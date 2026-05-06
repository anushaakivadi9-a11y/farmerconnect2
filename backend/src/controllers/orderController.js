// =============================
// backend/src/controllers/orderController.js
// =============================
const Order = require('../models/Order');

// @desc    Create order (called after payment confirmed)
// @route   POST /api/orders
const createOrder = async (req, res) => {
  try {
    const {
      items,
      totalAmount,
      paymentMethod,
      paymentStatus,
      deliveryAddress,
      razorpayOrderId,
      razorpayPaymentId,
    } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ success: false, message: 'No items in order' });
    }

    const order = await Order.create({
      buyer: req.user._id,
      items,
      totalAmount,
      paymentStatus: paymentStatus || 'pending',
      orderStatus: 'confirmed',
      deliveryAddress,
      ...(razorpayOrderId && { razorpayOrderId }),
      ...(razorpayPaymentId && { razorpayPaymentId }),
    });

    const populated = await Order.findById(order._id)
      .populate('buyer', 'name email')
      .populate('items.product', 'name imageUrl unit');

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get orders for logged-in buyer
// @route   GET /api/orders/my
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ buyer: req.user._id })
      .populate('items.product', 'name imageUrl unit price')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createOrder, getMyOrders };


// =============================
// backend/src/routes/orderRoutes.js  (replace existing file)
// =============================
// const express = require('express');
// const { createOrder, getMyOrders } = require('../controllers/orderController');
// const authMiddleware = require('../middleware/authMiddleware');
// const router = express.Router();
// 
// router.use(authMiddleware);
// router.post('/', createOrder);
// router.get('/my', getMyOrders);
// 
// module.exports = router;