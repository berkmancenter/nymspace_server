const { createAgents, initializeAgents } = require('./services/agent.service')

module.exports = async () => {
  await createAgents()
  await initializeAgents()
}
