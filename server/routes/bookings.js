import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

const SERVICE_PRICES = {
  'Flat Tire Repair': 699,
  'Battery Jump Start': 999,
  'Fuel Delivery': 799,
  'Engine Breakdown Diagnosis': 1499,
  'Car Towing': 1999,
  'Lockout Assistance': 899,
};

router.post('/', (req, res) => {
  const { db, io } = req;
  const {
    customerName, phone, email, vehicleType, vehicleNumber,
    serviceName, latitude, longitude, address, notes, paymentMethod, userId
  } = req.body;

  if (!customerName || !phone || !vehicleType || !vehicleNumber || !serviceName) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const price = SERVICE_PRICES[serviceName] || 999;
  const bookingId = `BK-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

  db.prepare(`
    INSERT INTO bookings (id, user_id, customer_name, phone, email, vehicle_type, vehicle_number, service_name, price, latitude, longitude, address, notes, payment_method, estimated_arrival)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(bookingId, userId || null, customerName, phone, email, vehicleType, vehicleNumber, serviceName, price, latitude || 23.0225, longitude || 72.5714, address || 'Anand, Gujarat', notes || '', paymentMethod || 'Cash', '15-20 min');

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
});

router.get('/', (req, res) => {
  const { db } = req;
  const { status, search, userId } = req.query;

  let query = 'SELECT * FROM bookings WHERE 1=1';
  const params = [];

  if (status && status !== 'all') {
    query += ' AND status = ?';
    params.push(status);
  }
  if (userId) {
    query += ' AND user_id = ?';
    params.push(userId);
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

router.get('/:id', (req, res) => {
  const { db } = req;
  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });

  const logs = db.prepare('SELECT * FROM booking_logs WHERE booking_id = ? ORDER BY created_at ASC').all(req.params.id);
  const payments = db.prepare('SELECT * FROM payments WHERE booking_id = ?').all(req.params.id);

  let mechanic = null;
  if (booking.assigned_mechanic_id) {
    mechanic = db.prepare('SELECT * FROM mechanics WHERE id = ?').get(booking.assigned_mechanic_id);
  }

  res.json({ booking, logs, payments, mechanic });
});

router.put('/:id', (req, res) => {
  const { db, io } = req;
  const { status, assigned_mechanic_id, note } = req.body;
  const bookingId = req.params.id;

  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });

  if (status) {
    db.prepare('UPDATE bookings SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, bookingId);
    db.prepare(`
      INSERT INTO booking_logs (id, booking_id, status, note, created_by)
      VALUES (?, ?, ?, ?, 'admin')
    `).run(uuidv4(), bookingId, status, note || `Status updated to ${status}`);

    if (status === 'Completed') {
      db.prepare('UPDATE bookings SET payment_status = ? WHERE id = ?').run('Paid', bookingId);
    }
  }

  if (assigned_mechanic_id) {
    db.prepare('UPDATE bookings SET assigned_mechanic_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(assigned_mechanic_id, bookingId);
    db.prepare('UPDATE mechanics SET status = ?, current_booking_id = ? WHERE id = ?').run('busy', bookingId, assigned_mechanic_id);

    const mechanic = db.prepare('SELECT * FROM mechanics WHERE id = ?').get(assigned_mechanic_id);
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
});

router.delete('/:id', (req, res) => {
  const { db, io } = req;
  const bookingId = req.params.id;

  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });

  db.prepare('DELETE FROM booking_logs WHERE booking_id = ?').run(bookingId);
  db.prepare('DELETE FROM payments WHERE booking_id = ?').run(bookingId);
  db.prepare('DELETE FROM notifications WHERE booking_id = ?').run(bookingId);
  db.prepare('DELETE FROM bookings WHERE id = ?').run(bookingId);

  io.to('admin_room').emit('booking_deleted', { bookingId });

  res.json({ success: true, message: 'Booking deleted' });
});

export default router;
