import { Router } from 'express';

const router = Router();

router.get('/dashboard', (req, res) => {
  const { db } = req;

  const totalBookings = db.prepare('SELECT COUNT(*) as count FROM bookings').get().count;
  const todayBookings = db.prepare("SELECT COUNT(*) as count FROM bookings WHERE DATE(booking_time) = DATE('now')").get().count;
  const pendingJobs = db.prepare("SELECT COUNT(*) as count FROM bookings WHERE status = 'Pending'").get().count;
  const completedJobs = db.prepare("SELECT COUNT(*) as count FROM bookings WHERE status = 'Completed'").get().count;
  const acceptedJobs = db.prepare("SELECT COUNT(*) as count FROM bookings WHERE status = 'Accepted'").get().count;

  const revenueToday = db.prepare("SELECT COALESCE(SUM(price), 0) as total FROM bookings WHERE DATE(booking_time) = DATE('now') AND payment_status = 'Paid'").get().total;
  const revenueMonth = db.prepare("SELECT COALESCE(SUM(price), 0) as total FROM bookings WHERE strftime('%Y-%m', booking_time) = strftime('%Y-%m', 'now') AND payment_status = 'Paid'").get().total;

  const availableMechanics = db.prepare("SELECT COUNT(*) as count FROM mechanics WHERE status = 'available'").get().count;
  const busyMechanics = db.prepare("SELECT COUNT(*) as count FROM mechanics WHERE status = 'busy'").get().count;

  const recentBookings = db.prepare('SELECT * FROM bookings ORDER BY booking_time DESC LIMIT 10').all();
  const latestNotifications = db.prepare('SELECT * FROM notifications WHERE target_role = ? ORDER BY created_at DESC LIMIT 10').all('admin');

  const bookingsPerDay = db.prepare(`
    SELECT DATE(booking_time) as date, COUNT(*) as count 
    FROM bookings 
    WHERE booking_time >= datetime('now', '-7 days')
    GROUP BY DATE(booking_time)
    ORDER BY date ASC
  `).all();

  const serviceDistribution = db.prepare(`
    SELECT service_name as service, COUNT(*) as count, SUM(price) as revenue
    FROM bookings
    GROUP BY service_name
  `).all();

  const revenueGraph = db.prepare(`
    SELECT DATE(booking_time) as date, SUM(price) as revenue
    FROM bookings
    WHERE booking_time >= datetime('now', '-7 days') AND payment_status = 'Paid'
    GROUP BY DATE(booking_time)
    ORDER BY date ASC
  `).all();

  const unreadNotifications = db.prepare("SELECT COUNT(*) as count FROM notifications WHERE target_role = 'admin' AND read = 0").get().count;

  res.json({
    stats: {
      totalBookings,
      todayBookings,
      pendingJobs,
      completedJobs,
      acceptedJobs,
      revenueToday,
      revenueMonth,
      availableMechanics,
      busyMechanics,
      unreadNotifications
    },
    recentBookings,
    latestNotifications,
    charts: {
      bookingsPerDay,
      serviceDistribution,
      revenueGraph
    }
  });
});

router.get('/bookings', (req, res) => {
  const { db } = req;
  const { status, search } = req.query;

  let query = 'SELECT * FROM bookings WHERE 1=1';
  const params = [];

  if (status && status !== 'all') {
    query += ' AND status = ?';
    params.push(status);
  }
  if (search) {
    query += ' AND (customer_name LIKE ? OR phone LIKE ? OR id LIKE ? OR vehicle_number LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s, s, s);
  }

  query += ' ORDER BY booking_time DESC';
  const bookings = db.prepare(query).all(...params);
  res.json(bookings);
});

router.get('/notifications', (req, res) => {
  const { db } = req;
  const notifications = db.prepare('SELECT * FROM notifications WHERE target_role = ? ORDER BY created_at DESC').all('admin');
  res.json(notifications);
});

router.put('/notifications/read-all', (req, res) => {
  const { db } = req;
  db.prepare("UPDATE notifications SET read = 1 WHERE target_role = 'admin' AND read = 0").run();
  res.json({ success: true });
});

router.put('/notifications/:id/read', (req, res) => {
  const { db } = req;
  db.prepare('UPDATE notifications SET read = 1 WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

export default router;
