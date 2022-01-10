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

const vote = catchAsync(async (req, res) => {
  const message = await messageService.vote(req.params.messageId, req.body.direction, req.body.status, req.user);
  res.status(httpStatus.OK).send(message);
});

// const downVote = catchAsync(async (req, res) => {
//   const message = await messageService.vote(req.params.messageId, 'down', req.user);
//   res.status(httpStatus.OK).send(message);
// });

module.exports = {
  createMessage,
  threadMessages,
  vote,
};
