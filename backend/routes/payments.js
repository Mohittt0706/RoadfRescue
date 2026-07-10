import { Router } from 'express';
import { verifyToken, verifyAdmin } from '../authentication/middleware.js';

const router = Router();

// POST /api/payments - Create payment (Protected & Verified)
router.post('/', verifyToken, (req, res) => {
  const { db, io } = req;
  const { bookingId, amount, method, transactionId } = req.body;
  const { id: tokenUserId, role } = req.user;

  try {
    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.', error: 'Not Found' });

    // Ensure the paying user owns the booking or is admin
    if (role === 'user' && booking.user_id !== tokenUserId) {
      return res.status(403).json({ success: false, message: 'Access denied. You do not own this booking.', error: 'Forbidden' });
    }

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
  } catch (err) {
    res.status(500).json({ success: false, message: 'Payment recording failed.', error: err.message });
  }
});

// GET /api/payments/booking/:bookingId - Get payment details for booking (Protected & Verified)
router.get('/booking/:bookingId', verifyToken, (req, res) => {
  const { db } = req;
  const { id: tokenUserId, role } = req.user;
  const { bookingId } = req.params;

  try {
    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.', error: 'Not Found' });

    // Authorization: owner or admin
    if (role === 'user' && booking.user_id !== tokenUserId) {
      return res.status(403).json({ success: false, message: 'Access denied. You do not own this booking.', error: 'Forbidden' });
    }

    const payments = db.prepare('SELECT * FROM payments WHERE booking_id = ? ORDER BY created_at DESC').all(bookingId);
    res.json(payments);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve payments.', error: err.message });
  }
});

// GET /api/payments/stats - Payment stats dashboard (Admin Only)
router.get('/stats', verifyAdmin, (req, res) => {
  const { db } = req;
  try {
    const today = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE DATE(created_at) = DATE('now') AND status = 'Completed'").get().total;
    const month = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now') AND status = 'Completed'").get().total;
    const total = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'Completed'").get().total;

    const methodBreakdown = db.prepare(`
      SELECT method, COUNT(*) as count, SUM(amount) as total
      FROM payments WHERE status = 'Completed'
      GROUP BY method
    `).all();

    res.json({ today, month, total, methodBreakdown });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch payment statistics.', error: err.message });
  }
});

export default router;
