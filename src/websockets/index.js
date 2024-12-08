const config = require('../config/config');
const http = require('http');
const logger = require('../config/logger');
const { availableParallelism } = require('node:os');
const cluster = require('node:cluster');
const { setupMaster, setupWorker } = require('@socket.io/sticky');
const { createAdapter, setupPrimary } = require('@socket.io/cluster-adapter');

// Initialize an empty worker variable to take
// the primary cluster instance for the rest of the
// app to use to send messages to child processes with.
let worker;

if (cluster.isMaster) {
  const httpServer = http.createServer();
  const numCPUs = availableParallelism();
  // create one worker per available core
  if (config.env !== 'test') {
    for (let i = 0; i < numCPUs; i++) {
      worker = cluster.fork({
        PORT: 5555 + i,
      });
    }
  }

  setupMaster(httpServer, {
    loadBalancingMethod: 'least-connection', // either "random", "round-robin" or "least-connection"
  });
  setupPrimary();
  if (config.env !== 'test') {
    httpServer.listen(5555);
  }
} else {
  const httpServer = http.createServer();
  const io = require('socket.io')(httpServer, {
    cors: {
      origin: '*',
    },
    connectionStateRecovery: {},
    // set up the adapter on each worker thread
    adapter: createAdapter(),
  });

  io.adapter(createAdapter());
  setupWorker(io);

  const registerMessageHandlers = require('./messageHandlers');
  const registerThreadHandlers = require('./threadHandlers');

  const onConnection = (socket) => {
    logger.info('Socket connecting.');
    registerMessageHandlers(io, socket);
    registerThreadHandlers(io, socket);
  };

  io.on('connection', onConnection);
  // receive messages from the rest of the app and pass them on to every
  // child process' socket io instance
  process.on('message', function (message) {
    if (message.thread) {
      io.in(message.thread).emit(message.event, message.message);
    }
  });
}
module.exports = {
  worker,
};
