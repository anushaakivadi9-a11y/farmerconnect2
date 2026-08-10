require('dotenv').config();
const http = require('http');
const app = require('./app');
const socketSetup = require('./config/socket');
const cookieParser = require('cookie-parser');

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

require('./workers/emailWorker');
require('./workers/imageWorker');

// Setup Socket.io
socketSetup(server);

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`👷 Workers listening for jobs...`);
  console.log(`📱 Frontend URL: ${process.env.CORS_ORIGIN || 'http://localhost:5173'}`);
});