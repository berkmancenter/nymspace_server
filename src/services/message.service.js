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
    throw new ApiError(httpStatus.BAD_REQUEST, 'You cannot post in this thread with your active pseudonym.')
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

  if (!messageBody.body) throw new ApiError(httpStatus.BAD_REQUEST, 'Message body is required')
  if (messageBody.body.length > config.maxMessageLength)
    throw new ApiError(httpStatus.BAD_REQUEST, `Message must be no longer than ${config.maxMessageLength} characters`)

  const message = await Message.create({
    body: messageBody.body,
    thread: thread._id,
    owner: user,
    pseudonym: activePseudo.pseudonym,
    pseudonymId: activePseudo._id,
    hitTheButtonhidden: thread.hitTheButton
  })

  Thread.findOneAndUpdate({ _id: thread._id }, { $inc: { messageCount: 1 } }).exec()

  message.threadMessageCount = thread.messageCount + 1
  return message
}

const threadMessages = async (id, userId) => {
  const messages = await Message.find({
    thread: id,
    visible: true
  })
    .select('body owner upVotes downVotes pseudonym pseudonymId createdAt fromAgent hitTheButtonhidden')
    .sort({ createdAt: 1 })
    .exec()

  // Redact body and pseudonym for hitTheButtonhidden messages not owned by the user
  const redactedMessages = messages.map((msg) => {
    if (msg.hitTheButtonhidden === true && msg.owner.toString() !== userId.toString()) {
      return {
        ...msg.toObject(),
        body: null, // or 'REDACTED'
        pseudonym: null // or 'REDACTED'
      }
    }
    return msg
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
    throw new ApiError(httpStatus.BAD_REQUEST, 'Users cannot vote for their own messages.')
  }

  const votes = message.upVotes.concat(message.downVotes)
  if (status) {
    if (votes && votes.length > 0) {
      const existingVote = votes.find((x) => x.owner.toString() === user._id.toString())
      if (existingVote) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'User has already voted for this message.')
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

module.exports = {
  fetchThread,
  createMessage,
  threadMessages,
  vote,
  newMessageHandler
}
