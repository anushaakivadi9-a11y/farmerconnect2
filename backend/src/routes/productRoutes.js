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

// Public route
router.get('/', getProducts);
router.get('/:id', getProductById); 
// Protected routes
router.use(authMiddleware);

router.get('/my', getMyProducts);
router.post('/:id/reviews', addReview); 

router.post(
  '/',
  roleMiddleware('farmer'),
  createProduct
);

router.put(
  '/:id',
  roleMiddleware('farmer'),
  updateProduct
);

router.delete('/:id', roleMiddleware('farmer'), deleteProduct);

module.exports = router;