const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { threadService } = require('../services');
const { worker } = require('../websockets/index');

const createThread = catchAsync(async (req, res) => {
  const thread = await threadService.createThread(req.body, req.user);
  worker.send({
    thread: thread.topic._id.toString(),
    event: 'thread:new',
    message: thread,
  });
  res.status(httpStatus.CREATED).send(thread);
});

const updateThread = catchAsync(async (req, res) => {
  const thread = await threadService.updateThread(req.body, req.user);
  worker.send({
    thread: thread.topic._id.toString(),
    event: 'thread:update',
    message: thread,
  });
  res.status(httpStatus.OK).send(thread);
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
  await threadService.deleteThread(req.params.threadId, req.user);
  res.status(httpStatus.OK).send();
});

module.exports = {
  createThread,
  updateThread,
  userThreads,
  getThread,
  getTopicThreads,
  follow,
  allPublic,
  deleteThread,
};
