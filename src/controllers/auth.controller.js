const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { authService, userService, tokenService } = require('../services');
const ApiError = require('../utils/ApiError');

const register = catchAsync(async (req, res) => {
  if (userService.isTokenGeneratedByThreads(req.body.token) === false) {
    throw new Error('Invalid login token');
  }
  if (req.body.username) {
    const existingUser = await userService.getUserByUsername(req.body.username);
    if (existingUser) {
      throw new ApiError(httpStatus.CONFLICT, 'Username is already registered');
    }
  }
  const user = await userService.createUser(req.body);
  const tokens = await tokenService.generateAuthTokens(user);
  res.status(httpStatus.CREATED).send({ user, tokens });
});

const login = catchAsync(async (req, res) => {
  const user = await authService.loginUser(req.body);
  const tokens = await tokenService.generateAuthTokens(user);
  res.send({ user, tokens });
});

const logout = catchAsync(async (req, res) => {
  await authService.logout(req.body.refreshToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const refreshTokens = catchAsync(async (req, res) => {
  const tokens = await authService.refreshAuth(req.body.refreshToken);
  res.send({ ...tokens });
});

const ping = catchAsync(async (req, res) => {
  res.send('pong');
});

const newPseudonym = catchAsync(async (req, res) => {
  const token = userService.newToken();
  const pseudonym = userService.newPseudonym();
  res.send({ token: token, pseudonym: pseudonym});
});

module.exports = {
  register,
  login,
  logout,
  refreshTokens,
  ping,
  newPseudonym,
};
