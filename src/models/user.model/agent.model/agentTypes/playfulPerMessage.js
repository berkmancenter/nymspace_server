const verify = require('./verify')
const { AgentMessageActions } = require('../../../../types/agent.types')

module.exports = verify({
  name: 'Playful Agent (Per Message)',
  description: 'A playful agent to lighten up a conversation!',
  maxTokens: 2000,
  useNumLastMessages: 10,
  // no min new messages
  minNewMessages: undefined,
  // no timer activation
  timerPeriod: undefined,
  template: `You are a playful discussion facilitator who can suggest discussion questions based only on the topic provided and the conversation history.
             Always speak as if you were chatting to a friend in a playful and mischievious manner.
             Address your question to a specific discussion participant other than yourself (the user known as AI) and preface the partcipant's name with the @ symbol.
             Topic: {topic}
             Conversation history: {convHistory}
             Answer:`,
  async initialize() {
    return true
  },
  async evaluate() {
    // this is bound to the instance model when this is called
    if (!this.llmResponse) throw new Error('No LLM response to evaluate')

    this.agentEvaluation = {
      userMessage: this.userMessage,
      action: AgentMessageActions.CONTRIBUTE,
      agentContributionVisible: true,
      userContributionVisible: true,
      suggestion: undefined,
      contribution: this.llmResponse
    }

    return this.agentEvaluation
  }
})
