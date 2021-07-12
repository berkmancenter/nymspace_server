const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { threadService } = require('../services');

const createThread = catchAsync(async (req, res) => {
  const thread = await threadService.createThread(req.body, req.user);
  res.status(httpStatus.CREATED).send(thread);
});

const userThreads = catchAsync(async (req, res) => {
  const threads = await threadService.userThreads(req.user);
  res.status(httpStatus.OK).send(threads);
});

const getThread = catchAsync(async (req, res) => {
  const thread = await threadService.findById(req.params.threadId);
  res.status(httpStatus.OK).send(thread);
});

module.exports = {
  createThread,
  userThreads,
  getThread,
};
