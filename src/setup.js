const { initializeAgents } = require('./services/agent.service')

module.exports = async () => {
  await initializeAgents()
}
