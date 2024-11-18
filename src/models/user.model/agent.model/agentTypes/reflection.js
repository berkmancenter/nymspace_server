const { ChatOpenAI } = require('@langchain/openai')
const { RunnableSequence } = require('@langchain/core/runnables')
const { PromptTemplate } = require('@langchain/core/prompts')
const { StringOutputParser } = require('@langchain/core/output_parsers')
// eslint-disable-next-line import/no-unresolved
const { isWithinTokenLimit } = require('gpt-tokenizer/model/gpt-4o-mini')
const { AgentMessageActions } = require('../../../../types/agent.types')
const verify = require('./verify')
const formatConvHistory = require('../helpers/formatConvHistory')
const config = require('../../../../config/config')
const { Message } = require('../../..')

const llm = new ChatOpenAI(
  {
    apiKey: config.llms.openAI.key,
    model: 'gpt-4o-mini'
  },
  {
    basePath: config.llms.basePath
  }
)

const summarizationTemplate = `You are a facilitator of an online deliberation on the given discussion topic.
You will receive the most recent comments on the topic.
In each line of the most recent comments, I provide you with a participant's handle name, followed by a ":" and then the participants's comment on the given discussion topic.
You will also receive summaries of the conversation that occurred prior to these most recent comments.
Please generate a summary of the deliberation thus far. Do not summarize the comments one at a time.
Instead write a well-written, highly coherent, and all encompassing summary.
In the summary, make sure to include information and quantification on how much agreement versus disagreement there was among participants.
Exclude off-topic comments from your analysis.
Deliberation topic: {topic}
Comments: {convHistory}
Summaries: {summaries}
Answer:`
const consensusTemplate = `Given the following summary of various comments from a deliberation platform, generate one original comment that is likely to get consensus.
I am including your prior consensus proposals. Make sure your original comment is unique from these prior proposals.
Present your comment to the group for discussion along with a more concise summary of the discussion thus far.
Limit your summary and comment to one paragraph. Use a conversational tone. Present the summary first. Do not identify the summary and comment with labels.
Summary: {summary}
Prior Consensus Proposals: {proposals}
Answer: `

module.exports = verify({
  name: 'Reflection Agent',
  description: 'A deliberation facilitator that reflects arguments and builds consensus',
  maxTokens: 2000,
  useNumLastMessages: 7,
  minNewMessages: 7,
  timerPeriod: '5 minutes',

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
  async respond(userMessage) {
    const humanMsgs = this.thread.messages.filter((msg) => !msg.fromAgent)
    const convHistory = formatConvHistory(humanMsgs, this.useNumLastMessages, userMessage)

    const summaryMessages = this.thread.messages.filter((msg) => msg.fromAgent && !msg.visible)
    const summaries = summaryMessages.map((message) => {
      return `Summary: ${message.body}`
    })

    const summarizationPrompt = PromptTemplate.fromTemplate(summarizationTemplate)
    const summarizationChain = summarizationPrompt.pipe(llm).pipe(new StringOutputParser())
    const consensusPrompt = PromptTemplate.fromTemplate(consensusTemplate)

    // Store detailed summaries as invisible agent messages to use for context in future analysis
    const storeSummary = async (summary) => {
      const agentMessage = new Message({
        fromAgent: true,
        visible: false,
        body: summary,
        thread: this.thread._id,
        pseudonym: this.name,
        pseudonymId: this.pseudonyms[0]._id,
        owner: this._id
      })

      agentMessage.save()
      this.thread.messages.push(agentMessage.toObject())
      await this.thread.save()

      // TODO this includes prior summarization as well. May need to separate those two to limit tokens
      const proposals = this.thread.messages.filter((msg) => msg.fromAgent && msg.visible)
      return {
        summary,
        proposals
      }
    }

    const chain = RunnableSequence.from([
      summarizationChain,
      (input) => storeSummary(input),
      consensusPrompt,
      llm,
      new StringOutputParser()
    ])

    const llmResponse = await chain.invoke({ topic: this.thread.name, convHistory, summaries })

    const agentResponse = {
      visible: true,
      message: llmResponse
    }

    return [agentResponse]
  },
  async isWithinTokenLimit(promptText) {
    return isWithinTokenLimit(promptText, this.tokenLimit)
  }
})
