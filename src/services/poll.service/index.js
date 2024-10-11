const httpStatus = require('http-status')
const logger = require('../../config/logger')
const { Poll, PollChoice, PollResponse } = require('../../models')
const ApiError = require('../../utils/ApiError')

const createPoll = async (pollData, user) => {
  const poll = new Poll({
    ...pollData,
    owner: user._id
  })
  await poll.save()
  logger.info('Created poll %s %s', poll._id, poll.title)
  return poll
}

const findById = async (pollId) => {
  const poll = await Poll.findById(pollId)
  return poll
}

// TODO: Transform poll view for user?
const getUserPollView = (poll, user) => {
  logger.info('Get user poll view %s %s', poll?._id, user._id)
  if (poll?.choices) {
    for (const choice of poll.choices) {
      if (choice.owner) delete choice.owner
    }
  }
  return poll
}

// TODO: Query and sorting params structure? Evaluate existing structure...
const listPolls = async (query, user) => {
  const polls = await Poll.find(query)
  logger.info('List polls %s %s', query, polls.length)
  return polls.map((poll) => getUserPollView(poll, user))
}

// Not yet supported
// function validatePoll(poll, validator, response) {
// }

// choice can be a choiceId or a new choice object
const votePoll = async (pollId, choiceIdOrObject, user) => {
  const poll = await Poll.findById(pollId)
  if (!poll) throw new ApiError(httpStatus.NOT_FOUND, 'No such poll')

  const existingVote = await PollResponse.findOne({ poll: poll._id, owner: user._id })
  if (existingVote) throw new ApiError(httpStatus.BAD_REQUEST, 'You have already voted on this poll')

  let choice

  if (typeof choiceIdOrObject === 'string') {
    // look up existing choice by id
    choice = await PollChoice.findById(choiceIdOrObject)
    if (!choice) throw new ApiError(httpStatus.NOT_FOUND, 'No such poll choice')
    if (!choice.poll._id.equals(poll._id)) throw new ApiError(httpStatus.NOT_FOUND, 'No such choice for this poll')
  } else {
    // create a new choice
    const choiceData = choiceIdOrObject
    if (!choiceData.text) throw new ApiError(httpStatus.BAD_REQUEST, 'Provide choice is missing the text field')
    const existingPollChoice = await PollChoice.findOne({ poll: poll._id, text: choiceData.text })
    if (existingPollChoice)
      throw new ApiError(httpStatus.BAD_REQUEST, 'The new choice text provided matches an existing choice')

    choiceData.owner = user
    choiceData.poll = poll
    choice = new PollChoice(choiceData)
    await choice.save()
  }

  const vote = new PollResponse({
    owner: user,
    poll,
    choice
  })

  await vote.save()

  logger.info('Vote poll %s %s', pollId, user._id, choice._id)
  return vote.replaceObjectsWithIds()
}

const inspectPoll = async (pollId, user) => {
  const [poll, choices] = await Promise.all([Poll.findById(pollId), PollChoice.find({ poll: pollId })])
  logger.info('Inspect poll %s %s', pollId, user._id)

  const pollData = poll.toObject()
  pollData.choices = choices.map((choice) => choice.toObject())

  const userPollView = await getUserPollView(pollData, user)
  return userPollView
}

const getPollResponses = async (pollId, user) => {
  // TODO this needs refining
  const poll = await Poll.findById(pollId)
  if (!poll) throw new ApiError(httpStatus.NOT_FOUND, 'No such poll')

  const myVote = await PollResponse.findOne({ poll: pollId, owner: user._id })
  if (!myVote) throw new ApiError(httpStatus.UNAUTHORIZED, 'You have not participated in this poll')

  // const numResponses = await PollResponse.countDocuments({ poll: pollId })
  // if (numResponses < poll.threshold) throw new ApiError(httpStatus.UNAUTHORIZED, 'Poll threshold has not been reached')

  // TODO filter data coming back
  const pollResponses = await PollResponse.find({ poll: pollId })
  logger.info('get poll responses', pollId, user._id)
  return pollResponses
}

module.exports = {
  createPoll,
  findById,
  listPolls,
  // validatePoll,
  votePoll,
  inspectPoll,
  getPollResponses,
  getUserPollView
}
