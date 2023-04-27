const { messageService } = require('../services');
const catchAsync = require('../utils/catchAsync');
const { checkAuth } = require('./utils');
const logger = require('../config/logger');

module.exports = (io, socket) => {
  const createMessage = catchAsync(async (data) => {
    logger.info(
      'Creating message %s via socket for userId %s. Message text = "%s"',
      data.request,
      data.user._id,
      data.message.body
    );
    const message = await messageService.createMessage(data.message, data.user);
    message.owner = data.user._id;
    io.in(message.thread._id.toString()).emit('message:new', { ...message.toJSON(), request: data.request });
  });

  const joinThread = catchAsync(async (data) => {
    logger.info('Joining thread via socket. ThreadId = %s', data.threadId);
    socket.join(data.threadId.toString());
  });

  socket.use(([event, args], next) => {
    logger.info('Checking auth (JWT) for message/thread socket requests.');
    checkAuth(event, args, next);
  });

  socket.on('message:create', createMessage);
  socket.on('thread:join', joinThread);
  socket.on('thread:disconnect', () => {
    logger.info('Socket disconnecting from thread.');
    socket.disconnect(true);
  });
  socket.on('disconnect', () => {
  });
};
