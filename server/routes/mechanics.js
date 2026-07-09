import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  const { db } = req;
  const mechanics = db.prepare('SELECT * FROM mechanics ORDER BY rating DESC').all();
  res.json(mechanics);
});

router.get('/:id', (req, res) => {
  const { db } = req;
  const mechanic = db.prepare('SELECT * FROM mechanics WHERE id = ?').get(req.params.id);
  if (!mechanic) return res.status(404).json({ error: 'Mechanic not found' });

  const currentJob = mechanic.current_booking_id
    ? db.prepare('SELECT * FROM bookings WHERE id = ?').get(mechanic.current_booking_id)
    : null;

  const recentJobs = db.prepare(`
    SELECT b.* FROM bookings b 
    WHERE b.assigned_mechanic_id = ? 
    ORDER BY b.booking_time DESC LIMIT 5
  `).all(req.params.id);

  res.json({ mechanic, currentJob, recentJobs });
});

router.put('/:id/status', (req, res) => {
  const { db, io } = req;
  const { status } = req.body;
  db.prepare('UPDATE mechanics SET status = ? WHERE id = ?').run(status, req.params.id);
  const mechanic = db.prepare('SELECT * FROM mechanics WHERE id = ?').get(req.params.id);
  io.to('admin_room').emit('mechanic_updated', mechanic);
  res.json({ success: true, mechanic });
});

router.post('/assign', (req, res) => {
  const { db, io } = req;
  const { bookingId, mechanicId } = req.body;

  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);
  const mechanic = db.prepare('SELECT * FROM mechanics WHERE id = ?').get(mechanicId);

  if (!booking || !mechanic) {
    return res.status(404).json({ error: 'Booking or mechanic not found' });
  }
  if (mechanic.status === 'busy') {
    return res.status(400).json({ error: 'Mechanic is currently busy' });
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
});

export default router;
