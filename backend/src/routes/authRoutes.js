const express = require('express');
const { register, login, refresh, logout } = require('../controllers/authController');
const router = express.Router();
const slidingWindowRateLimit = require('../middleware/slidingWindowRateLimit');

const authLimiter = slidingWindowRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,          // 5 login/register attempts per 15 min per IP
  keyPrefix: 'auth',
});

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/refresh',refresh);
router.post('/logout',logout);
module.exports = router;