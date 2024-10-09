const logger = require('../../config/logger')
const { Agent, Message } = require('../../models')
const { AgentMessageActions } = require('../../types/agent.types')
const agentConfig = require('./config')
const { ChatOpenAI } = require('@langchain/openai')
const { PromptTemplate } = require('@langchain/core/prompts')
const { StringOutputParser } = require('@langchain/core/output_parsers')

const llm = new ChatOpenAI(
  {
    apiKey: process.env.OPENAI_API_KEY
    // can specify model here, default is gpt-3.5.-turbo
  },
  {
    basePath: process.env.API_BASE_PATH
  }
)
const answerTemplate = `You are a playful discussion facilitator who can suggest discussion questions based only on the topic provided and the conversation history.  Always speak as if you were chatting to a friend in a playful and mischievious manner. Address your question to a specific discussion participant other than yourself (the user known as AI) and preface the partcipant's name with the @ symbol.
topic: {topic}
conversation history: {conv_history}
answer: `
const answerPrompt = PromptTemplate.fromTemplate(answerTemplate)
const answerChain = answerPrompt.pipe(llm).pipe(new StringOutputParser())

/**
 * Process a message from a user with an agent
 * @param {string} message
 * @returns {Promise<AgentResponse>}
 */

const processMessage = async (message, user, thread, agentId) => {
  // TODO was passing in just the ObjectId rather than the agent intentional?
  const agent = await Agent.findById(agentId)
  const activePseudo = user.pseudonyms.find((x) => x.active)
  const messageHistory = await Message.find({ thread: thread._id })
  const convHistory = formatConvHistory(messageHistory)
  convHistory.push(`${activePseudo.pseudonym}: ${message}`)

  // TODO investigate various conversational memory options if needed: https://www.pinecone.io/learn/series/langchain/langchain-conversational-memory/
  const response = await answerChain.invoke({
    conv_history: convHistory,
    topic: thread.name
  })
  // Include agent responses in the conversation history
  // TODO this should probably be removed when agent can just contribute to the discussion
  // as a specialized user, which would automatically create messages somehow?
  // These do show up in the UI after hitting refresh, though the sequencing is sometimes off
  // Not sure how granular the timestamps are for ordering.....
  const agentMessage = await Message.create({
    body: response,
    thread,
    pseudonym: agent.name,
    pseudonymId: activePseudo._id, // TODO this is really wrong, just needed an actual id and agents don't have pseudonyms atm
    owner: agent
  })

  thread.messages.push(agentMessage.toObject())
  await thread.save()

  /** @type {AgentResponse} */
  const agentResponse = {
    agent: agent._id,
    name: agent.name,
    action: AgentMessageActions.ANNOTATE,
    annotation: response
  }

  return agentResponse
}

const formatConvHistory = (messages) => {
  return messages.map((message) => {
    if (message.fromAgent) {
      return `AI: ${message.body}`
    } else {
      return `${message.pseudonym}: ${message.body}`
    }
  })
}

const createAgents = async () => {
  const agents = await Agent.find()
  const agentMap = {}
  for (const agent of agents) {
    agentMap[agent.name] = true
  }

  const agentsToCreate = []
  for (const agentData of agentConfig) {
    if (!agentMap[agentData.name]) agentsToCreate.push(new Agent(agentData))
  }

  if (agentsToCreate.length) {
    await Agent.create(agentsToCreate)
    logger.info(`Created ${agentsToCreate.length} missing agents`)
  }
}

module.exports = {
  processMessage,
  createAgents
}
