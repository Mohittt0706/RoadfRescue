import { BaseRepository } from './baseRepository.js';

/**
 * Notification Repository - Data access layer for notifications table.
 */
export class NotificationRepository extends BaseRepository {
  constructor(db) {
    super(db, 'notifications');
  }

  /** Find notifications by role and optionally by target ID */
  findByRole(role, targetId = null) {
    if (role === 'admin' || role === 'super_admin') {
      return this.findAll({ target_role: 'admin' }, { orderBy: 'created_at DESC' });
    }
    if (targetId) {
      return this.raw(
        `SELECT * FROM notifications WHERE target_id = ? OR target_role = 'all' ORDER BY created_at DESC`,
        [targetId]
      );
    }
    return this.findAll({}, { orderBy: 'created_at DESC' });
  }

  /** Get unread count for admin */
  getUnreadCount(role) {
    if (role === 'admin' || role === 'super_admin') {
      return this.rawOne(
        "SELECT COUNT(*) as count FROM notifications WHERE target_role = 'admin' AND read = 0"
      ).count;
    }
    return 0;
  }

  /** Mark all as read for a role */
  markAllRead(role, targetId = null) {
    if (role === 'admin' || role === 'super_admin') {
      this.db.prepare("UPDATE notifications SET read = 1 WHERE target_role = 'admin' AND read = 0").run();
    } else if (targetId) {
      this.db.prepare(
        "UPDATE notifications SET read = 1 WHERE (target_id = ? OR target_role = ?) AND read = 0"
      ).run(targetId, 'all');
    }
  }

  /** Mark single notification as read (with ownership check) */
  markRead(id, role, userId) {
    const notification = this.findById(id);
    if (!notification) return { success: false, error: 'not_found' };
    
    if (role !== 'admin' && role !== 'super_admin' 
        && notification.target_id !== userId 
        && notification.target_role !== 'all') {
      return { success: false, error: 'forbidden' };
    }
    
    this.db.prepare('UPDATE notifications SET read = 1 WHERE id = ?').run(id);
    return { success: true };
  }
}
