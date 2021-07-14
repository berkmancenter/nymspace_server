const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((err) => {
    if (next) {
      next(err);
    }
  });
};

module.exports = catchAsync;
