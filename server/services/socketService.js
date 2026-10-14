const { Server } = require('socket.io');
const mongoose = require('mongoose');
const Message = require('../models/Message');
const Store = require('../models/Store');
const Product = require('../models/Product');

let io = null;

const initSocket = (httpServer, allowedOrigins = []) => {
  if (io) return io;

  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        // Allow server-to-server, curl, local dev and deployed frontend
        if (!origin) return callback(null, true);
        if (
          allowedOrigins.includes(origin) ||
          origin.endsWith('.vercel.app') ||
          origin.includes('localhost') ||
          origin.includes('127.0.0.1')
        ) {
          return callback(null, true);
        }
        return callback(null, true);
      },
      methods: ['GET', 'POST', 'PUT'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket) => {
    // Join a specific buyer-seller product conversation room
    socket.on('join_conversation', ({ conversationId, userId }) => {
      if (conversationId) {
        socket.join(conversationId);
      }
      if (userId) {
        socket.join(`user_${userId}`);
      }
    });

    // Real-time message exchange
    socket.on('send_message', async (data) => {
      try {
        const { conversationId, senderId, receiverId, productId, message } = data;
        if (!conversationId || !senderId || !receiverId || !message) {
          return socket.emit('error', { message: 'Incomplete message parameters.' });
        }

        let safeReceiverId = receiverId;
        if (!mongoose.Types.ObjectId.isValid(receiverId)) {
          const store = await Store.findOne();
          safeReceiverId = store?.sellerId || (mongoose.Types.ObjectId.isValid(senderId) ? senderId : new mongoose.Types.ObjectId());
        }

        let safeProductId = productId;
        if (productId && !mongoose.Types.ObjectId.isValid(productId)) {
          const prod = await Product.findOne();
          safeProductId = prod?._id || null;
        }

        const newMsg = await Message.create({
          conversationId,
          senderId,
          receiverId: safeReceiverId,
          productId: safeProductId,
          message: message.trim(),
          timestamp: new Date(),
          readStatus: false,
        });

        const populated = await Message.findById(newMsg._id)
          .populate('senderId', 'name email role')
          .populate('receiverId', 'name email role')
          .populate('productId', 'title images price');

        // Broadcast to the conversation room
        io.to(conversationId).emit('receive_message', populated);

        // Notify receiver's private channel
        io.to(`user_${receiverId}`).emit('unread_notification', {
          conversationId,
          message: populated,
        });
      } catch (err) {
        socket.emit('error', { message: 'Failed to process message: ' + err.message });
      }
    });

    // Typing indicators
    socket.on('typing', ({ conversationId, userName }) => {
      if (conversationId) {
        socket.to(conversationId).emit('user_typing', { conversationId, userName });
      }
    });

    socket.on('stop_typing', ({ conversationId }) => {
      if (conversationId) {
        socket.to(conversationId).emit('user_stop_typing', { conversationId });
      }
    });

    // Mark messages as read in real-time
    socket.on('mark_read', async ({ conversationId, userId }) => {
      try {
        if (conversationId && userId) {
          await Message.updateMany(
            { conversationId, receiverId: userId, readStatus: false },
            { $set: { readStatus: true } }
          );
          io.to(conversationId).emit('messages_read', { conversationId, readBy: userId });
        }
      } catch (err) {
        console.warn('[Socket] Error marking read:', err.message);
      }
    });

    socket.on('disconnect', () => {
      // Disconnect cleanly
    });
  });

  console.log('[Socket.io] Real-time messaging service initialized.');
  return io;
};

const getIO = () => io;

module.exports = {
  initSocket,
  getIO,
};
