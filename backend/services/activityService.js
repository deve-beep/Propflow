const Activity = require('../models/Activity');

/**
 * Fire-and-forget-ish activity logger. Awaited by callers that care about
 * ordering, but failures here should never break the primary operation, so
 * we swallow errors and just log them.
 */
const logActivity = async ({ company, actor, action, description, entityType, entityId, metadata }) => {
  try {
    await Activity.create({
      company,
      actor,
      action,
      description,
      relatedEntity: { entityType, entityId },
      metadata,
    });
  } catch (err) {
    console.error('[ActivityLog] Failed to record activity:', err.message);
  }
};

module.exports = { logActivity };
