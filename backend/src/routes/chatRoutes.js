const express = require('express');
const router = express.Router();
const { startChat, getMyChats, getChat, saveMessage } = require('../controllers/chatController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.post('/start', startChat);
router.get('/my', getMyChats);
router.get('/:chatId', getChat);
router.post('/:chatId/message', saveMessage);

module.exports = router;