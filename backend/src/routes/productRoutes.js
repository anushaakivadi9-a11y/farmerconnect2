const express = require('express');
const router = express.Router();
const {
  getProducts, createProduct, updateProduct,
  getMyProducts, deleteProduct, getProductById, addReview,
} = require('../controllers/productController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// ✅ 1. Public — no auth
router.get('/', getProducts);

// ✅ 2. Auth middleware for all below
router.use(authMiddleware);

// ✅ 3. Specific string routes BEFORE /:id wildcard
router.get('/my', getMyProducts);
router.post('/', roleMiddleware('farmer'), createProduct);
router.post('/:id/reviews', addReview);
router.put('/:id', roleMiddleware('farmer'), updateProduct);
router.delete('/:id', roleMiddleware('farmer'), deleteProduct);

// ✅ 4. Wildcard /:id LAST
router.get('/:id', getProductById);

module.exports = router;