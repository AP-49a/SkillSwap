const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getConversations,
  createConversation,
  getConversationMessages,
  sendMessage,
  markConversationRead,
} = require('../controllers/conversationController');

router.use(protect);

router.get('/', getConversations);
router.post('/', createConversation);
router.get('/:conversationId/messages', getConversationMessages);
router.post('/:conversationId/messages', sendMessage);
router.patch('/:conversationId/read', markConversationRead);

module.exports = router;
