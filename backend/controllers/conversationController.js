const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');

const safeId = (value) => value && value.toString ? value.toString() : String(value);

const normalizeParticipants = (ids = []) => [...new Set(ids.map(safeId))].sort();

const buildConversationPayload = async (conversation, currentUserId) => {
  const participantIds = conversation.participants.map(safeId);
  const peerId = participantIds.find((id) => id !== safeId(currentUserId));
  const peer = peerId ? await User.findById(peerId).select('username profile.avatar') : null;
  const unreadCount = await Message.countDocuments({
    conversationId: conversation._id,
    receiverId: currentUserId,
    read: false,
  });

  return {
    _id: conversation._id,
    participants: conversation.participants,
    peer,
    lastMessage: conversation.lastMessage || '',
    lastMessageAt: conversation.lastMessageAt || conversation.updatedAt,
    unreadCount,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
  };
};

exports.getConversations = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({ participants: req.user.id })
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .populate('participants', 'username profile.avatar');

    const payload = await Promise.all(
      conversations.map((conversation) => buildConversationPayload(conversation, req.user.id))
    );

    res.status(200).json({ success: true, data: payload });
  } catch (error) {
    next(error);
  }
};

exports.createConversation = async (req, res, next) => {
  try {
    const otherUserId = req.body.participantId || req.body.userId || req.body.recipientId;

    if (!otherUserId) {
      return res.status(400).json({ success: false, message: 'Participant ID is required' });
    }

    if (safeId(otherUserId) === safeId(req.user.id)) {
      return res.status(400).json({ success: false, message: 'You cannot message yourself' });
    }

    const otherUser = await User.findById(otherUserId);
    if (!otherUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const participantList = normalizeParticipants([req.user.id, otherUserId]);
    const existing = await Conversation.findOne({
      participants: { $all: participantList, $size: 2 },
    });

    if (existing) {
      const conversationPayload = await buildConversationPayload(existing, req.user.id);
      return res.status(200).json({ success: true, data: conversationPayload, message: 'Conversation already exists' });
    }

    const conversation = await Conversation.create({ participants: participantList });
    const payload = await buildConversationPayload(conversation, req.user.id);

    res.status(201).json({ success: true, data: payload });
  } catch (error) {
    next(error);
  }
};

exports.getConversationMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const skip = Number(req.query.skip || 0);
    const limit = Math.min(Number(req.query.limit || 30), 100);

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    if (!conversation.participants.some((participant) => safeId(participant) === safeId(req.user.id))) {
      return res.status(403).json({ success: false, message: 'You are not allowed to access this conversation' });
    }

    const messages = await Message.find({ conversationId })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit)
      .populate('senderId', 'username profile.avatar')
      .populate('receiverId', 'username profile.avatar');

    res.status(200).json({ success: true, data: messages, pagination: { skip, limit } });
  } catch (error) {
    next(error);
  }
};

exports.sendMessage = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const content = (req.body.content || req.body.text || '').toString().trim();

    if (!content) {
      return res.status(400).json({ success: false, message: 'Message cannot be empty' });
    }

    if (content.length > 2000) {
      return res.status(400).json({ success: false, message: 'Message is too long' });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    if (!conversation.participants.some((participant) => safeId(participant) === safeId(req.user.id))) {
      return res.status(403).json({ success: false, message: 'You are not allowed to send in this conversation' });
    }

    const receiverId = conversation.participants.find(
      (participant) => safeId(participant) !== safeId(req.user.id)
    );

    const message = await Message.create({
      conversationId: conversation._id,
      senderId: req.user.id,
      receiverId,
      content,
      text: content,
      read: false,
      isRead: false,
    });

    conversation.lastMessage = content;
    conversation.lastMessageAt = new Date();
    await conversation.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('senderId', 'username profile.avatar')
      .populate('receiverId', 'username profile.avatar');

    if (req.app && req.app.locals && req.app.locals.io) {
      req.app.locals.io.to(conversation._id.toString()).emit('receive_message', {
        conversationId: conversation._id.toString(),
        message: populatedMessage,
        senderId: req.user.id,
      });
    }

    res.status(201).json({ success: true, data: populatedMessage });
  } catch (error) {
    next(error);
  }
};

exports.markConversationRead = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    if (!conversation.participants.some((participant) => safeId(participant) === safeId(req.user.id))) {
      return res.status(403).json({ success: false, message: 'You are not allowed to access this conversation' });
    }

    const result = await Message.updateMany(
      {
        conversationId,
        receiverId: req.user.id,
        read: false,
      },
      {
        $set: {
          read: true,
          readAt: new Date(),
        },
      }
    );

    res.status(200).json({ success: true, data: { updatedCount: result.modifiedCount || 0 } });
  } catch (error) {
    next(error);
  }
};

exports.getConversationByParticipants = async (userId, otherUserId) => {
  const participantList = normalizeParticipants([userId, otherUserId]);
  const conversation = await Conversation.findOne({
    participants: { $all: participantList, $size: 2 },
  });

  return conversation;
};

exports.ensureConversationExists = async (userId, otherUserId) => {
  const participantList = normalizeParticipants([userId, otherUserId]);
  let conversation = await Conversation.findOne({
    participants: { $all: participantList, $size: 2 },
  });

  if (!conversation) {
    conversation = await Conversation.create({ participants: participantList });
  }

  return conversation;
};
