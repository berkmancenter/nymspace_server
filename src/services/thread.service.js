const mongoose = require('mongoose');
const httpStatus = require('http-status');
const { Thread, Topic, Follower, Message } = require('../models');
const updateDocument = require('../utils/updateDocument');
const ApiError = require('../utils/ApiError');

const returnFields = 'name slug locked owner';

/**
 * Removed messages array property and replaces with messageCount
 * @param {Array} threads
 * @returns {Array}
 */
const addMessageCount = (threads) => {
  return threads.map((t) => {
    t = t.toObject();
    t.messageCount = t.messages ? t.messages.length : 0;
    delete t.messages;
    // Replace _id with id since toJSON plugin will not be applied
    t.id = t._id.toString();
    delete t._id;
    return t;
  });
};

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

  // Owner is missing from create return on line 35, so add it.
  // Probably a better way to do this, but don't want to dig through the Mongoose docs.
  const threadRet = thread.toObject();
  threadRet.owner = user.id;

  return threadRet;
};

/**
 * Update a thread
 * @param {Object} threadBody
 * @returns {Promise<Thread>}
 */
 const updateThread = async (threadBody, user) => {
  let threadDoc = await Thread.findById(threadBody.id);

  if (user._id.toString() !== threadDoc.owner.toString()) {
    throw new ApiError(httpStatus.FORBIDDEN, "Only thread owner can update.");
  }

  threadDoc = updateDocument(threadBody, threadDoc);
  await threadDoc.save();

  const threadRet = threadDoc.toObject();
  threadRet.owner = user.id;

  return threadRet;
};

const userThreads = async (user) => {
  const deletedTopics = await Topic.find({ isDeleted: true }).select('_id');
  const followedThreads = await Follower.find({ user }).select('thread').exec();
  const followedThreadsIds = followedThreads.map((el) => el.thread).filter((el) => el);
  let threads = await Thread.find({
    $and: [
      { $or: [{ owner: user }, { _id: { $in: followedThreadsIds } }] },
      {
        topic: { $nin: deletedTopics },
      },
    ],
  })
    .populate({ path: 'messages', select: 'id' })
    .select(returnFields)
    .exec();
  threads = addMessageCount(threads);
  threads.forEach((thread) => {
    if (followedThreadsIds.map(f => f.toString()).includes(thread.id)){
      thread.followed = true;
    }
  });
  return threads;
};

const findById = async (id) => {
  const thread = await Thread.findOne({ _id: id }).populate('followers').select('name slug').exec();
  return thread;
};

const findByIdFull = async (id, user) => {
  const thread = await Thread.findOne({ _id: id }).select(returnFields).exec();
  const threadPojo = thread.toObject();
  threadPojo.followed = await Follower.findOne({ thread, user }).select('_id').exec();
  return threadPojo;
};

const topicThreads = async (topicId) => {
  const threads = await Thread.find({ topic: topicId })
    .populate({ path: 'messages', select: 'id' })
    .select(returnFields)
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
  const deletedTopics = await Topic.find({ isDeleted: true }).select('_id');
  const threads = await Thread.find({ topic: { $nin: deletedTopics } })
    .select(returnFields)
    .populate({ path: 'messages', select: 'id' })
    .exec();
  return addMessageCount(threads);
};

const deleteThread = async (id, user) => {
  const thread = await Thread.findOne({ _id: id }).select('name slug owner').exec();

  if (user._id.toString() !== thread.owner.toString()) {
    throw new ApiError(httpStatus.FORBIDDEN, "Only thread owner can delete.");
  }

  await Thread.deleteOne({ _id: id });
  await Follower.deleteMany({ thread });
  await Message.deleteMany({ thread });
};

module.exports = {
  createThread,
  userThreads,
  findById,
  topicThreads,
  follow,
  findByIdFull,
  allPublic,
  deleteThread,
  updateThread,
};
