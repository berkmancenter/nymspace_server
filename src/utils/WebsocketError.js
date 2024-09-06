class WebsocketError extends Error {
  constructor(error, data) {
    super(error.message);
    this.originalError = error;
    this.data = data;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = WebsocketError;
