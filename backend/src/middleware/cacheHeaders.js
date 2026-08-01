// middleware/cacheHeaders.js — reusable cache control middleware
const cacheControl = (maxAgeSeconds) => (req, res, next) => {
  if (req.method === 'GET') {
    res.set('Cache-Control', `public, max-age=${maxAgeSeconds}, stale-while-revalidate=60`);
  } else {
    res.set('Cache-Control', 'no-store'); // never cache POST/PUT/DELETE
  }
  next();
};

module.exports = cacheControl;