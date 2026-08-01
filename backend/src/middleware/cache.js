const redisClient = require('../config/redisClient');

const buildKey = (req) => `cache:${req.originalUrl}`;

// Cache-aside: check Redis first; on miss, let the controller run and
// intercept res.json to populate Redis before the response goes out.
const cache = (ttlSeconds) => {
  return async (req, res, next) => {
    if (!redisClient.isReady) return next(); // fail open

    const key = buildKey(req);

    try {
      const cached = await redisClient.get(key);
      if (cached) {
        res.set('X-Cache', 'HIT');
        return res.json(JSON.parse(cached));
      }
    } catch (err) {
      console.error('Cache read error:', err.message);
      return next();
    }

    const originalJson = res.json.bind(res);
    res.json = (body) => {
      res.set('X-Cache', 'MISS');
      if (body?.success !== false) {
        redisClient
          .set(key, JSON.stringify(body), { EX: ttlSeconds })
          .catch((err) => console.error('Cache write error:', err.message));
      }
      return originalJson(body);
    };

    next();
  };
};

// Deletes every cached key whose URL starts with `prefix`.
// Uses SCAN (not KEYS) so it doesn't block Redis on a large keyspace.

const invalidateCache = async (prefix) => {
  if (!redisClient.isReady) return;

  const pattern = `cache:${prefix}*`;
  try {
    const keys = [];
    for await (const key of redisClient.scanIterator({ MATCH: pattern, COUNT: 100 })) {
      keys.push(key);
    }
    if (keys.length) {
      await redisClient.del(keys);
      console.log(`🗑️  Invalidated ${keys.length} key(s) matching "${pattern}"`);
    }
  } catch (err) {
    console.error('Cache invalidation error:', err.message);
  }
};

module.exports = { cache, invalidateCache };