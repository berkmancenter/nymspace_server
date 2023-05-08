const catchAsync = require('../utils/catchAsync');
const { checkAuth } = require('./utils');
const logger = require('../config/logger');

module.exports = (io, socket) => {
  const joinUser = catchAsync(async (data) => {
    logger.info('Joining user via socket. UserId = %s', data.user._id);
    socket.join(data.userId.toString());
  });

  const joinTopic = catchAsync(async (data) => {
    logger.info('Joining topic via socket. TopicId = %s', data.topicId);
    socket.join(data.topicId.toString());
  });

  socket.use(([event, args], next) => {
    logger.info('Checking auth (JWT) for topic socket requests.');
    checkAuth(event, args, next);
  });

  socket.on('user:join', joinUser);
  socket.on('topic:join', joinTopic);
  socket.on('topic:disconnect', () => {
    logger.info('Socket disconnecting from topic.');
    socket.disconnect(true);
  });
};
