const redisClient = require('../config/redisClient');

// Sliding window via Redis sorted set: each request adds a timestamp-scored
// member; on every check we drop anything older than the window, then count
// what's left. ZCARD after trimming = "requests in the last windowMs, right now."
const slidingWindowRateLimit = ({ windowMs, max, keyPrefix }) => {
  return async (req, res, next) => {
    if (!redisClient.isReady) return next(); // fail open — see tradeoff note below

    const identifier = req.user?._id?.toString() || req.ip;
    const key = `ratelimit:${keyPrefix}:${identifier}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    try {
      const multi = redisClient.multi();
      multi.zRemRangeByScore(key, 0, windowStart);
      multi.zAdd(key, { score: now, value: `${now}-${Math.random()}` });
      multi.zCard(key);
      multi.expire(key, Math.ceil(windowMs / 1000)); // auto-cleanup if client goes quiet
      const results = await multi.exec();

      const count = results[2];

      if (count > max) {
        return res.status(429).json({
          success: false,
          message: 'Too many requests, please try again later.',
        });
      }

      next();
    } catch (err) {
      console.error('Rate limiter error:', err.message);
      next(); // fail open
    }
  };
};

module.exports = slidingWindowRateLimit;