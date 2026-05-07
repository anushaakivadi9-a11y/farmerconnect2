const express = require('express');
const router = express.Router();

const {
  getProducts,
  createProduct,
  updateProduct,
  getMyProducts,
  deleteProduct,
  getProductById,
  addReview,
} = require('../controllers/productController');

const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const optionalAuth = require('../middleware/optionalAuth');

// ── Public routes ─────────────────────────────────────────────────────────────
router.get('/', getProducts);

// ── Protected routes (auth required) ─────────────────────────────────────────
router.get('/my', authMiddleware, getMyProducts);        // ← BEFORE /:id

// ── Public but token-aware ────────────────────────────────────────────────────
router.get('/:id', optionalAuth, getProductById);        // ← AFTER /my

router.use(authMiddleware);
router.post('/', roleMiddleware('farmer'), createProduct);
router.post('/:id/reviews', addReview);
router.put('/:id', roleMiddleware('farmer'), updateProduct);
router.delete('/:id', roleMiddleware('farmer'), deleteProduct);

module.exports = router;