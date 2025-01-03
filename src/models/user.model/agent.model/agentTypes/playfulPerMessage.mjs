import { ChatOpenAI } from '@langchain/openai'
// eslint-disable-next-line import/no-unresolved
import { isWithinTokenLimit } from 'gpt-tokenizer/esm/model/gpt-3.5-turbo'
import verify from './verify.mjs'
import { AgentMessageActions } from '../../../../types/agent.types.js'
import formatConvHistory from '../helpers/formatConvHistory.mjs'
import llmChain from '../helpers/llmChain.mjs'
import config from '../../../../config/config.js'

const { getSinglePromptResponse } = llmChain

const llm = new ChatOpenAI(
  {
    apiKey: config.llms.openAI.key
    // can specify model here, default is gpt-3.5.-turbo
  },
  {
    basePath: config.llms.basePath
  }
)

const template = `You are a playful discussion facilitator who can suggest discussion questions based only on the topic provided and the conversation history.
Always speak as if you were chatting to a friend in a playful and mischievious manner.
Address your question to a specific discussion participant other than yourself (the user known as AI) and preface the partcipant's name with the @ symbol.
Make sure your question is unique from prior questions you have asked.
Topic: {topic}
Conversation history: {convHistory}
Answer:`

export default verify({
  name: 'Playful Agent (Per Message)',
  description: 'A playful agent to lighten up a conversation!',
  priority: 100,
  maxTokens: 2000,
  useNumLastMessages: 10,
  // no min new messages
  minNewMessages: undefined,
  // no timer activation
  timerPeriod: undefined,
  async initialize() {
    return true
  },
  async evaluate(userMessage) {
    return {
      userMessage,
      action: AgentMessageActions.CONTRIBUTE,
      userContributionVisible: true,
      suggestion: undefined
    }
  },
  async isWithinTokenLimit(promptText) {
    return isWithinTokenLimit(promptText, this.tokenLimit)
  },
  async respond(userMessage) {
    const convHistory = formatConvHistory(this.thread.messages, this.useNumLastMessages, userMessage)
    const topic = this.thread.name
    const llmResponse = await getSinglePromptResponse(llm, template, { convHistory, topic })

    const agentResponse = {
      visible: true,
      message: llmResponse
    }

    return [agentResponse]
  }
})
