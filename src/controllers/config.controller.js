const httpStatus = require('http-status')
const config = require('../config/config')
const catchAsync = require('../utils/catchAsync')
const agentTypesPromise = require('../models/user.model/agent.model/agentTypes/config')

const getConfig = catchAsync(async (req, res) => {
  const agentTypes = await agentTypesPromise
  return res.status(httpStatus.OK).send({
    maxMessageLength: config.maxMessageLength,
    enablePolls: config.enablePolls,
    enableAgents: config.enableAgents,
    availableAgents: config.enableAgents ? agentTypes : []
  })
})

module.exports = {
  getConfig
}
