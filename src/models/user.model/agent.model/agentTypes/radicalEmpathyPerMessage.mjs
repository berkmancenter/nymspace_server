import { ChatOpenAI } from '@langchain/openai'
// eslint-disable-next-line import/no-unresolved
import { isWithinTokenLimit } from 'gpt-tokenizer/esm/model/gpt-4o-mini'
import { AgentMessageActions } from '../../../../types/agent.types.js'
import verify from './verify.mjs'
import formatConvHistory from '../helpers/formatConvHistory.mjs'
import llmChain from '../helpers/llmChain.mjs'
import config from '../../../../config/config.js'

const { getSinglePromptResponse } = llmChain

const llm = new ChatOpenAI(
  {
    apiKey: config.llms.openAI.key,
    model: 'gpt-4o-mini'
  },
  {
    basePath: config.llms.basePath
  }
)

const template = `You are a facilitator and coach in a text-based chat. Your job is to promote "radical empathy."
                  You consider one message at a time and your responsibilities are to:
               1) call out personal (i.e. ad hominem) attacks as inappropriate
               2) call out harassment or bullying against protected classes as inappropriate
               3) call out the use of profanity as inappropriate
               4) promote Active Listening
               5) encourage the use of Open-Ended Questions
               6) encourage a Non-Judgmental Orientation
               7) encourage Validating Emotions
               8) encourage Expressing Curiosity
               9) encourage Reflective Responses
               10) encourage Empathetic Language
               11) encourage Considering Context
               12) encourage Patience and Tolerance
               13) encourage Sharing Appropriate Vulnerability
             Each message starts with participants's username followed by ":" and then the participant's message.
             You respond to the last message, which is the most recent message.
             If there is a problem with the last message, or an opportunity to be substantially more empathic in the last message, please make a suggestion directed to the participant by their username (all text before the : character), prefaced with the @ symbol.
             Please compassionately suggest specific ways to alter or improve their communication to be more empathic, in light of previous messages in the chat.
             Important! If there is no problem with a participants message, you should respond with the specific response "OK".
             If you see a message that includes '@"Radical Empathy Agent"' that is a direct question to you. Please do your best to answer the question in the same spirit.
             Message: {convHistory}
             Answer:`

export default verify({
  name: 'Radical Empathy Agent',
  description: 'A agent which seeks to promote radical empathy among participants',
  priority: 10,
  maxTokens: 2000,
  // don't include any history
  useNumLastMessages: 10,
  // no min new messages
  minNewMessages: undefined,
  // no timer activation
  timerPeriod: undefined,
  template,
  async initialize() {
    return true
  },
  async evaluate(userMessage) {
    const convHistory = formatConvHistory(this.thread.messages, this.useNumLastMessages, userMessage)
    const topic = this.thread.name
    const llmResponse = await getSinglePromptResponse(llm, template, { convHistory, topic })

    const action = llmResponse === 'OK' ? AgentMessageActions.OK : AgentMessageActions.REJECT

    this.agentEvaluation = {
      userMessage,
      action,
      agentContributionVisible: true,
      userContributionVisible: true,
      suggestion: llmResponse,
      contribution: undefined
    }

    return this.agentEvaluation
  },
  async respond() {
    if (this.agentEvaluation.action === AgentMessageActions.OK) return []
    // disable agent contribution. Use reject instead.
    // const agentMessage = {
    //   visible: true,
    //   message: this.agentEvaluation.contribution
    // }
    // return [agentMessage]
    return []
  },
  async isWithinTokenLimit(promptText) {
    return isWithinTokenLimit(promptText, this.tokenLimit)
  }
})
