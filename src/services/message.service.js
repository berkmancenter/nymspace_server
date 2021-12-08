const mongoose = require('mongoose');
const { Message } = require('../models');
const { Thread } = require('../models');

/**
 * Create a message
 * @param {Object} messageBody
 * @returns {Promise<Message>}
 */
const createMessage = async (messageBody, user) => {
  const threadId = mongoose.Types.ObjectId(messageBody.thread);
  const thread = await Thread.findById(threadId);
  const message = await Message.create({
    body: messageBody.body,
    thread,
    owner: user,
  });

  thread.messages.push(message.toObject());
  thread.save();

  return message;
};

const threadMessages = async (id) => {
  const messages = await Message.find({ thread: id }).select('body owner createdAt').sort({ createdAt: 1 }).exec();
  return messages;
};

/**
 * Upvote or downvote a message
 * @param {Object} messageId
 * @param {Object} direction
 * @returns {Promise<void>}
 */
const vote = async (messageId, direction) => {
  const message = await Message.findById(messageId);
  if (direction === 'up') {
    message.upVotes++;
  } else {
    message.downVotes++;
  }

  await message.save();
};

module.exports = {
  createMessage,
  threadMessages,
  vote
};
