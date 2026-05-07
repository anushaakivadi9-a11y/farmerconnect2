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

// @desc    Get stats for logged-in farmer
// @route   GET /api/orders/farmer-stats
const getFarmerStats = async (req, res) => {
  try {
    const farmerId = req.user._id;

    // Get all orders that contain this farmer's products
    const orders = await Order.find({
      "items.product": {
        $in: await require('../models/Product')
          .find({ farmer: farmerId })
          .distinct('_id')
      }
    }).populate('items.product', 'farmer price reviews');

    // Filter only items belonging to this farmer
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let totalEarnings = 0;
    let ordersThisMonth = 0;
    let totalRating = 0;
    let ratingCount = 0;

    orders.forEach(order => {
      const myItems = order.items.filter(
        item => String(item.product?.farmer) === String(farmerId)
      );
      if (myItems.length === 0) return;

      // Earnings
      myItems.forEach(item => {
        totalEarnings += item.price * item.quantity;
      });

      // Orders this month
      if (new Date(order.createdAt) >= startOfMonth) {
        ordersThisMonth++;
      }
    });

    // Avg rating from products
    const products = await require('../models/Product')
      .find({ farmer: farmerId });

    products.forEach(p => {
      (p.reviews || []).forEach(r => {
        totalRating += r.rating;
        ratingCount++;
      });
    });

    res.json({
      success: true,
      data: {
        totalEarnings,
        ordersThisMonth,
        avgRating: ratingCount > 0
          ? Math.round((totalRating / ratingCount) * 10) / 10
          : 0,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};



module.exports = { createOrder, getMyOrders, getFarmerStats };


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