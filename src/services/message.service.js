const { Message } = require('../models');

/**
 * Create a message
 * @param {Object} messageBody
 * @returns {Promise<Message>}
 */
const createMessage = async (messageBody) => {
  const message = await Message.create(messageBody);
  return message;
};

module.exports = {
  createMessage,
};
