const jwt = require('jsonwebtoken');
const config = require('../config/config');
const { User } = require('../models');
const catchAsync = require('../utils/catchAsync');

const checkAuth = catchAsync(async (event, args, next) => {
    try {
      const payload = jwt.verify(args.token, config.jwt.secret);
      args.user = await User.findById(payload.sub);
    } catch (e) {
      return;
    }

    next();
  });

  module.exports = {
      checkAuth,
  }