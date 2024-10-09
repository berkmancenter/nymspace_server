const httpStatus = require('http-status')
const logger = require('../../config/logger')
const { Poll, PollResponse } = require('../../models')
const ApiError = require('../../utils/ApiError')

const createPoll = async (pollData, user) => {
  const poll = new Poll({
    ...pollData,
    owner: user._id
  })
  await poll.save()
  logger.info('Created poll', poll._id, poll.title)
  return poll
}

const findById = async (pollId) => {
  const poll = await Poll.findById(pollId)
  return poll
}

// TODO: Transform poll view for user?
const getUserPollView = (poll, user) => {
  logger.info('Get user poll view', poll._id, user._id)
  return poll
}

// TODO: Query and sorting params structure? Evaluate existing structure...
const listPolls = async (query, user) => {
  const polls = await Poll.find(query)
  logger.info('List polls', query, polls.length)
  return polls.map((poll) => getUserPollView(poll, user))
}

// Not yet supported
// function validatePoll(poll, validator, response) {
// }

const votePoll = async (poll, voter, choiceId) => {
  logger.info('Vote poll', poll._id, voter._id, choiceId)
  return { voteResponse: 'placeholder' }
}

const inspectPoll = async (pollId, user) => {
  const poll = await Poll.findById(pollId)
  logger.info('Inspect poll', pollId, user._id)
  const userPollView = await getUserPollView(poll, user)
  return userPollView
}

const getPollResponses = async (pollId, user) => {
  // TODO this needs refining
  const poll = await Poll.findById(pollId)
  if (!poll) throw new ApiError(httpStatus.NOT_FOUND, 'No such poll')

  const myVote = await PollResponse.findOne({ poll: pollId, owner: user._id })
  if (!myVote) throw new ApiError(httpStatus.UNAUTHORIZED, 'You have not participated in this poll')

  const numResponses = await PollResponse.countDocuments({ poll: pollId })
  if (numResponses < poll.threshold) throw new ApiError(httpStatus.UNAUTHORIZED, 'Poll threshold has not been reached')

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
