const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { topicService } = require('../services');

const createTopic = catchAsync(async (req, res) => {
  const topic = await topicService.createTopic(req.body);
  res.status(httpStatus.CREATED).send(topic);
});

module.exports = {
  createTopic,
};
