const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  role: { 
    type: String, 
    enum: ['farmer', 'buyer', 'admin'], 
    default: 'buyer' 
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
    }
  },
  phone: { type: String },
  isVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

// ✅ CRITICAL: Hash password BEFORE saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// ✅ CRITICAL: Compare password method (THIS WAS MISSING!)
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// ✅ Select minus password
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};
userSchema.index({ location: '2dsphere' }, { sparse: true });

module.exports = mongoose.model('User', userSchema);