const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { topicService } = require('../services');

const createTopic = catchAsync(async (req, res) => {
  const topic = await topicService.createTopic(req.body, req.user);
  res.status(httpStatus.CREATED).send(topic);
});

const userTopics = catchAsync(async (req, res) => {
  const topics = await topicService.userTopics(req.user);
  res.status(httpStatus.OK).send(topics);
});

const getTopic = catchAsync(async (req, res) => {
  const topic = await topicService.findById(req.params.topicId);
  res.status(httpStatus.OK).send(topic);
});

const allPublic = catchAsync(async (req, res) => {
  const topics = await topicService.allPublic();
  res.status(httpStatus.OK).send(topics);
});

module.exports = {
  createTopic,
  userTopics,
  getTopic,
  allPublic,
};
