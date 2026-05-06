const Chat = require('../models/Chat');

// @desc  Get or create a chat between buyer and farmer for a product
// @route POST /api/chat/start
const startChat = async (req, res) => {
  try {
    const { farmerId, productId } = req.body;
    const buyerId = req.user._id;

    let chat = await Chat.findOne({
      participants: { $all: [buyerId, farmerId] },
      product: productId,
    })
      .populate('participants', 'name role')
      .populate('product', 'name imageUrl');

    if (!chat) {
      chat = await Chat.create({
        participants: [buyerId, farmerId],
        product: productId,
        messages: [],
      });
      chat = await Chat.findById(chat._id)
        .populate('participants', 'name role')
        .populate('product', 'name imageUrl');
    }

    res.json({ success: true, data: chat });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get all chats for the logged-in user
// @route GET /api/chat/my
const getMyChats = async (req, res) => {
  try {
    const chats = await Chat.find({ participants: req.user._id })
      .populate('participants', 'name role')
      .populate('product', 'name imageUrl')
      .sort({ lastMessageAt: -1 });

    res.json({ success: true, data: chats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get single chat by id (with messages)
// @route GET /api/chat/:chatId
const getChat = async (req, res) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.chatId,
      participants: req.user._id,         // must be a participant
    })
      .populate('participants', 'name role')
      .populate('product', 'name imageUrl');

    if (!chat) return res.status(404).json({ success: false, message: 'Chat not found' });

    // Mark all messages as read for this user
    chat.messages.forEach((m) => {
      if (String(m.sender) !== String(req.user._id)) m.read = true;
    });
    await chat.save();

    res.json({ success: true, data: chat });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Save a message (called by socket after saving)
// @route POST /api/chat/:chatId/message
const saveMessage = async (req, res) => {
  try {
    const { content } = req.body;
    const chat = await Chat.findOne({
      _id: req.params.chatId,
      participants: req.user._id,
    });

    if (!chat) return res.status(404).json({ success: false, message: 'Chat not found' });

    const msg = { sender: req.user._id, content };
    chat.messages.push(msg);
    chat.lastMessage = content;
    chat.lastMessageAt = new Date();
    await chat.save();

    const saved = chat.messages[chat.messages.length - 1];
    res.json({ success: true, data: saved });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { startChat, getMyChats, getChat, saveMessage };