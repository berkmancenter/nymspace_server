const { messageService } = require('../services');
const catchAsync = require('../utils/catchAsync');
const { checkAuth } = require('./utils');

module.exports = (io, socket) => {
  const createMessage = catchAsync(async (data) => {
    const message = await messageService.createMessage(data.message, data.user);
    message.owner = data.user._id;
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
};
