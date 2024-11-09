const { ChatOpenAI } = require('@langchain/openai')
// eslint-disable-next-line import/no-unresolved
const { isWithinTokenLimit } = require('gpt-tokenizer/model/gpt-3.5-turbo')
const { AgentMessageActions } = require('../../../../types/agent.types')
const verify = require('./verify')
const formatConvHistory = require('../helpers/formatConvHistory')
const { getSinglePromptResponse } = require('../helpers/llmChain')
const config = require('../../../../config/config')

const llm = new ChatOpenAI(
  {
    apiKey: config.llms.openAI.key
    // can specify model here, default is gpt-3.5.-turbo
  },
  {
    basePath: config.llms.basePath
  }
)

const template = `You are a facilitator in a text-based chat. You consider one message at a time and your only responsibilities are to:
               1) prevent against any type of personal (i.e. ad hominem) attacks or dismissive personal statements,
               2) prevent personal or identity-based harassment or bullying
               3) prevent speaking for others, or assuming what are others are thinking or feeling
               4) prevent the use of profanity.
             Each message consists of the participants's handle name followed by the a ":" and then the user's message.
             If there is a problem with a specific message, please respond to the user by the partcipant's handle name, prefaced with the @ symbol. T
             You response should be a professional, simple, compassionate and clear one or two sentence explaining what problem exists with their message, and ask them to rephrase their response and resubmit it.
             You should allow free discussion of any topic so long as a message does not violate any of the three conditions above.
             Important! If there is no problem with a participants message, you should respond with the specific response "OK".
             Conversation topic: {topic}
             Message: {convHistory}
             Answer:`

module.exports = verify({
  name: 'Civility Agent (Per Message)',
  description: 'A basic civility agent to prevent personal or identity based attacks',
  maxTokens: 2000,
  // don't include any history
  useNumLastMessages: 0,
  // no min new messages
  minNewMessages: undefined,
  // no timer activation
  timerPeriod: undefined,
  template,
  async initialize() {
    return true
  },
  async evaluate() {
    const convHistory = formatConvHistory(this.thread.messages, this.useNumLastMessages, this.userMessage)
    const topic = this.thread.name
    const llmResponse = await getSinglePromptResponse(llm, template, { convHistory, topic })

    const action = llmResponse === 'OK' ? AgentMessageActions.OK : AgentMessageActions.REJECT

    this.agentEvaluation = {
      userMessage: this.userMessage,
      action,
      agentContributionVisible: false,
      userContributionVisible: true,
      suggestion: llmResponse,
      contribution: undefined
    }

    return this.agentEvaluation
  },
  async isWithinTokenLimit(promptText) {
    return isWithinTokenLimit(promptText, this.tokenLimit)
  }
})
