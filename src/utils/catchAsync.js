const WebsocketError = require('./WebsocketError');

const catchAsync = (fn) => (req, data, next) => {
  Promise.resolve(fn(req, data, next)).catch((err) => {
    const websocketError = new WebsocketError(err, data);

    if (next) {
      next(websocketError);
    }
  });
};

module.exports = catchAsync;
