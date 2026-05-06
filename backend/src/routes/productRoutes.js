const express = require('express');
const { 
  getProducts, 
  createProduct, 
  updateProduct 
} = require('../controllers/productController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const router = express.Router();

router.get('/', getProducts); // Public - Buyers

router.use(authMiddleware); // All below require auth

router.post('/', roleMiddleware('farmer'), createProduct);
router.put('/:id', roleMiddleware('farmer'), updateProduct);

module.exports = router;