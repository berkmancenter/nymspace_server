const moment = require('moment')
const config = require('../../src/config/config')
const { tokenTypes } = require('../../src/config/tokens')
const tokenService = require('../../src/services/token.service')
const { userOne, userTwo, admin, registeredUser } = require('./user.fixture')

const accessTokenExpires = moment().add(config.jwt.accessExpirationMinutes, 'minutes')
const userOneAccessToken = tokenService.generateToken(userOne._id, accessTokenExpires, tokenTypes.ACCESS)
const userTwoAccessToken = tokenService.generateToken(userTwo._id, accessTokenExpires, tokenTypes.ACCESS)
const registeredUserAccessToken = tokenService.generateToken(registeredUser._id, accessTokenExpires, tokenTypes.ACCESS)
const adminAccessToken = tokenService.generateToken(admin._id, accessTokenExpires, tokenTypes.ACCESS)

module.exports = {
  userOneAccessToken,
  userTwoAccessToken,
  adminAccessToken,
  registeredUserAccessToken
}
