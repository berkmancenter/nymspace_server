const jwt = require('jsonwebtoken');
const config = require('../config/config');
const { User } = require('../models');
const catchAsync = require('../utils/catchAsync');
const logger = require('../config/logger');

const checkAuth = catchAsync(async (event, args, next) => {
  try {
    const payload = jwt.verify(args.token, config.jwt.secret);
    args.user = await User.findById(payload.sub);
  } catch (e) {
    logger.info('Socket request failed auth check. ERROR = %s', Object.keys(e));
    const err = new Error(e.message);
    err.data = { type: 'error' };
    next(err);
  }

  next();
});

module.exports = {
  checkAuth,
}