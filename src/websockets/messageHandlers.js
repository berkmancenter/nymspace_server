const { messageService } = require('../services');
const catchAsync = require('../utils/catchAsync');
const { checkAuth } = require('./utils');
const logger = require('../config/logger');

module.exports = (io, socket) => {
  const createMessage = catchAsync(async (data) => {
    logger.info(`Message received for creation via socket. Message content: ${data.message.body}`);
    const message = await messageService.createMessage(data.message, data.user);
    message.owner = data.user._id;
    logger.info(`Number of clients connected to room ${message.thread._id.toString()}: ${io.sockets.adapter.rooms.get(message.thread._id.toString()).size}`);
    io.in(message.thread._id.toString()).emit('message:new', message);
  });

  const joinThread = catchAsync(async (data) => {
    socket.join(data.threadId.toString());
  });

  socket.use(([event, args], next) => {
    checkAuth(event, args, next);
  });

  socket.on('message:create', createMessage);
  socket.on('thread:join', joinThread);
  socket.on('thread:disconnect', () => {
    logger.info(`Server is disconnecting socket id ${socket.id}.`);
    socket.disconnect(true);
  });
  socket.on('disconnect', () => {
    logger.info(`Socket id ${socket.id} has disconnected.`);
  });
};
