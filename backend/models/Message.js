const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      index: true,
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    content: {
      type: String,
      default: '',
      trim: true,
      maxlength: 2000,
    },
    text: {
      type: String,
      default: '',
      trim: true,
      maxlength: 2000,
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
    attachment: {
      name: String,
      url: String,
      fileType: String,
    },
    voiceNoteUrl: {
      type: String,
      default: '',
    },
    emojiReaction: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });
messageSchema.index({ receiverId: 1, read: 1, createdAt: -1 });

messageSchema.pre('save', function (next) {
  if (!this.sender && this.senderId) this.sender = this.senderId;
  if (!this.recipient && this.receiverId) this.recipient = this.receiverId;
  if (!this.content && this.text) this.content = this.text;
  if (!this.text && this.content) this.text = this.content;
  if (this.read !== undefined && this.isRead === undefined) this.isRead = this.read;
  if (this.isRead !== undefined && this.read === undefined) this.read = this.isRead;
  next();
});

module.exports = mongoose.model('Message', messageSchema);
