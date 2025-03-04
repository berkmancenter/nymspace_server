const mongoose = require('mongoose')
const slugify = require('slugify')
const { toJSON, paginate } = require('./plugins')
const config = require('../config/config')

const threadSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    locked: {
      type: Boolean,
      default: false,
      index: true
    },
    enableAgents: {
      type: Boolean,
      default: false,
      index: true
    },
    owner: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'BaseUser',
      required: true,
      private: false,
      index: true
    },
    topic: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'Topic',
      required: true,
      index: true
    },
    messageCount: {
      type: mongoose.SchemaTypes.Number,
      ref: 'MessageCount'
    },
    followers: [{ type: mongoose.SchemaTypes.ObjectId, ref: 'Follower' }],
    agents: [{ type: mongoose.SchemaTypes.ObjectId, ref: 'Agent' }]
  },
  {
    timestamps: true
  }
)

// add plugin that converts mongoose to json
threadSchema.plugin(toJSON)
threadSchema.plugin(paginate)

// index timestamps
threadSchema.index({ createdAt: 1 })
threadSchema.index({ updatedAt: 1 })

threadSchema.pre('validate', function (next) {
  const thread = this
  thread.slug = slugify(thread.name)
  next()
})

threadSchema.post('findOne', async function () {
  if (config.enableAgents && this.enableAgents) await this.populate('agents').execPopulate()
})

/**
 * @typedef Thread
 */
const Thread = mongoose.model('Thread', threadSchema)

module.exports = Thread
