const Product = require('../models/Product');
const Order = require('../models/Order');
const { invalidateCache } = require('../middleware/cache');
const mongoose = require('mongoose');
const emailQueue = require('../queues/emailQueue');

const createOrder = async (req, res) => {
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

  const session = await mongoose.startSession();
  let createdOrder;
  const affectedProductsIds = [];

  try {

    await session.withTransaction(async () => {
      let serverTotal = 0;
      const verifiedItems = [];

      for (const { product: productId,quantity } of items) {
        if (!quantity || quantity < 1) {
          throw new Error(`Invalid quantity for product ${productId}`);
        }

        // Atomic conditional update: only decrements if stock is still sufficient
        // at the moment this runs. Under concurrent orders for the same product,
        // MongoDB serializes these per-document, so two buyers can't both succeed
        // in buying the last unit.
        const updated = await Product.findOneAndUpdate(
          { _id: productId, isActive: true, stock: { $gte: quantity } },
          { $inc: { stock: -quantity } },
          { new: true, session }
        );

        if (!updated) {
          throw new Error(`Insufficient stock for product ${productId}`);
        }

        affectedProductsIds.push(productId);
        serverTotal += updated.price * quantity;   
        verifiedItems.push({ product: productId, quantity, price: updated.price });
      }


      const [order] = await Order.create(
        [
          {
            buyer: req.user._id,
            items: verifiedItems,
            totalAmount: serverTotal,
            paymentStatus: paymentStatus || 'pending',
            orderStatus: 'confirmed',
            deliveryAddress,
            ...(razorpayOrderId && { razorpayOrderId }),
            ...(razorpayPaymentId && { razorpayPaymentId }),
          },
        ],
        { session }
      );
      createdOrder = order;
    });

  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  } finally {
    await session.endSession();
  }

  // FIXED: array holds plain ID strings, not objects — use the id directly
  // Order is already committed at this point — nothing below should be able to fail the response
try {
  await Promise.all(affectedProductsIds.map((id) => invalidateCache(`/api/products/${id}`)));
  await invalidateCache('/api/products');
} catch (err) {
  console.error('Cache invalidation failed after order:', err.message); // log, don't throw
}

try {
  await emailQueue.add(
    'order-confirmation',
    { to: req.user.email, orderId: createdOrder._id.toString(), totalAmount: createdOrder.totalAmount },
    { attempts: 3, backoff: { type: 'exponential', delay: 5000 } }
  );
} catch (err) {
  console.error('Failed to queue confirmation email:', err.message); // log, don't throw — BullMQ's own retries handle transient issues anyway
}

let populated;
try {
  populated = await Order.findById(createdOrder._id)
    .populate('buyer', 'name email')
    .populate('items.product', 'name imageUrl unit');
} catch (err) {
  console.error('Failed to populate order for response:', err.message);
  populated = createdOrder; // fall back to the unpopulated doc rather than failing the whole request
}
tgft
res.status(201).json({ success: true, data: populated });
}

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

const getFarmerStats = async (req, res) => {
  try {
    const farmerId = req.user._id;

    const orders = await Order.find({
      "items.product": {
        $in: await require('../models/Product')
          .find({ farmer: farmerId })
          .distinct('_id')
      }
    }).populate('items.product', 'farmer price reviews');

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

const getEarningsTrend = async (req, res) => {
  try {
    const farmerId = req.user._id;
    const productIds = await Product.find({ farmer: farmerId }).distinct('_id');

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const orders = await Order.find({
      'items.product': { $in: productIds },
      createdAt: { $gte: sixMonthsAgo },
    }).populate('items.product', 'farmer');

    // Build a map for the last 6 months, so months with zero orders still show as 0
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleString('en-IN', { month: 'short' }), earnings: 0 });
    }
    const monthMap = Object.fromEntries(months.map(m => [m.key, m]));

    orders.forEach(order => {
      const myItems = order.items.filter(item => String(item.product?.farmer) === String(farmerId));
      if (!myItems.length) return;
      const d = new Date(order.createdAt);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (monthMap[key]) {
        myItems.forEach(item => { monthMap[key].earnings += item.price * item.quantity; });
      }
    });

    res.json({ success: true, data: months.map(({ label, earnings }) => ({ month: label, earnings })) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createOrder, getMyOrders, getFarmerStats, getEarningsTrend };
