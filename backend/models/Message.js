const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: String,
      required: [true, 'Conversation ID is required'],
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, 'Sender ID is required'],
      index: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, 'Receiver ID is required'],
      index: true,
    },
    productId: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
      index: true,
    },
    message: {
      type: String,
      required: [true, 'Message text is required'],
      trim: true,
    },
    readStatus: {
      type: Boolean,
      default: false,
      index: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient message retrieval
messageSchema.index({ conversationId: 1, timestamp: 1 });
messageSchema.index({ receiverId: 1, readStatus: 1 });

module.exports = mongoose.model('Message', messageSchema);
