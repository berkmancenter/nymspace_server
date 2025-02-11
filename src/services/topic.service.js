const crypto = require('crypto')
const httpStatus = require('http-status')
const { Topic, Follower } = require('../models')
const { emailService, tokenService } = require('.')
const Token = require('../models/token.model')
const ApiError = require('../utils/ApiError')
const updateDocument = require('../utils/updateDocument')
const User = require('../models/user.model/user.model')
const config = require('../config/config')

/**
 * Query topics and add sorting properties
 * @param {Object} topicQuery
 * @returns {Promise<Array>}
 */
const topicsWithSortData = async (topicQuery) => {
  const dbtopics = await Topic.find(topicQuery)
    // Populate threads and messages for calculation of sorting properties
    .populate({
      path: 'threads',
      select: 'id',
      populate: [{ path: 'messages', select: ['id', 'createdAt'], match: { visible: true } }]
    })
    .select('name slug private votingAllowed threadCreationAllowed archiveEmail owner')
    .exec()

  const topics = []
  dbtopics.forEach((t) => {
    // Create a new POJO for return, since mongoose
    // does not allow for random properties to be set.
    const topic = {}
    const threadMsgTimes = []
    let msgCount = 0
    t.threads.forEach((thread) => {
      if (thread.messages && thread.messages.length > 0) {
        // Get the createdAt datetime for the final message,
        // which will always be the most recent as it is pushed
        // to Thread.messages upon message creation.
        threadMsgTimes.push(thread.messages.slice(-1)[0].createdAt)
        // Sum up the visible messages and followers for all threads
        msgCount += thread.messages.length
      }
    })
    topic.name = t.name
    topic.slug = t.slug
    topic.id = t.id
    topic.private = t.private
    topic.votingAllowed = t.votingAllowed
    topic.threadCreationAllowed = t.threadCreationAllowed
    topic.owner = t.owner
    topic.archiveEmail = t.archiveEmail
    // Sort the most recent messages for all threads, to determine the
    // most recent message for the topic/channel.
    threadMsgTimes.sort((a, b) => {
      return b - a
    })
    topic.latestMessageCreatedAt = threadMsgTimes.length > 0 ? threadMsgTimes[0] : null
    topic.messageCount = msgCount
    topic.threadCount = t.threads.length
    // Calculate default sort avg as (message activity x recency)
    topic.defaultSortAverage = 0
    if (topic.latestMessageCreatedAt && topic.messageCount) {
      const msSinceEpoch = new Date(topic.latestMessageCreatedAt).getTime()
      topic.defaultSortAverage = msSinceEpoch * topic.messageCount
    }

    topics.push(topic)
  })

  return topics.sort((a, b) => {
    return b.defaultSortAverage - a.defaultSortAverage
  })
}

/**
 * Create a topic
 * @param {Object} topicBody
 * @param {Object} user
 * @returns {Promise<Topic>}
 */
const createTopic = async (topicBody, user) => {
  const randomPasscode = async (min, max) => {
    return new Promise((resolve, reject) => {
      crypto.randomInt(min, max, (err, res) => {
        if (err) reject(err)
        resolve(res)
      })
    })
  }

  let passcode = null
  if (topicBody.private) {
    passcode = await randomPasscode(1000000, 9999999)
  }

  const topic = await Topic.create({
    name: topicBody.name,
    votingAllowed: topicBody.votingAllowed,
    threadCreationAllowed: topicBody.threadCreationAllowed,
    private: config.enablePublicChannelCreation ? topicBody.private : true,
    archivable: topicBody.archivable,
    archiveEmail: topicBody.archiveEmail,
    passcode,
    owner: user
  })
  return topic
}

/**
 * Update a topic
 * @param {Object} topicBody
 * @returns {Promise<Topic>}
 */
const updateTopic = async (topicBody) => {
  let topicDoc = await Topic.findById(topicBody.id)
  topicDoc = updateDocument(topicBody, topicDoc)
  await topicDoc.save()
  return topicDoc
}

const userTopics = async (user) => {
  const followedTopics = await Follower.find({ user }).select('topic').exec()
  const followedTopicIds = followedTopics.map((el) => el.topic).filter((el) => el)
  const topics = await topicsWithSortData({
    $and: [
      { $or: [{ owner: user }, { _id: { $in: followedTopicIds } }] },
      {
        isDeleted: false
      }
    ]
  })
  topics.forEach((topic) => {
    if (followedTopicIds.map((f) => f.toString()).includes(topic.id)) {
      // eslint-disable-next-line
      topic.followed = true
    }
  })
  return topics
}

const allPublicTopics = async () => {
  const topics = await topicsWithSortData({ isDeleted: false, private: false })
  return topics
}

const allTopicsByUser = async (user) => {
  const otherPrivateTopics = await Topic.find({ $and: [{ private: true }, { owner: { $ne: user } }] })
  // $and: [
  //   { $or: [{ owner: user }, { _id: { $in: followedThreads.map((el) => el.thread) } }] },
  //   {
  //     topic: { $nin: deletedTopics },
  //   },
  const topics = await topicsWithSortData({
    $and: [{ isDeleted: false }, { _id: { $nin: otherPrivateTopics.map((x) => x._id) } }]
  })
  return topics
}

const findById = async (id) => {
  const topic = await Topic.findOne({ _id: id })
    .populate('followers')
    .select('name slug private votingAllowed threadCreationAllowed owner')
    .exec()
  return topic
}

/**
 * Soft delete a topic
 * @param {Object} topicBody
 * @returns {Promise}
 */
const deleteTopic = async (id) => {
  const topic = await Topic.findOne({ _id: id })
  if (!topic) throw new ApiError(httpStatus.NOT_FOUND, 'Topic does not exist')
  topic.isDeleted = true
  await topic.save()
}

const verifyPasscode = async (topicId, passcode) => {
  const topic = await Topic.findById(topicId)
  return passcode === topic.passcode
}

/**
 * Filter out a topic that has recent message activity occurring after targetDate
 * @param {Topic} topic
 * @param {Date} targetDate
 * @returns {Promise}
 */
const activeTopicFilter = (topic, targetDate) => {
  const threadMsgTimes = []
  topic.threads.forEach((thread) => {
    if (thread.messages && thread.messages.length > 0) {
      // Get the createdAt datetime for the final message,
      // which will always be the most recent as it is pushed
      // to Thread.messages upon message creation.
      threadMsgTimes.push(thread.messages.slice(-1)[0].createdAt)
    }
  })
  threadMsgTimes.sort((a, b) => {
    return b - a
  })
  const latestMessageCreatedAt = threadMsgTimes.length > 0 ? new Date(threadMsgTimes[0].toString()) : null
  if (latestMessageCreatedAt && latestMessageCreatedAt > targetDate) {
    // Remove this topic from deletion, since it has recent messages
    return false
  }
  return true
}

/**
 * Soft delete all topics that haven't been active for 97 days
 * @returns {Promise}
 */
const deleteOldTopics = async () => {
  // Set target date
  const targetDeletionDate = new Date()
  targetDeletionDate.setDate(targetDeletionDate.getDate() - 97)

  // Get all deletable topics
  const topics = await Topic.find({ isDeleted: false, archived: false, createdAt: { $lte: targetDeletionDate } })
    // Populate threads and messages
    .populate({
      path: 'threads',
      select: 'id',
      populate: [{ path: 'messages', select: ['id', 'createdAt'], match: { visible: true } }]
    })
    .exec()

  // Filter out topics that have recent activity
  const deletableTopics = topics.filter(activeTopicFilter)

  const toSave = []
  for (let x = 0; x < deletableTopics.length; x++) {
    // Save topic as deleted
    deletableTopics[x].isDeleted = true
    toSave.push(deletableTopics[x])
  }

  await Promise.all(toSave.map((t) => t.save()))

  return deletableTopics
}

/**
 * Prompt users to archive all topics that haven't been active for 97 days
 * and are archivable.
 * @returns {Promise}
 */
const emailUsersToArchive = async () => {
  // Set target date
  const targetDeletionDate = new Date()
  targetDeletionDate.setDate(targetDeletionDate.getDate() - 90)

  // Get all deletable topics
  const topics = await Topic.find({
    isArchiveNotified: false,
    isDeleted: false,
    archived: false,
    archivable: true,
    createdAt: { $lte: targetDeletionDate }
  })
    // Populate threads and messages
    .populate({
      path: 'threads',
      select: 'id',
      populate: [{ path: 'messages', select: ['id', 'createdAt'], match: { visible: true } }]
    })
    .exec()
  // Filter out topics that have recent activity
  const archivableTopics = topics.filter(activeTopicFilter)
  const returnTopics = []

  const promises = archivableTopics.map(async (archivableTopic) => {
    const topic = archivableTopic
    const owner = await User.findById(topic.owner)
    const emailAddress = topic.archiveEmail ? topic.archiveEmail : owner.email
    if (emailAddress) {
      const archiveToken = await tokenService.generateArchiveTopicToken(owner)
      await emailService.sendArchiveTopicEmail(emailAddress, topic, archiveToken)
      topic.isArchiveNotified = true
      await topic.save()
      returnTopics.push(topic)
    }
    return true
  })

  await Promise.all(promises)

  return returnTopics
}

const archiveTopic = async (token, topicId) => {
  const topic = await Topic.findById(topicId)
  if (!topic) {
    throw new Error('Topic not found')
  }
  topic.archived = true
  await topic.save()
  await Token.deleteOne({ token })
}

/**
 * Follow or unfollow a topic
 * @param {Boolean} status
 * @param {String} topicId
 * @param {String} user
 * @returns {Promise}
 */
const follow = async (status, topicId, user) => {
  const topic = await findById(topicId)
  const params = {
    user,
    topic
  }
  if (status === true) {
    const follower = await Follower.create(params)
    topic.followers.push(follower.toObject())
    topic.save()
  } else {
    await Follower.deleteMany(params)
  }
}

module.exports = {
  createTopic,
  userTopics,
  findById,
  allPublicTopics,
  allTopicsByUser,
  verifyPasscode,
  deleteOldTopics,
  emailUsersToArchive,
  archiveTopic,
  deleteTopic,
  updateTopic,
  follow
}
