const mongoose = require('mongoose');
const slugify = require('slugify');
const { toJSON, paginate } = require('./plugins');

const topicSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
    },
    votingAllowed: {
      type: Boolean,
      required: true,
    },
    private: {
      type: Boolean,
      required: true,
    },
    passcode: {
      type: Number,
      private: true,
    },
    archivable: {
      type: Boolean,
      required: true,
    },
    archived: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    isArchiveNotified: {
      type: Boolean,
      default: false,
    },
    owner: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
      required: true,
      private: true,
    },
    threads: [{ type: mongoose.SchemaTypes.ObjectId, ref: 'Thread' }],
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
topicSchema.plugin(toJSON);
topicSchema.plugin(paginate);

topicSchema.pre('validate', function (next) {
  const topic = this;
  topic.slug = slugify(topic.name);
  next();
});

/**
 * @typedef Topic
 */
const Topic = mongoose.model('Topic', topicSchema);

module.exports = Topic;
