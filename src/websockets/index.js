const config = require('../config/config');

const httpServer = require('http').createServer();
const io = require('socket.io')(httpServer, {
  cors: {
    origin: '*',
  },
});
const registerMessageHandlers = require('./messageHandlers');

const onConnection = (socket) => {
  registerMessageHandlers(io, socket);
};

io.on('connection', onConnection);

if (config.env !== 'test') httpServer.listen(5555);
