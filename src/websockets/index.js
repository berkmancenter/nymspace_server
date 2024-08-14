const config = require('../config/config');
const http = require('http');
const logger = require('../config/logger');
const { availableParallelism } = require('node:os');
const cluster = require('node:cluster');
const { setupMaster, setupWorker } = require('@socket.io/sticky');
const { createAdapter, setupPrimary } = require('@socket.io/cluster-adapter');

let io;
if (cluster.isPrimary) {
  const httpServer = http.createServer();
  const numCPUs = availableParallelism();
  // create one worker per available core
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork({
      PORT: 5555 + i,
    });
  }
  setupMaster(httpServer, {
    loadBalancingMethod: 'least-connection', // either "random", "round-robin" or "least-connection"
  });
  setupPrimary();
  if (config.env !== 'test') httpServer.listen(5555);
} else {
  const httpServer = http.createServer();
  io = require('socket.io')(httpServer, {
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
}

module.exports = {
  io,
};
