const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const { sendResponse } = require('../utils/ApiResponse');
const { getPagination, buildMeta } = require('../utils/pagination');

// ─────────────────────────────────────────────────────────────
// GET /api/messages/conversations  (list threads for the logged-in user)
// ─────────────────────────────────────────────────────────────
const listConversations = catchAsync(async (req, res) => {
  const conversations = await Conversation.find({ participants: req.user._id })
    .sort({ updatedAt: -1 })
    .populate('participants', 'name avatar role')
    .populate('property', 'title images')
    .lean();

  const withUnread = conversations.map((c) => ({
    ...c,
    unreadCount: c.unreadCount?.[req.user._id.toString()] || 0,
  }));

  sendResponse(res, 200, 'Conversations fetched successfully.', withUnread);
});

// ─────────────────────────────────────────────────────────────
// POST /api/messages/conversations  (start or fetch existing 1:1 conversation)
// ─────────────────────────────────────────────────────────────
const startConversation = catchAsync(async (req, res) => {
  const { recipientId, propertyId } = req.body;
  if (!recipientId) throw ApiError.badRequest('recipientId is required.');
  if (recipientId === req.user._id.toString()) throw ApiError.badRequest('Cannot start a conversation with yourself.');

  let conversation = await Conversation.findOne({
    participants: { $all: [req.user._id, recipientId], $size: 2 },
    ...(propertyId ? { property: propertyId } : {}),
  });

  if (!conversation) {
    conversation = await Conversation.create({
      company: req.user.company || req.body.company,
      participants: [req.user._id, recipientId],
      property: propertyId || null,
    });
  }

  const populated = await conversation.populate('participants', 'name avatar role');
  sendResponse(res, 200, 'Conversation ready.', populated);
});

// ─────────────────────────────────────────────────────────────
// GET /api/messages/conversations/:id  (message history, paginated)
// ─────────────────────────────────────────────────────────────
const getConversationMessages = catchAsync(async (req, res) => {
  const conversation = await Conversation.findOne({ _id: req.params.id, participants: req.user._id });
  if (!conversation) throw ApiError.notFound('Conversation not found.');

  const { page, limit, skip } = getPagination(req.query, 30);

  const [messages, total] = await Promise.all([
    Message.find({ conversation: conversation._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('sender', 'name avatar')
      .lean(),
    Message.countDocuments({ conversation: conversation._id }),
  ]);

  sendResponse(res, 200, 'Messages fetched successfully.', messages.reverse(), buildMeta(page, limit, total));
});

module.exports = { listConversations, startConversation, getConversationMessages };
