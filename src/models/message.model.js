const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const messageSchema = mongoose.Schema(
  {
    body: {
      type: String,
      required: true,
      trim: true,
    },
    user_token: {
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
messageSchema.plugin(toJSON);
messageSchema.plugin(paginate);

/**
 * @typedef User
 */
const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
