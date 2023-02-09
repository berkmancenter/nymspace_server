const config = require('../config/config');
const logger = require('../config/logger');

const httpServer = require('http').createServer();
const io = require('socket.io')(httpServer, {
  cors: {
    origin: '*',
  },
});
const registerMessageHandlers = require('./messageHandlers');
const registerThreadHandlers = require('./threadHandlers');

const onConnection = (socket) => {
  logger.info('Socket connecting.');
  registerMessageHandlers(io, socket);
  registerThreadHandlers(io, socket);

  socket.on('error', (error) => {
    logger.info('Socket error. %s', error);
  });
};

io.on('connection', onConnection);

if (config.env !== 'test') httpServer.listen(5555);

module.exports = {
  io,
};