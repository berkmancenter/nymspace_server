const mongoose = require('mongoose')
const slugify = require('slugify')
const { toJSON, paginate } = require('./plugins')

const topicSchema = mongoose.Schema(
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
    votingAllowed: {
      type: Boolean,
      required: true
    },
    threadCreationAllowed: {
      type: Boolean,
      required: true
    },
    private: {
      type: Boolean,
      required: true,
      index: true // we query on this
    },
    passcode: {
      type: Number,
      private: true
    },
    archivable: {
      type: Boolean,
      required: true,
      index: true
    },
    archived: {
      type: Boolean,
      default: false,
      private: true,
      index: true
    },
    isDeleted: {
      type: Boolean,
      default: false,
      private: true,
      index: true // We need to query on this
    },
    isArchiveNotified: {
      type: Boolean,
      default: false,
      private: true,
      index: true
    },
    archiveEmail: {
      type: String
    },
    owner: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'BaseUser',
      required: true,
      index: true
    },
    threads: [{ type: mongoose.SchemaTypes.ObjectId, ref: 'Thread' }],
    // NOTE! polls are intentionally excluded from being saved here in order to prevent accidental disclosure of the
    // owner of a poll, which is sensitive information
    // really, we might want to consider moving all embedded document out and use a lookup instead
    // especially for messages on threads, etc.
    // this could help with performance
    followers: [{ type: mongoose.SchemaTypes.ObjectId, ref: 'Follower' }]
  },
  {
    timestamps: true
  }
)

// add plugin that converts mongoose to json
topicSchema.plugin(toJSON)
topicSchema.plugin(paginate)

// index timestamps
topicSchema.index({ createdAt: 1 })
topicSchema.index({ updatedAt: 1 })

topicSchema.pre('validate', function (next) {
  const topic = this
  topic.slug = slugify(topic.name)
  next()
})

/**
 * @typedef Topic
 */
const Topic = mongoose.model('Topic', topicSchema)

module.exports = Topic
