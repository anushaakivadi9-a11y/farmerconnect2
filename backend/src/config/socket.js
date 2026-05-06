const { Server } = require('socket.io');

const socketSetup = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || "http://localhost:5173",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join user room
    socket.on('join', (userId) => {
      socket.join(userId);
      socket.userId = userId;
    });

    // Chat messages
    socket.on('sendMessage', ({ to, message }) => {
      socket.to(to).emit('receiveMessage', {
        from: socket.userId,
        message,
        timestamp: new Date()
      });
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  return io;
};

module.exports = socketSetup;