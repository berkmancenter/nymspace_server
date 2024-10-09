const mongoose = require('mongoose')
const { toJSON, paginate } = require('../plugins')

const pollChoiceSchema = mongoose.Schema(
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
    }
  },
  {
    timestamps: true
  }
)

// add plugin that converts mongoose to json
pollChoiceSchema.plugin(toJSON)
pollChoiceSchema.plugin(paginate)

/**
 * @typedef pollChoice
 */
const pollChoice = mongoose.model('PollChoice', pollChoiceSchema)

module.exports = pollChoice
