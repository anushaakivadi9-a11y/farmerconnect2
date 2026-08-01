const { createClient } = require('redis');

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        console.error('Redis: too many reconnect attempts, giving up');
        return new Error('Redis reconnect failed');
      }
      return Math.min(retries * 100, 3000); // exponential-ish backoff, capped at 3s
    },
  },
});

redisClient.on('error', (err) => console.error('Redis Client Error:', err.message));
redisClient.on('ready', () => console.log('✅ Redis ready'));
redisClient.on('reconnecting', () => console.warn('⚠️  Redis reconnecting...'));

// Connect without crashing the process if Redis is down at boot —
// the app must survive without caching, not die because of it.
(async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    console.error('❌ Initial Redis connection failed:', err.message);
    console.error('   Continuing WITHOUT caching until Redis recovers.');
  }
})();

module.exports = redisClient;