import { ChatOpenAI } from '@langchain/openai'
import { RunnableSequence } from '@langchain/core/runnables'
import { PromptTemplate } from '@langchain/core/prompts'
import { StringOutputParser } from '@langchain/core/output_parsers'
// eslint-disable-next-line import/no-unresolved
import { isWithinTokenLimit } from 'gpt-tokenizer/esm/model/gpt-4o-mini'
import { AgentMessageActions } from '../../../../types/agent.types.js'
import verify from './verify.mjs'
import formatConvHistory from '../helpers/formatConvHistory.mjs'
import llmChain from '../helpers/llmChain.mjs'
import config from '../../../../config/config.js'
import Message from '../../../message.model.js'

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
const chatTemplate = `You are a facilitator of an online deliberation on the given discussion topic.
You will receive the most recent comments on the topic.
In each line of the most recent comments, I provide you with a participant's handle name, followed by a ":" and then the participants's comment on the given discussion topic.
You will also receive summaries of the conversation that occurred prior to these most recent comments.
A participant has asked you the given Participant Question, addressing you as '@"Reflection Agent".' Do your best to answer the
question, but only if it concerns the discussion topic or guidelines for healthy civil deliberation.
Othwerise, respond with a polite reminder that you can only answer questions about the discussion topic or deliberation procedure.
Deliberation topic: {topic}
Comments: {convHistory}
Summaries: {summaries}
Participant Question: {question}
Answer:`
const minMessagesForSummary = 7

export default verify({
  name: 'Reflection Agent',
  description: 'A deliberation facilitator that reflects arguments and builds consensus',
  priority: 20,
  maxTokens: 2000,
  useNumLastMessages: 7,
  minNewMessages: undefined,
  timerPeriod: '5 minutes',
  introMessage: `Welcome to the conversation! I am your automated facilitator. You can ask me questions about the discussion topic or tips for healthy discourse by using @"Reflection Agent" in your message.
    I will also chime in occasionally with my perspective on the discussion and some proposals for reaching consensus.`,

  async initialize() {
    return true
  },
  async evaluate(userMessage) {
    let action = AgentMessageActions.OK

    if (userMessage?.body.includes(`@"${this.name}"`)) {
      // direct message - always respond
      action = AgentMessageActions.CONTRIBUTE
    } else {
      // find the last summarization (invisible agent message)
      const lastInvisibleIndex = this.thread.messages.findLastIndex((msg) => !msg.visible && msg.fromAgent)
      // calculate the number of human messages received since last summarization
      const countSinceSummary =
        lastInvisibleIndex === -1
          ? this.thread.messages.filter((msg) => !msg.fromAgent).length
          : this.thread.messages.slice(lastInvisibleIndex).filter((msg) => !msg.fromAgent).length

      if (!userMessage && countSinceSummary > 0) {
        // periodic invocation - there has been at least one new message
        action = AgentMessageActions.CONTRIBUTE
      } else if (userMessage && countSinceSummary + 1 >= minMessagesForSummary) {
        action = AgentMessageActions.CONTRIBUTE
      }
    }

    return {
      userMessage,
      action,
      userContributionVisible: true,
      suggestion: undefined
    }
  },
  async respond(userMessage) {
    let llmResponse
    const humanMsgs = this.thread.messages.filter((msg) => !msg.fromAgent)
    const convHistory = formatConvHistory(humanMsgs, this.useNumLastMessages, userMessage)

    const summaryMessages = this.thread.messages.filter((msg) => msg.fromAgent && !msg.visible)
    const summaries = summaryMessages.map((message) => {
      return `Summary: ${message.body}`
    })
    if (userMessage?.body.includes(`@"${this.name}"`)) {
      llmResponse = await getSinglePromptResponse(llm, chatTemplate, {
        convHistory,
        summaries,
        topic: this.thread.name,
        question: userMessage.body
      })
    } else {
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
      llmResponse = await chain.invoke({ topic: this.thread.name, convHistory, summaries })
    }

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
