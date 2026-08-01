// src/config/logger.js
const pino = require('pino');

const logger = pino({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', 'req.body.password', 'req.body.token'],
    censor: '[REDACTED]',
  },
  transport:
    process.env.NODE_ENV !== 'production'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
});

module.exports = logger;