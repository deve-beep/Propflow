const Notification = require('../models/Notification');
const catchAsync = require('../utils/catchAsync');
const { sendResponse } = require('../utils/ApiResponse');
const { getPagination, buildMeta } = require('../utils/pagination');

const listNotifications = catchAsync(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query, 20);
  const filter = { recipient: req.user._id };
  if (req.query.unreadOnly === 'true') filter.isRead = false;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ recipient: req.user._id, isRead: false }),
  ]);

  sendResponse(res, 200, 'Notifications fetched successfully.', notifications, {
    ...buildMeta(page, limit, total),
    unreadCount,
  });
});

const markAsRead = catchAsync(async (req, res) => {
  await Notification.updateOne(
    { _id: req.params.id, recipient: req.user._id },
    { isRead: true, readAt: new Date() }
  );
  sendResponse(res, 200, 'Notification marked as read.');
});

const markAllAsRead = catchAsync(async (req, res) => {
  await Notification.updateMany(
    { recipient: req.user._id, isRead: false },
    { isRead: true, readAt: new Date() }
  );
  sendResponse(res, 200, 'All notifications marked as read.');
});

module.exports = { listNotifications, markAsRead, markAllAsRead };
