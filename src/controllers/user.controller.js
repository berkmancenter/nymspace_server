const httpStatus = require('http-status');
const crypto = require('crypto');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { userService } = require('../services');

const createUser = catchAsync(async (req, res) => {
  const user = await userService.createUser(req.body);
  res.status(httpStatus.CREATED).send(user);
});

const getUser = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.params.userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  res.send(user);
});

const newToken = catchAsync(async (req, res) => {
  const currentDate = new Date().valueOf().toString();
  const random = Math.random().toString();
  const result = crypto
    .createHash('sha1')
    .update(currentDate + random)
    .digest('hex');
  res.send(result);
});

module.exports = {
  createUser,
  getUser,
  newToken,
};
