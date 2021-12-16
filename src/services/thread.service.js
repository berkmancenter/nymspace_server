const mongoose = require('mongoose');
const { Thread, Topic, Follower, Message } = require('../models');
const httpStatus = require('http-status');

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

  topic.threads.push(thread.toObject());
  topic.save();

  return thread;
};

const userThreads = async (user) => {
  const followedThreads = await Follower.find({ user }).select('thread').exec();
  const threads = await Thread.find({ $or: [{ owner: user }, { _id: { $in: followedThreads.map((el) => el.thread) } }] })
    .populate({ path: 'messages', select: 'id'})
    .select('name slug')
    .exec();
  return addMessageCount(threads);
};

const findById = async (id) => {
  const thread = await Thread.findOne({ _id: id }).populate('followers').select('name slug').exec();
  return thread;
};

const findByIdFull = async (id, user) => {
  const thread = await Thread.findOne({ _id: id }).select('name slug').lean().exec();
  thread.followed = await Follower.findOne({ thread, user }).select('_id').exec();
  return thread;
};

const topicThreads = async (topicId) => {
  const threads = await Thread.find({ topic: topicId })
    .populate({ path: 'messages', select: 'id'})
    .select('name slug')
    .exec();
  return addMessageCount(threads);
};

const follow = async (status, threadId, user) => {
  const thread = await findById(threadId);
  const params = {
    user,
    thread,
  };

  if (status === true) {
    const follower = await Follower.create(params);

    thread.followers.push(follower.toObject());
    thread.save();
  } else {
    await Follower.deleteMany(params);
  }
};

const allPublic = async () => {
  const threads = await Thread.find()
    .select('name slug')
    .populate({ path: 'messages', select: 'id'})
    .exec();
  return addMessageCount(threads);
};

const deleteThread = async (id, user) => {
  const thread = await Thread.findOne({ _id: id }).select('name slug owner').exec();

  if (user._id.toString() !== thread.owner.toString()) {
    return {
      errorCode: httpStatus.UNAUTHORIZED,
      message: "You're not the owner of this thread",
    };
  }

  await Thread.deleteOne({ _id: id });
  await Follower.deleteMany({ thread });
  await Message.deleteMany({ thread });

  return thread;
};

const addMessageCount = (threads) => {
  return threads.map(t => {
    t = t.toObject();
    t.messageCount = t.messages ? t.messages.length : 0;
    delete t.messages;
    // Replace _id with id since toJSON plugin will not be applied
    t.id = t._id.toString();
    delete t._id;
    return t;
  });
}

module.exports = {
  createThread,
  userThreads,
  findById,
  topicThreads,
  follow,
  findByIdFull,
  allPublic,
  deleteThread,
};
