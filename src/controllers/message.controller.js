const httpStatus = require('http-status')
const catchAsync = require('../utils/catchAsync')
const { messageService } = require('../services')
const { worker } = require('../websockets/index')

const createMessage = catchAsync(async (req, res) => {
  const sentMessages = await messageService.newMessageHandler(req.body, req.user)
  res.status(httpStatus.CREATED).send(sentMessages)
})

const threadMessages = catchAsync(async (req, res) => {
  const messages = await messageService.threadMessages(req.params.threadId, req.user.id)
  res.status(httpStatus.OK).send(messages)
})

const vote = catchAsync(async (req, res) => {
  const message = await messageService.vote(req.params.messageId, req.body.direction, req.body.status, req.user)
  if (worker) {
    worker.send({
      thread: message.thread._id.toString(),
      event: 'vote:new',
      message
    })
  }
  res.status(httpStatus.OK).send(message)
})

// const downVote = catchAsync(async (req, res) => {
//   const message = await messageService.vote(req.params.messageId, 'down', req.user);
//   res.status(httpStatus.OK).send(message);
// });

module.exports = {
  createMessage,
  threadMessages,
  vote
}
