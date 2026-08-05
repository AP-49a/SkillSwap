import Message from '../models/Message.js';
import User from '../models/User.js';
import Profile from '../models/Profile.js';
import Notification from '../models/Notification.js';

// @desc    Send a chat message
// @route   POST /api/messages
// @access  Private
export const sendMessage = async (req, res) => {
  const { recipientId, text, attachment, voiceNoteUrl } = req.body;

  try {
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
      attachment,
      voiceNoteUrl,
    });

    // Notify recipient of new message
    await Notification.create({
      user: recipientId,
      type: 'new_message',
      title: `Message from ${req.user.name}`,
      message: text ? (text.length > 50 ? text.substring(0, 47) + '...' : text) : 'Sent an attachment',
      metaData: { messageId: message._id.toString() },
    });

    const populated = await Message.findById(message._id)
      .populate('sender', 'name username')
      .populate('recipient', 'name username');

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get conversation history with a user
// @route   GET /api/messages/conversation/:userId
// @access  Private
export const getConversation = async (req, res) => {
  const targetId = req.params.userId;

  try {
    // Mark messages from target to current user as read
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
      .populate('sender', 'name username')
      .populate('recipient', 'name username');

    res.json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get list of active conversation partners with last message
// @route   GET /api/messages/chats
// @access  Private
export const getRecentChats = async (req, res) => {
  try {
    // Find all messages involving current user
    const messages = await Message.find({
      $or: [{ sender: req.user.id }, { recipient: req.user.id }],
    }).sort({ createdAt: -1 });

    const chatPartners = new Map();

    for (const msg of messages) {
      const partnerId = msg.sender.toString() === req.user.id ? msg.recipient.toString() : msg.sender.toString();
      
      if (!chatPartners.has(partnerId)) {
        chatPartners.set(partnerId, msg);
      }
    }

    const recentChats = [];

    for (const [partnerId, lastMsg] of chatPartners.entries()) {
      const partnerUser = await User.findById(partnerId).select('name username');
      if (!partnerUser) continue;
      
      const partnerProfile = await Profile.findOne({ user: partnerId }).select('avatar bio');

      // Unread count
      const unreadCount = await Message.countDocuments({
        sender: partnerId,
        recipient: req.user.id,
        isRead: false,
      });

      recentChats.push({
        user: {
          _id: partnerUser._id,
          name: partnerUser.name,
          username: partnerUser.username,
          avatar: partnerProfile ? partnerProfile.avatar : '',
          bio: partnerProfile ? partnerProfile.bio : '',
        },
        lastMessage: {
          text: lastMsg.text,
          attachment: lastMsg.attachment,
          voiceNoteUrl: lastMsg.voiceNoteUrl,
          createdAt: lastMsg.createdAt,
          sender: lastMsg.sender,
          isRead: lastMsg.isRead,
        },
        unreadCount,
      });
    }

    res.json({ success: true, data: recentChats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add a reaction to a message
// @route   PUT /api/messages/:id/react
// @access  Private
export const reactToMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    // Check permissions
    if (message.sender.toString() !== req.user.id && message.recipient.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    message.emojiReaction = req.body.emoji || '';
    await message.save();

    res.json({ success: true, data: message });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
