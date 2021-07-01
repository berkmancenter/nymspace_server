const httpStatus = require('http-status');
const { Message } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Create a message
 * @param {Object} messageBody
 * @returns {Promise<User>}
 */
const createMessage = async (messageBody) => {
  const user = await Message.create(messageBody);
  return user;
};

module.exports = {
  createMessage,
};
