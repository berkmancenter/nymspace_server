const { Topic } = require('../models');

/**
 * Create a topic
 * @param {Object} messageBody
 * @returns {Promise<User>}
 */
const createTopic = async (topicBody) => {
  const topic = await Topic.create(topicBody);
  return topic;
};

module.exports = {
  createTopic,
};
