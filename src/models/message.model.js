const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const voteSchema = mongoose.Schema(
  {
    owner: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
      required: false,
    },
  }
);

const messageSchema = mongoose.Schema(
  {
    body: {
      type: String,
      required: true,
      trim: true,
    },
    owner: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
      required: false,
    },
    thread: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'Thread',
      required: true,
    },
    upVotes: {
      type: [voteSchema],
    },
    downVotes: {
      type: [voteSchema],
    },
    pseudonym: {
      type: String,
      required: true,
    },
    pseudonymId: {
      type: mongoose.SchemaTypes.ObjectId,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
messageSchema.plugin(toJSON);
messageSchema.plugin(paginate);

/**
 * @typedef User
 */
const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
