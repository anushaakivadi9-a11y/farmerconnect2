const express = require('express');
const router = express.Router();

const { createOrder, getMyOrders, getFarmerStats, getEarningsTrend } = require('../controllers/orderController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const slidingWindowRateLimit = require('../middleware/slidingWindowRateLimit');

const orderLimiter = slidingWindowRateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10, // 10 order attempts per 10 min per user
  keyPrefix: 'order',
});

// All order routes require authentication
router.use(authMiddleware);

router.get('/farmer-stats', roleMiddleware('farmer'), getFarmerStats); // specific route first
router.get('/my', getMyOrders);
router.get('/earnings-trend', roleMiddleware('farmer'), getEarningsTrend);
router.post('/', orderLimiter, createOrder);

module.exports = router;