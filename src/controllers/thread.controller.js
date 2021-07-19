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
  const thread = await threadService.findByIdFull(req.params.threadId, req.user);
  res.status(httpStatus.OK).send(thread);
});

const getTopicThreads = catchAsync(async (req, res) => {
  const threads = await threadService.topicThreads(req.params.topicId);
  res.status(httpStatus.OK).send(threads);
});

const follow = catchAsync(async (req, res) => {
  await threadService.follow(req.body.status, req.body.threadId, req.user);
  res.status(httpStatus.OK).send('ok');
});

const allPublic = catchAsync(async (req, res) => {
  const threads = await threadService.allPublic();
  res.status(httpStatus.OK).send(threads);
});

const deleteThread = catchAsync(async (req, res) => {
  const thread = await threadService.deleteThread(req.params.threadId, req.user, res);

  if (thread.errorCode) {
    return res.status(thread.errorCode).send(thread.message);
  }

  res.status(httpStatus.OK).send(thread);
});

module.exports = {
  createThread,
  userThreads,
  getThread,
  getTopicThreads,
  follow,
  allPublic,
  deleteThread,
};
