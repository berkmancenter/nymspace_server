const mongoose = require('mongoose')
const { toJSON, paginate } = require('./plugins')

const voteSchema = mongoose.Schema({
  owner: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: 'BaseUser',
    required: false
  }
})

const messageSchema = mongoose.Schema(
  {
    body: {
      type: String,
      required: true,
      trim: true
    },
    owner: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'BaseUser',
      required: false,
      index: true
    },
    thread: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'Thread',
      required: true,
      index: true
    },
    upVotes: {
      type: [voteSchema]
    },
    downVotes: {
      type: [voteSchema]
    },
    pseudonym: {
      type: String,
      required: true
    },
    pseudonymId: {
      type: mongoose.SchemaTypes.ObjectId,
      required: true,
      index: true
    },
    // from a non-human agent
    fromAgent: {
      type: Boolean,
      default: false,
      required: true,
      index: true
    },
    // to help with backchannel interactions
    visible: {
      type: Boolean,
      default: true,
      required: true,
      index: true
    }
  },
  {
    timestamps: true
  }
)

// add plugin that converts mongoose to json
messageSchema.plugin(toJSON)
messageSchema.plugin(paginate)

// index timestamps
messageSchema.index({ createdAt: 1 })
messageSchema.index({ updatedAt: 1 })

/**
 * @typedef User
 */
const Message = mongoose.model('Message', messageSchema)

module.exports = Message
