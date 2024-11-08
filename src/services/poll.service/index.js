const escapeStringRegexPromise = import('escape-string-regexp')
const mongoose = require('mongoose')
const httpStatus = require('http-status')
const logger = require('../../config/logger')
const { Topic, Poll, PollChoice, PollResponse } = require('../../models')
const ApiError = require('../../utils/ApiError')

const createPoll = async (pollBody, user) => {
  if (!pollBody.topicId) throw new ApiError(httpStatus.BAD_REQUEST, 'topic id must be passed in request body')

  const topicId = mongoose.Types.ObjectId(pollBody.topicId)
  const topic = await Topic.findById(topicId)

  // TODO: Confirm if we want to separately allow control of thread and poll creation or not
  // For this MVP we are using threadCreationAllowed, but it should probably be renamed
  // spaceCreationAllowed or separated into two options for clarity
  if (!topic.threadCreationAllowed && user._id.toString() !== topic.owner.toString()) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Poll creation not allowed.')
  }

  let choices
  if (pollBody.choices) choices = pollBody.choices

  const pollData = {
    ...pollBody,
    owner: user._id,
    topic
  }
  delete pollData.topicId

  if (pollData.whenResultsVisible === 'thresholdOnly' && pollData.expirationDate) delete pollData.expirationDate
  if (pollData.whenResultsVisible === 'expirationOnly' && pollData.threshold) delete pollData.threshold

  const poll = await Poll.create(pollData)

  if (choices) {
    await PollChoice.create(choices.map((c) => ({ ...c, poll })))
  }

  // NOTE! We specifically do NOT save polls in the topic objects because
  // it is important that poll owners not be exposed (in contrast with threads)
  // WEe can still look up polls for a topic with a query if needed
  // NO: topic.polls.push(poll.toObject())
  // NO: await topic.save()

  logger.info('Created poll %s %s %s', poll._id, poll.title, choices?.length)
  return poll
}

const findById = async (pollId) => {
  const poll = await Poll.findById(pollId)
  return poll
}

// TODO: Transform poll view for user?
const getUserPollView = (poll, user) => {
  if (!poll) return null
  // logger.info('Get user poll view %s %s', poll?._id, user._id)
  const pollData = poll?.toObject ? poll.toObject() : poll

  // how poll owner data from others
  if (!user._id.equals(poll.owner._id)) delete pollData.owner

  return pollData
}

// TODO More transformation may be needed
const getUserPollResponseView = (poll, pollResponse, user, userChoiceMap) => {
  // logger.info('Get user poll view %s %s', poll?._id, user._id)
  const pollResponseData = pollResponse.toObject()

  if (poll.onlyOwnChoicesVisible && !userChoiceMap[pollResponseData.choice._id.toString()]) return null

  pollResponseData.owner = pollResponseData.owner.username
  pollResponseData.choice = pollResponseData.choice.text

  return pollResponseData
}

// TODO: Query and sorting params structure? Evaluate existing structure...
const listPolls = async (query, sort, sortDir, user) => {
  const polls = await Poll.find(query).sort({ [sort]: sortDir })
  logger.info('List polls %s %s %s %s', query, sort, sortDir, polls.length)
  return polls.map((poll) => getUserPollView(poll, user))
}

// Not yet supported
// function validatePoll(poll, validator, response) {
// }

// choice can be a choiceId or a new choice object
const respondPoll = async (pollId, choiceData, user) => {
  const poll = await Poll.findById(pollId)
  if (!poll) throw new ApiError(httpStatus.NOT_FOUND, 'No such poll')

  // cannot respond to an expired poll
  const nowTime = Date.now()
  if (poll.whenResultsVisible !== 'thresholdOnly' && nowTime > poll.expirationDate.getTime())
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Expiration date has been reached. No more responses are allowed.')

  // cannot respond to threshold only poll that has been reached
  if (poll.whenResultsVisible === 'thresholdOnly') {
    const numResponses = await PollResponse.countDocuments({ poll: pollId })
    if (numResponses >= poll.threshold)
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Threshold has been reached. No more responses are allowed.')
  }

  const text = choiceData.text.trim()
  if (!text) throw new ApiError(httpStatus.BAD_REQUEST, 'Provided choice is missing the required text field')

  const escapeStringRegex = (await escapeStringRegexPromise).default

  // find by case insensitive text match for robustness
  // eslint-disable-next-line
  const textRegex = new RegExp(`^${escapeStringRegex(text)}$`, 'i')

  // find existing choice or create a new one
  let choice = await PollChoice.findOne({ poll: poll._id, text: textRegex })
  if (!poll.allowNewChoices && !choice) throw new ApiError(httpStatus.BAD_REQUEST, 'Only existing poll choices are allowed')

  if (!choice)
    choice = new PollChoice({
      ...choiceData,
      poll
    })

  if (choice.isModified()) await choice.save()

  const pollResponseData = {
    owner: user,
    poll,
    choice
  }

  // check for existing response or create a new one
  const response = (await PollResponse.findOne(pollResponseData)) || new PollResponse(pollResponseData)

  // can remove an existing choice if before expiration
  if (choiceData.remove && !response.isModified()) {
    await PollResponse.findByIdAndRemove({ _id: response._id })
    const responseData = response.replaceObjectsWithIds()
    responseData.removed = true
    return responseData
  }

  if (!poll.multiSelect) {
    const existingOtherResponse = await PollResponse.findOne({
      poll: poll._id,
      owner: user._id,
      choice: { $ne: choice._id }
    })
    if (existingOtherResponse) throw new ApiError(httpStatus.BAD_REQUEST, 'Only one response is allowed for this poll')
  }

  if (response.isModified()) await response.save()

  logger.info('Response poll %s %s', pollId, user._id, choice._id)
  return response.replaceObjectsWithIds()
}

const inspectPoll = async (pollId, user) => {
  const [poll, choices] = await Promise.all([Poll.findById(pollId), PollChoice.find({ poll: pollId })])

  let responseCounts
  if (poll.responseCountVisible) {
    responseCounts = await PollResponse.aggregate([
      { $match: { poll: new mongoose.Types.ObjectId(pollId) } },
      {
        $lookup: {
          from: 'pollchoices',
          localField: 'choice',
          foreignField: '_id',
          as: 'choice'
        }
      },
      { $addFields: { choice: { $arrayElemAt: ['$choice', 0] } } },
      { $addFields: { choice: '$choice.text' } },
      { $group: { _id: '$choice', count: { $sum: 1 } } }
    ])
  }
  logger.info('Inspect poll %s %s', pollId, user._id)

  const pollData = poll.toObject()
  if (poll.choicesVisible) pollData.choices = choices.map((choice) => choice.toObject())
  if (poll.responseCountVisible) pollData.responseCounts = responseCounts

  const userPollView = await getUserPollView(pollData, user)
  return userPollView
}

const getPollResponses = async (pollId, user) => {
  const nowTime = Date.now()

  const poll = await Poll.findById(pollId)
  if (!poll) throw new ApiError(httpStatus.NOT_FOUND, 'No such poll')

  if (!poll.responsesVisible) throw new ApiError(httpStatus.BAD_REQUEST, 'Responses are not visible for this poll')

  const myResponse = await PollResponse.findOne({ poll: pollId, owner: user._id })
  if (!poll.responsesVisibleToNonParticipants && !myResponse)
    throw new ApiError(httpStatus.UNAUTHORIZED, 'You have not participated in this poll')

  const numResponses = await PollResponse.countDocuments({ poll: pollId })
  if (poll.whenResultsVisible !== 'expirationOnly' && numResponses < poll.threshold)
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Poll threshold has not been reached')

  if (poll.whenResultsVisible !== 'thresholdOnly' && nowTime < poll.expirationDate.getTime())
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Expiration date has not been reached')

  // create a map of choices from this user
  const userResponses = await PollResponse.find({ poll: pollId, owner: user._id })
  const userChoiceMap = userResponses.reduce((map, response) => {
    // eslint-disable-next-line
    map[response.choice._id.toString()] = true
    return map
  }, {})

  // this could be done more efficiently
  const pollResponses = (await PollResponse.find({ poll: pollId }).populate('choice').populate('owner'))
    .map((response) => getUserPollResponseView(poll, response, user, userChoiceMap))
    .filter(Boolean)
  logger.info('get poll responses', pollId, user._id)
  return pollResponses
}

module.exports = {
  createPoll,
  findById,
  listPolls,
  // validatePoll,
  respondPoll,
  inspectPoll,
  getPollResponses,
  getUserPollView
}
