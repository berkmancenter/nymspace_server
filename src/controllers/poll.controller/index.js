const httpStatus = require('http-status')
const catchAsync = require('../../utils/catchAsync')
const { pollService } = require('../../services')

const createPoll = catchAsync(async (req, res) => {
  const poll = await pollService.createPoll(req.body, req.user)
  return res.status(httpStatus.CREATED).send(poll)
})

// TODO: Query and sorting params structure? Evaluate existing structure...
const listPolls = catchAsync(async (req, res) => {
  const polls = await pollService.listPolls(req.query, req.user)
  return res.status(httpStatus.OK).send(polls)
})

// Not yet supported
// const validatePoll = catchAsync(async (req, res) => {
//   const response = await pollService.validatePoll(req.body, req.user)
//   return res.status(httpStatus.OK).send(poll)
// })

const votePoll = catchAsync(async (req, res) => {
  const poll = await pollService.findById(req.params.id)
  const voteResponse = await pollService.votePoll(poll, req.body, req.user)
  return res.status(httpStatus.OK).send(voteResponse)
})

const inspectPoll = catchAsync(async (req, res) => {
  const poll = await pollService.inspectPoll(req.params.id, req.user)
  return res.status(httpStatus.OK).send(poll)
})

const getPollResponses = catchAsync(async (req, res) => {
  const pollResponses = await pollService.getPollResponse(req.params.id, req.user)
  return res.status(httpStatus.OK).send(pollResponses)
})

module.exports = {
  createPoll,
  listPolls,
  votePoll,
  inspectPoll,
  getPollResponses
}
