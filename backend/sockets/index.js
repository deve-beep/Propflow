const { Server } = require('socket.io');
const { verifyAccessToken } = require('../utils/jwt');
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

// Tracks which socket IDs belong to which user, so we know who's online
// and can push notification events to every tab/device a user has open.
const onlineUsers = new Map(); // userId -> Set<socketId>

const initSockets = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  // Auth middleware for socket handshake — same JWT used for REST calls.
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication required'));

      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.id);
      if (!user || !user.isActive) return next(new Error('Invalid session'));

      socket.userId = user._id.toString();
      socket.userRole = user.role;
      next();
    } catch (err) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    const { userId } = socket;

    // Track presence
    if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
    onlineUsers.get(userId).add(socket.id);

    // Join a personal room so notificationService can target this user directly
    socket.join(`user:${userId}`);

    // Broadcast this user's online status to anyone who cares (their conversation partners)
    socket.broadcast.emit('presence:online', { userId });

    // ── Chat: join a conversation room ──
    socket.on('conversation:join', async (conversationId) => {
      const convo = await Conversation.findOne({ _id: conversationId, participants: userId });
      if (!convo) return; // silently ignore — not a participant
      socket.join(`conversation:${conversationId}`);
    });

    socket.on('conversation:leave', (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
    });

    // ── Chat: send message ──
    socket.on('message:send', async ({ conversationId, text, attachments }, ack) => {
      try {
        const convo = await Conversation.findOne({ _id: conversationId, participants: userId });
        if (!convo) return ack?.({ error: 'Conversation not found or access denied.' });

        const message = await Message.create({
          conversation: conversationId,
          sender: userId,
          text,
          attachments: attachments || [],
          readBy: [userId],
        });

        convo.lastMessage = { text: text || '[Attachment]', sender: userId, sentAt: new Date() };
        const otherParticipants = convo.participants.filter((p) => p.toString() !== userId);
        otherParticipants.forEach((p) => {
          const key = p.toString();
          const current = convo.unreadCount.get(key) || 0;
          convo.unreadCount.set(key, current + 1);
        });
        await convo.save();

        const populated = await message.populate('sender', 'name avatar');

        io.to(`conversation:${conversationId}`).emit('message:new', populated);
        otherParticipants.forEach((p) => {
          io.to(`user:${p.toString()}`).emit('conversation:updated', {
            conversationId,
            lastMessage: convo.lastMessage,
          });
        });

        ack?.({ success: true, message: populated });
      } catch (err) {
        ack?.({ error: 'Failed to send message.' });
      }
    });

    // ── Chat: typing indicator ──
    socket.on('typing:start', ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit('typing:start', { conversationId, userId });
    });
    socket.on('typing:stop', ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit('typing:stop', { conversationId, userId });
    });

    // ── Chat: mark read ──
    socket.on('message:read', async ({ conversationId }) => {
      await Message.updateMany(
        { conversation: conversationId, readBy: { $ne: userId } },
        { $addToSet: { readBy: userId } }
      );
      const convo = await Conversation.findById(conversationId);
      if (convo) {
        convo.unreadCount.set(userId, 0);
        await convo.save();
      }
      socket.to(`conversation:${conversationId}`).emit('message:read', { conversationId, userId });
    });

    socket.on('disconnect', () => {
      const sockets = onlineUsers.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          onlineUsers.delete(userId);
          socket.broadcast.emit('presence:offline', { userId });
        }
      }
    });
  });

  return io;
};

const isUserOnline = (userId) => onlineUsers.has(userId.toString());

module.exports = { initSockets, isUserOnline };
