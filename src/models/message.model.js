const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const messageSchema = mongoose.Schema(
  {
    body: {
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
    thread: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'Thread',
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
