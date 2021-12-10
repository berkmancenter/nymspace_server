const httpStatus = require('http-status');
const crypto = require('crypto');
const { User } = require('../models');
const { Message } = require('../models');
const ApiError = require('../utils/ApiError');
const { uniqueNamesGenerator, adjectives, colors, animals } = require('unique-names-generator');

/**
 * Create a user
 * @param {Object} userBody
 * @returns {Promise<User>}
 */
const createUser = async (userBody) => {
  let user = {
    username: userBody.username,
    password: userBody.password,
    pseudonyms: [{ 
      token: userBody.token, 
      pseudonym: userBody.pseudonym,
      // Mark pseudonym as active
      active: true
    }]
  };
  user = await User.create(user);
  return user;
};

/**
 * Add a pseudonym to an existing a user
 * @param {Object} requestBody
 * @param {Object} user
 * @returns {Promise<void>}
 */
 const addPseudonym = async (requestBody, requestUser) => {
  requestBody.active = true;
  const user = await User.findById(requestUser.id);
  user.pseudonyms.forEach((p) => p.active = false);
  user.pseudonyms.push(requestBody);
  await user.save()
  return user;
};

/**
 * Update a pseudonym
 * @param {Object} requestBody
 * @param {Object} user
 * @returns {Promise<void>}
 */
 const activatePseudonym = async (requestBody, requestUser) => {
  const user = await User.findById(requestUser.id);
  let match = false;
  user.pseudonyms.forEach((p) => {
    p.active = false;
    if (p.token === requestBody.token) {
      p.active = true;
      match = true;
    }
  });
  if (!match) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Pseudonym not found');
  }
  await user.save()
  return user;
};

/**
 * Query for users
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryUsers = async (filter, options) => {
  const users = await User.paginate(filter, options);
  return users;
};

/**
 * Get user by id
 * @param {ObjectId} id
 * @returns {Promise<User>}
 */
const getUserById = async (id) => {
  return User.findById(id);
};

/**
 * Get user by username and password
 * @param {String} username
 * @param {String} password
 * @returns {Promise<User>}
 */
const getUserByUsernamePassword = async (username, password) => {
  return User.findOne({
    username,
    password,
  });
};

/**
 * Get user by username
 * @param {String} username
 * @returns {Promise<User>}
 */
 const getUserByUsername = async (username) => {
  return User.findOne({ username: username });
};

/**
 * Update user by id
 * @param {ObjectId} userId
 * @param {Object} updateBody
 * @returns {Promise<User>}
 */
const updateUserById = async (userId, updateBody) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  Object.assign(user, updateBody);
  await user.save();
  return user;
};

/**
 * Delete user by id
 * @param {ObjectId} userId
 * @returns {Promise<User>}
 */
const deleteUserById = async (userId) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  await user.remove();
  return user;
};

const newToken = () => {
  const currentDate = new Date().valueOf().toString();
  const random = Math.random().toString();
  const result = crypto
    .createHash('sha256')
    .update(currentDate + random)
    .digest('hex');

  const data = JSON.stringify({
    token: result,
  });

  const algorithm = 'aes256';
  const key = 'password';

  const cipher = crypto.createCipher(algorithm, key);
  const encrypted = cipher.update(data, 'utf8', 'hex') + cipher.final('hex');
  return encrypted;
};

const newPseudonym = () => {
  const pseudo = uniqueNamesGenerator({ dictionaries: [adjectives, animals], length: 2 });
  return pseudo.split('_').map((word) => {
    return word.charAt(0).toUpperCase() + word.substr(1).toLowerCase()
  }).join(' ');;
};

const isTokenGeneratedByThreads = (password) => {
  let decryptedParsed = {};
  try {
    const algorithm = 'aes256';
    const key = 'password';
    const decipher = crypto.createDecipher(algorithm, key);
    const decrypted = decipher.update(password, 'hex', 'utf8') + decipher.final('utf8');
    decryptedParsed = JSON.parse(decrypted);
  } catch (err) {
    // Todo: log error?
    throw new Error('Invalid token');
  }

  return typeof decryptedParsed.token !== 'undefined';
};

/**
 * Check if a user has good "reputation"
 * @param {User} user
 * @returns {Promise<boolean>}
 */
const goodReputation = async (user) => {
  // Calculate total downvotes for all user's messages
  const messages = await Message.find({ owner: user.id});
  let totalDownVotes = 0;
  if (messages.length > 0) {
    totalDownVotes = messages.map((m) => {
      const downVotes = m.downVotes ? m.downVotes : 0;
      return downVotes;
    }).reduce((x, y) => x + y);
  }
  // Calculate weeks since account creation
  const today = new Date();
  const createdDate = new Date(user.createdAt);
  const weeks = Math.round((today - createdDate) / 604800000);
  // Good reputation is a user with less than 5 total downvotes,
  // and an account more than 1 week old.
  return ((totalDownVotes <= 5) && (weeks > 0));
};

module.exports = {
  createUser,
  queryUsers,
  getUserById,
  updateUserById,
  deleteUserById,
  getUserByUsernamePassword,
  getUserByUsername,
  isTokenGeneratedByThreads,
  newToken,
  newPseudonym,
  goodReputation,
  addPseudonym,
  activatePseudonym,
};
