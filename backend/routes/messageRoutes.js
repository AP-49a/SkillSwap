const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Message = require('../models/Message');
const User = require('../models/User');

// All message routes are protected
router.use(protect);

// POST /api/messages — send a message
router.post('/', async (req, res) => {
  try {
    const { recipientId, text } = req.body;

    if (!recipientId || !text) {
      return res.status(400).json({ success: false, message: 'Recipient and text are required' });
    }

    if (recipientId === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot message yourself' });
    }

    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ success: false, message: 'Recipient not found' });
    }

    const message = await Message.create({
      sender: req.user.id,
      recipient: recipientId,
      text,
    });

    const populated = await Message.findById(message._id)
      .populate('sender', 'username profile.avatar')
      .populate('recipient', 'username profile.avatar');

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/messages/chats — list recent chat partners
router.get('/chats', async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [{ sender: req.user.id }, { recipient: req.user.id }],
    }).sort({ createdAt: -1 });

    const chatPartners = new Map();
    for (const msg of messages) {
      const partnerId =
        msg.sender.toString() === req.user.id
          ? msg.recipient.toString()
          : msg.sender.toString();
      if (!chatPartners.has(partnerId)) {
        chatPartners.set(partnerId, msg);
      }
    }

    const recentChats = [];
    for (const [partnerId, lastMsg] of chatPartners.entries()) {
      const partnerUser = await User.findById(partnerId).select('username profile.avatar');
      if (!partnerUser) continue;

      const unreadCount = await Message.countDocuments({
        sender: partnerId,
        recipient: req.user.id,
        isRead: false,
      });

      recentChats.push({ user: partnerUser, lastMessage: lastMsg, unreadCount });
    }

    res.json({ success: true, data: recentChats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/messages/conversation/:userId — get conversation history
router.get('/conversation/:userId', async (req, res) => {
  try {
    const targetId = req.params.userId;

    await Message.updateMany(
      { sender: targetId, recipient: req.user.id, isRead: false },
      { $set: { isRead: true } }
    );

    const messages = await Message.find({
      $or: [
        { sender: req.user.id, recipient: targetId },
        { sender: targetId, recipient: req.user.id },
      ],
    })
      .sort({ createdAt: 1 })
      .populate('sender', 'username profile.avatar')
      .populate('recipient', 'username profile.avatar');

    res.json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/messages/:id/react — add emoji reaction
router.put('/:id/react', async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }
    message.emojiReaction = req.body.emoji || '';
    await message.save();
    res.json({ success: true, data: message });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
