const mongoose = require('mongoose')
const { toJSON, paginate } = require('../plugins')
const BaseUser = require('./baseUser.model')

const agentSchema = mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true
    }
    // TODO: Extend with options, etc or
    // TODO: subclass with discriminators: https://mongoosejs.com/docs/discriminators.html
  },
  {
    timestamps: true
  }
)

// add plugin that converts mongoose to json
agentSchema.plugin(toJSON)
agentSchema.plugin(paginate)

/**
 * @typedef Agent
 */
const Agent = BaseUser.discriminator('Agent', agentSchema)

module.exports = Agent
