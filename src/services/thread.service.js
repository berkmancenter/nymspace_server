const mongoose = require('mongoose')
const httpStatus = require('http-status')
const { Thread, Topic, Follower, Message } = require('../models')
const updateDocument = require('../utils/updateDocument')
const ApiError = require('../utils/ApiError')
const { canActAsChannelOwner, isSiteAdmin } = require('../config/roles')

const returnFields = 'name slug locked owner createdAt messageCount hiddenMessageMode'

/**
 * Create a thread
 * @param {Object} threadBody
 * @returns {Promise<Thread>}
 */
const createThread = async (threadBody, user) => {
  if (!threadBody.topicId) throw new ApiError(httpStatus.BAD_REQUEST, 'Channel ID must be passed in request body.')

  const topicId = mongoose.Types.ObjectId(threadBody.topicId)
  const topic = await Topic.findById(topicId)

  if (!topic.threadCreationAllowed && !canActAsChannelOwner(user, topic)) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Thread creation not allowed in this channel.')
  }

  const thread = await Thread.create({
    name: threadBody.name,
    owner: user,
    topic,
    messageCount: 0,
    enableAgents: !!threadBody.agentTypes.length,
    agents: [],
    hitTheButton: threadBody?.hitTheButton ? threadBody?.hitTheButton : false
  })

  // need to save to get id
  await thread.save()

  const { default: Agent } = await import('../models/user.model/agent.model/index.mjs')
  for (const agentType of threadBody.agentTypes) {
    const agent = new Agent({
      agentType,
      thread
    })

    // need to save to get id
    await agent.save()

    // initialize to set up timer, etc.
    await agent.initialize(true)

    // depopulate thread to prevent circular clone
    agent.thread = thread._id
    thread.agents.push(agent)
  }

  topic.threads.push(thread.toObject())
  await Promise.all([thread.save(), topic.save()])

  return thread
}

/**
 * Update a thread
 * @param {Object} threadBody
 * @returns {Promise<Thread>}
 */
const updateThread = async (threadBody, user) => {
  let threadDoc = await Thread.findById(threadBody.id).populate('topic')
  const isThreadOwner = user._id.toString() === threadDoc.owner.toString()
  const canManageAsChannelOwner = canActAsChannelOwner(user, threadDoc.topic)
  
  if (!isThreadOwner && !canManageAsChannelOwner) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only thread owner, channel owner, or site admin can update.')
  }

  threadDoc = updateDocument(threadBody, threadDoc)
  await threadDoc.save()

  return threadDoc
}

const revealHiddenMessageModeMessages = async (threadId, user) => {
  const thread = await Thread.findById(threadId).populate('topic')
  const isThreadOwner = user._id.toString() === thread.owner.toString()
  const canManageAsChannelOwner = canActAsChannelOwner(user, thread.topic)
  
  if (!isThreadOwner && !canManageAsChannelOwner) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only thread owner, channel owner, or site admin can reveal hidden messages.')
  }

  await Message.updateMany({ thread: threadId, hiddenMessageModeHidden: true }, { $set: { hiddenMessageModeHidden: false } })

  thread.hiddenMessageMode = false
  await thread.save()

  return thread
}

const userThreads = async (user) => {
  const deletedTopics = await Topic.find({ isDeleted: true }).select('_id')
  const followedThreads = await Follower.find({ user }).select('thread').exec()
  const followedThreadsIds = followedThreads.map((el) => el.thread).filter((el) => el)
  
  // Site admins should see all threads, not just ones they own/follow
  let threadQuery
  if (isSiteAdmin(user)) {
    threadQuery = {
      topic: { $nin: deletedTopics }
    }
  } else {
    threadQuery = {
      $and: [
        { $or: [{ owner: user }, { _id: { $in: followedThreadsIds } }] },
        {
          topic: { $nin: deletedTopics }
        }
      ]
    }
  }
  
  const threads = await Thread.find(threadQuery)
    .select(returnFields)
    .populate('topic', 'owner') // Populate topic to check channel ownership
    .exec()

  // Map to new array with permission flags
  return threads.map((thread) => {
    const threadObj = thread.toObject()
    
    // Add followed status
    if (followedThreadsIds.map((f) => f.toString()).includes(thread.id)) {
      threadObj.followed = true
    }
    
    // Add permission flags for frontend
    const isThreadOwner = user._id?.toString() === thread.owner?.toString()
    const isChannelOwner = user._id?.toString() === thread.topic?.owner?.toString() 
    const isSiteAdministrator = isSiteAdmin(user)
    
    threadObj.canEdit = isThreadOwner || isChannelOwner || isSiteAdministrator
    threadObj.canDelete = isThreadOwner || isChannelOwner || isSiteAdministrator
    threadObj.canExport = isChannelOwner || isSiteAdministrator
    threadObj.canRevealHidden = isThreadOwner || isChannelOwner || isSiteAdministrator
    
    return threadObj
  })
}

const findById = async (id) => {
  const thread = await Thread.findOne({ _id: id }).populate('followers').select('name slug owner').exec()
  return thread
}

const findByIdFull = async (id, user) => {
  const thread = await Thread.findOne({ _id: id }).select(returnFields).exec()
  const threadPojo = thread.toObject()
  threadPojo.followed = await Follower.findOne({ thread, user }).select('_id').exec()

  threadPojo.id = threadPojo._id.toString()
  delete threadPojo._id
  return threadPojo
}

const topicThreads = async (topicId, user = null) => {
  const threads = await Thread.find({ topic: topicId })
    .select(returnFields)
    .populate('topic', 'owner') // Populate topic to check channel ownership
    .exec()
    
  // Add permission flags if user is provided
  if (user) {
    return threads.map(thread => {
      const threadObj = thread.toObject()
      
      const isThreadOwner = user._id?.toString() === thread.owner?.toString()
      const isChannelOwner = user._id?.toString() === thread.topic?.owner?.toString() 
      const isSiteAdministrator = isSiteAdmin(user)
      
      threadObj.canEdit = isThreadOwner || isChannelOwner || isSiteAdministrator
      threadObj.canDelete = isThreadOwner || isChannelOwner || isSiteAdministrator
      threadObj.canExport = isChannelOwner || isSiteAdministrator
      threadObj.canRevealHidden = isThreadOwner || isChannelOwner || isSiteAdministrator
      
      return threadObj
    })
  }
  
  return threads
}

const follow = async (status, threadId, user) => {
  const thread = await findById(threadId)
  const params = {
    user,
    thread
  }

  if (status === true) {
    const follower = await Follower.create(params)

    thread.followers.push(follower.toObject())
    thread.save()
  } else {
    await Follower.deleteMany(params)
  }
}

const allPublic = async () => {
  const deletedTopics = await Topic.find({ isDeleted: true }).select('_id')
  const threads = await Thread.find({ topic: { $nin: deletedTopics } })
    .select(returnFields)
    .exec()
  return threads
}

const deleteThread = async (id, user) => {
  const thread = await Thread.findOne({ _id: id }).populate('topic').select('name slug owner topic').exec()

  const isThreadOwner = user._id.toString() === thread.owner.toString()
  const canManageAsChannelOwner = canActAsChannelOwner(user, thread.topic)
  
  if (!isThreadOwner && !canManageAsChannelOwner) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only thread owner, channel owner, or site admin can delete.')
  }

  await Thread.deleteOne({ _id: id })
  await Follower.deleteMany({ thread })
  await Message.deleteMany({ thread })
}

module.exports = {
  createThread,
  userThreads,
  findById,
  topicThreads,
  follow,
  findByIdFull,
  allPublic,
  deleteThread,
  updateThread,
  revealHiddenMessageModeMessages
}
