const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const topicSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    owner: {
      type: String,
      required: true,
      unique: false,
      trim: true,
      lowercase: true,
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
topicSchema.plugin(toJSON);
topicSchema.plugin(paginate);

/**
 * @typedef User
 */
const Topic = mongoose.model('Topic', topicSchema);

module.exports = Topic;
