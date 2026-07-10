import { Router } from 'express';

const router = Router();

router.post('/', (req, res) => {
  const { db, io } = req;
  const { bookingId, amount, method, transactionId } = req.body;

  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });

  const paymentId = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

  db.prepare(`
    INSERT INTO payments (id, booking_id, amount, method, status, transaction_id)
    VALUES (?, ?, ?, ?, 'Completed', ?)
  `).run(paymentId, bookingId, amount, method, transactionId || paymentId);

  db.prepare("UPDATE bookings SET payment_status = 'Paid', payment_method = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
    .run(method, bookingId);

  const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(paymentId);
  io.to('admin_room').emit('payment_received', { payment, bookingId });

  res.status(201).json({ success: true, payment });
});

router.get('/booking/:bookingId', (req, res) => {
  const { db } = req;
  const payments = db.prepare('SELECT * FROM payments WHERE booking_id = ? ORDER BY created_at DESC').all(req.params.bookingId);
  res.json(payments);
});

router.get('/stats', (req, res) => {
  const { db } = req;
  const today = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE DATE(created_at) = DATE('now') AND status = 'Completed'").get().total;
  const month = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now') AND status = 'Completed'").get().total;
  const total = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'Completed'").get().total;

  const methodBreakdown = db.prepare(`
    SELECT method, COUNT(*) as count, SUM(amount) as total
    FROM payments WHERE status = 'Completed'
    GROUP BY method
  `).all();

  res.json({ today, month, total, methodBreakdown });
});

export default router;
