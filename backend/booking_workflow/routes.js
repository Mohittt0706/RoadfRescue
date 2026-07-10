import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { verifyToken, verifyAdmin } from '../authentication/middleware.js';
import { sendNotification } from './notifications.js';
import { startSOSDispatch, cancelActiveDispatch, findEligibleMechanics } from './dispatch.js';
import { EmergencyDb } from '../emergencyDb.js';

const router = Router();

// ==========================================
// 1. Status Transition Validation Helper
// ==========================================

const ALLOWED_BOOKING_STATUSES = [
  'pending', 'admin_review', 'mechanic_assigned', 'accepted', 'rejected',
  'mechanic_en_route', 'arrived', 'service_started', 'completed', 
  'cancelled', 'payment_pending', 'payment_completed', 'refunded'
];

const VALID_TRANSITIONS = {
  'pending': ['admin_review', 'cancelled', 'rejected'],
  'admin_review': ['mechanic_assigned', 'rejected', 'cancelled'],
  'mechanic_assigned': ['accepted', 'rejected', 'cancelled'],
  'accepted': ['mechanic_en_route', 'cancelled'],
  'mechanic_en_route': ['arrived', 'cancelled'],
  'arrived': ['service_started', 'cancelled'],
  'service_started': ['completed', 'cancelled'],
  'completed': ['payment_pending', 'payment_completed'],
  'payment_pending': ['payment_completed'],
  'payment_completed': ['refunded'],
  'rejected': [],
  'cancelled': [],
  'refunded': []
};

// Independent Emergency statuses: pending, assigned, accepted, en_route, arrived, resolved, cancelled
const ALLOWED_EMERGENCY_STATUSES = [
  'pending', 'assigned', 'accepted', 'en_route', 'arrived', 'resolved', 'cancelled'
];

const VALID_EMERGENCY_TRANSITIONS = {
  'pending': ['assigned', 'cancelled'],
  'assigned': ['accepted', 'rejected', 'cancelled'], // reject falls back/cascades
  'accepted': ['en_route', 'cancelled'],
  'en_route': ['arrived', 'cancelled'],
  'arrived': ['resolved', 'cancelled'],
  'resolved': [],
  'cancelled': []
};

function isValidTransition(oldStatus, newStatus, isEmergency = false) {
  const oldLower = (oldStatus || 'pending').toLowerCase();
  const newLower = (newStatus || 'pending').toLowerCase();

  if (isEmergency) {
    if (!ALLOWED_EMERGENCY_STATUSES.includes(newLower)) return false;
    if (oldLower === newLower) return true;
    const allowed = VALID_EMERGENCY_TRANSITIONS[oldLower] || [];
    return allowed.includes(newLower);
  } else {
    if (!ALLOWED_BOOKING_STATUSES.includes(newLower)) return false;
    if (oldLower === newLower) return true;
    const allowed = VALID_TRANSITIONS[oldLower] || [];
    return allowed.includes(newLower);
  }
}

/**
 * Shared helper to update a booking/emergency status and record to logs/history
 */
function updateStatus(db, bookingId, oldStatus, newStatus, updatedBy, remarks = '', isEmergency = false) {
  const table = isEmergency ? 'emergencies' : 'bookings';
  
  if (isEmergency) {
    db.prepare('UPDATE emergencies SET status = ?, updated_time = CURRENT_TIMESTAMP WHERE id = ?')
      .run(newStatus, bookingId);
  } else {
    db.prepare('UPDATE bookings SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(newStatus, bookingId);
  }

  // Record to booking_history
  db.prepare(`
    INSERT INTO booking_history (id, booking_id, old_status, new_status, updated_by, remarks)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(uuidv4(), bookingId, oldStatus, newStatus, updatedBy, remarks);

  // Record to booking_logs for legacy compatibility
  db.prepare(`
    INSERT INTO booking_logs (id, booking_id, status, note, created_by)
    VALUES (?, ?, ?, ?, ?)
  `).run(uuidv4(), bookingId, newStatus, remarks || `Status transitioned to ${newStatus}`, updatedBy);
}

// ==========================================
// 2. Timeline API
// ==========================================

// GET /api/bookings/:id/timeline - Return full history and timeline
router.get('/bookings/:id/timeline', verifyToken, (req, res) => {
  const { db } = req;
  const bookingId = req.params.id;

  try {
    const history = db.prepare(`
      SELECT * FROM booking_history 
      WHERE booking_id = ? 
      ORDER BY created_at ASC
    `).all(bookingId);

    const legacyLogs = db.prepare(`
      SELECT * FROM booking_logs 
      WHERE booking_id = ? 
      ORDER BY created_at ASC
    `).all(bookingId);

    res.json({ success: true, timeline: history, legacyLogs });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve timeline.', error: err.message });
  }
});

// ==========================================
// 3. Admin Booking Review & Assignment
// ==========================================

// PUT /api/admin/bookings/:id/approve - Pre-approve booking, transition to admin_review
router.put('/admin/bookings/:id/approve', verifyAdmin, (req, res) => {
  const { db, io } = req;
  const bookingId = req.params.id;

  try {
    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

    if (!isValidTransition(booking.status, 'admin_review', false)) {
      return res.status(400).json({ success: false, message: `Invalid transition from ${booking.status} to admin_review.` });
    }

    updateStatus(db, bookingId, booking.status, 'admin_review', 'admin', 'Booking approved for administrative review.');

    sendNotification({
      db, io,
      type: 'booking_approved',
      title: 'Booking Pre-Approved',
      message: `Your booking request ${bookingId} has been approved by admin and is under review.`,
      bookingId,
      targetRole: 'user',
      targetId: booking.user_id,
      socketEvent: 'bookingUpdated',
      socketData: { bookingId, status: 'admin_review' }
    });

    res.json({ success: true, message: 'Booking approved for review.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to approve booking.', error: err.message });
  }
});

// PUT /api/admin/bookings/:id/reject - Reject booking
router.put('/admin/bookings/:id/reject', verifyAdmin, (req, res) => {
  const { db, io } = req;
  const bookingId = req.params.id;
  const { reason = 'Rejected by administrator.' } = req.body;

  try {
    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

    if (!isValidTransition(booking.status, 'rejected', false)) {
      return res.status(400).json({ success: false, message: `Invalid transition from ${booking.status} to rejected.` });
    }

    updateStatus(db, bookingId, booking.status, 'rejected', 'admin', reason);

    sendNotification({
      db, io,
      type: 'booking_rejected',
      title: 'Booking Rejected',
      message: `Your booking request ${bookingId} has been rejected. Reason: ${reason}`,
      bookingId,
      targetRole: 'user',
      targetId: booking.user_id,
      socketEvent: 'bookingUpdated',
      socketData: { bookingId, status: 'rejected' }
    });

    res.json({ success: true, message: 'Booking rejected.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to reject booking.', error: err.message });
  }
});

// PUT /api/admin/bookings/:id/assign - Manually assign a mechanic
router.put('/admin/bookings/:id/assign', verifyAdmin, (req, res) => {
  const { db, io } = req;
  const bookingId = req.params.id;
  const { mechanicId } = req.body;

  if (!mechanicId) {
    return res.status(400).json({ success: false, message: 'mechanicId is required.' });
  }

  try {
    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

    if (!isValidTransition(booking.status, 'mechanic_assigned', false)) {
      return res.status(400).json({ success: false, message: `Cannot assign mechanic when status is ${booking.status}.` });
    }

    // Check if mechanic is blocked or approved
    const mechanic = db.prepare('SELECT * FROM mechanics WHERE id = ?').get(mechanicId);
    if (!mechanic) return res.status(404).json({ success: false, message: 'Mechanic not found.' });
    
    if (mechanic.approval_status !== 'approved') {
      return res.status(400).json({ success: false, message: 'Cannot assign a mechanic that is not approved.' });
    }
    if (mechanic.status === 'blocked') {
      return res.status(400).json({ success: false, message: 'Cannot assign a blocked mechanic.' });
    }

    // Cancel auto-dispatches if active
    cancelActiveDispatch(bookingId);

    db.transaction(() => {
      // Assign mechanic to booking
      db.prepare('UPDATE bookings SET assigned_mechanic_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(mechanicId, bookingId);

      // Create booking assignment
      db.prepare(`
        INSERT INTO booking_assignment (id, booking_id, mechanic_id, status)
        VALUES (?, ?, ?, 'pending')
      `).run(uuidv4(), bookingId, mechanicId);

      updateStatus(db, bookingId, booking.status, 'mechanic_assigned', 'admin', `Manually assigned to mechanic: ${mechanic.name}`);
    })();

    sendNotification({
      db, io,
      type: 'mechanic_assigned',
      title: 'Job Assigned to You',
      message: `You have been manually assigned to booking request ${bookingId}.`,
      bookingId,
      targetRole: 'mechanic',
      targetId: mechanicId,
      socketEvent: 'bookingAssigned',
      socketData: { bookingId, mechanicId }
    });

    res.json({ success: true, message: `Mechanic ${mechanic.name} successfully assigned.` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to assign mechanic.', error: err.message });
  }
});

// ==========================================
// 4. Auto Mechanic Assignment API (Direct Trigger)
// ==========================================

// POST /api/bookings/:id/auto-assign - Trigger auto assignment cascade
router.post('/bookings/:id/auto-assign', verifyAdmin, (req, res) => {
  const { db, io } = req;
  const bookingId = req.params.id;

  try {
    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

    const started = startSOSDispatch(db, io, bookingId, booking.latitude, booking.longitude, false);
    if (started) {
      res.json({ success: true, message: 'Auto-assignment cascade started.' });
    } else {
      res.json({ success: false, message: 'No eligible mechanics found. Booking remains pending.' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error initiating auto-assignment.', error: err.message });
  }
});

// ==========================================
// 5. Mechanic Actions APIs
// ==========================================

// GET /api/mechanic/jobs - Get current jobs assigned to logged-in mechanic
router.get('/mechanic/jobs', verifyToken, (req, res) => {
  const { db } = req;
  const { id: mechanicId, role } = req.user;

  if (role !== 'mechanic') {
    return res.status(403).json({ success: false, message: 'Access denied. Mechanic account required.' });
  }

  try {
    const jobs = db.prepare(`
      SELECT * FROM bookings 
      WHERE assigned_mechanic_id = ? AND status != 'completed' AND status != 'cancelled'
      ORDER BY booking_time DESC
    `).all(mechanicId);

    // Also include emergencies fallback
    const emergencies = db.prepare(`
      SELECT * FROM emergencies 
      WHERE assigned_mechanic = ? AND status != 'resolved' AND status != 'cancelled'
      ORDER BY created_time DESC
    `).all(mechanicId);

    res.json({ success: true, jobs, emergencies });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve jobs.', error: err.message });
  }
});

// PUT /api/mechanic/jobs/:id/accept - Accept job assignment
router.put('/mechanic/jobs/:id/accept', verifyToken, (req, res) => {
  const { db, io } = req;
  const bookingId = req.params.id;
  const { id: mechanicId, role } = req.user;

  if (role !== 'mechanic') {
    return res.status(403).json({ success: false, message: 'Access denied.' });
  }

  try {
    // 1. Fetch booking or emergency
    let isEmergency = false;
    let booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);
    if (!booking) {
      booking = db.prepare('SELECT * FROM emergencies WHERE id = ?').get(bookingId);
      if (!booking) return res.status(404).json({ success: false, message: 'Job not found.' });
      isEmergency = true;
    }

    // Authorization
    const assignedMechId = isEmergency ? booking.assigned_mechanic : booking.assigned_mechanic_id;
    if (assignedMechId !== mechanicId) {
      return res.status(403).json({ success: false, message: 'Access denied. This job is not assigned to you.' });
    }

    if (booking.status === 'accepted') {
      return res.status(400).json({ success: false, message: 'Job is already accepted.' });
    }

    if (!isValidTransition(booking.status, 'accepted', isEmergency)) {
      return res.status(400).json({ success: false, message: `Invalid transition to accepted status from ${booking.status}.` });
    }

    // Cancel timeouts
    cancelActiveDispatch(bookingId);

    db.transaction(() => {
      // Mark assignment as accepted
      db.prepare(`
        UPDATE booking_assignment 
        SET status = 'accepted', responded_at = CURRENT_TIMESTAMP 
        WHERE booking_id = ? AND mechanic_id = ? AND status = 'pending'
      `).run(bookingId, mechanicId);

      // Update mechanic status to busy
      db.prepare('UPDATE mechanics SET status = \'busy\', current_booking_id = ? WHERE id = ?')
        .run(bookingId, mechanicId);

      updateStatus(db, bookingId, booking.status, 'accepted', 'mechanic', 'Job accepted by mechanic.', isEmergency);
    })();

    // Notify user & Admin
    const targetUserId = isEmergency ? null : booking.user_id;
    if (targetUserId) {
      sendNotification({
        db, io,
        type: 'booking_accepted',
        title: 'Mechanic En Route',
        message: 'Your mechanic has accepted the request and will update details soon.',
        bookingId,
        targetRole: 'user',
        targetId: targetUserId,
        socketEvent: 'bookingUpdated',
        socketData: { bookingId, status: 'accepted' }
      });
    }

    sendNotification({
      db, io,
      type: 'booking_accepted',
      title: 'Job Accepted',
      message: `Mechanic ${mechanicId} accepted job ${bookingId}`,
      bookingId,
      targetRole: 'admin',
      socketEvent: 'bookingAccepted',
      socketData: { bookingId, mechanicId }
    });

    res.json({ success: true, message: 'Job accepted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to accept job.', error: err.message });
  }
});

// PUT /api/mechanic/jobs/:id/reject - Reject job assignment
router.put('/mechanic/jobs/:id/reject', verifyToken, (req, res) => {
  const { db, io } = req;
  const bookingId = req.params.id;
  const { id: mechanicId, role } = req.user;
  const { reason = 'Declined by mechanic.' } = req.body;

  if (role !== 'mechanic') {
    return res.status(403).json({ success: false, message: 'Access denied.' });
  }

  try {
    let isEmergency = false;
    let booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);
    if (!booking) {
      booking = db.prepare('SELECT * FROM emergencies WHERE id = ?').get(bookingId);
      if (!booking) return res.status(404).json({ success: false, message: 'Job not found.' });
      isEmergency = true;
    }

    const assignedMechId = isEmergency ? booking.assigned_mechanic : booking.assigned_mechanic_id;
    if (assignedMechId !== mechanicId) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    cancelActiveDispatch(bookingId);

    db.transaction(() => {
      // Update booking assignment
      db.prepare(`
        UPDATE booking_assignment 
        SET status = 'rejected', responded_at = CURRENT_TIMESTAMP, decline_reason = ? 
        WHERE booking_id = ? AND mechanic_id = ? AND status = 'pending'
      `).run(reason, bookingId, mechanicId);

      // Free mechanic
      db.prepare('UPDATE mechanics SET status = \'available\', current_booking_id = NULL WHERE id = ?')
        .run(mechanicId);

      // Revert status to admin_review (or pending for emergencies)
      const revertedStatus = isEmergency ? 'pending' : 'admin_review';
      updateStatus(db, bookingId, booking.status, revertedStatus, 'mechanic', `Rejected by mechanic. Reason: ${reason}`, isEmergency);
    })();

    sendNotification({
      db, io,
      type: 'booking_rejected',
      title: 'Job Declined by Mechanic',
      message: `Mechanic ${mechanicId} declined job ${bookingId}. Reason: ${reason}`,
      bookingId,
      targetRole: 'admin',
      socketEvent: 'bookingRejected',
      socketData: { bookingId, mechanicId, reason }
    });

    // Check if we need to cascade to another mechanic (for emergencies SOS cascade)
    if (isEmergency) {
      // Find remaining queue: fetch all previously rejected/expired mechanic ids for this booking
      const assignments = db.prepare('SELECT mechanic_id FROM booking_assignment WHERE booking_id = ?').all(bookingId);
      const triedIds = assignments.map(a => a.mechanic_id);

      const eligible = findEligibleMechanics(db, booking.latitude, booking.longitude);
      const remainingQueue = eligible.map(m => m.id).filter(id => !triedIds.includes(id));

      dispatchNextMechanic(db, io, bookingId, remainingQueue, true);
    }

    res.json({ success: true, message: 'Job rejected.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to reject job.', error: err.message });
  }
});

// PUT /api/mechanic/jobs/:id/en_route - Mark mechanic en route
router.put('/mechanic/jobs/:id/en_route', verifyToken, (req, res) => {
  const { db, io } = req;
  const bookingId = req.params.id;
  const { id: mechanicId, role } = req.user;

  if (role !== 'mechanic') return res.status(403).json({ success: false, message: 'Access denied.' });

  try {
    let isEmergency = false;
    let booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);
    if (!booking) {
      booking = db.prepare('SELECT * FROM emergencies WHERE id = ?').get(bookingId);
      if (!booking) return res.status(404).json({ success: false, message: 'Job not found.' });
      isEmergency = true;
    }

    const assignedMechId = isEmergency ? booking.assigned_mechanic : booking.assigned_mechanic_id;
    if (assignedMechId !== mechanicId) return res.status(403).json({ success: false, message: 'Access denied.' });

    const nextStatus = isEmergency ? 'en_route' : 'mechanic_en_route';

    if (!isValidTransition(booking.status, nextStatus, isEmergency)) {
      return res.status(400).json({ success: false, message: `Invalid transition to en_route from ${booking.status}.` });
    }

    updateStatus(db, bookingId, booking.status, nextStatus, 'mechanic', 'Mechanic en route to your location.', isEmergency);

    const targetUserId = isEmergency ? null : booking.user_id;
    if (targetUserId) {
      sendNotification({
        db, io,
        type: 'mechanic_en_route',
        title: 'Mechanic En Route',
        message: 'Your help is on the way!',
        bookingId,
        targetRole: 'user',
        targetId: targetUserId,
        socketEvent: 'bookingUpdated',
        socketData: { bookingId, status: nextStatus }
      });
    }

    res.json({ success: true, message: 'Status updated to en route.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update status.', error: err.message });
  }
});

// PUT /api/mechanic/jobs/:id/arrived - Mark arrived
router.put('/mechanic/jobs/:id/arrived', verifyToken, (req, res) => {
  const { db, io } = req;
  const bookingId = req.params.id;
  const { id: mechanicId, role } = req.user;

  if (role !== 'mechanic') return res.status(403).json({ success: false, message: 'Access denied.' });

  try {
    let isEmergency = false;
    let booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);
    if (!booking) {
      booking = db.prepare('SELECT * FROM emergencies WHERE id = ?').get(bookingId);
      if (!booking) return res.status(404).json({ success: false, message: 'Job not found.' });
      isEmergency = true;
    }

    const assignedMechId = isEmergency ? booking.assigned_mechanic : booking.assigned_mechanic_id;
    if (assignedMechId !== mechanicId) return res.status(403).json({ success: false, message: 'Access denied.' });

    const nextStatus = isEmergency ? 'arrived' : 'arrived'; // both are 'arrived'

    if (!isValidTransition(booking.status, nextStatus, isEmergency)) {
      return res.status(400).json({ success: false, message: `Invalid transition from ${booking.status} to arrived.` });
    }

    updateStatus(db, bookingId, booking.status, nextStatus, 'mechanic', 'Mechanic has arrived at your location.', isEmergency);

    const targetUserId = isEmergency ? null : booking.user_id;
    if (targetUserId) {
      sendNotification({
        db, io,
        type: 'mechanic_arrived',
        title: 'Mechanic Arrived',
        message: 'Your rescue partner has arrived at your location.',
        bookingId,
        targetRole: 'user',
        targetId: targetUserId,
        socketEvent: 'bookingUpdated',
        socketData: { bookingId, status: 'arrived' }
      });
    }

    res.json({ success: true, message: 'Status updated to arrived.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update status.', error: err.message });
  }
});

// PUT /api/mechanic/jobs/:id/start - Start service
router.put('/mechanic/jobs/:id/start', verifyToken, (req, res) => {
  const { db, io } = req;
  const bookingId = req.params.id;
  const { id: mechanicId, role } = req.user;

  if (role !== 'mechanic') return res.status(403).json({ success: false, message: 'Access denied.' });

  try {
    let booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);
    if (!booking) return res.status(404).json({ success: false, message: 'Standard booking not found.' });

    if (booking.assigned_mechanic_id !== mechanicId) return res.status(403).json({ success: false, message: 'Access denied.' });

    if (!isValidTransition(booking.status, 'service_started', false)) {
      return res.status(400).json({ success: false, message: `Invalid transition to service_started.` });
    }

    updateStatus(db, bookingId, booking.status, 'service_started', 'mechanic', 'Service repair has started.');

    if (booking.user_id) {
      sendNotification({
        db, io,
        type: 'service_started',
        title: 'Service Started',
        message: 'Your service repair work has officially started.',
        bookingId,
        targetRole: 'user',
        targetId: booking.user_id,
        socketEvent: 'serviceStarted',
        socketData: { bookingId }
      });
    }

    res.json({ success: true, message: 'Service work started.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to start service.', error: err.message });
  }
});

// PUT /api/mechanic/jobs/:id/complete - Mark service complete (Transition to Completed/Resolved)
router.put('/mechanic/jobs/:id/complete', verifyToken, (req, res) => {
  const { db, io } = req;
  const bookingId = req.params.id;
  const { id: mechanicId, role } = req.user;

  if (role !== 'mechanic') return res.status(403).json({ success: false, message: 'Access denied.' });

  try {
    let isEmergency = false;
    let booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);
    if (!booking) {
      booking = db.prepare('SELECT * FROM emergencies WHERE id = ?').get(bookingId);
      if (!booking) return res.status(404).json({ success: false, message: 'Job not found.' });
      isEmergency = true;
    }

    const assignedMechId = isEmergency ? booking.assigned_mechanic : booking.assigned_mechanic_id;
    if (assignedMechId !== mechanicId) return res.status(403).json({ success: false, message: 'Access denied.' });

    const nextStatus = isEmergency ? 'resolved' : 'completed';

    if (!isValidTransition(booking.status, nextStatus, isEmergency)) {
      return res.status(400).json({ success: false, message: `Invalid transition from ${booking.status} to completed/resolved.` });
    }

    db.transaction(() => {
      // Free mechanic
      db.prepare('UPDATE mechanics SET status = \'available\', current_booking_id = NULL WHERE id = ?').run(mechanicId);
      
      // Update booking completion & set payment pending/completed
      if (isEmergency) {
        db.prepare('UPDATE emergencies SET payment_status = \'Completed\' WHERE id = ?').run(bookingId); // Emergencies resolved immediately
      } else {
        db.prepare('UPDATE bookings SET payment_status = \'Pending\' WHERE id = ?').run(bookingId);
      }

      updateStatus(db, bookingId, booking.status, nextStatus, 'mechanic', 'Service resolved & completed by mechanic.', isEmergency);
    })();

    const targetUserId = isEmergency ? null : booking.user_id;
    if (targetUserId) {
      sendNotification({
        db, io,
        type: 'service_completed',
        title: 'Service Completed',
        message: 'Your service repair is complete. Please confirm completion & pay.',
        bookingId,
        targetRole: 'user',
        targetId: targetUserId,
        socketEvent: 'serviceCompleted',
        socketData: { bookingId }
      });
    }

    res.json({ success: true, message: 'Job completed successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to complete job.', error: err.message });
  }
});

// ==========================================
// 6. ETA Updates API
// ==========================================

// PUT /api/mechanic/jobs/:id/eta - Mechanic updates job ETA
router.put('/mechanic/jobs/:id/eta', verifyToken, (req, res) => {
  const { db, io } = req;
  const bookingId = req.params.id;
  const { etaMinutes } = req.body;
  const { id: mechanicId, role } = req.user;

  if (role !== 'mechanic') return res.status(403).json({ success: false, message: 'Access denied.' });
  if (!etaMinutes || isNaN(etaMinutes)) return res.status(400).json({ success: false, message: 'Valid etaMinutes is required.' });

  try {
    let isEmergency = false;
    let booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);
    if (!booking) {
      booking = db.prepare('SELECT * FROM emergencies WHERE id = ?').get(bookingId);
      if (!booking) return res.status(404).json({ success: false, message: 'Job not found.' });
      isEmergency = true;
    }

    const assignedMechId = isEmergency ? booking.assigned_mechanic : booking.assigned_mechanic_id;
    if (assignedMechId !== mechanicId) return res.status(403).json({ success: false, message: 'Access denied.' });

    const etaText = `${etaMinutes} mins`;

    db.transaction(() => {
      if (isEmergency) {
        db.prepare('UPDATE emergencies SET eta = ?, eta_minutes = ?, updated_time = CURRENT_TIMESTAMP WHERE id = ?')
          .run(etaText, etaMinutes, bookingId);
      } else {
        db.prepare('UPDATE bookings SET estimated_arrival = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
          .run(etaText, bookingId);
      }

      db.prepare(`
        INSERT INTO booking_history (id, booking_id, old_status, new_status, updated_by, remarks)
        VALUES (?, ?, ?, ?, 'mechanic', ?)
      `).run(uuidv4(), bookingId, booking.status, booking.status, `Updated ETA to ${etaMinutes} minutes`);
    })();

    const targetUserId = isEmergency ? null : booking.user_id;
    if (targetUserId) {
      sendNotification({
        db, io,
        type: 'eta_updated',
        title: 'ETA Updated',
        message: `Your mechanic will arrive in approximately ${etaMinutes} minutes.`,
        bookingId,
        targetRole: 'user',
        targetId: targetUserId,
        socketEvent: 'etaUpdated',
        socketData: { bookingId, etaMinutes }
      });
    }

    res.json({ success: true, message: 'ETA updated successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update ETA.', error: err.message });
  }
});

// ==========================================
// 7. Live Location tracking
// ==========================================

// PUT /api/mechanic/location - Mechanic updates current GPS coordinates
router.put('/mechanic/location', verifyToken, (req, res) => {
  const { db, io } = req;
  const { latitude, longitude } = req.body;
  const { id: mechanicId, role } = req.user;

  if (role !== 'mechanic') return res.status(403).json({ success: false, message: 'Access denied.' });
  if (latitude === undefined || longitude === undefined) {
    return res.status(400).json({ success: false, message: 'latitude and longitude are required.' });
  }

  try {
    db.prepare(`
      INSERT INTO mechanic_locations (mechanic_id, latitude, longitude, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(mechanic_id) DO UPDATE SET 
        latitude = excluded.latitude,
        longitude = excluded.longitude,
        updated_at = CURRENT_TIMESTAMP
    `).run(mechanicId, latitude, longitude);

    // Broadcast live location to any listening rooms
    if (io) {
      io.emit('mechanicLocationUpdated', { mechanicId, latitude, longitude });
    }

    res.json({ success: true, message: 'GPS coordinates updated successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update location.', error: err.message });
  }
});

// GET /api/bookings/:id/location - Return latest mechanic location
router.get('/bookings/:id/location', verifyToken, (req, res) => {
  const { db } = req;
  const bookingId = req.params.id;

  try {
    let booking = db.prepare('SELECT assigned_mechanic_id FROM bookings WHERE id = ?').get(bookingId);
    let isEmergency = false;
    if (!booking) {
      booking = db.prepare('SELECT assigned_mechanic FROM emergencies WHERE id = ?').get(bookingId);
      isEmergency = true;
    }

    if (!booking) return res.status(404).json({ success: false, message: 'Job not found.' });

    const mechId = isEmergency ? booking.assigned_mechanic : booking.assigned_mechanic_id;
    if (!mechId) return res.status(400).json({ success: false, message: 'No mechanic currently assigned to this job.' });

    const location = db.prepare('SELECT * FROM mechanic_locations WHERE mechanic_id = ?').get(mechId);
    if (!location) return res.status(404).json({ success: false, message: 'No GPS data available for assigned mechanic.' });

    res.json({ success: true, location });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to get location.', error: err.message });
  }
});

// ==========================================
// 8. SOS Dispatch Trigger (User Access)
// ==========================================

// POST /api/emergency/sos - Create emergency SOS and trigger auto-dispatch
router.post('/emergency/sos', async (req, res) => {
  const { db, io } = req;
  const {
    customer_name, phone, email, vehicle, vehicle_number,
    emergency_type, latitude, longitude, address, notes
  } = req.body;

  if (!customer_name || !phone || !vehicle || !vehicle_number || !emergency_type || !latitude || !longitude) {
    return res.status(400).json({ error: 'Missing required emergency details or GPS location.' });
  }

  try {
    // 1. Create emergency record inside DB using existing EmergencyDb controller
    const emergencyId = `RR-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const price = 1499; // Standard base price for priority SOS

    const data = {
      id: emergencyId,
      customer_name,
      phone,
      email: email || '',
      vehicle,
      vehicle_number,
      emergency_type,
      price,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      address: address || 'Ahmedabad, India',
      notes: notes || '',
      priority: 'Critical',
      status: 'Pending',
      payment_method: 'UPI',
      payment_status: 'Pending'
    };

    const emergency = await EmergencyDb.create(data, db);

    // Notify admins immediately via Socket
    sendNotification({
      db, io,
      type: 'new_emergency',
      title: 'CRITICAL SOS RECEIVED',
      message: `Emergency SOS from ${customer_name} for ${emergency_type}`,
      bookingId: emergencyId,
      targetRole: 'admin',
      socketEvent: 'emergencyCreated',
      socketData: { emergency }
    });

    // 2. Start Automatic Cascade Dispatch
    startSOSDispatch(db, io, emergencyId, parseFloat(latitude), parseFloat(longitude), true);

    res.status(201).json({ success: true, emergencyId, message: 'Critical SOS registered. Dispatch cascading initiated.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to register SOS request.', details: err.message });
  }
});

// GET /api/admin/emergencies - Admin emergency queue categorized & sorted
router.get('/admin/emergencies', verifyAdmin, (req, res) => {
  const { db } = req;
  const { status, priority } = req.query;

  try {
    let query = 'SELECT * FROM emergencies WHERE 1=1';
    const params = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    if (priority) {
      query += ' AND priority = ?';
      params.push(priority);
    }

    // Sort by Critical priority first, then creation time
    query += `
      ORDER BY 
        CASE priority 
          WHEN 'Critical' THEN 1 
          WHEN 'Urgent' THEN 2 
          ELSE 3 
        END ASC, 
        created_time DESC
    `;

    const emergencies = db.prepare(query).all(...params);
    res.json({ success: true, emergencies });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch emergencies.', error: err.message });
  }
});

// ==========================================
// 9. Booking Cancellation
// ==========================================

// POST /api/bookings/:id/cancel - Cancel booking
router.post('/bookings/:id/cancel', verifyToken, (req, res) => {
  const { db, io } = req;
  const bookingId = req.params.id;
  const { reason = 'Cancelled by user.' } = req.body;
  const { id: tokenUserId, role } = req.user;

  try {
    let isEmergency = false;
    let booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);
    if (!booking) {
      booking = db.prepare('SELECT * FROM emergencies WHERE id = ?').get(bookingId);
      if (!booking) return res.status(404).json({ success: false, message: 'Job not found.' });
      isEmergency = true;
    }

    // Rules:
    // User can cancel only before mechanic starts service (i.e. status not 'service_started' or 'completed')
    // Mechanic can cancel with reason
    // Admin can cancel anytime
    const currentStatusLower = booking.status.toLowerCase();
    if (role === 'user') {
      const bUserId = isEmergency ? null : booking.user_id;
      if (bUserId !== tokenUserId) return res.status(403).json({ success: false, message: 'Access denied.' });

      if (['service_started', 'completed', 'resolved'].includes(currentStatusLower)) {
        return res.status(400).json({ success: false, message: 'Cannot cancel booking after service has started or completed.' });
      }
    } else if (role === 'mechanic') {
      const assignedMechId = isEmergency ? booking.assigned_mechanic : booking.assigned_mechanic_id;
      if (assignedMechId !== tokenUserId) return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    // Cancel active timeouts
    cancelActiveDispatch(bookingId);

    db.transaction(() => {
      // Revert mechanic status if one was assigned
      const mechId = isEmergency ? booking.assigned_mechanic : booking.assigned_mechanic_id;
      if (mechId) {
        db.prepare('UPDATE mechanics SET status = \'available\', current_booking_id = NULL WHERE id = ?').run(mechId);
      }

      if (isEmergency) {
        db.prepare('UPDATE emergencies SET status = \'cancelled\', updated_time = CURRENT_TIMESTAMP WHERE id = ?').run(bookingId);
      } else {
        db.prepare(`
          UPDATE bookings 
          SET status = 'cancelled', cancelled_by = ?, cancel_reason = ?, cancelled_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
          WHERE id = ?
        `).run(role, reason, bookingId);
      }

      // Record to history
      db.prepare(`
        INSERT INTO booking_history (id, booking_id, old_status, new_status, updated_by, remarks)
        VALUES (?, ?, ?, 'cancelled', ?, ?)
      `).run(uuidv4(), bookingId, booking.status, role, `Cancelled. Reason: ${reason}`);
    })();

    // Notify other roles
    sendNotification({
      db, io,
      type: 'booking_cancelled',
      title: 'Booking Cancelled',
      message: `Booking ${bookingId} has been cancelled by ${role}. Reason: ${reason}`,
      bookingId,
      targetRole: 'admin',
      socketEvent: 'bookingUpdated',
      socketData: { bookingId, status: 'cancelled' }
    });

    res.json({ success: true, message: 'Booking cancelled successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to cancel booking.', error: err.message });
  }
});

// ==========================================
// 10. Refund Workflow
// ==========================================

// POST /api/bookings/:id/refund - User requests refund
router.post('/bookings/:id/refund', verifyToken, (req, res) => {
  const { db, io } = req;
  const bookingId = req.params.id;
  const { reason = 'Requesting refund.' } = req.body;
  const { id: tokenUserId } = req.user;

  try {
    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

    // Validate ownership
    if (booking.user_id !== tokenUserId) {
      return res.status(403).json({ success: false, message: 'Access denied. You do not own this booking.' });
    }

    // Must be completed & paid
    if (booking.status.toLowerCase() !== 'completed' && booking.status.toLowerCase() !== 'payment_completed') {
      return res.status(400).json({ success: false, message: 'Refunds can only be requested for completed bookings.' });
    }

    const refundId = `RF-${Date.now()}`;
    db.prepare(`
      INSERT INTO refund_requests (id, booking_id, user_id, amount, status, reason)
      VALUES (?, ?, ?, ?, 'requested', ?)
    `).run(refundId, bookingId, tokenUserId, booking.price, reason);

    sendNotification({
      db, io,
      type: 'refund_requested',
      title: 'Refund Request Created',
      message: `User ${tokenUserId} requested refund for booking ${bookingId}. Reason: ${reason}`,
      bookingId,
      targetRole: 'admin',
      socketEvent: 'paymentUpdated',
      socketData: { bookingId, refundId, status: 'requested' }
    });

    res.json({ success: true, message: 'Refund request submitted successfully.', refundId });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create refund request.', error: err.message });
  }
});

// PUT /api/admin/refunds/:id - Admin approves or rejects refund
router.put('/admin/refunds/:id', verifyAdmin, (req, res) => {
  const { db, io } = req;
  const refundId = req.params.id;
  const { status, remarks = '' } = req.body; // status: 'approved', 'rejected', 'completed'

  if (!['approved', 'rejected', 'completed'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid refund status.' });
  }

  try {
    const refund = db.prepare('SELECT * FROM refund_requests WHERE id = ?').get(refundId);
    if (!refund) return res.status(404).json({ success: false, message: 'Refund request not found.' });

    db.transaction(() => {
      db.prepare('UPDATE refund_requests SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(status, refundId);

      if (status === 'approved' || status === 'completed') {
        db.prepare('UPDATE bookings SET status = \'refunded\' WHERE id = ?').run(refund.booking_id);
        db.prepare(`
          INSERT INTO booking_history (id, booking_id, old_status, new_status, updated_by, remarks)
          VALUES (?, ?, 'completed', 'refunded', 'admin', ?)
        `).run(uuidv4(), refund.booking_id, `Refund approved. Remarks: ${remarks}`);
      }
    })();

    sendNotification({
      db, io,
      type: 'refund_updated',
      title: `Refund Request ${status.toUpperCase()}`,
      message: `Your refund request for booking ${refund.booking_id} has been ${status}.`,
      bookingId: refund.booking_id,
      targetRole: 'user',
      targetId: refund.user_id,
      socketEvent: 'paymentUpdated',
      socketData: { bookingId: refund.booking_id, refundId, status }
    });

    res.json({ success: true, message: `Refund request updated to ${status}.` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update refund request.', error: err.message });
  }
});

// ==========================================
// 11. Ratings & Reviews
// ==========================================

// POST /api/bookings/:id/review - User rates and reviews mechanic
router.post('/bookings/:id/review', verifyToken, (req, res) => {
  const { db } = req;
  const bookingId = req.params.id;
  const { rating, reviewText } = req.body;
  const { id: tokenUserId } = req.user;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ success: false, message: 'Valid rating (1-5) is required.' });
  }

  try {
    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

    if (booking.user_id !== tokenUserId) {
      return res.status(403).json({ success: false, message: 'Access denied. You do not own this booking.' });
    }

    if (!booking.assigned_mechanic_id) {
      return res.status(400).json({ success: false, message: 'No mechanic was assigned to this booking.' });
    }

    const reviewId = uuidv4();
    
    db.transaction(() => {
      // Store review
      db.prepare(`
        INSERT INTO reviews (id, booking_id, user_id, mechanic_id, rating, review_text)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(reviewId, bookingId, tokenUserId, booking.assigned_mechanic_id, rating, reviewText || '');

      // Recalculate average rating for mechanic
      const stats = db.prepare(`
        SELECT AVG(rating) as avgRating, COUNT(id) as count 
        FROM reviews 
        WHERE mechanic_id = ?
      `).get(booking.assigned_mechanic_id);

      const newAvgRating = parseFloat(stats.avgRating.toFixed(2));
      db.prepare('UPDATE mechanics SET rating = ? WHERE id = ?')
        .run(newAvgRating, booking.assigned_mechanic_id);
    })();

    res.json({ success: true, message: 'Review submitted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to submit review.', error: err.message });
  }
});

// GET /api/mechanics/:id/reviews - Return reviews for specific mechanic
router.get('/mechanics/:id/reviews', (req, res) => {
  const { db } = req;
  const mechanicId = req.params.id;

  try {
    const reviews = db.prepare(`
      SELECT r.*, u.name as reviewer_name 
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.mechanic_id = ?
      ORDER BY r.created_at DESC
    `).all(mechanicId);

    res.json({ success: true, reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch reviews.', error: err.message });
  }
});

// ==========================================
// 12. Dashboard Statistics API
// ==========================================

// GET /api/admin/dashboard/statistics - Admin dashboard stats
router.get('/admin/dashboard/statistics', verifyAdmin, (req, res) => {
  const { db } = req;

  try {
    const today = new Date().toISOString().slice(0, 10);

    // 1. Today's bookings count
    const todayBookings = db.prepare(`
      SELECT COUNT(*) as count FROM bookings 
      WHERE DATE(booking_time) = ?
    `).get(today).count;

    // 2. Completed / Pending jobs
    const completedCount = db.prepare(`SELECT COUNT(*) as count FROM bookings WHERE status = 'completed'`).get().count;
    const pendingCount = db.prepare(`SELECT COUNT(*) as count FROM bookings WHERE status = 'pending'`).get().count;

    // 3. Emergency SOS count
    const emergencyCount = db.prepare(`SELECT COUNT(*) as count FROM emergencies WHERE status != 'resolved'`).get().count;

    // 4. Cancelled count
    const cancelledCount = db.prepare(`SELECT COUNT(*) as count FROM bookings WHERE status = 'cancelled'`).get().count;

    // 5. Avg Response Time (estimated_arrival average or mock average based on data)
    // Coerce average from logs (time between Pending and Mechanic Assigned)
    const logs = db.prepare(`
      SELECT h1.booking_id, 
             julianday(h2.created_at) - julianday(h1.created_at) as diff_days
      FROM booking_history h1
      JOIN booking_history h2 ON h1.booking_id = h2.booking_id
      WHERE h1.new_status = 'pending' AND h2.new_status = 'mechanic_assigned'
    `).all();
    
    let avgResponseTimeMins = 12; // Standard fallback
    if (logs.length > 0) {
      const totalMins = logs.reduce((acc, curr) => acc + (curr.diff_days * 1440), 0);
      avgResponseTimeMins = parseFloat((totalMins / logs.length).toFixed(1));
    }

    // 6. Avg completion time (time between service_started and completed)
    const completionLogs = db.prepare(`
      SELECT h1.booking_id, 
             julianday(h2.created_at) - julianday(h1.created_at) as diff_days
      FROM booking_history h1
      JOIN booking_history h2 ON h1.booking_id = h2.booking_id
      WHERE h1.new_status = 'service_started' AND h2.new_status = 'completed'
    `).all();

    let avgCompletionTimeMins = 35; // Standard fallback
    if (completionLogs.length > 0) {
      const totalMins = completionLogs.reduce((acc, curr) => acc + (curr.diff_days * 1440), 0);
      avgCompletionTimeMins = parseFloat((totalMins / completionLogs.length).toFixed(1));
    }

    // 7. Mechanic utilization (percentage of approved mechanics currently busy)
    const activeMechs = db.prepare(`SELECT COUNT(*) as count FROM mechanics WHERE approval_status = 'approved'`).get().count;
    const busyMechs = db.prepare(`SELECT COUNT(*) as count FROM mechanics WHERE approval_status = 'approved' AND status = 'busy'`).get().count;
    const utilization = activeMechs > 0 ? parseFloat(((busyMechs / activeMechs) * 100).toFixed(1)) : 0;

    // 8. Revenue summary
    const revenue = db.prepare(`
      SELECT SUM(price) as total FROM bookings 
      WHERE status IN ('completed', 'payment_completed')
    `).get().total || 0;

    res.json({
      success: true,
      statistics: {
        todayBookings,
        completedJobs: completedCount,
        pendingJobs: pendingCount,
        emergencyCount,
        averageResponseTimeMinutes: avgResponseTimeMins,
        averageCompletionTimeMinutes: avgCompletionTimeMins,
        mechanicUtilizationPercentage: utilization,
        cancelledBookings: cancelledCount,
        totalRevenue: revenue
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch statistics.', error: err.message });
  }
});

export default router;
