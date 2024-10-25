const verify = require('./verify')
const { AgentMessageActions } = require('../../../../types/agent.types')

module.exports = verify({
  name: 'Playful Agent (Periodic)',
  description: 'A playful agent to lighten up a conversation!',
  maxTokens: 2000,
  useNumLastMessages: 20,
  minNewMessages: 2,
  timerPeriod: '30 seconds',
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
