const mongoose = require('mongoose');
const Message = require('../models/Message');
const Product = require('../models/Product');
const Store = require('../models/Store');
const User = require('../models/User');
const { getIO } = require('../services/socketService');

// @desc    Get message history for a conversation
// @route   GET /api/chat/messages/:conversationId
// @access  Private (Authenticated User)
exports.getConversationMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;

    if (!conversationId) {
      return res.status(400).json({ success: false, message: 'Conversation ID is required.' });
    }

    // Auto mark incoming messages as read for current user
    await Message.updateMany(
      { conversationId, receiverId: req.user._id, readStatus: false },
      { $set: { readStatus: true } }
    );

    const messages = await Message.find({ conversationId })
      .sort({ timestamp: 1 })
      .populate('senderId', 'name email role')
      .populate('receiverId', 'name email role')
      .populate('productId', 'title images price');

    res.json({
      success: true,
      data: messages,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send a message via HTTP REST (with real-time socket broadcast)
// @route   POST /api/chat/messages
// @access  Private (Authenticated User)
exports.sendMessage = async (req, res, next) => {
  try {
    const { conversationId, receiverId, productId, message } = req.body;

    if (!conversationId || !receiverId || !message) {
      return res.status(400).json({
        success: false,
        message: 'conversationId, receiverId, and message are required.',
      });
    }

    const trimmedMsg = message.trim();
    if (!trimmedMsg) {
      return res.status(400).json({
        success: false,
        message: 'Message cannot be empty.',
      });
    }

    let safeReceiverId = receiverId;
    if (!mongoose.Types.ObjectId.isValid(receiverId)) {
      const store = await Store.findOne();
      safeReceiverId = store?.sellerId || req.user._id;
    }

    let safeProductId = productId;
    if (productId && !mongoose.Types.ObjectId.isValid(productId)) {
      const prod = await Product.findOne();
      safeProductId = prod?._id || null;
    }

    const newMsg = await Message.create({
      conversationId,
      senderId: req.user._id,
      receiverId: safeReceiverId,
      productId: safeProductId,
      message: trimmedMsg,
      timestamp: new Date(),
      readStatus: false,
    });

    const populated = await Message.findById(newMsg._id)
      .populate('senderId', 'name email role')
      .populate('receiverId', 'name email role')
      .populate('productId', 'title images price');

    // Broadcast through socket if active
    const io = getIO();
    if (io) {
      io.to(conversationId).emit('receive_message', populated);
      io.to(`user_${receiverId}`).emit('unread_notification', {
        conversationId,
        message: populated,
      });
    }

    res.status(201).json({
      success: true,
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get conversation list for logged-in user / vendor
// @route   GET /api/chat/conversations
// @access  Private (Authenticated User)
exports.getUserConversations = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Find all distinct conversation IDs where user is sender or receiver
    const distinctConversations = await Message.distinct('conversationId', {
      $or: [{ senderId: userId }, { receiverId: userId }],
    });

    const conversationList = [];

    for (const convId of distinctConversations) {
      const lastMessage = await Message.findOne({ conversationId: convId })
        .sort({ timestamp: -1 })
        .populate('senderId', 'name email role')
        .populate('receiverId', 'name email role')
        .populate('productId', 'title images price');

      if (!lastMessage) continue;

      const unreadCount = await Message.countDocuments({
        conversationId: convId,
        receiverId: userId,
        readStatus: false,
      });

      const counterParty =
        lastMessage.senderId?._id?.toString() === userId.toString()
          ? lastMessage.receiverId
          : lastMessage.senderId;

      conversationList.push({
        conversationId: convId,
        lastMessage: lastMessage.message,
        timestamp: lastMessage.timestamp,
        unreadCount,
        product: lastMessage.productId,
        counterParty,
      });
    }

    // Sort by most recent activity
    conversationList.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({
      success: true,
      data: conversationList,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark conversation messages as read
// @route   PUT /api/chat/read/:conversationId
// @access  Private (Authenticated User)
exports.markConversationRead = async (req, res, next) => {
  try {
    const { conversationId } = req.params;

    const result = await Message.updateMany(
      { conversationId, receiverId: req.user._id, readStatus: false },
      { $set: { readStatus: true } }
    );

    const io = getIO();
    if (io) {
      io.to(conversationId).emit('messages_read', {
        conversationId,
        readBy: req.user._id,
      });
    }

    res.json({
      success: true,
      message: 'Messages marked as read.',
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    next(error);
  }
};
