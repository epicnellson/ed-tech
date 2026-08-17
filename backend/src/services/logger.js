const LOG_LEVEL = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

const shouldLog = (level) => {
  return levels[level] <= levels[LOG_LEVEL] || levels[level] <= levels.info;
};

const formatMessage = (level, message, meta = {}) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level: level.toUpperCase(),
    message,
    ...meta
  };
  
  if (process.env.NODE_ENV === 'production') {
    return JSON.stringify(logEntry);
  }
  
  const color = {
    error: '\x1b[31m',
    warn: '\x1b[33m',
    info: '\x1b[36m',
    debug: '\x1b[90m',
    reset: '\x1b[0m'
  };
  
  return `${color[level]}[${timestamp}] ${level.toUpperCase()}: ${message}${Object.keys(meta).length ? ' ' + JSON.stringify(meta) : ''}${color.reset}`;
};

const logger = {
  error: (message, meta = {}) => {
    if (shouldLog('error')) {
      console.error(formatMessage('error', message, meta));
    }
  },
  
  warn: (message, meta = {}) => {
    if (shouldLog('warn')) {
      console.warn(formatMessage('warn', message, meta));
    }
  },
  
  info: (message, meta = {}) => {
    if (shouldLog('info')) {
      console.log(formatMessage('info', message, meta));
    }
  },
  
  debug: (message, meta = {}) => {
    if (shouldLog('debug')) {
      console.log(formatMessage('debug', message, meta));
    }
  }
};

module.exports = logger;
