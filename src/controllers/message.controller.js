const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { messageService } = require('../services');

const createMessage = catchAsync(async (req, res) => {
  const message = await messageService.createMessage(req.body, req.user);
  res.status(httpStatus.CREATED).send(message);
});

const threadMessages = catchAsync(async (req, res) => {
  const messages = await messageService.findById(req.params.threadId);
  res.status(httpStatus.OK).send(messages);
});

module.exports = {
  createMessage,
  threadMessages,
};
