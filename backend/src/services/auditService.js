'use strict';

const { AuditLog } = require('../models');
const logger = require('../utils/logger');

/**
 * Record an audit entry. Audit writes must never break the main request flow,
 * so failures are logged but not rethrown when `critical` is false.
 */
async function record(
  { actorUserId = null, actorRole = null, action, entityType = null, entityId = null, metadata = null, req = null },
  { transaction = null, critical = false } = {}
) {
  try {
    const ipAddress = req
      ? (req.headers['x-forwarded-for']?.split(',')[0].trim() || req.ip || null)
      : null;
    const userAgent = req ? (req.headers['user-agent'] || null) : null;

    return await AuditLog.create(
      {
        actorUserId,
        actorRole,
        action,
        entityType,
        entityId,
        metadata,
        ipAddress,
        userAgent: userAgent ? String(userAgent).slice(0, 255) : null,
      },
      { transaction }
    );
  } catch (err) {
    logger.error('Failed to write audit log', { action, error: err.message });
    if (critical) throw err;
    return null;
  }
}

module.exports = { record };
