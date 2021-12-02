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
    owner: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
      required: true,
      private: true,
    },
    threads: [{ type: mongoose.SchemaTypes.ObjectId, ref: 'Thread' }]
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
