const { createAgents } = require('./services/agent.service')

module.exports = async () => {
  await createAgents()
}
