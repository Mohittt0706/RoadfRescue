import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { verifyToken, verifyAdmin } from '../authentication/middleware.js';
import { validate, createBookingValidator, updateBookingValidator, idParamValidator } from '../authentication/validators.js';
import { insertAuditLog, getClientIP } from '../utils/auditLogger.js';

const router = Router();

const SERVICE_PRICES = {
  'Flat Tire Repair': 699,
  'Battery Jump Start': 999,
  'Fuel Delivery': 799,
  'Engine Breakdown Diagnosis': 1499,
  'Car Towing': 1999,
  'Lockout Assistance': 899,
};

// POST /api/bookings - Create a booking
router.post('/', verifyToken, createBookingValidator, validate, (req, res) => {
  const { db, io } = req;
  const {
    customerName, phone, email, vehicleType, vehicleNumber,
    serviceName, latitude, longitude, address, notes, paymentMethod
  } = req.body;

  if (!customerName || !phone || !vehicleType || !vehicleNumber || !serviceName) {
    return res.status(400).json({ success: false, message: 'Missing required fields.', error: 'Bad Request' });
  }

  // Users can only create bookings for themselves; admins can create for anyone.
  const userId = req.user.role === 'user' ? req.user.id : (req.body.userId || null);

  const price = SERVICE_PRICES[serviceName] || 999;
  const bookingId = `BK-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

  try {
    db.prepare(`
      INSERT INTO bookings (id, user_id, customer_name, phone, email, vehicle_type, vehicle_number, service_name, price, latitude, longitude, address, notes, payment_method, estimated_arrival)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(bookingId, userId, customerName, phone, email, vehicleType, vehicleNumber, serviceName, price, latitude || 23.0225, longitude || 72.5714, address || 'Anand, Gujarat', notes || '', paymentMethod || 'Cash', '15-20 min');

    db.prepare(`
      INSERT INTO booking_logs (id, booking_id, status, note, created_by)
      VALUES (?, ?, 'Pending', 'Booking created', ?)
    `).run(uuidv4(), bookingId, customerName);

    const notificationId = uuidv4();
    db.prepare(`
      INSERT INTO notifications (id, type, title, message, booking_id, target_role)
      VALUES (?, 'new_booking', 'New Emergency Booking', ?, ?, 'admin')
    `).run(notificationId, `Customer: ${customerName}\nService: ${serviceName}\nAmount: ₹${price.toLocaleString('en-IN')}\nLocation: ${address || 'Anand, Gujarat'}`, bookingId);

    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);

    io.to('admin_room').emit('new_booking', {
      booking,
      notification: { id: notificationId, type: 'new_booking', title: 'New Emergency Booking', message: `New booking from ${customerName} for ${serviceName}`, bookingId, read: 0 }
    });

    res.status(201).json({ success: true, booking });
  } catch (err) {
    console.error('Create booking error:', err);
    res.status(500).json({ success: false, message: 'Failed to create booking.', error: err.message });
  }
});

// GET /api/bookings - Get list of bookings (Protected & Filtered)
router.get('/', verifyToken, (req, res) => {
  const { db } = req;
  const { status, search } = req.query;
  const { id: tokenUserId, role } = req.user;

  try {
    let query = 'SELECT * FROM bookings WHERE 1=1';
    const params = [];

    // Filter by role access limits
    if (role === 'user') {
      query += ' AND user_id = ?';
      params.push(tokenUserId);
    } else if (role === 'mechanic') {
      query += ' AND assigned_mechanic_id = ?';
      params.push(tokenUserId);
    } // Admins can view all bookings

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
    console.error('Fetch bookings error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve bookings.', error: err.message });
  }
});

// GET /api/bookings/:id - Get specific booking detail (Protected)
router.get('/:id', verifyToken, idParamValidator, validate, (req, res) => {
  const { db } = req;
  const { id: tokenUserId, role } = req.user;

  try {
    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.', error: 'Not Found' });

    // Authorization checks
    if (role === 'user' && booking.user_id !== tokenUserId) {
      return res.status(403).json({ success: false, message: 'Access denied. You do not own this booking.', error: 'Forbidden' });
    }
    if (role === 'mechanic' && booking.assigned_mechanic_id !== tokenUserId) {
      return res.status(403).json({ success: false, message: 'Access denied. This booking is not assigned to you.', error: 'Forbidden' });
    }

    const logs = db.prepare('SELECT * FROM booking_logs WHERE booking_id = ? ORDER BY created_at ASC').all(req.params.id);
    const payments = db.prepare('SELECT * FROM payments WHERE booking_id = ?').all(req.params.id);

    let mechanic = null;
    if (booking.assigned_mechanic_id) {
      mechanic = db.prepare('SELECT id, name, phone, email, specialization, rating FROM mechanics WHERE id = ?').get(booking.assigned_mechanic_id);
    }

    res.json({ booking, logs, payments, mechanic });
  } catch (err) {
    console.error('Get booking detail error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch booking details.', error: err.message });
  }
});

// PUT /api/bookings/:id - Update booking status / assigned mechanic (Protected)
router.put('/:id', verifyToken, updateBookingValidator, validate, (req, res) => {
  const { db, io } = req;
  const { status, assigned_mechanic_id, note } = req.body;
  const bookingId = req.params.id;
  const { id: tokenUserId, role } = req.user;

  try {
    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.', error: 'Not Found' });

    // Authorization and parameter verification
    if (role === 'user') {
      if (booking.user_id !== tokenUserId) {
        return res.status(403).json({ success: false, message: 'Access denied. You do not own this booking.', error: 'Forbidden' });
      }
      // Users can only update status to 'Cancelled'
      if (status !== 'Cancelled') {
        return res.status(403).json({ success: false, message: 'Access denied. Users can only cancel bookings.', error: 'Forbidden' });
      }
    } else if (role === 'mechanic') {
      if (booking.assigned_mechanic_id !== tokenUserId) {
        return res.status(403).json({ success: false, message: 'Access denied. Booking not assigned to you.', error: 'Forbidden' });
      }
      // Mechanics cannot assign other mechanics
      if (assigned_mechanic_id) {
        return res.status(403).json({ success: false, message: 'Access denied. Mechanics cannot assign bookings.', error: 'Forbidden' });
      }
      // Mechanics can only update statuses like: 'Accepted', 'Arrived', 'Completed'
      const allowedStatuses = ['Accepted', 'Arrived', 'Completed'];
      if (status && !allowedStatuses.includes(status)) {
        return res.status(403).json({ success: false, message: `Access denied. Mechanics can only update status to: ${allowedStatuses.join(', ')}`, error: 'Forbidden' });
      }
    }

    // Process status updates
    if (status) {
      db.prepare('UPDATE bookings SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, bookingId);
      db.prepare(`
        INSERT INTO booking_logs (id, booking_id, status, note, created_by)
        VALUES (?, ?, ?, ?, ?)
      `).run(uuidv4(), bookingId, status, note || `Status updated to ${status}`, role);

      if (status === 'Completed') {
        db.prepare('UPDATE bookings SET payment_status = ? WHERE id = ?').run('Paid', bookingId);
      }

      // Audit log for booking status change
      insertAuditLog(db, {
        adminId: req.user.id,
        action: 'STATUS_CHANGE',
        entity: 'booking',
        entityId: bookingId,
        description: `Booking status changed to "${status}" for ${booking.customer_name}`,
        ipAddress: getClientIP(req),
      });
    }

    // Process mechanic assignments (Admin only)
    if (assigned_mechanic_id) {
      if (role !== 'admin' && role !== 'super_admin') {
        return res.status(403).json({ success: false, message: 'Access denied. Admin privileges required.', error: 'Forbidden' });
      }

      db.prepare('UPDATE bookings SET assigned_mechanic_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(assigned_mechanic_id, bookingId);
      db.prepare('UPDATE mechanics SET status = ?, current_booking_id = ? WHERE id = ?').run('busy', bookingId, assigned_mechanic_id);

      const mechanic = db.prepare('SELECT id, name FROM mechanics WHERE id = ?').get(assigned_mechanic_id);
      db.prepare(`
        INSERT INTO booking_logs (id, booking_id, status, note, created_by)
        VALUES (?, ?, 'Mechanic Assigned', ?, 'admin')
      `).run(uuidv4(), bookingId, `Assigned to ${mechanic?.name}`);

      io.to('admin_room').emit('mechanic_assigned', { bookingId, mechanic });
    }

    const updated = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);
    io.to('admin_room').emit('booking_updated', updated);
    if (booking.user_id) {
      io.to(`user_${booking.user_id}`).emit('booking_updated', updated);
    }

    res.json({ success: true, booking: updated });
  } catch (err) {
    console.error('Update booking error:', err);
    res.status(500).json({ success: false, message: 'Failed to update booking.', error: err.message });
  }
});

// DELETE /api/bookings/:id - Delete booking (Admin Only)
router.delete('/:id', verifyAdmin, idParamValidator, validate, (req, res) => {
  const { db, io } = req;
  const bookingId = req.params.id;

  try {
    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.', error: 'Not Found' });

    db.prepare('DELETE FROM booking_logs WHERE booking_id = ?').run(bookingId);
    db.prepare('DELETE FROM payments WHERE booking_id = ?').run(bookingId);
    db.prepare('DELETE FROM notifications WHERE booking_id = ?').run(bookingId);
    db.prepare('DELETE FROM bookings WHERE id = ?').run(bookingId);

    // Audit log for booking deletion
    insertAuditLog(db, {
      adminId: req.user.id,
      action: 'DELETE',
      entity: 'booking',
      entityId: bookingId,
      description: `Deleted booking for ${booking.customer_name} (${booking.service_name})`,
      ipAddress: getClientIP(req),
    });

    io.to('admin_room').emit('booking_deleted', { bookingId });

    res.json({ success: true, message: 'Booking deleted successfully.' });
  } catch (err) {
    console.error('Delete booking error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete booking.', error: err.message });
  }
});

export default router;
