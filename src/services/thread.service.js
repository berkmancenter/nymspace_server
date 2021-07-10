const { Thread } = require('../models');

/**
 * Create a thread
 * @param {Object} threadBody
 * @returns {Promise<Thread>}
 */
const createThread = async (threadBody, user) => {
  const thread = await Thread.create({
    name: threadBody.name,
    owner: user,
  });
  return thread;
};

module.exports = {
  createThread,
};
