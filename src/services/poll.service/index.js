const escapeStringRegexPromise = import('escape-string-regexp')
const httpStatus = require('http-status')
const logger = require('../../config/logger')
const { Poll, PollChoice, PollResponse } = require('../../models')
const ApiError = require('../../utils/ApiError')

const createPoll = async (pollData, user) => {
  let choices
  if (pollData.choices) choices = pollData.choices

  const poll = new Poll({
    ...pollData,
    owner: user._id
  })
  await poll.save()

  if (choices) {
    await PollChoice.create(choices.map((c) => ({ ...c, poll })))
  }

  logger.info('Created poll %s %s %s', poll._id, poll.title, choices?.length)
  return poll
}

const findById = async (pollId) => {
  const poll = await Poll.findById(pollId)
  return poll
}

// TODO: Transform poll view for user?
const getUserPollView = (poll, user) => {
  // logger.info('Get user poll view %s %s', poll?._id, user._id)
  const pollData = poll.toObject()

  // how poll owner data from others
  if (!user._id.equals(poll.owner._id)) delete pollData.owner

  return pollData
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

  const existingResponse = await PollResponse.findOne({ poll: poll._id, owner: user._id })

  const text = choiceData.text.trim()
  if (!text) throw new ApiError(httpStatus.BAD_REQUEST, 'Provided choice is missing the required text field')

  const escapeStringRegex = (await escapeStringRegexPromise).default

  // find by case insensitive text match for robustness
  // eslint-disable-next-line
  const textRegex = new RegExp(`^${escapeStringRegex(text)}$`, 'i')

  // find existing choice or create a new one
  let choice = await PollChoice.findOne({ poll: poll._id, text: textRegex })
  if (!poll.allowNewChoices && !choice) throw new Error('Only existing poll choices are allowed')

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

  if (!poll.multiSelect && existingResponse && !existingResponse.choice._id.equals(choice._id))
    throw new ApiError(httpStatus.BAD_REQUEST, 'Only one response is allowed for this poll')

  if (response.isModified()) await response.save()

  logger.info('Response poll %s %s', pollId, user._id, choice._id)
  return response.replaceObjectsWithIds()
}

const inspectPoll = async (pollId, user) => {
  const [poll, choices, responseCount] = await Promise.all([
    Poll.findById(pollId),
    PollChoice.find({ poll: pollId }),
    PollResponse.countDocuments({ poll: pollId })
  ])
  logger.info('Inspect poll %s %s', pollId, user._id)

  const pollData = poll.toObject()
  if (poll.choicesVisible) pollData.choices = choices.map((choice) => choice.toObject())
  if (poll.responseCountVisible) pollData.responseCount = responseCount

  const userPollView = await getUserPollView(pollData, user)
  return userPollView
}

const getPollResponses = async (pollId, user) => {
  const nowTime = Date.now()

  const poll = await Poll.findById(pollId)
  if (!poll) throw new ApiError(httpStatus.NOT_FOUND, 'No such poll')

  const myResponse = await PollResponse.findOne({ poll: pollId, owner: user._id })
  if (!poll.responsesVisibleToNonParticipants && !myResponse)
    throw new ApiError(httpStatus.UNAUTHORIZED, 'You have not participated in this poll')

  const numResponses = await PollResponse.countDocuments({ poll: pollId })
  if (poll.whenResponsesVisible !== 'expirationOnly' && numResponses < poll.threshold)
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Poll threshold has not been reached')

  if (poll.whenResponsesVisible !== 'thresholdOnly' && nowTime < poll.expirationDate.getTime())
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Expiration date has not been reached')

  const pollResponses = await PollResponse.find({ poll: pollId })
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
