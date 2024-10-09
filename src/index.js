const mongoose = require('mongoose')
const app = require('./app')
const config = require('./config/config')
const logger = require('./config/logger')
const setup = require('./setup')
const { startJobs } = require('./jobs')

let server

if (config.mongoose.debug !== undefined) mongoose.set('debug', config.mongoose.debug)
mongoose.connect(config.mongoose.url, config.mongoose.options).then(() => {
  logger.info('Connected to MongoDB')
  setup().then(() => {
    server = app.listen(config.port, () => {
      logger.info(`Listening to port ${config.port}`)
    })
    if (config.env !== 'test') startJobs()
  })
})

const exitHandler = () => {
  if (server) {
    server.close(() => {
      logger.info('Server closed')
      process.exit(1)
    })
  } else {
    process.exit(1)
  }
}

const unexpectedErrorHandler = (error) => {
  logger.error(error)
  exitHandler()
}

process.on('uncaughtException', unexpectedErrorHandler)
process.on('unhandledRejection', unexpectedErrorHandler)

process.on('SIGTERM', () => {
  logger.info('SIGTERM received')
  if (server) {
    server.close()
  }
})
