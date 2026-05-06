const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  stock: { type: Number, required: true, min: 0 },
  category: { 
    type: String, 
    required: true,
    enum: ['vegetables', 'fruits', 'grains', 'dairy', 'organic', 'others']
  },
  imageUrl: { type: String, required: true },
  unit: { type: String, default: 'kg' }, // kg, liter, piece, etc.
  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: true },

   reviews: [
    {
      user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      rating:    { type: Number, required: true, min: 1, max: 5 },
      comment:   { type: String, required: true, trim: true },
      createdAt: { type: Date, default: Date.now },
    },
  ],
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for farmer population
productSchema.virtual('farmerInfo', {
  ref: 'User',
  localField: 'farmer',
  foreignField: '_id'
});

productSchema.index({ category: 1, price: 1 });
productSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Product', productSchema);