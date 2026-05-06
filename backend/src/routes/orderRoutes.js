const express = require('express');
const { createOrder, getMyOrders } = require('../controllers/orderController');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

router.use(authMiddleware);
router.post('/', createOrder);
router.get('/my', getMyOrders);

module.exports = router;