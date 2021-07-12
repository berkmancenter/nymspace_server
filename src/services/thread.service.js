const mongoose = require('mongoose');
const { Thread } = require('../models');
const { Topic } = require('../models');

/**
 * Create a thread
 * @param {Object} threadBody
 * @returns {Promise<Thread>}
 */
const createThread = async (threadBody, user) => {
  const topicId = mongoose.Types.ObjectId(threadBody.topicId);
  const topic = await Topic.findById(topicId);

  const thread = await Thread.create({
    name: threadBody.name,
    owner: user,
    topic,
  });

  return thread;
};

const userThreads = async (user) => {
  const threads = await Thread.find({ owner: user }).select('name slug').exec();
  return threads;
};

const findById = async (id) => {
  const thread = await Thread.findOne({ _id: id }).select('name slug').exec();
  return thread;
};

module.exports = {
  createThread,
  userThreads,
  findById,
};
