import { v4 as uuidv4 } from 'uuid';

/**
 * Insert an audit log entry.
 * @param {Object} db - Database instance.
 * @param {Object} params - Audit log parameters.
 * @param {string} params.adminId - ID of the admin performing the action.
 * @param {string} params.action - Action type (CREATE, UPDATE, DELETE, STATUS_CHANGE).
 * @param {string} params.entity - Entity type (user, mechanic, service, emergency_type, booking, emergency).
 * @param {string} [params.entityId] - ID of the affected entity.
 * @param {string} [params.description] - Human-readable description.
 * @param {string} [params.ipAddress] - Client IP address.
 */
export function insertAuditLog(db, { adminId, action, entity, entityId, description, ipAddress }) {
  try {
    const id = `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    db.prepare(`
      INSERT INTO audit_logs (id, admin_id, action, entity, entity_id, description, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, adminId, action, entity, entityId || null, description || null, ipAddress || null);
  } catch (err) {
    console.error('Audit log insertion failed:', err.message);
  }
}

/**
 * Get client IP address from request.
 * @param {Object} req - Express request object.
 * @returns {string} IP address.
 */
export function getClientIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || req.connection?.remoteAddress || 'unknown';
}
