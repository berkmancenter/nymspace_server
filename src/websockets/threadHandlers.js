const catchAsync = require('../utils/catchAsync');
const { checkAuth } = require('./utils');
const logger = require('../config/logger');

module.exports = (io, socket) => {
  const joinTopic = catchAsync(async (data) => {
    logger.info('Joining topic via socket. TopicId = %s', data.topicId);
    socket.join(data.topicId.toString());
  });

  socket.use(([event, args], next) => {
    logger.info('Checking auth (JWT) for topic socket requests.');
    checkAuth(event, args, next);
  });

  socket.on('topic:join', joinTopic);
  socket.on('topic:disconnect', () => {
    logger.info('Socket disconnecting from topic.');
    socket.disconnect(true);
  });
};
