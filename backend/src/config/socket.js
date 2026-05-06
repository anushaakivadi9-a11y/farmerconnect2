const { Server } = require('socket.io');
const Chat = require('../models/Chat');

const socketSetup = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Each user joins their own room (userId) so we can target them
    socket.on('join', (userId) => {
      socket.join(userId);
      socket.userId = userId;
      console.log(`User ${userId} joined their room`);
    });

    // Join a specific chat room
    socket.on('joinChat', (chatId) => {
      socket.join(`chat:${chatId}`);
    });

    // Handle sending a message
    // Saves to DB then broadcasts to the chat room
    socket.on('sendMessage', async ({ chatId, content, senderId, receiverId }) => {
      try {
        const chat = await Chat.findById(chatId);
        if (!chat) return;

        const msg = { sender: senderId, content };
        chat.messages.push(msg);
        chat.lastMessage = content;
        chat.lastMessageAt = new Date();
        await chat.save();

        const saved = chat.messages[chat.messages.length - 1];

        // Emit to everyone in the chat room (both participants)
        io.to(`chat:${chatId}`).emit('receiveMessage', {
          _id: saved._id,
          sender: senderId,
          content,
          createdAt: saved.createdAt,
          chatId,
        });

        // Also notify the receiver's personal room (for unread badge)
        io.to(receiverId).emit('newMessageNotification', {
          chatId,
          senderId,
          content,
        });
      } catch (err) {
        console.error('Socket sendMessage error:', err.message);
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  return io;
};

module.exports = socketSetup;