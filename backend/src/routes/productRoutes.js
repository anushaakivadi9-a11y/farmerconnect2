const express = require('express');
const router = express.Router();
const { cache, invalidateCache } = require('../middleware/cache'); // ← add this

const {
  getProducts, createProduct, updateProduct,
  getMyProducts, deleteProduct, getProductById, addReview,
} = require('../controllers/productController');

const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const optionalAuth = require('../middleware/optionalAuth');

// ── /my MUST be before /:id ────────────────────────────────────────────────
router.get('/my', authMiddleware, getMyProducts);  // ← FIRST

// ── Public single product ──────────────────────────────────────────────────
router.get('/:id', optionalAuth,cache(300), getProductById);  // ← AFTER /my

// ── Public ─────────────────────────────────────────────────────────────────
router.get('/',cache(120), getProducts);

// ── Farmer protected ───────────────────────────────────────────────────────
router.post('/', authMiddleware, roleMiddleware('farmer'),  async (req, res, next) => { await invalidateCache('/api/products'); next(); },
 createProduct);
router.post('/:id/reviews', authMiddleware,  async (req, res, next) => {
    await invalidateCache(`/api/products/${req.params.id}`); // only this product
    next();
  }, addReview);
  
router.put('/:id', authMiddleware,  async (req, res, next) => { await invalidateCache('/api/products'); next(); },
 roleMiddleware('farmer'), updateProduct);
router.delete('/:id', authMiddleware, roleMiddleware('farmer'),  async (req, res, next) => { await invalidateCache('/api/products'); next(); },
 deleteProduct);

module.exports = router;