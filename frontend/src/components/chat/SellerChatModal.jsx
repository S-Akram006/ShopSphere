import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { chatAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  MessageSquare,
  X,
  Send,
  Store,
  ShieldCheck,
  Check,
  CheckCheck,
  Sparkles,
  ShoppingBag,
  ExternalLink,
  Minimize2,
} from 'lucide-react';

export default function SellerChatModal({ product, isOpen, onClose }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Compute consistent conversationId: productId_buyerId_vendorId
  const storeId = product?.storeId?._id || product?.storeId || 'store_official';
  const storeName = product?.storeId?.storeName || 'Official Merchant';
  const buyerId = user?._id || 'guest_buyer';
  const vendorSellerId = product?.storeId?.sellerId || storeId || 'vendor_rep';
  const conversationId = `${product?._id || 'prod_general'}_${buyerId}_${storeId}`;

  // Auto-scroll to bottom of message list
  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  useEffect(() => {
    scrollToBottom(false);
  }, [messages, isOpen]);

  // Connect to Socket.io and fetch message history
  useEffect(() => {
    if (!isOpen || !conversationId) return;

    let socketInstance = null;
    try {
      const socketUrl =
        import.meta.env.VITE_SOCKET_URL ||
        (typeof window !== 'undefined' &&
        window.location.hostname !== 'localhost' &&
        window.location.hostname !== '127.0.0.1'
          ? window.location.origin
          : 'http://localhost:5000');

      socketInstance = io(socketUrl, {
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      socketInstance.on('connect', () => {
        socketInstance.emit('join_conversation', {
          conversationId,
          userId: user?._id,
        });
      });

      socketInstance.on('receive_message', (msg) => {
        if (msg.conversationId === conversationId) {
          setMessages((prev) => {
            // Prevent duplicate message entries
            if (prev.some((m) => m._id === msg._id)) return prev;
            return [...prev, msg];
          });
        }
      });

      socketInstance.on('user_typing', (data) => {
        if (data.conversationId === conversationId) {
          setIsTyping(true);
        }
      });

      socketInstance.on('user_stop_typing', (data) => {
        if (data.conversationId === conversationId) {
          setIsTyping(false);
        }
      });

      socketInstance.on('messages_read', (data) => {
        if (data.conversationId === conversationId) {
          setMessages((prev) => prev.map((m) => ({ ...m, readStatus: true })));
        }
      });

      setSocket(socketInstance);
    } catch (err) {
      console.warn('[SellerChat] Socket initialization fallback:', err.message);
    }

    // Fetch conversation message history via REST API
    const loadMessages = async () => {
      setLoading(true);
      try {
        if (user) {
          const res = await chatAPI.getMessages(conversationId);
          if (res.data?.data) {
            setMessages(res.data.data);
            return;
          }
        }
        // Initial simulated welcome message if empty
        setMessages([
          {
            _id: 'welcome-initial',
            senderId: { name: storeName, role: 'Seller' },
            message: `Hello! Thanks for your interest in "${product?.title}". How can we help you today with sizing, specifications, or fulfillment?`,
            timestamp: new Date().toISOString(),
            readStatus: true,
          },
        ]);
      } catch (err) {
        setMessages([
          {
            _id: 'welcome-initial',
            senderId: { name: storeName, role: 'Seller' },
            message: `Hello! Welcome to ${storeName}. Feel free to ask any questions regarding "${product?.title}".`,
            timestamp: new Date().toISOString(),
            readStatus: true,
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();

    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [isOpen, conversationId, user]);

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    const text = newMessage.trim();
    if (!text) return;

    const tempId = 'temp-' + Date.now();
    const optimisticMsg = {
      _id: tempId,
      conversationId,
      senderId: user ? { _id: user._id, name: user.name || 'You', role: user.role } : { name: 'You (Guest)' },
      receiverId: vendorSellerId,
      productId: product?._id,
      message: text,
      timestamp: new Date().toISOString(),
      readStatus: false,
    };

    // Optimistic UI update
    setMessages((prev) => [...prev, optimisticMsg]);
    setNewMessage('');

    // Emit via socket if connected
    if (socket && socket.connected) {
      socket.emit('send_message', {
        conversationId,
        senderId: user?._id || 'guest_user',
        receiverId: vendorSellerId,
        productId: product?._id,
        message: text,
      });
      socket.emit('stop_typing', { conversationId });
    }

    // Persist via REST API if logged in
    if (user) {
      try {
        await chatAPI.sendMessage({
          conversationId,
          receiverId: vendorSellerId,
          productId: product?._id,
          message: text,
        });
      } catch (err) {
        console.warn('[SellerChat] REST send fallback:', err.message);
      }
    } else {
      // Automatic vendor simulated reply for guest users
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            _id: 'vendor-auto-' + Date.now(),
            conversationId,
            senderId: { name: storeName, role: 'Seller' },
            receiverId: buyerId,
            productId: product?._id,
            message: `Thank you for your message! Our fulfillment team for "${product?.title}" usually responds within a few minutes. We have active stock ready for dispatch!`,
            timestamp: new Date().toISOString(),
            readStatus: true,
          },
        ]);
      }, 1500);
    }
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    if (socket && socket.connected) {
      socket.emit('typing', { conversationId, userName: user?.name || 'Customer' });
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('stop_typing', { conversationId });
      }, 1500);
    }
  };

  const quickPrompts = [
    'Is this in stock and ready to ship?',
    'What is the estimated delivery time?',
    'Does this come with full warranty?',
  ];

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-label="Chat with Seller"
      className="fixed inset-0 sm:inset-auto sm:bottom-6 sm:right-6 sm:w-[420px] sm:h-[620px] z-50 flex flex-col bg-white sm:rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-4 text-white flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={
                product?.storeId?.logo ||
                'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=100&q=80'
              }
              alt={storeName}
              className="w-10 h-10 rounded-xl object-cover border border-white/20"
            />
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-bold truncate max-w-[200px]">{storeName}</h3>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-[11px] text-emerald-300 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Online • Verified Merchant
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          aria-label="Close chat"
          className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Product Reference Context Strip */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between text-xs gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <img
            src={product?.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=100&q=80'}
            alt={product?.title}
            className="w-8 h-8 rounded-lg object-cover border border-slate-200 flex-shrink-0"
          />
          <div className="min-w-0">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">
              Inquiry About
            </span>
            <span className="font-bold text-slate-900 truncate block text-[11px]">
              {product?.title}
            </span>
          </div>
        </div>
        <span className="text-xs font-black text-indigo-600 font-outfit flex-shrink-0">
          ${product?.price?.toFixed(2)}
        </span>
      </div>

      {/* Message History Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50 text-xs">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600" />
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe =
              msg.senderId?._id === user?._id ||
              msg.senderId?.name === 'You' ||
              msg.senderId?.name === 'You (Guest)';

            return (
              <div
                key={msg._id || index}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}
              >
                {!isMe && (
                  <span className="text-[10px] font-bold text-slate-500 ml-1">
                    {msg.senderId?.name || storeName}
                  </span>
                )}
                <div
                  className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl shadow-xs leading-relaxed ${
                    isMe
                      ? 'bg-indigo-600 text-white rounded-br-xs font-medium'
                      : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-400 px-1">
                  <span>
                    {new Date(msg.timestamp || Date.now()).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  {isMe && (
                    <span>
                      {msg.readStatus ? (
                        <CheckCheck className="w-3.5 h-3.5 text-indigo-500 inline" />
                      ) : (
                        <Check className="w-3.5 h-3.5 text-slate-400 inline" />
                      )}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}

        {isTyping && (
          <div className="flex items-center gap-1.5 text-slate-400 text-[11px] italic">
            <span className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" />
            <span className="w-2 h-2 rounded-full bg-slate-300 animate-bounce delay-100" />
            <span className="w-2 h-2 rounded-full bg-slate-300 animate-bounce delay-200" />
            <span>{storeName} is typing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts */}
      <div className="px-3 pt-2 pb-1 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto text-[11px]">
        {quickPrompts.map((prompt, i) => (
          <button
            key={i}
            onClick={() => setNewMessage(prompt)}
            className="whitespace-nowrap px-2.5 py-1 rounded-full bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 font-medium transition-colors text-[10px]"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Composer */}
      <form
        onSubmit={handleSendMessage}
        className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
      >
        <input
          type="text"
          value={newMessage}
          onChange={handleInputChange}
          placeholder={`Message ${storeName}...`}
          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
        />
        <button
          type="submit"
          disabled={!newMessage.trim()}
          className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:cursor-not-allowed text-white transition-all shadow-xs"
          title="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
