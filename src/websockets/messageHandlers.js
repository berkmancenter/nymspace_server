const { messageService } = require('../services');
const catchAsync = require('../utils/catchAsync');
const WebsocketError = require('../utils/WebsocketError');
const { checkAuth } = require('./utils');
const logger = require('../config/logger');

module.exports = (io, socket) => {
  const createMessage = async (data) => {
    if (!data) {
      logger.error('No request data.');

      return;
    }

    logger.info(
      'Creating message %s via socket for userId %s. Message text = "%s"',
      data.request,
      data.user._id,
      data.message.body
    );

    try {
      const message = await messageService.createMessage(data.message, data.user);
      message.owner = data.user._id;
  
      io.in(message.thread._id.toString()).emit('message:new', { ...message.toJSON(), request: data.request });
    } catch (err) {
      logger.error('Error creating message via socket - %s', err.message);
      // throw new WebsocketError('message:create', data.user._id, err.message);
    }
    
  };

  const joinThread = catchAsync(async (data) => {
    logger.info('Joining thread via socket. ThreadId = %s', data.threadId);
    socket.join(data.threadId.toString());
  });

  socket.use(([event, args], next) => {
    logger.info('Checking auth (JWT) for message/thread socket requests.');
    checkAuth(event, args, next);
  });

  socket.on('error', (err) => {
    if (err instanceof WebsocketError) {
      const { data, originalError } = err;

      if (!data) {
        logger.error('No error data.');

        return;
      }

      logger.info('Socket error - request: %s, user: %s, error: %s', data.request, data.userId, originalError.message);
      io.in(data.userId).emit('error', { error: originalError.message, request: data.request });
    } else {
      logger.error('Socket error - %s', err.message);
    }
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
