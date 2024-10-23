const httpStatus = require('http-status')
const config = require('../config/config')
const catchAsync = require('../utils/catchAsync')
const agentTypes = require('../models/user.model/agent.model/agentTypes')

const getConfig = catchAsync(async (req, res) => {
  return res.status(httpStatus.OK).send({
    enableAgents: config.enableAgents,
    availableAgents: config.enableAgents
      ? Object.keys(agentTypes).map((agentType) => {
          return {
            agentType,
            name: agentTypes[agentType].name,
            description: agentTypes[agentType].description
          }
        })
      : []
  })
})

module.exports = {
  getConfig
}
