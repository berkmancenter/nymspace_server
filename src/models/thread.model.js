const mongoose = require('mongoose')
const slugify = require('slugify')
const { toJSON, paginate } = require('./plugins')

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
    owner: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
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
    messages: [{ type: mongoose.SchemaTypes.ObjectId, ref: 'Message' }],
    followers: [{ type: mongoose.SchemaTypes.ObjectId, ref: 'Follower' }]
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

/**
 * @typedef Thread
 */
const Thread = mongoose.model('Thread', threadSchema)

module.exports = Thread
