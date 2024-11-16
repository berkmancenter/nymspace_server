const { Poll, PollChoice, PollResponse } = require('../../src/models/poll.model')
const { newPrivateTopic } = require('./topic.fixture')
const { WHEN_RESULTS_VISIBLE } = require('../../src/models/poll.model/constants')

const privateTopic = newPrivateTopic()

const pollOneBody = {
  title: 'Multiselect open threshold/expiration poll with hidden choices and visible responses for own choices',
  owner: 'TO BE OVERWRITTEN',
  topicId: privateTopic._id.toString(),
  threshold: 1,
  // will be filled in when created so expiration can be tested expirationDate:
  multiSelect: true,
  allowNewChoices: true,
  choicesVisible: false,
  responseCountsVisible: false,
  onlyOwnChoicesVisible: true,
  whenResultsVisible: WHEN_RESULTS_VISIBLE.THRESHOLD_AND_EXPIRATION,
  responsesVisibleToNonParticipants: false,
  responsesVisible: true
}

const pollTwoBody = {
  title: 'Single select closed threshold only poll with visible choices and visible responses for all choices',
  topicId: privateTopic._id.toString(),
  threshold: 2,
  multiSelect: false,
  allowNewChoices: false,
  choicesVisible: true,
  responseCountsVisible: false,
  onlyOwnChoicesVisible: false,
  whenResultsVisible: WHEN_RESULTS_VISIBLE.THRESHOLD_ONLY,
  responsesVisibleToNonParticipants: false,
  responsesVisible: true,
  choices: [
    {
      text: 'Choice 1'
    },
    {
      text: 'Choice 2'
    },
    {
      text: 'Choice 3'
    }
  ]
}

const pollThreeBody = {
  title: 'Single select closed expiration only poll with visible choices and response counts for all',
  topicId: privateTopic._id.toString(),
  // will be filled in when created so expiration can be tested expirationDate:
  multiSelect: false,
  allowNewChoices: false,
  choicesVisible: true,
  responseCountsVisible: true,
  onlyOwnChoicesVisible: false,
  whenResultsVisible: WHEN_RESULTS_VISIBLE.EXPIRATION_ONLY,
  responsesVisibleToNonParticipants: true,
  responsesVisible: false,
  choices: [
    {
      text: 'Choice 1'
    },
    {
      text: 'Choice 2'
    },
    {
      text: 'Choice 3'
    }
  ]
}

const insertPolls = async (polls) => {
  await Poll.insertMany(polls)
}

const getPolls = async () => {
  return Poll.find().sort({ createdAt: 1 })
}

const getPollChoices = async (pollId) => {
  return PollChoice.find({ poll: pollId }).sort({ createdAt: 1 })
}

const getPollResponses = async (pollId) => {
  return PollResponse.find({ poll: pollId }).sort({ createdAt: 1 })
}

module.exports = {
  pollOneBody,
  pollTwoBody,
  pollThreeBody,
  insertPolls,
  getPolls,
  getPollChoices,
  getPollResponses,
  privateTopic
}
