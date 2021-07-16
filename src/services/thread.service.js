const mongoose = require('mongoose');
const { Thread, Topic, Follower } = require('../models');

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
  const followedThreads = await Follower.find({ user }).select('thread').exec();
  const threads = await Thread.find({ $or: [{ owner: user }, { _id: { $in: followedThreads.map((el) => el.thread) } }] })
    .select('name slug')
    .exec();
  return threads;
};

const findById = async (id) => {
  const thread = await Thread.findOne({ _id: id }).select('name slug').exec();
  return thread;
};

const findByIdFull = async (id, user) => {
  const thread = await Thread.findOne({ _id: id }).select('name slug').lean().exec();
  thread.followed = await Follower.findOne({ thread, user }).select('_id').exec();
  return thread;
};

const topicThreads = async (topicId) => {
  const threads = await Thread.find({ topic: topicId }).select('name slug').exec();
  return threads;
};

const follow = async (status, threadId, user) => {
  const thread = await findById(threadId);
  const params = {
    user,
    thread,
  };

  if (status === true) {
    await Follower.create(params);
  } else {
    await Follower.deleteMany(params);
  }
};

const allPublic = async () => {
  const threads = await Thread.find().select('name slug').exec();
  return threads;
};

module.exports = {
  createThread,
  userThreads,
  findById,
  topicThreads,
  follow,
  findByIdFull,
  allPublic,
};
