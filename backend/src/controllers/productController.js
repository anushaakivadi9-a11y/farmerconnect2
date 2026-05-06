const Product = require('../models/Product');

// @desc    Get all products (Buyers)
// @route   GET /api/products
const getProducts = async (req, res) => {
  try {
    const { category, minPrice, maxPrice, location, page = 1, limit = 12 } = req.query;
    
    let query = { isActive: true, isVerified: true };
    
    if (category) query.category = category;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = minPrice;
      if (maxPrice) query.price.$lte = maxPrice;
    }

    const products = await Product.find(query)
      .populate('farmer', 'name location')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Product.countDocuments(query);

    res.json({
      success: true,
      count: products.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create product (Farmers only)
// @route   POST /api/products
const createProduct = async (req, res) => {
  try {
    req.body.farmer = req.user._id;
    const product = await Product.create(req.body);
    
    const populatedProduct = await Product.findById(product._id).populate('farmer', 'name');
    
    res.status(201).json({
      success: true,
      data: populatedProduct
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update product (Farmers only)
// @route   PUT /api/products/:id
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findOne({ 
      _id: req.params.id, 
      farmer: req.user._id 
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    Object.assign(product, req.body);
    await product.save();

    const populatedProduct = await Product.findById(product._id).populate('farmer', 'name');

    res.json({
      success: true,
      data: populatedProduct
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = { getProducts, createProduct, updateProduct };