const httpStatus = require('http-status');
const crypto = require('crypto');
const { User } = require('../models');
const ApiError = require('../utils/ApiError');
const { uniqueNamesGenerator, adjectives, colors, animals } = require('unique-names-generator');
const bcrypt = require('bcrypt');

/**
 * Create a user
 * @param {Object} userBody
 * @returns {Promise<User>}
 */
const createUser = async (userBody) => {
  let hash = undefined;
  if (userBody.password)
    hash = await hashpassword(userBody.password);
  let user = {
    username: userBody.username,
    password: hash,
    pseudonyms: [{ 
      token: userBody.token, 
      pseudonym: userBody.pseudonym,
      // Mark pseudonym as active
      active: true
    }]
  };
  console.log(user);
  user = await User.create(user);
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
  const user = await getUserByUsername(username);
  if (user) {
    const match = await bcrypt.compare(password, user.password);
    if (match)
      return user;
  }
  return null;
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
}

const newPseudonym = () => {
  const pseudo = uniqueNamesGenerator({ dictionaries: [adjectives, animals], length: 2 });
  return pseudo.split('_').map((word) => {
    return word.charAt(0).toUpperCase() + word.substr(1).toLowerCase()
  }).join(' ');;
}

const isTokenGeneratedByThreads = (password) => {
  const algorithm = 'aes256';
  const key = 'password';
  const decipher = crypto.createDecipher(algorithm, key);
  const decrypted = decipher.update(password, 'hex', 'utf8') + decipher.final('utf8');
  const decryptedParsed = JSON.parse(decrypted);

  return typeof decryptedParsed.token !== 'undefined';
};

const hashpassword = (password) => {
  const saltRounds = 10;
  const hash = bcrypt.hash(password, saltRounds);
  return hash;
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
  newPseudonym
};
