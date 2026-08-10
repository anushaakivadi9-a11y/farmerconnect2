const { createClient } = require('redis');

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    reconnectStrategy: (retries) => {
      const delay = Math.min(retries * 100, 3000); // cap the wait, but never stop trying
      if (retries % 10 === 0) {
        console.warn(`Redis: still retrying to connect (attempt ${retries})...`);
      }
      return delay;
    },
  },
});

redisClient.on('error', (err) => console.error('Redis Client Error:', err.message));
redisClient.on('ready', () => console.log('✅ Redis ready'));
redisClient.on('reconnecting', () => console.warn('⚠️  Redis reconnecting...'));

(async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    console.error('❌ Initial Redis connection failed:', err.message);
    console.error('   Continuing WITHOUT caching until Redis recovers.');
  }
})();

module.exports = redisClient;