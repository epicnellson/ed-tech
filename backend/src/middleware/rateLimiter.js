const rateLimit = require('express-rate-limit');
const constants = require('../config/constants');

const authRateLimiter = rateLimit({
  windowMs: constants.RATE_LIMIT.AUTH_WINDOW_MS,
  max: constants.RATE_LIMIT.AUTH_MAX_REQUESTS,
  message: {
    success: false,
    message: 'Too many requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const rateLimiter = (options = {}) => {
  return rateLimit({
    windowMs: options.windowMs || 15 * 60 * 1000,
    max: options.max || 100,
    message: options.message || {
      success: false,
      message: 'Too many requests, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

module.exports = {
  authRateLimiter,
  rateLimit: rateLimiter
};
