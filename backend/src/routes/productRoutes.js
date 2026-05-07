const express = require('express');
const router = express.Router();

const {
  getProducts, createProduct, updateProduct,
  getMyProducts, deleteProduct, getProductById, addReview,
} = require('../controllers/productController');

const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const optionalAuth = require('../middleware/optionalAuth');

// ── Public ─────────────────────────────────────────────────────────────────
router.get('/', getProducts);

// ── /my MUST be before /:id ────────────────────────────────────────────────
router.get('/my', authMiddleware, getMyProducts);  // ← FIRST

// ── Public single product ──────────────────────────────────────────────────
router.get('/:id', optionalAuth, getProductById);  // ← AFTER /my

// ── Farmer protected ───────────────────────────────────────────────────────
router.post('/', authMiddleware, roleMiddleware('farmer'), createProduct);
router.post('/:id/reviews', authMiddleware, addReview);
router.put('/:id', authMiddleware, roleMiddleware('farmer'), updateProduct);
router.delete('/:id', authMiddleware, roleMiddleware('farmer'), deleteProduct);

module.exports = router;