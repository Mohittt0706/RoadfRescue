import { Router } from 'express';
import { verifyToken, verifyAdmin } from '../authentication/middleware.js';
import { validate, mechanicStatusValidator, mechanicAssignValidator, idParamValidator } from '../authentication/validators.js';

const router = Router();

// GET /api/mechanics - List all mechanics (Protected)
router.get('/', verifyToken, (req, res) => {
  const { db } = req;
  try {
    // Only return approved mechanics to standard users
    let query = "SELECT id, name, phone, email, role, experience_years, rating, total_jobs, status, specialization, latitude, longitude FROM mechanics";
    const params = [];

    if (req.user.role === 'user') {
      query += " WHERE approval_status = 'approved'";
    }

    query += " ORDER BY rating DESC";
    const mechanics = db.prepare(query).all(...params);
    res.json(mechanics);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve mechanics.', error: err.message });
  }
});

// GET /api/mechanics/:id - Get specific mechanic details (Protected)
router.get('/:id', verifyToken, idParamValidator, validate, (req, res) => {
  const { db } = req;
  const { id } = req.params;

  try {
    const mechanic = db.prepare('SELECT id, name, phone, email, role, experience_years, rating, total_jobs, status, current_booking_id, specialization, latitude, longitude, approval_status, profile_image, address, city FROM mechanics WHERE id = ?').get(id);
    if (!mechanic) return res.status(404).json({ success: false, message: 'Mechanic not found.', error: 'Not Found' });

    // Users can only view approved mechanics
    if (req.user.role === 'user' && mechanic.approval_status !== 'approved') {
      return res.status(403).json({ success: false, message: 'Access denied.', error: 'Forbidden' });
    }

    const currentJob = mechanic.current_booking_id
      ? db.prepare('SELECT * FROM bookings WHERE id = ?').get(mechanic.current_booking_id)
      : null;

    const recentJobs = db.prepare(`
      SELECT b.* FROM bookings b 
      WHERE b.assigned_mechanic_id = ? 
      ORDER BY b.booking_time DESC LIMIT 5
    `).all(id);

    res.json({ mechanic, currentJob, recentJobs });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch mechanic details.', error: err.message });
  }
});

// PUT /api/mechanics/:id/status - Update availability status (Protected)
router.put('/:id/status', verifyToken, mechanicStatusValidator, validate, (req, res) => {
  const { db, io } = req;
  const { status } = req.body;
  const { id: tokenUserId, role } = req.user;
  const targetId = req.params.id;

  // Only the mechanic themselves or an admin can update this availability status
  if (role === 'mechanic' && tokenUserId !== targetId) {
    return res.status(403).json({ success: false, message: 'Access denied. You cannot update status of another mechanic.', error: 'Forbidden' });
  }
  if (role === 'user') {
    return res.status(403).json({ success: false, message: 'Access denied. Users cannot update mechanic status.', error: 'Forbidden' });
  }

  try {
    db.prepare('UPDATE mechanics SET status = ? WHERE id = ?').run(status, targetId);
    const mechanic = db.prepare('SELECT * FROM mechanics WHERE id = ?').get(targetId);
    io.to('admin_room').emit('mechanic_updated', mechanic);
    res.json({ success: true, mechanic });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update mechanic status.', error: err.message });
  }
});

// POST /api/mechanics/assign - Assign mechanic to a booking (Admin Only)
router.post('/assign', verifyAdmin, mechanicAssignValidator, validate, (req, res) => {
  const { db, io } = req;
  const { bookingId, mechanicId } = req.body;

  try {
    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);
    const mechanic = db.prepare('SELECT * FROM mechanics WHERE id = ?').get(mechanicId);

    if (!booking || !mechanic) {
      return res.status(404).json({ success: false, message: 'Booking or mechanic not found.', error: 'Not Found' });
    }
    if (mechanic.status === 'busy') {
      return res.status(400).json({ success: false, message: 'Mechanic is currently busy.', error: 'Bad Request' });
    }
    if (mechanic.approval_status !== 'approved') {
      return res.status(400).json({ success: false, message: 'Mechanic account is not approved.', error: 'Bad Request' });
    }

    db.prepare('UPDATE bookings SET assigned_mechanic_id = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(mechanicId, 'Accepted', bookingId);
    db.prepare('UPDATE mechanics SET status = ?, current_booking_id = ? WHERE id = ?')
      .run('busy', bookingId, mechanicId);

    io.to('admin_room').emit('booking_updated', { ...booking, assigned_mechanic_id: mechanicId, status: 'Accepted' });
    io.to('admin_room').emit('mechanic_assigned', { bookingId, mechanic });

    if (booking.user_id) {
      io.to(`user_${booking.user_id}`).emit('booking_updated', { ...booking, status: 'Accepted' });
    }

    res.json({ success: true, message: `Mechanic ${mechanic.name} assigned to booking ${bookingId}` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to assign mechanic.', error: err.message });
  }
});

export default router;
