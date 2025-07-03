const mongoose = require('mongoose')
const httpStatus = require('http-status')
const config = require('../config/config')
const logger = require('../config/logger')
const { Message } = require('../models')
const { Thread } = require('../models')
const { User } = require('../models')
const { AgentMessageActions } = require('../types/agent.types')
const ApiError = require('../utils/ApiError')

/**
 * Apply hidden message redaction logic
 * @param {Object} msg - Message object
 * @param {String} userId - Current user ID
 * @param {Boolean} isChannelOwner - Whether current user is channel owner
 * @param {String} channelOwnerId - Channel owner ID
 * @returns {Object} - Message object with redaction applied
 */
const applyHiddenMessageRedaction = (msg, userId, isChannelOwner, channelOwnerId) => {
  const msgObj = msg.toObject ? msg.toObject() : msg

  if (msg.hiddenMessageModeHidden === true) {
    const isOwnMessage = userId && msg.owner.toString() === userId.toString()
    const isMessageFromChannelOwner = msg.owner.toString() === channelOwnerId?.toString()

    if (!isChannelOwner && !isOwnMessage && !isMessageFromChannelOwner) {
      msgObj.body = null
      msgObj.hiddenForUser = true
      logger.info(`Message ${msg._id} body set to null for user ${userId || 'unauthenticated'}`)
    }

    if (isMessageFromChannelOwner) {
      msgObj.visibilityLabel = 'Message from facilitator, visible to everyone'
    } else if (isChannelOwner && !isOwnMessage) {
      msgObj.visibilityLabel = 'Message from participant, visible to you and author'
    } else if (isOwnMessage) {
      msgObj.visibilityLabel = 'Message is hidden from everyone except the facilitator'
    } else {
      msgObj.visibilityLabel = 'Message hidden from everyone else except the facilitator.'
    }
  }

  return msgObj
}

/**
 * Check if we can create a message and fetch thread
 * @param {Object} messageBody
 * @param {User} user
 * @returns {Promise<Thread>}
 */
const fetchThread = async (messageBody, user) => {
  const threadId = mongoose.Types.ObjectId(messageBody.thread)
  const thread = await Thread.findById(threadId)
    .populate('agents')
    .populate({ path: 'messages', match: { visible: true } })
  if (thread.locked) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'This thread is locked and cannot receive messages.')
  }
  const activePseudo = user.activePseudonym
  const pseudoForThread = user.pseudonyms.find((x) => x.threads.includes(threadId))

  if (pseudoForThread && activePseudo._id.toString() !== pseudoForThread._id.toString()) {
    logger.error(`CANNOT POST - THREAD: ${pseudoForThread._id}, ACTIVE: ${activePseudo._id}`)
    throw new ApiError(httpStatus.BAD_REQUEST, 'You can only post to this thread with the psuedonym you already used here.')
  }

  if (!pseudoForThread) {
    const newPseudonyms = user.pseudonyms.map((x) => {
      if (x.active) {
        x.threads.push(threadId)
      }
      return x
    })
    user.pseudonyms.set(newPseudonyms)
    user.markModified('pseudonyms')
    await user.save()
  }

  return thread
}

/**
 * Create a message
 * @param {Object} messageBody
 * @param {User} user
 * @param {Thread} thread
 * @returns {Promise<Message>}
 */
const createMessage = async (messageBody, user, thread) => {
  const activePseudo = user.activePseudonym

  if (!messageBody.body) throw new ApiError(httpStatus.BAD_REQUEST, 'Message text is required')
  if (messageBody.body.length > config.maxMessageLength)
    throw new ApiError(httpStatus.BAD_REQUEST, `Message cannot be longer than ${config.maxMessageLength} characters`)

  const messageData = {
    body: messageBody.body,
    thread: thread._id,
    owner: user,
    pseudonym: activePseudo.pseudonym,
    pseudonymId: activePseudo._id,
    hiddenMessageModeHidden: thread.hiddenMessageMode
  }

  if (messageBody.parentMessage) {
    messageData.parentMessage = mongoose.Types.ObjectId(messageBody.parentMessage)
  }

  const message = await Message.create(messageData)

  Thread.findOneAndUpdate({ _id: thread._id }, { $inc: { messageCount: 1 } }).exec()

  message.threadMessageCount = thread.messageCount + 1
  return message
}

const threadMessages = async (id, userId) => {
  // Get thread with topic to check ownership
  const thread = await Thread.findById(id).populate('topic').exec()
  const isChannelOwner = userId && thread.topic && thread.topic.owner.toString() === userId.toString()

  const messages = await Message.find({
    thread: id,
    visible: true,
    parentMessage: { $exists: false }
  })
    .select('body owner upVotes downVotes pseudonym pseudonymId createdAt fromAgent hiddenMessageModeHidden')
    .sort({ createdAt: 1 })
    .exec()

  const messageIds = messages.map((msg) => msg._id)
  const replyCounts = await Message.aggregate([
    {
      $match: {
        parentMessage: { $in: messageIds },
        visible: true
      }
    },
    {
      $group: {
        _id: '$parentMessage',
        count: { $sum: 1 }
      }
    }
  ])

  const replyCountMap = {}
  replyCounts.forEach((item) => {
    replyCountMap[item._id.toString()] = item.count
  })

  logger.info(`Total messages found: ${messages.length}`)
  messages.forEach((msg) => {
    logger.info(
      `Message ${msg._id}: owner=${msg.owner}, hiddenMessageModeHidden=${
        msg.hiddenMessageModeHidden
      }, body=${msg.body?.substring(0, 10)}...`
    )
  })

  // Apply new redaction logic
  const redactedMessages = messages.map((msg) => {
    const msgObj = applyHiddenMessageRedaction(msg, userId, isChannelOwner, thread.topic?.owner?.toString())
    msgObj.replyCount = replyCountMap[msg._id.toString()] || 0
    return msgObj
  })

  return redactedMessages
}

/**
 * Upvote or downvote a message
 * @param {Object} messageId
 * @param {Object} direction
 * @returns {Promise<Message>}
 */
const vote = async (messageId, direction, status, requestUser) => {
  const user = await User.findById(requestUser.id)
  const message = await Message.findById(messageId)
  if (message.owner.toString() === user._id.toString()) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'You cannot vote on your own message.')
  }

  const votes = message.upVotes.concat(message.downVotes)
  if (status) {
    if (votes && votes.length > 0) {
      const existingVote = votes.find((x) => x.owner.toString() === user._id.toString())
      if (existingVote) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'You have already voted on this message.')
      }
    }
  }

  if (status) {
    if (direction === 'up') {
      message.upVotes.push({ owner: user._id })
    } else {
      message.downVotes.push({ owner: user._id })
    }
  } else if (direction === 'up') {
    for (let x = 0; x < message.upVotes.length; x++) {
      if (message.upVotes[x].owner.toString() === user._id.toString()) {
        message.upVotes.id(message.upVotes[x]._id).remove()
      }
    }
  } else {
    for (let x = 0; x < message.downVotes.length; x++) {
      if (message.downVotes[x].owner.toString() === user._id.toString()) {
        message.downVotes.id(message.downVotes[x]._id).remove()
      }
    }
  }
  // if (status) {
  //   message.votes.push({ owner: user._id, direction: direction})
  // } else {
  //   message.votes.remove({ owner: user._id, direction: direction })
  // }

  await message.save()
  return message
}

/**
 * Handle all stages of processing a new message
 * @param {Object} message
 * @param {User} user
 * @returns {Promise<[Message]>}
 */
const newMessageHandler = async (message, user) => {
  const thread = await fetchThread(message, user)
  const agentEvaluations = []

  let userContributionVisible = true

  if (config.enableAgents && thread.enableAgents) {
    // process evaluations and check for any rejections. Process in priority order
    const sortedAgents = thread.agents.sort((a, b) => a.priority - b.priority)
    for (const agent of sortedAgents) {
      // use in memory thread for speed
      agent.thread = thread
      const agentEvaluation = await agent.evaluate(message)
      if (!agentEvaluation) continue

      if (agentEvaluation.action === AgentMessageActions.REJECT) {
        logger.info(`Rejecting message: ${agentEvaluation.suggestion}`)
        throw new ApiError(httpStatus.UNPROCESSABLE_ENTITY, agentEvaluation.suggestion)
      }
      agentEvaluations.push(agentEvaluation)
      if (!agentEvaluation.userContributionVisible) userContributionVisible = false
    }
  }

  // first, user message
  const messages = []
  const sentMessage = await createMessage(message, user, thread)
  if (userContributionVisible) {
    messages.push(sentMessage)
  }

  return messages
}

/**
 * Get replies for a specific message
 * @param {Object} messageId
 * @param {Object} userId
 * @returns {Promise<[Message]>}
 */
const getMessageReplies = async (messageId, userId) => {
  // Get the parent message to find the thread
  const parentMessage = await Message.findById(messageId).exec()
  const thread = await Thread.findById(parentMessage.thread).populate('topic').exec()
  const isChannelOwner = userId && thread.topic && thread.topic.owner.toString() === userId.toString()

  const replies = await Message.find({
    parentMessage: messageId,
    visible: true
  })
    .select('body owner upVotes downVotes pseudonym pseudonymId createdAt fromAgent hiddenMessageModeHidden')
    .sort({ createdAt: 1 })
    .exec()

  // Apply same redaction logic as threadMessages
  const redactedReplies = replies.map((msg) => {
    return applyHiddenMessageRedaction(msg, userId, isChannelOwner, thread.topic?.owner?.toString())
  })

  return redactedReplies
}

module.exports = {
  fetchThread,
  createMessage,
  threadMessages,
  vote,
  newMessageHandler,
  getMessageReplies
}
