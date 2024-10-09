const mongoose = require('mongoose')
const { toJSON, paginate } = require('../plugins')

const pollResponseSchema = mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
      trim: true
    },
    owner: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
      required: true,
      private: false
    },
    poll: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'Poll',
      required: true,
      private: false
    },
    choice: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'PollChoice',
      required: true,
      private: false
    }
  },
  {
    timestamps: true
  }
)

// add plugin that converts mongoose to json
pollResponseSchema.plugin(toJSON)
pollResponseSchema.plugin(paginate)

/**
 * @typedef pollResponse
 */
const pollResponse = mongoose.model('PollResponse', pollResponseSchema)

module.exports = pollResponse
