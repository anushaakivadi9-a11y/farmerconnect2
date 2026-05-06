const Product = require('../models/Product');

// @desc    Get all products (Buyers)
// @route   GET /api/products
const getProducts = async (req, res) => {
  try {
    const { category, minPrice, maxPrice, page = 1, limit = 12 } = req.query;

    let query = { isActive: true };

    // ✅ FIXED: normalize category to lowercase to match schema enum
    if (category) query.category = category.toLowerCase();

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    const products = await Product.find(query)
      .populate('farmer', 'name location')   // ✅ populates farmer name for display
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
      data: products,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create product (Farmers only)
// @route   POST /api/products
const createProduct = async (req, res) => {
  try {
    req.body.farmer = req.user._id;

    // ✅ FIXED: normalize category to lowercase before saving
    if (req.body.category) {
      req.body.category = req.body.category.toLowerCase();
    }

    const product = await Product.create(req.body);
    const populatedProduct = await Product.findById(product._id).populate('farmer', 'name');

    res.status(201).json({ success: true, data: populatedProduct });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update product (Farmers only)
// @route   PUT /api/products/:id
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      farmer: req.user._id,
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // ✅ FIXED: normalize category on update too
    if (req.body.category) {
      req.body.category = req.body.category.toLowerCase();
    }

    Object.assign(product, req.body);
    await product.save();

    const populatedProduct = await Product.findById(product._id).populate('farmer', 'name');

    res.json({ success: true, data: populatedProduct });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single product by ID (Public)
// @route   GET /api/products/:id
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('farmer', 'name location')
      .populate('reviews.user', 'name');   // if reviews are embedded

    if (!product || !product.isActive) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add review to product (Buyers only)
// @route   POST /api/products/:id/reviews
const addReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Prevent duplicate reviews from same user
    const alreadyReviewed = product.reviews?.some(
      (r) => String(r.user) === String(req.user._id)
    );
    if (alreadyReviewed) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this product' });
    }

    product.reviews = product.reviews || [];
    product.reviews.push({
      user: req.user._id,
      rating: Number(rating),
      comment,
    });

    await product.save();

    const updated = await Product.findById(req.params.id)
      .populate('farmer', 'name location')
      .populate('reviews.user', 'name');

    res.status(201).json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};



// @desc    Get my products (Farmer)
// @route   GET /api/products/my
const getMyProducts = async (req, res) => {
  try {
    const products = await Product.find({ farmer: req.user._id })
      .sort({ createdAt: -1 });
    res.json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete product (Farmers only)
// @route   DELETE /api/products/:id
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      farmer: req.user._id,
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    await product.deleteOne();
    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getProducts,getProductById,addReview, createProduct, updateProduct, getMyProducts, deleteProduct };