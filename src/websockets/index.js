const config = require('../config/config');

const httpServer = require('http').createServer();
const io = require('socket.io')(httpServer, {
  cors: {
    origin: '*',
  },
});
const registerMessageHandlers = require('./messageHandlers');
const registerThreadHandlers = require('./threadHandlers');

const onConnection = (socket) => {
  registerMessageHandlers(io, socket);
  registerThreadHandlers(io, socket);
};

io.on('connection', onConnection);

if (config.env !== 'test') httpServer.listen(5555);

module.exports = {
  io,
};