const Notification = require('../models/Notification');

/**
 * Creates a notification record and, if a Socket.IO instance is available
 * (attached to the Express app in server.js), pushes it in real time to the
 * recipient's room. Falls back gracefully to DB-only if sockets aren't wired
 * (e.g. during tests).
 */
const notify = async (io, { company, recipient, type, title, message, entityType, entityId }) => {
  const notification = await Notification.create({
    company: company || null,
    recipient,
    type,
    title,
    message,
    relatedEntity: entityType ? { entityType, entityId } : undefined,
  });

  if (io) {
    io.to(`user:${recipient.toString()}`).emit('notification:new', notification);
  }

  return notification;
};

module.exports = { notify };
