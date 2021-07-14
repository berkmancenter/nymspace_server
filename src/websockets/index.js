const httpServer = require('http').createServer();
const io = require('socket.io')(httpServer, {});
const registerMessageHandlers = require('./messageHandlers');

const onConnection = (socket) => {
  registerMessageHandlers(io, socket);
};

io.on('connection', onConnection);

httpServer.listen(5555);
