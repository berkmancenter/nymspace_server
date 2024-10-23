const logger = require('../config/logger')
const WebsocketError = require('./WebsocketError')

const catchAsync = (fn) => (req, data, next) => {
  Promise.resolve(fn(req, data, next)).catch((err) => {
    logger.error(err)
    const websocketError = new WebsocketError(err, data)

    if (next) {
      next(websocketError)
    }
  })
}

module.exports = catchAsync
