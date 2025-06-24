/* eslint-disable global-require */
const http = require('http')
const { availableParallelism } = require('node:os')
const cluster = require('node:cluster')
const { setupMaster } = require('@socket.io/sticky')
const { setupPrimary } = require('@socket.io/cluster-adapter')
const config = require('../config/config')
const socketIO = require('./socketIO')
const registerMessageHandlers = require('./messageHandlers')
const registerThreadHandlers = require('./threadHandlers')

// Initialize an empty worker variable to take
// the primary cluster instance for the rest of the
// app to use to send messages to child processes with.
let worker

if (cluster.isMaster) {
  const httpServer = http.createServer()
  const numCPUs = availableParallelism()
  // create one worker per available core
  if (config.env !== 'test') {
    for (let i = 1; i < numCPUs; i += 1) {
      worker = cluster.fork({
        PORT: config.websocketBasePort + i
      })
    }
  }

  setupMaster(httpServer, {
    loadBalancingMethod: 'least-connection' // either "random", "round-robin" or "least-connection"
  })
  setupPrimary()
  if (config.env !== 'test') {
    httpServer.listen(config.websocketBasePort)
  }
} else {
  const httpServer = http.createServer()
  socketIO.connect(httpServer)
  const io = socketIO.connection()
  io.addConnectionHandlers([registerMessageHandlers, registerThreadHandlers])

  // receive messages from the rest of the app and pass them on to every
  // child process' socket io instance
  process.on('message', function (message) {
    if (message.thread) {
      io.emit(message.thread, message.event, message.message)
    }
  })
}
module.exports = {
  worker
}
