const mongoose = require('mongoose');
const httpStatus = require('http-status');
const { Message } = require('../models');
const { Thread } = require('../models');
const { User } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Create a message
 * @param {Object} messageBody
 * @returns {Promise<Message>}
 */
const createMessage = async (messageBody, user) => {
  const threadId = mongoose.Types.ObjectId(messageBody.thread);
  const thread = await Thread.findById(threadId);
  if (thread.locked) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'This thread is locked and cannot receive messages.');
  }
  const activePseudo = user.pseudonyms.find((x) => x.active);
  const message = await Message.create({
    body: messageBody.body,
    thread,
    owner: user,
    pseudonym: activePseudo.pseudonym,
    pseudonymId: activePseudo._id,
  });

  thread.messages.push(message.toObject());
  thread.save();

  return message;
};

const threadMessages = async (id) => {
  const messages = await Message.find({ thread: id })
    .select('body owner upVotes downVotes pseudonym pseudonymId createdAt')
    .sort({ createdAt: 1 })
    .exec();
  return messages;
};

/**
 * Upvote or downvote a message
 * @param {Object} messageId
 * @param {Object} direction
 * @returns {Promise<Message>}
 */
const vote = async (messageId, direction, status, requestUser) => {
  const user = await User.findById(requestUser.id);
  const message = await Message.findById(messageId);
  if (message.owner.toString() === user._id.toString()) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Users cannot vote for their own messages.');
  }

  const votes = message.upVotes.concat(message.downVotes);
  if (status) {
    if (votes && votes.length > 0) {
      const existingVote = votes.find((x) => x.owner.toString() === user._id.toString());
      if (existingVote) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'User has already voted for this message.');
      }
    }
} 

  if (status) {
    if (direction === 'up') {
      message.upVotes.push({ owner: user._id });
    } else {
      message.downVotes.push({ owner: user._id });
    }
  } else {
    if (direction === 'up') {
      for (let x=0; x<message.upVotes.length; x++) {
        if (message.upVotes[x].owner.toString() === user._id.toString()) {
          message.upVotes.id(message.upVotes[x]._id).remove();  
        }
      }
    } else {
      for (let x=0; x<message.downVotes.length; x++) {
        if (message.downVotes[x].owner.toString() === user._id.toString()) {
          message.downVotes.id(message.downVotes[x]._id).remove();  
        }
      }
    }
  }
  // if (status) {
  //   message.votes.push({ owner: user._id, direction: direction})
  // } else {
  //   message.votes.remove({ owner: user._id, direction: direction })
  // }

  await message.save();
  return message;
};

module.exports = {
  createMessage,
  threadMessages,
  vote,
};
