const { google } = require('googleapis')
const { AgentMessageActions } = require('../../../../types/agent.types')
const verify = require('./verify')
const config = require('../../../../config/config')

const PERSPECTIVE_API_URL = 'https://commentanalyzer.googleapis.com/$discovery/rest?version=v1alpha1'
const TOXICITY_THRESHOLD = 0.7

module.exports = verify({
  name: 'Civility Agent using Perspective API (Per Message)',
  description: `A basic civility agent using Perspective API with threshold ${TOXICITY_THRESHOLD} to prevent personal or identity based attacks`,
  maxTokens: 2000,
  // don't include any history
  useNumLastMessages: 0,
  // no min new messages
  minNewMessages: undefined,
  // no timer activation
  timerPeriod: undefined,
  // template not needed
  template: undefined,
  async initialize() {
    return true
  },
  async evaluate(userMessage) {
    const googleClient = await google.discoverAPI(PERSPECTIVE_API_URL)
    const analyzeRequest = {
      comment: {
        text: userMessage.body
      },
      requestedAttributes: {
        TOXICITY: {},
        // these below are experimental as of 11/24
        SEVERE_TOXICITY: {},
        IDENTITY_ATTACK: {},
        INSULT: {},
        PROFANITY: {},
        THREAT: {}
      }
    }

    const { data } = await googleClient.comments.analyze({
      key: config.llms.perspectiveAPI.key,
      resource: analyzeRequest
    })

    const summaryScores = {}

    for (const dimension of Object.keys(data.attributeScores)) {
      summaryScores[dimension] = data.attributeScores[dimension].summaryScore.value
    }

    const action = summaryScores.TOXICITY < TOXICITY_THRESHOLD ? AgentMessageActions.OK : AgentMessageActions.REJECT

    this.agentEvaluation = {
      userMessage,
      action,
      agentContributionVisible: false,
      userContributionVisible: true,
      suggestion: `@${userMessage.user}: Please rephrase your comment to be more civil.`,
      contribution: undefined
    }

    return this.agentEvaluation
  },
  async isWithinTokenLimit() {
    // Is there a token limit for Perspective API? Assuming this is not a problem for this agent
    // Ref: https://developers.perspectiveapi.com/s/about-the-api-methods?language=en_US
    return true
  }
})
