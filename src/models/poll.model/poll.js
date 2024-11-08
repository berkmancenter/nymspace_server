const mongoose = require('mongoose')
const slugify = require('slugify')
const { toJSON, paginate } = require('../plugins')

const pollSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    description: {
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
    owner: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
      required: true,
      private: false,
      index: true
    },
    threshold: {
      type: Number,
      min: 0,
      index: true
    },
    expirationDate: {
      type: Date,
      index: true
    },
    topic: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'Topic',
      required: true,
      index: true
    },
    multiSelect: {
      type: Boolean,
      required: true,
      default: false
    },
    allowNewChoices: {
      type: Boolean,
      required: true,
      default: false
    },
    choicesVisible: {
      type: Boolean,
      required: true,
      default: false
    },
    responseCountVisible: {
      type: Boolean,
      required: true,
      default: false
    },
    onlyOwnChoicesVisible: {
      type: Boolean,
      required: true,
      default: true
    },
    whenResponsesVisible: {
      type: String,
      required: true,
      enum: ['thresholdAndExpiration', 'thresholdOnly', 'expirationOnly'],
      default: 'thresholdAndExpiration'
    },
    responsesVisibleToNonParticipants: {
      type: Boolean,
      required: true,
      default: false
    },
    followers: [{ type: mongoose.SchemaTypes.ObjectId, ref: 'Follower' }]
  },
  {
    timestamps: true
  }
)

// add plugin that converts mongoose to json
pollSchema.plugin(toJSON)
pollSchema.plugin(paginate)

pollSchema.pre('validate', function (next) {
  const poll = this
  poll.slug = slugify(poll.title)
  next()
})

/**
 * @typedef poll
 */
const poll = mongoose.model('Poll', pollSchema)

module.exports = poll
