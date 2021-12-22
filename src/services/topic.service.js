const { Topic, Thread, Message, Follower } = require('../models');
const crypto = require('crypto');

/**
 * Create a topic
 * @param {Object} topicBody
 * @returns {Promise<Topic>}
 */
const createTopic = async (topicBody, user) => {
  const randomPasscode = async (min, max) => {
    return new Promise((resolve, reject) => {
      crypto.randomInt(min,max, (err, res) => {
        if (err)
          reject(err);
        resolve(res);
      });
    });
  };
  
  let passcode = null;
  if (topicBody.private) {
    passcode = await randomPasscode(1000000,9999999);
  }
  const topic = await Topic.create({
    name: topicBody.name,
    votingAllowed: topicBody.votingAllowed,
    private: topicBody.private,
    archivable: topicBody.archivable,
    passcode,
    owner: user,
  });
  return topic;
};

const userTopics = async (user) => {
  const topics = await topicsWithSortData({ owner: user });
  return topics;
};

const allTopics = async () => {
  const topics = await topicsWithSortData();
  return topics;
};

const findById = async (id) => {
  const topic = await Topic.findOne({ _id: id }).select('name slug private votingAllowed').exec();
  return topic;
};

const verifyPasscode = async (topicId, passcode) => {
  const topic = await Topic.findById(topicId);
  return passcode === topic.passcode;
};

const topicsWithSortData = async(topicQuery) => {
  const dbtopics = await Topic.find(topicQuery) 
  // Populate threads and messages for calculation of sorting properties
  .populate({
    path: 'threads',
    select: 'id',
    populate: [
      { path: 'messages', select: ['id','createdAt'] },
      { path: 'followers', select: 'id' }
    ]
  })
  .select('name slug private votingAllowed')
  .exec();

  const topics = [];
  dbtopics.forEach((t) => {
    // Create a new POJO for return, since mongoose
    // does not allow for random properties to be set.
    const topic = {};
    const threadMsgTimes = [];
    let msgCount = 0;
    let followerCount = 0;
    t.threads.forEach((thread) => { 
      if (thread.messages && thread.messages.length > 0) {
        // Get the createdAt datetime for the final message,
        // which will always be the most recent as it is pushed
        // to Thread.messages upon message creation.
        threadMsgTimes.push(thread.messages.slice(-1)[0].createdAt);
        // Sum up the messages and followers for all threads
        msgCount += thread.messages.length;
      }
      // Sum up followers for all threads
      if (thread.followers && thread.followers.length > 0)
        followerCount += thread.followers.length;
    })
    topic.name = t.name;
    topic.slug = t.slug;
    topic.id = t.id;
    topic.private = t.private;
    topic.votingAllowed = t.votingAllowed;
    // Sort the most recent messages for all threads, to determine the
    // most recent message for the topic/channel.
    threadMsgTimes.sort((a, b) => {
      return (a < b) ? 1 : ((a > b) ? -1 : 0);
    });
    topic.latestMessageCreatedAt = threadMsgTimes.length > 0 ? threadMsgTimes[0] : null;
    topic.messageCount = msgCount;
    topic.threadCount = t.threads.length;
    topic.follows = followerCount;
    // Calculate default sort avg as (message activity x recency)
    topic.defaultSortAverage = 0;
    if (topic.latestMessageCreatedAt && topic.messageCount) {
      const msSinceEpoch = new Date(topic.latestMessageCreatedAt).getTime();
      topic.defaultSortAverage = msSinceEpoch * topic.messageCount;
    }
    
    topics.push(topic);
  })

  return topics.sort((a,b) => { return b.defaultSortAverage-a.defaultSortAverage; });
};

const deleteOldTopics = async() => {
  var date = new Date();
  date.setDate(date.getDate() - 97);
  // Get all deletable topics
  const topics = await Topic.find({ archived: false, createdAt: { $gte: date } });
  topics.forEach((topic) => {
    // Get all threads for topic
    const threads = await Thread.find({ topic: topic });
    threads.forEach((thread) => {
      // Delete all messages
      await Message.deleteMany({ thread: thread });
    })
    // Delete all followers
    await Follower.deleteMany( { topic: topic });
    // Delete all threads
    await Thread.deleteMany( { topic: topic });
  });
  // Finally, delete all topics
  const result = await Topic.deleteMany({ archived: false, createdAt: { $gte: date } });
  return result;
};

module.exports = {
  createTopic,
  userTopics,
  findById,
  allTopics,
  verifyPasscode,
  deleteOldTopics,
};
