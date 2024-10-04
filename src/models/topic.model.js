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
      trim: true
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
      required: true
    },
    passcode: {
      type: Number,
      private: true
    },
    archivable: {
      type: Boolean,
      required: true
    },
    archived: {
      type: Boolean,
      default: false,
      private: true
    },
    isDeleted: {
      type: Boolean,
      default: false,
      private: true
    },
    isArchiveNotified: {
      type: Boolean,
      default: false,
      private: true
    },
    archiveEmail: {
      type: String
    },
    owner: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
      required: true
    },
    threads: [{ type: mongoose.SchemaTypes.ObjectId, ref: 'Thread' }],
    followers: [{ type: mongoose.SchemaTypes.ObjectId, ref: 'Follower' }]
  },
  {
    timestamps: true
  }
)

// add plugin that converts mongoose to json
topicSchema.plugin(toJSON)
topicSchema.plugin(paginate)

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
