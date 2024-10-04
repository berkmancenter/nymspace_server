const mongoose = require('mongoose')
const { toJSON, paginate } = require('./plugins')

const schema = mongoose.Schema(
  {
    user: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
      required: true
    },
    thread: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'Thread'
    },
    topic: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'Topic'
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
