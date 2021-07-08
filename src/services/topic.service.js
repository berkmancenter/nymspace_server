const { Topic } = require('../models');

/**
 * Create a topic
 * @param {Object} topicBody
 * @returns {Promise<Topic>}
 */
const createTopic = async (topicBody, user) => {
  const topic = await Topic.create({
    name: topicBody.name,
    owner: user,
  });
  return topic;
};

const userTopics = async (user) => {
  const topics = await Topic.find({ owner: user }).select('name slug').exec();
  return topics;
};

module.exports = {
  createTopic,
  userTopics,
};
