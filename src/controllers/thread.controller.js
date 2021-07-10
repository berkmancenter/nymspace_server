const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { threadService } = require('../services');

const createThread = catchAsync(async (req, res) => {
  const thread = await threadService.createTopic(req.body, req.user);
  res.status(httpStatus.CREATED).send(thread);
});

module.exports = {
  createThread,
};
