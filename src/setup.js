const config = require('./config/config')
const { initializeAgents } = require('./services/agent.service')

module.exports = async () => {
  if (config.enableAgents) await initializeAgents()
}
