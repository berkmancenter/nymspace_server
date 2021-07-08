const { Topic } = require('../models');

/**
 * Create a topic
 * @param {Object} topicBody
 * @returns {Promise<Topic>}
 */
const createTopic = async (topicBody) => {
  const topic = await Topic.create(topicBody);
  return topic;
};

const userTopics = async (userToken) => {
  const topics = await Topic.find({ owner: userToken }).select('name slug').exec();
  return topics;
};

module.exports = {
  createTopic,
  userTopics,
};
