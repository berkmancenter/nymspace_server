const jwt = require('jsonwebtoken');
const config = require('../config/config');
const { messageService } = require('../services');
const catchAsync = require('../utils/catchAsync');
const { User } = require('../models');

module.exports = (io, socket) => {
  let user = null;

  const createMessage = catchAsync(async (data) => {
    const message = await messageService.createMessage(data.message, user);
    message.owner = user._id;
    io.in(message.thread._id.toString()).emit('message:new', message);
  });

  const joinThread = catchAsync(async (data) => {
    socket.join(data.threadId.toString());
  });

  const checkAuth = catchAsync(async (event, args, next) => {
    try {
      const payload = jwt.verify(args.token, config.jwt.secret);
      user = await User.findById(payload.sub);
    } catch (e) {
      return;
    }

    next();
  });

  socket.use(([event, args], next) => {
    checkAuth(event, args, next);
  });

  socket.on('message:create', createMessage);
  socket.on('thread:join', joinThread);
};
