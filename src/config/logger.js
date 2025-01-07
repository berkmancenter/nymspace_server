const winston = require('winston')
const config = require('./config')

const enumerateErrorFormat = winston.format((info) => {
  if (info.message && info[Symbol.for('splat')]) {
    const [error] = info[Symbol.for('splat')]
    if (error instanceof Error) {
      Object.assign(info, {
        message: `${info.message} \n ${error.stack}${error.cause ? `\nCaused by: ${error.cause}` : ''}`
      })
    }
  } else if (info instanceof Error) {
    Object.assign(info, {
      message: info.stack + (info.cause ? `\nCaused by: ${info.cause}` : '')
    })
  }
  return info
})

const logger = winston.createLogger({
  level: config.env === 'development' ? 'debug' : 'info',
  format: winston.format.combine(
    enumerateErrorFormat(),
    config.env === 'development' ? winston.format.colorize() : winston.format.uncolorize(),
    winston.format.splat(),
    winston.format.printf(({ level, message }) => `${level}: ${message}`)
  ),
  transports: [
    new winston.transports.Console({
      stderrLevels: ['error']
    })
  ]
})

module.exports = logger
