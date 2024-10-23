const mongoose = require('mongoose')
const { toJSON, paginate } = require('../plugins')

const pollResponseSchema = mongoose.Schema(
  {
    owner: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
      required: true,
      private: false,
      index: true
    },
    poll: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'Poll',
      required: true,
      private: false,
      index: true
    },
    choice: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'PollChoice',
      required: true,
      private: false,
      index: true
    }
  },
  {
    timestamps: true
  }
)

// add plugin that converts mongoose to json
pollResponseSchema.plugin(toJSON)
pollResponseSchema.plugin(paginate)

pollResponseSchema.static('replaceObjectsWithIds', function (pollResponse) {
  const pollResponseData = pollResponse.toObject()
  pollResponseData.owner = pollResponseData.owner._id
  pollResponseData.poll = pollResponseData.poll._id
  pollResponseData.choice = pollResponseData.choice._id
  return pollResponseData
})

pollResponseSchema.method('replaceObjectsWithIds', function () {
  return pollResponseSchema.statics.replaceObjectsWithIds(this)
})

/**
 * @typedef pollResponse
 */
const pollResponse = mongoose.model('PollResponse', pollResponseSchema)

module.exports = pollResponse
