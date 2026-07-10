import { Router } from 'express';
import { insertAuditLog, getClientIP } from '../utils/auditLogger.js';
import { createUser } from '../controllers/adminController.js';

const router = Router();

// GET /api/admin/dashboard - Admin dashboard stats & graph data
router.get('/dashboard', (req, res) => {
  const { db } = req;

  try {
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
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve dashboard stats.', error: err.message });
  }
});

// GET /api/admin/bookings - Fetch list of bookings
router.get('/bookings', (req, res) => {
  const { db } = req;
  const { status, search } = req.query;

  try {
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
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch bookings.', error: err.message });
  }
});

// GET /api/admin/notifications - Get admin notifications
router.get('/notifications', (req, res) => {
  const { db } = req;
  try {
    const notifications = db.prepare('SELECT * FROM notifications WHERE target_role = ? ORDER BY created_at DESC').all('admin');
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch notifications.', error: err.message });
  }
});

// PUT /api/admin/notifications/read-all - Mark all notifications read
router.put('/notifications/read-all', (req, res) => {
  const { db } = req;
  try {
    db.prepare("UPDATE notifications SET read = 1 WHERE target_role = 'admin' AND read = 0").run();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to mark all as read.', error: err.message });
  }
});

// PUT /api/admin/notifications/:id/read - Mark specific notification read
router.put('/notifications/:id/read', (req, res) => {
  const { db } = req;
  try {
    db.prepare('UPDATE notifications SET read = 1 WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to mark notification read.', error: err.message });
  }
});

// ----------------------------------------------------
// USER MANAGEMENT APIs
// ----------------------------------------------------

// POST /api/admin/users - Create a new user (admin-initiated)
router.post('/users', createUser);

// GET /api/admin/users - Get all users
router.get('/users', (req, res) => {
  const { db } = req;
  try {
    const users = db.prepare('SELECT id, name, email, phone, vehicle_type, vehicle_number, status, profile_image, address, city, created_at FROM users ORDER BY created_at DESC').all();
    res.json(users);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch users.', error: err.message });
  }
});

// GET /api/admin/users/:id - Get specific user
router.get('/users/:id', (req, res) => {
  const { db } = req;
  try {
    const user = db.prepare('SELECT id, name, email, phone, vehicle_type, vehicle_number, status, profile_image, address, city, created_at FROM users WHERE id = ?').get(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch user details.', error: err.message });
  }
});

// PUT /api/admin/users/:id - Update user status / details
router.put('/users/:id', (req, res) => {
  const { db } = req;
  const { status, name, phone, address, city, vehicle } = req.body;
  const userId = req.params.id;

  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Admins can deactivate (inactive), activate (active), suspend (blocked) accounts
    const newStatus = status !== undefined ? status : user.status;
    const newName = name !== undefined ? name : user.name;
    const newPhone = phone !== undefined ? phone : user.phone;
    const newAddress = address !== undefined ? address : user.address;
    const newCity = city !== undefined ? city : user.city;
    const newVehicle = vehicle !== undefined ? vehicle : user.vehicle;

    db.prepare(`
      UPDATE users 
      SET status = ?, name = ?, phone = ?, address = ?, city = ?, vehicle = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(newStatus, newName, newPhone, newAddress, newCity, newVehicle, userId);

    const updated = db.prepare('SELECT id, name, email, phone, vehicle_type, vehicle_number, status, address, city, vehicle FROM users WHERE id = ?').get(userId);

    insertAuditLog(db, {
      adminId: req.user.id,
      action: 'UPDATE',
      entity: 'user',
      entityId: userId,
      description: `Updated user: ${updated.name}`,
      ipAddress: getClientIP(req),
    });

    res.json({ success: true, message: 'User updated successfully.', user: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update user.', error: err.message });
  }
});

// DELETE /api/admin/users/:id - Delete user account
router.delete('/users/:id', (req, res) => {
  const { db } = req;
  const userId = req.params.id;

  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    db.prepare('DELETE FROM users WHERE id = ?').run(userId);

    insertAuditLog(db, {
      adminId: req.user.id,
      action: 'DELETE',
      entity: 'user',
      entityId: userId,
      description: `Deleted user: ${user.name} (${user.email})`,
      ipAddress: getClientIP(req),
    });

    res.json({ success: true, message: 'User account deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete user.', error: err.message });
  }
});

// ----------------------------------------------------
// MECHANIC MANAGEMENT APIs
// ----------------------------------------------------

// GET /api/admin/mechanics - List all mechanics (includes status and approval status)
router.get('/mechanics', (req, res) => {
  const { db } = req;
  try {
    const mechanics = db.prepare('SELECT id, name, phone, email, role, experience_years, rating, total_jobs, status, specialization, latitude, longitude, approval_status, profile_image, address, city, created_at FROM mechanics ORDER BY created_at DESC').all();
    res.json(mechanics);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch mechanics.', error: err.message });
  }
});

// PUT /api/admin/mechanics/:id - Approve, Reject, or Block a mechanic
router.put('/mechanics/:id', (req, res) => {
  const { db } = req;
  const { approval_status, name, phone, experience_years, specialization, status } = req.body;
  const mechanicId = req.params.id;

  try {
    const mechanic = db.prepare('SELECT * FROM mechanics WHERE id = ?').get(mechanicId);
    if (!mechanic) {
      return res.status(404).json({ success: false, message: 'Mechanic not found.' });
    }

    const newApprovalStatus = approval_status !== undefined ? approval_status : mechanic.approval_status;
    const newName = name !== undefined ? name : mechanic.name;
    const newPhone = phone !== undefined ? phone : mechanic.phone;
    const newExp = experience_years !== undefined ? experience_years : mechanic.experience_years;
    const newSpec = specialization !== undefined ? specialization : mechanic.specialization;
    const newStatus = status !== undefined ? status : mechanic.status;

    db.prepare(`
      UPDATE mechanics 
      SET approval_status = ?, name = ?, phone = ?, experience_years = ?, specialization = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(newApprovalStatus, newName, newPhone, newExp, newSpec, newStatus, mechanicId);

    const updated = db.prepare('SELECT id, name, email, phone, experience_years, specialization, rating, status, approval_status FROM mechanics WHERE id = ?').get(mechanicId);

    insertAuditLog(db, {
      adminId: req.user.id,
      action: 'UPDATE',
      entity: 'mechanic',
      entityId: mechanicId,
      description: `Updated mechanic: ${updated.name} (approval: ${newApprovalStatus})`,
      ipAddress: getClientIP(req),
    });

    res.json({ success: true, message: 'Mechanic details and status updated successfully.', mechanic: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update mechanic.', error: err.message });
  }
});

// DELETE /api/admin/mechanics/:id - Delete a mechanic account
router.delete('/mechanics/:id', (req, res) => {
  const { db } = req;
  const mechanicId = req.params.id;

  try {
    const mechanic = db.prepare('SELECT * FROM mechanics WHERE id = ?').get(mechanicId);
    if (!mechanic) {
      return res.status(404).json({ success: false, message: 'Mechanic not found.' });
    }

    db.prepare('DELETE FROM mechanics WHERE id = ?').run(mechanicId);

    insertAuditLog(db, {
      adminId: req.user.id,
      action: 'DELETE',
      entity: 'mechanic',
      entityId: mechanicId,
      description: `Deleted mechanic: ${mechanic.name} (${mechanic.email})`,
      ipAddress: getClientIP(req),
    });

    res.json({ success: true, message: 'Mechanic account deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete mechanic.', error: err.message });
  }
});

export default router;
