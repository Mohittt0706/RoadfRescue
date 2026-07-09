import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.get('/', (req, res) => {
  const { db } = req;
  const { userId } = req.query;
  let query = 'SELECT * FROM notifications WHERE 1=1';
  const params = [];

  if (userId) {
    query += ' AND (target_id = ? OR target_role = ?)';
    params.push(userId, 'all');
  } else {
    query += ' AND target_role = ?';
    params.push('admin');
  }

  query += ' ORDER BY created_at DESC';
  const notifications = db.prepare(query).all(...params);
  res.json(notifications);
});

router.post('/', (req, res) => {
  const { db, io } = req;
  const { type, title, message, bookingId, targetRole, targetId } = req.body;

  const id = uuidv4();
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
});

router.put('/read-all', (req, res) => {
  const { db } = req;
  const { targetRole } = req.body;
  db.prepare('UPDATE notifications SET read = 1 WHERE target_role = ? AND read = 0').run(targetRole || 'admin');
  res.json({ success: true });
});

router.put('/:id/read', (req, res) => {
  const { db } = req;
  db.prepare('UPDATE notifications SET read = 1 WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

export default router;
