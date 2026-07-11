import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { verifyToken, verifyAdmin } from '../authentication/middleware.js';
import { notificationService } from './notificationService.js';
import { insertAuditLog, getClientIP } from '../utils/auditLogger.js';

const router = Router();

// ==========================================
// 1. Retrieve Notifications
// ==========================================

// GET /api/notifications - User's notification inbox list (Paginated, Searchable, Filterable)
router.get('/notifications', verifyToken, (req, res) => {
  const { db } = req;
  const { id: userId, role } = req.user;
  const { limit = 10, offset = 0, status, priority, type, search } = req.query;

  try {
    let query = 'SELECT * FROM workflow_notifications WHERE (recipient_id = ? OR recipient_id = "all")';
    const params = [userId];

    if (role === 'admin' || role === 'super_admin') {
      // Admins see all notifications
      query = 'SELECT * FROM workflow_notifications WHERE 1=1';
      params.pop();
    }

    if (status === 'unread') {
      query += ' AND is_read = 0';
    } else if (status === 'read') {
      query += ' AND is_read = 1';
    }

    if (priority) {
      query += ' AND priority = ?';
      params.push(priority);
    }

    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }

    if (search) {
      query += ' AND (title LIKE ? OR message LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const notifications = db.prepare(query).all(...params);
    res.json({ success: true, notifications });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve notifications.', error: err.message });
  }
});

// GET /api/notifications/unread - Get only unread notifications
router.get('/notifications/unread', verifyToken, (req, res) => {
  const { db } = req;
  const { id: userId, role } = req.user;

  try {
    let query = 'SELECT * FROM workflow_notifications WHERE (recipient_id = ? OR recipient_id = "all") AND is_read = 0';
    const params = [userId];

    if (role === 'admin' || role === 'super_admin') {
      query = 'SELECT * FROM workflow_notifications WHERE is_read = 0';
      params.pop();
    }

    query += ' ORDER BY created_at DESC';
    const unread = db.prepare(query).all(...params);
    res.json({ success: true, unread });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch unread list.', error: err.message });
  }
});

// GET /api/notifications/count - Get unread count
router.get('/notifications/count', verifyToken, (req, res) => {
  const { db } = req;
  const { id: userId, role } = req.user;

  try {
    let query = 'SELECT COUNT(*) as count FROM workflow_notifications WHERE (recipient_id = ? OR recipient_id = "all") AND is_read = 0';
    const params = [userId];

    if (role === 'admin' || role === 'super_admin') {
      query = 'SELECT COUNT(*) as count FROM workflow_notifications WHERE is_read = 0';
      params.pop();
    }

    const count = db.prepare(query).get(...params).count;
    res.json({ success: true, unread: count });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch unread count.', error: err.message });
  }
});

// GET /api/notifications/:id - Details of a single notification
router.get('/notifications/:id', verifyToken, (req, res) => {
  const { db } = req;
  const { id: userId, role } = req.user;
  const notiId = req.params.id;

  try {
    const notification = db.prepare('SELECT * FROM workflow_notifications WHERE id = ?').get(notiId);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }

    // Verify ownership: only targeted user or admins can retrieve
    if (role !== 'admin' && role !== 'super_admin' && notification.recipient_id !== userId && notification.recipient_id !== 'all') {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.json({ success: true, notification });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch notification.', error: err.message });
  }
});

// ==========================================
// 2. Read and Status Transitions
// ==========================================

// PUT /api/notifications/:id/read - Mark single alert as read
router.put('/notifications/:id/read', verifyToken, (req, res) => {
  const { db, io } = req;
  const { id: userId, role } = req.user;
  const notiId = req.params.id;

  try {
    const notification = db.prepare('SELECT * FROM workflow_notifications WHERE id = ?').get(notiId);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }

    if (role !== 'admin' && role !== 'super_admin' && notification.recipient_id !== userId && notification.recipient_id !== 'all') {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    db.prepare("UPDATE workflow_notifications SET is_read = 1, read_at = CURRENT_TIMESTAMP WHERE id = ?").run(notiId);

    // Emit Socket read confirmations
    if (io) {
      const socketPayload = { id: notiId, isRead: 1, readAt: new Date().toISOString() };
      if (notification.recipient_id === 'all') {
        io.emit('notificationRead', socketPayload);
      } else {
        io.to(`user_${notification.recipient_id}`).emit('notificationRead', socketPayload);
      }
    }

    res.json({ success: true, message: 'Notification marked as read.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update status.', error: err.message });
  }
});

// PUT /api/notifications/read-all - Mark all unread alerts as read
router.put('/notifications/read-all', verifyToken, (req, res) => {
  const { db, io } = req;
  const { id: userId, role } = req.user;

  try {
    if (role === 'admin' || role === 'super_admin') {
      db.prepare("UPDATE workflow_notifications SET is_read = 1, read_at = CURRENT_TIMESTAMP WHERE is_read = 0").run();
      if (io) io.to('admin_room').emit('notificationRead', { all: true });
    } else {
      db.prepare(`
        UPDATE workflow_notifications 
        SET is_read = 1, read_at = CURRENT_TIMESTAMP 
        WHERE (recipient_id = ? OR recipient_id = "all") AND is_read = 0
      `).run(userId);
      if (io) io.to(`user_${userId}`).emit('notificationRead', { all: true, userId });
    }

    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update unreads.', error: err.message });
  }
});

// ==========================================
// 3. Deleting & Clearing
// ==========================================

// DELETE /api/notifications/:id - Remove single alert
router.delete('/notifications/:id', verifyToken, (req, res) => {
  const { db, io } = req;
  const { id: userId, role } = req.user;
  const notiId = req.params.id;

  try {
    const notification = db.prepare('SELECT * FROM workflow_notifications WHERE id = ?').get(notiId);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }

    if (role !== 'admin' && role !== 'super_admin' && notification.recipient_id !== userId && notification.recipient_id !== 'all') {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    db.prepare('DELETE FROM workflow_notifications WHERE id = ?').run(notiId);

    if (io) {
      if (notification.recipient_id === 'all') {
        io.emit('notificationDeleted', { id: notiId });
      } else {
        io.to(`user_${notification.recipient_id}`).emit('notificationDeleted', { id: notiId });
      }
    }

    res.json({ success: true, message: 'Notification deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete notification.', error: err.message });
  }
});

// DELETE /api/notifications/clear - Clear user's entire alert history
router.delete('/notifications/clear', verifyToken, (req, res) => {
  const { db } = req;
  const { id: userId, role } = req.user;

  try {
    if (role === 'admin' || role === 'super_admin') {
      db.prepare('DELETE FROM workflow_notifications').run();
    } else {
      db.prepare('DELETE FROM workflow_notifications WHERE recipient_id = ?').run(userId);
    }
    res.json({ success: true, message: 'Notification inbox cleared successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to clear notifications.', error: err.message });
  }
});

// ==========================================
// 4. Notification Preferences Config
// ==========================================

// GET /api/notifications/preferences - Retrieve configurations
router.get('/notifications/preferences', verifyToken, (req, res) => {
  const { db } = req;
  const { id: userId } = req.user;

  try {
    const preferences = notificationService.ensurePreferences(db, userId);
    res.json({ success: true, preferences });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve preferences.', error: err.message });
  }
});

// PUT /api/notifications/preferences - Save configurations
router.put('/notifications/preferences', verifyToken, (req, res) => {
  const { db } = req;
  const { id: userId } = req.user;
  const {
    pushEnabled,
    emailEnabled,
    smsEnabled,
    bookingUpdates,
    emergencyUpdates,
    paymentUpdates,
    chatNotifications,
    marketingNotifications
  } = req.body;

  try {
    notificationService.ensurePreferences(db, userId);

    db.prepare(`
      UPDATE notification_preferences 
      SET push_enabled = COALESCE(?, push_enabled),
          email_enabled = COALESCE(?, email_enabled),
          sms_enabled = COALESCE(?, sms_enabled),
          booking_updates = COALESCE(?, booking_updates),
          emergency_updates = COALESCE(?, emergency_updates),
          payment_updates = COALESCE(?, payment_updates),
          chat_notifications = COALESCE(?, chat_notifications),
          marketing_notifications = COALESCE(?, marketing_notifications)
      WHERE user_id = ?
    `).run(
      pushEnabled !== undefined ? (pushEnabled ? 1 : 0) : null,
      emailEnabled !== undefined ? (emailEnabled ? 1 : 0) : null,
      smsEnabled !== undefined ? (smsEnabled ? 1 : 0) : null,
      bookingUpdates !== undefined ? (bookingUpdates ? 1 : 0) : null,
      emergencyUpdates !== undefined ? (emergencyUpdates ? 1 : 0) : null,
      paymentUpdates !== undefined ? (paymentUpdates ? 1 : 0) : null,
      chatNotifications !== undefined ? (chatNotifications ? 1 : 0) : null,
      marketingNotifications !== undefined ? (marketingNotifications ? 1 : 0) : null,
      userId
    );

    const updated = db.prepare('SELECT * FROM notification_preferences WHERE user_id = ?').get(userId);
    res.json({ success: true, message: 'Preferences updated successfully.', preferences: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update preferences.', error: err.message });
  }
});

// ==========================================
// 5. Device Token Registrations (FCM Push Ready)
// ==========================================

// POST /api/notifications/device-token - Register device tokens for client pushes
router.post('/notifications/device-token', verifyToken, (req, res) => {
  const { db } = req;
  const { id: userId } = req.user;
  const { deviceToken, platform } = req.body; // platform: 'ios', 'android', 'web'

  if (!deviceToken || !platform) {
    return res.status(400).json({ success: false, message: 'deviceToken and platform are required.' });
  }

  try {
    const tokenId = `TOK-${Date.now()}`;
    db.prepare(`
      INSERT INTO push_device_tokens (id, user_id, device_token, platform, last_active)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(device_token) DO UPDATE SET last_active = CURRENT_TIMESTAMP
    `).run(tokenId, userId, deviceToken, platform);

    res.status(201).json({ success: true, message: 'Device token registered successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to register token.', error: err.message });
  }
});

// ==========================================
// 6. Admin Broadcast Messages
// ==========================================

// POST /api/admin/notifications/broadcast - Send custom announcements (Admin Only)
router.post('/admin/notifications/broadcast', verifyAdmin, async (req, res) => {
  const { db, io } = req;
  const { targetGroup, targetCity, title, message, priority, type } = req.body;
  const { id: adminId } = req.user;

  if (!title || !message) {
    return res.status(400).json({ success: false, message: 'title and message are required.' });
  }

  try {
    const sentCount = await notificationService.broadcast(db, io, {
      targetGroup: targetGroup || 'all',
      targetCity: targetCity || null,
      title,
      message,
      type: type || 'system_announcement',
      priority: priority || 'Normal'
    });

    insertAuditLog(db, {
      adminId,
      action: 'CREATE',
      entity: 'notification_broadcast',
      entityId: `BC-${Date.now()}`,
      description: `Broadcasted "${title}" to ${sentCount} recipients in group: ${targetGroup}`,
      ipAddress: getClientIP(req)
    });

    res.json({ success: true, message: 'Broadcast dispatched successfully.', recipientsReached: sentCount });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Broadcast transmission failed.', error: err.message });
  }
});

// ==========================================
// 7. Admin Dashboard Analytics Summary
// ==========================================

// GET /api/admin/notifications/statistics - Metrics overview (Admin Only)
router.get('/admin/notifications/statistics', verifyAdmin, (req, res) => {
  const { db } = req;

  try {
    const total = db.prepare('SELECT COUNT(*) as count FROM workflow_notifications').get().count;
    const unread = db.prepare('SELECT COUNT(*) as count FROM workflow_notifications WHERE is_read = 0').get().count;
    const delivered = db.prepare('SELECT COUNT(*) as count FROM workflow_notifications WHERE is_delivered = 1').get().count;
    const critical = db.prepare("SELECT COUNT(*) as count FROM workflow_notifications WHERE priority = 'Critical'").get().count;

    const deliveryRate = total > 0 ? parseFloat(((delivered / total) * 100).toFixed(2)) : 100;
    const readRate = total > 0 ? parseFloat((((total - unread) / total) * 100).toFixed(2)) : 0;

    const broadcastCount = db.prepare("SELECT COUNT(*) as count FROM audit_logs WHERE entity = 'notification_broadcast'").get().count;

    res.json({
      success: true,
      statistics: {
        totalNotifications: total,
        unreadNotifications: unread,
        deliveryRatePercentage: deliveryRate,
        readRatePercentage: readRate,
        criticalAlertsCount: critical,
        broadcastDispatchesCount: broadcastCount
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to compile metrics.', error: err.message });
  }
});

export default router;
