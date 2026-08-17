const { validationResult } = require('express-validator');
const constants = require('../config/constants');
const logger = require('../services/logger');

const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(constants.HTTP_STATUS.NOT_FOUND);
  next(error);
};

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  const logMeta = {
    error: err.message,
    url: req.originalUrl,
    method: req.method,
    userId: req.user?.id
  };

  if (process.env.NODE_ENV === 'production') {
    logger.error('Server error', { ...logMeta, stack: err.stack });
  } else {
    logger.error('Server error', { ...logMeta, stack: err.stack });
  }

  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = new Error(message);
    error.statusCode = constants.HTTP_STATUS.NOT_FOUND;
  }

  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = new Error(message);
    error.statusCode = constants.HTTP_STATUS.BAD_REQUEST;
  }

  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((val) => val.message).join(', ');
    error = new Error(message);
    error.statusCode = constants.HTTP_STATUS.BAD_REQUEST;
  }

  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = new Error(message);
    error.statusCode = constants.HTTP_STATUS.UNAUTHORIZED;
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = new Error(message);
    error.statusCode = constants.HTTP_STATUS.UNAUTHORIZED;
  }

  if (err.name === 'MulterError') {
    const message = err.message || 'File upload error';
    error = new Error(message);
    error.statusCode = constants.HTTP_STATUS.BAD_REQUEST;
  }

  res.status(error.statusCode || constants.HTTP_STATUS.SERVER_ERROR).json({
    success: false,
    message: error.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }
  next();
};

module.exports = {
  notFound,
  errorHandler,
  validate,
};
