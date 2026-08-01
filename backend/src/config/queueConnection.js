const IORedis = require('ioredis');

// maxRetriesPerRequest: null is mandatory for BullMQ — its internal
// blocking commands (waiting for new jobs) would otherwise time out.
const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

connection.on('error', (err) => console.error('BullMQ Redis connection error:', err.message));

module.exports = connection;