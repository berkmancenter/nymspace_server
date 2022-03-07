const catchAsync = require('../utils/catchAsync');
const { checkAuth } = require('./utils');

module.exports = (io, socket) => {
  const joinTopic = catchAsync(async (data) => {
    socket.join(data.topicId.toString());
  });

  socket.use(([event, args], next) => {
    checkAuth(event, args, next);
  });

  socket.on('topic:join', joinTopic);
  socket.on('topic:disconnect', () => {
    socket.disconnect(true);
  });
};
