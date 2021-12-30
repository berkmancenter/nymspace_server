const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { userService } = require('../services');

const createUser = catchAsync(async (req, res) => {
  const user = await userService.createUser(req.body);
  user.goodReputation = await userService.goodReputation(user);
  res.status(httpStatus.CREATED).send(user);
});

const updateUser = catchAsync(async (req, res) => {
  const user = await userService.updateUser(req.body);
  user.goodReputation = await userService.goodReputation(user);
  res.status(httpStatus.OK).send(user);
});

const getUser = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.params.userId);
  user.goodReputation = await userService.goodReputation(user);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  res.send(user);
});

const getPseudonyms = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.user);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  res.send(user.pseudonyms.filter((x) => !x.isDeleted));
});

const addPseudonym = catchAsync(async (req, res) => {
  const user = await userService.addPseudonym(req.body, req.user);
  res.status(httpStatus.CREATED).send(user.pseudonyms.filter((x) => !x.isDeleted));
});

const deletePseudonym = catchAsync(async (req, res) => {
  await userService.deletePseudonym(req.params.pseudonymId, req.user);
  res.status(httpStatus.OK).send();
});

const activatePseudonym = catchAsync(async (req, res) => {
  const user = await userService.activatePseudonym(req.body, req.user);
  res.status(httpStatus.OK).send(user.pseudonyms.filter((x) => !x.isDeleted));
});

module.exports = {
  createUser,
  updateUser,
  getUser,
  addPseudonym,
  activatePseudonym,
  getPseudonyms,
  deletePseudonym,
};
