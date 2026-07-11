/**
 * Notification Logger Service
 *
 * Tracks every notification lifecycle: Queued -> Sent -> Delivered -> Failed -> Retrying
 * Records metadata: recipient, type, payload, timestamps, retry count
 *
 * Stores notification logs in the database (notification_logs table).
 */

import logger from '../middleware/logger.js';

/**
 * Notification statuses.
 */
export const NOTIFICATION_STATUS = {
  QUEUED: 'queued',
  SENT: 'sent',
  DELIVERED: 'delivered',
  FAILED: 'failed',
  RETRYING: 'retrying',
};

/**
 * Notification types.
 */
export const NOTIFICATION_TYPE = {
  PUSH: 'push',
  EMAIL: 'email',
  SMS: 'sms',
  IN_APP: 'in_app',
  SOCKET: 'socket',
};

export class NotificationLogger {
  constructor(db) {
    this.db = db;
  }

  /**
   * Create a new notification log entry.
   * @param {object} data - Notification data
   * @returns {object} Created log entry
   */
  create(data) {
    const id = data.id || `nl-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO notification_logs (id, recipient_id, notification_type, title, message, payload, status, retry_count, max_retries, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      data.recipientId || null,
      data.notificationType || NOTIFICATION_TYPE.IN_APP,
      data.title || null,
      data.message || null,
      data.payload ? JSON.stringify(data.payload) : null,
      data.status || NOTIFICATION_STATUS.QUEUED,
      data.retryCount || 0,
      data.maxRetries || 3,
      now,
      now
    );

    return this.findById(id);
  }

  /**
   * Find a notification log by ID.
   */
  findById(id) {
    return this.db.prepare('SELECT * FROM notification_logs WHERE id = ?').get(id);
  }

  /**
   * Update notification status.
   * @param {string} id - Notification ID
   * @param {string} status - New status
   * @param {object} extra - Additional fields to update
   * @returns {object} Updated entry
   */
  updateStatus(id, status, extra = {}) {
    const now = new Date().toISOString();
    const fields = ['status = ?', 'updated_at = ?'];
    const params = [status, now];

    if (extra.errorMessage !== undefined) {
      fields.push('error_message = ?');
      params.push(extra.errorMessage);
    }
    if (extra.retryCount !== undefined) {
      fields.push('retry_count = ?');
      params.push(extra.retryCount);
    }
    if (extra.deliveredAt !== undefined) {
      fields.push('delivered_at = ?');
      params.push(extra.deliveredAt);
    }
    if (extra.sentAt !== undefined) {
      fields.push('sent_at = ?');
      params.push(extra.sentAt);
    }

    params.push(id);

    this.db.prepare(`UPDATE notification_logs SET ${fields.join(', ')} WHERE id = ?`).run(...params);
    return this.findById(id);
  }

  /**
   * Mark a notification as sent.
   */
  markSent(id) {
    return this.updateStatus(id, NOTIFICATION_STATUS.SENT, {
      sentAt: new Date().toISOString(),
    });
  }

  /**
   * Mark a notification as delivered.
   */
  markDelivered(id) {
    return this.updateStatus(id, NOTIFICATION_STATUS.DELIVERED, {
      deliveredAt: new Date().toISOString(),
    });
  }

  /**
   * Mark a notification as failed.
   */
  markFailed(id, errorMessage) {
    return this.updateStatus(id, NOTIFICATION_STATUS.FAILED, {
      errorMessage,
    });
  }

  /**
   * Mark a notification as retrying.
   */
  markRetrying(id, retryCount) {
    return this.updateStatus(id, NOTIFICATION_STATUS.RETRYING, {
      retryCount,
    });
  }

  /**
   * Get all notifications for a recipient.
   */
  findByRecipient(recipientId, options = {}) {
    const { limit = 50, offset = 0 } = options;
    return this.db.prepare(
      'SELECT * FROM notification_logs WHERE recipient_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
    ).all(recipientId, limit, offset);
  }

  /**
   * Get failed notifications.
   */
  findFailed(limit = 100) {
    return this.db.prepare(
      'SELECT * FROM notification_logs WHERE status = ? ORDER BY created_at DESC LIMIT ?'
    ).all(NOTIFICATION_STATUS.FAILED, limit);
  }

  /**
   * Get notifications that need retrying (failed but under max retries).
   */
  findRetryable() {
    return this.db.prepare(
      'SELECT * FROM notification_logs WHERE status = ? AND retry_count < max_retries ORDER BY created_at ASC'
    ).all(NOTIFICATION_STATUS.FAILED);
  }

  /**
   * Get notification statistics.
   */
  getStats() {
    return this.db.prepare(`
      SELECT
        status,
        COUNT(*) as count
      FROM notification_logs
      GROUP BY status
    `).all();
  }

  /**
   * Get recent notifications.
   */
  findRecent(limit = 50) {
    return this.db.prepare(
      'SELECT * FROM notification_logs ORDER BY created_at DESC LIMIT ?'
    ).all(limit);
  }

  /**
   * Delete old notification logs (cleanup).
   * @param {number} daysOld - Delete entries older than N days
   * @returns {object} Deletion result
   */
  cleanup(daysOld = 30) {
    const result = this.db.prepare(
      "DELETE FROM notification_logs WHERE created_at < datetime('now', ?)"
    ).run(`-${daysOld} days`);

    logger.info(`[NotificationLogger] Cleaned up ${result.changes} old entries`);
    return { deletedCount: result.changes };
  }
}

export default NotificationLogger;
