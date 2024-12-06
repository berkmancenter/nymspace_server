const { createAdapter } = require('@socket.io/cluster-adapter')
const { setupWorker } = require('@socket.io/sticky')
const logger = require('../config/logger')

let connection = null

class SocketIO {
  constructor() {
    this.io = null
  }

  connect(server) {
    // eslint-disable-next-line global-require
    this.io = require('socket.io')(server, {
      cors: {
        origin: '*'
      },
      connectionStateRecovery: {},
      // set up the adapter on each worker thread
      adapter: createAdapter()
    })
    this.io.adapter(createAdapter())
    setupWorker(this.io)
  }

  emit(channel, event, data) {
    this.io.in(channel).emit(event, data)
  }

  addConnectionHandlers(handlers) {
    this.io.on('connection', (socket) => {
      logger.debug('Socket connecting.')
      for (const handler of handlers) {
        handler(this.io, socket)
      }
    })
  }

  static init(server) {
    if (!connection) {
      connection = new SocketIO()
      connection.connect(server)
    }
  }

  static getConnection() {
    if (connection) {
      return connection
    }
  }
}
module.exports = {
  SocketIO,
  connect: SocketIO.init,
  connection: SocketIO.getConnection
}
