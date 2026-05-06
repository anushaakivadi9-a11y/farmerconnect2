const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true, trim: true },
  read: { type: Boolean, default: false },
}, { timestamps: true });

const chatSchema = new mongoose.Schema({
  // The two participants: always [buyerId, farmerId]
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
  // The product this chat is about
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  messages: [messageSchema],
  lastMessage: { type: String, default: '' },
  lastMessageAt: { type: Date, default: Date.now },
}, { timestamps: true });

// Unique chat per (buyer, farmer, product)
chatSchema.index({ participants: 1, product: 1 });

module.exports = mongoose.model('Chat', chatSchema);