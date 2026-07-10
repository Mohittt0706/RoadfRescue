import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { verifyToken } from '../authentication/middleware.js';

const router = Router();

// GET /api/notifications - Get notifications (Protected & Filtered)
router.get('/', verifyToken, (req, res) => {
  const { db } = req;
  const { id: tokenUserId, role } = req.user;

  try {
    let query = 'SELECT * FROM notifications WHERE 1=1';
    const params = [];

    if (role === 'admin' || role === 'super_admin') {
      query += ' AND target_role = ?';
      params.push('admin');
    } else {
      // User or mechanic can only see notifications targeted to them or 'all'
      query += ' AND (target_id = ? OR target_role = ?)';
      params.push(tokenUserId, 'all');
    }

    query += ' ORDER BY created_at DESC';
    const notifications = db.prepare(query).all(...params);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve notifications.', error: err.message });
  }
});

// POST /api/notifications - Create notification (Protected)
router.post('/', verifyToken, (req, res) => {
  const { db, io } = req;
  const { type, title, message, bookingId, targetRole, targetId } = req.body;

  const id = uuidv4();
  try {
    db.prepare(`
      INSERT INTO notifications (id, type, title, message, booking_id, target_role, target_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, type, title, message, bookingId || null, targetRole || 'admin', targetId || null);

    const notification = db.prepare('SELECT * FROM notifications WHERE id = ?').get(id);

    if (targetRole === 'admin') {
      io.to('admin_room').emit('new_notification', notification);
    }
    if (targetId) {
      io.to(`user_${targetId}`).emit('new_notification', notification);
    }

    res.status(201).json({ success: true, notification });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create notification.', error: err.message });
  }
});

// PUT /api/notifications/read-all - Mark all notifications as read (Protected)
router.put('/read-all', verifyToken, (req, res) => {
  const { db } = req;
  const { id: tokenUserId, role } = req.user;

  try {
    if (role === 'admin' || role === 'super_admin') {
      db.prepare("UPDATE notifications SET read = 1 WHERE target_role = 'admin' AND read = 0").run();
    } else {
      db.prepare("UPDATE notifications SET read = 1 WHERE (target_id = ? OR target_role = ?) AND read = 0").run(tokenUserId, 'all');
    }
    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to mark notifications as read.', error: err.message });
  }
});

// PUT /api/notifications/:id/read - Mark specific notification as read (Protected)
router.put('/:id/read', verifyToken, (req, res) => {
  const { db } = req;
  const { id: tokenUserId, role } = req.user;
  const notiId = req.params.id;

  try {
    const notification = db.prepare('SELECT * FROM notifications WHERE id = ?').get(notiId);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found.', error: 'Not Found' });
    }

    // Verify ownership
    if (role !== 'admin' && role !== 'super_admin' && notification.target_id !== tokenUserId && notification.target_role !== 'all') {
      return res.status(403).json({ success: false, message: 'Access denied.', error: 'Forbidden' });
    }

    db.prepare('UPDATE notifications SET read = 1 WHERE id = ?').run(notiId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to mark notification as read.', error: err.message });
  }
});

export default router;
