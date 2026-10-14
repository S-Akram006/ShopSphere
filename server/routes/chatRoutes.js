const express = require('express');
const router = express.Router();
const {
  getConversationMessages,
  sendMessage,
  getUserConversations,
  markConversationRead,
} = require('../controllers/chatController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/conversations', getUserConversations);
router.get('/messages/:conversationId', getConversationMessages);
router.post('/messages', sendMessage);
router.put('/read/:conversationId', markConversationRead);

module.exports = router;
