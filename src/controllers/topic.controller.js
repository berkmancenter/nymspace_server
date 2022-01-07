const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { topicService, userService, tokenService } = require('../services');
const ApiError = require('../utils/ApiError');
const { tokenTypes } = require('../config/tokens');

const createTopic = catchAsync(async (req, res) => {
  const topic = await topicService.createTopic(req.body, req.user);
  res.status(httpStatus.CREATED).send(topic);
});

const updateTopic = catchAsync(async (req, res) => {
  const topic = await topicService.updateTopic(req.body);
  res.status(httpStatus.OK).send(topic);
});

const userTopics = catchAsync(async (req, res) => {
  const topics = await topicService.userTopics(req.user);
  res.status(httpStatus.OK).send(topics);
});

const getTopic = catchAsync(async (req, res) => {
  const topic = await topicService.findById(req.params.topicId);
  res.status(httpStatus.OK).send(topic);
});

const deleteTopic = catchAsync(async (req, res) => {
  await topicService.deleteTopic(req.params.topicId);
  res.status(httpStatus.OK).send();
});

const allTopics = catchAsync(async (req, res) => {
  const topics = await topicService.allTopicsByUser(req.user);
  res.status(httpStatus.OK).send(topics);
});

const publicTopics = catchAsync(async (req, res) => {
  if (userService.isTokenGeneratedByThreads(req.params.token) === false) {
    throw new Error('Invalid token');
  }
  const topics = await topicService.allPublicTopics();
  // Return top ten topics
  res.status(httpStatus.OK).send(topics.slice(0, 10));
});

const authenticate = catchAsync(async (req, res) => {
  const result = await topicService.verifyPasscode(req.body.topicId, req.body.passcode);
  if (!result) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid passcode');
  }
  res.status(httpStatus.OK).send();
});

const archiveTopic = catchAsync(async (req, res) => {
  await tokenService.verifyToken(req.body.token, tokenTypes.ARCHIVE_TOPIC);
  await topicService.archiveTopic(req.body.token, req.body.topicId);
  res.status(httpStatus.OK).send();
});

module.exports = {
  createTopic,
  updateTopic,
  userTopics,
  getTopic,
  allTopics,
  publicTopics,
  authenticate,
  archiveTopic,
  deleteTopic,
};
