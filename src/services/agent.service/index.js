const logger = require('../../config/logger')
const { Agent } = require('../../models')
const { AgentMessageActions } = require('../../types/agent.types')
const agentConfig = require('./config')

/**
 * Process a message from a user with an agent
 * @param {string} message
 * @returns {Promise<AgentResponse>}
 */

const processMessage = async (message, agent) => {
  // TODO: Extend here

  /** @type {AgentResponse} */
  const agentResponse = {
    agent: agent._id,
    name: agent.name,
    action: AgentMessageActions.OK,
    suggestion: 'The agent recommends rewriting your message like this: blah blah',
    annotation: 'Placeholder text'
  }

  return agentResponse
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
