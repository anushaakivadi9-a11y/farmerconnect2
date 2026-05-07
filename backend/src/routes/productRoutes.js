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
router.get('/:id', optionalAuth, getProductById); // public but token-aware

// ── Protected routes (auth required) ─────────────────────────────────────────
router.use(authMiddleware);

router.get('/my', getMyProducts);                            // must be after authMiddleware
router.post('/', roleMiddleware('farmer'), createProduct);
router.post('/:id/reviews', addReview);
router.put('/:id', roleMiddleware('farmer'), updateProduct);
router.delete('/:id', roleMiddleware('farmer'), deleteProduct);

module.exports = router;