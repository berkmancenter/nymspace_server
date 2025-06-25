const httpStatus = require('http-status')
const tokenService = require('./token.service')
const userService = require('./user.service')
const Token = require('../models/token.model')
const ApiError = require('../utils/ApiError')
const { tokenTypes } = require('../config/tokens')
const emailService = require('./email.service')
const User = require('../models/user.model/user.model')
const logger = require('../config/logger')

/**
 * Login with username and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<User>}
 */
const loginUser = async (loginBody) => {
  const user = await userService.getUserByUsernamePassword(loginBody.username, loginBody.password)
  if (!user) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect username or password')
  }
  return user
}

/**
 * Logout
 * @param {string} refreshToken
 * @returns {Promise}
 */
const logout = async (refreshToken) => {
  const refreshTokenDoc = await Token.findOne({ token: refreshToken, type: tokenTypes.REFRESH, blacklisted: false })
  if (!refreshTokenDoc) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Not found')
  }
  await refreshTokenDoc.remove()
}

/**
 * Refresh auth tokens
 * @param {string} refreshToken
 * @returns {Promise<Object>}
 */
const refreshAuth = async (refreshToken) => {
  try {
    const refreshTokenDoc = await tokenService.verifyToken(refreshToken, tokenTypes.REFRESH)
    const user = await userService.getUserById(refreshTokenDoc.user)
    if (!user) {
      throw new Error()
    }
    await refreshTokenDoc.remove()
    return tokenService.generateAuthTokens(user)
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Please log in')
  }
}

/**
 * Send a password reset email to user
 * @param {string} email
 * @returns {Promise}
 */
const sendPasswordReset = async (email) => {
  const user = await User.findOne({ email })
  if (!user || !user.email) {
    return
  }
  const resetToken = await tokenService.generatePasswordResetToken(user)
  emailService.sendPasswordResetEmail(user.email, resetToken, (err, info) => {
    if (err) {
      logger.error(`Error occurred sending password reset email: ${err.message}`)
      return
    }
    logger.info(`Password reset email sent successfully to ${user.email}. Response: ${info.response}`)
  })
}

/**
 * Resets a user's password
 * @param {string} email
 * @returns {Promise}
 */
const resetPassword = async (token, password) => {
  const tokenDoc = await tokenService.verifyToken(token, tokenTypes.RESET_PASSWORD)
  const user = await User.findById(tokenDoc.user)
  if (!user) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'User not found')
  }
  user.password = await userService.hashPassword(password)
  await user.save()
  await Token.deleteOne({ _id: tokenDoc._id })
}

module.exports = {
  loginUser,
  logout,
  refreshAuth,
  sendPasswordReset,
  resetPassword
}
