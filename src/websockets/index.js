const httpServer = require('http').createServer();
const io = require('socket.io')(httpServer, {});
const logger = require('../config/logger');

io.on('connection', (socket) => {
  socket.emit("hello", "world");
});

httpServer.listen(5555);
