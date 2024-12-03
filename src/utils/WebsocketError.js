class WebsocketError extends Error {
  constructor(error, data) {
    super(error.message);
    this.originalError = error;
    this.data = data;
    this.statusCode = error.statusCode;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = WebsocketError;
