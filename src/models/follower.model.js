const mongoose = require('mongoose')
const { toJSON, paginate } = require('./plugins')

const schema = mongoose.Schema(
  {
    user: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    thread: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'Thread',
      index: true
    },
    topic: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'Topic',
      index: true
    }
  },
  {
    timestamps: true
  }
)

// add plugin that converts mongoose to json
schema.plugin(toJSON)
schema.plugin(paginate)

/**
 * @typedef Follower
 */
const Follower = mongoose.model('Follower', schema)

module.exports = Follower
