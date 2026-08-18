require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorMiddleware');
const compression = require('compression');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const chatRoutes = require('./routes/chatRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

connectDB();
app.use(cookieParser());

app.use(helmet());
app.use(compression());
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      "http://localhost:5173",
      "http://localhost:8080",
      process.env.FRONTEND_URL,
    ].filter(Boolean);

    if (
      !origin ||
      allowedOrigins.includes(origin) ||
      origin.endsWith('.netlify.app') ||
      /^http:\/\/10\.\d+\.\d+\.\d+:\d+$/.test(origin) ||
      /^http:\/\/192\.168\.\d+\.\d+:\d+$/.test(origin)
    ) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: ${origin}`));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
}));

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));


const mongoose = require('mongoose');
const redisClient = require('./config/redisClient');

app.get('/api/health', (req, res) => {
  const mongoUp = mongoose.connection.readyState === 1;
  const redisUp = redisClient.isReady;

  res.status(mongoUp ? 200 : 503).json({
    status: mongoUp && redisUp ? 'OK' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
    dependencies: {
      mongo: mongoUp ? 'connected' : 'disconnected',
      redis: redisUp ? 'connected' : 'disconnected',
    },
  });
});

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  skip: (req) => req.path === '/api/health',

});
app.use('/api/', limiter);

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminRoutes);
app.use("/api/wishlist", wishlistRoutes);

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

app.use(errorHandler);

module.exports = app;