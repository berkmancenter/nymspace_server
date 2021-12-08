const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { messageService } = require('../services');

const createMessage = catchAsync(async (req, res) => {
  const message = await messageService.createMessage(req.body, req.user);
  res.status(httpStatus.CREATED).send(message);
});

const threadMessages = catchAsync(async (req, res) => {
  const messages = await messageService.threadMessages(req.params.threadId);
  res.status(httpStatus.OK).send(messages);
});

const upVote = catchAsync(async (req, res) => {
  await messageService.vote(req.params.messageId, 'up');
  res.status(httpStatus.OK).send();
});

const downVote = catchAsync(async (req, res) => {
  await messageService.vote(req.params.messageId, 'down');
  res.status(httpStatus.OK).send();
});

module.exports = {
  createMessage,
  threadMessages,
  upVote,
  downVote
};
