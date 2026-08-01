require('dotenv').config();
require('./emailWorker');
require('./imageWorker');      
// require('./notificationWorker'); — added after we scope what "notifications" means beyond chat sockets

console.log('👷 Worker process started, listening for jobs...');