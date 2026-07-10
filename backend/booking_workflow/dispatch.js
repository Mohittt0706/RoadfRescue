import { v4 as uuidv4 } from 'uuid';
import { sendNotification } from './notifications.js';

// In-memory registry of active timeouts to prevent duplicate triggers
const activeDispatchTimeouts = new Map();

/**
 * Calculates distance between two coordinates in kilometers using Haversine formula
 */
export function getHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Finds all approved and available mechanics sorted by eligibility
 */
export function findEligibleMechanics(db, lat, lng) {
  // Get all approved mechanics
  const mechanics = db.prepare(`
    SELECT id, name, rating, status, total_jobs, latitude, longitude 
    FROM mechanics 
    WHERE approval_status = 'approved' AND status != 'blocked'
  `).all();

  // Get active location overrides from mechanic_locations
  const locations = db.prepare(`SELECT * FROM mechanic_locations`).all();
  const locationMap = new Map(locations.map(loc => [loc.mechanic_id, loc]));

  const enriched = mechanics.map(mech => {
    // Determine the best available location coordinates
    const override = locationMap.get(mech.id);
    const mLat = override ? override.latitude : mech.latitude;
    const mLng = override ? override.longitude : mech.longitude;

    const distance = (lat !== undefined && lng !== undefined && mLat !== undefined && mLng !== undefined) 
      ? getHaversineDistance(lat, lng, mLat, mLng) 
      : 99999; // Fallback if locations are missing

    return {
      ...mech,
      distance,
      // Coerce status: available mechanics are prioritized
      isAvailable: mech.status === 'available' ? 1 : 0
    };
  });

  // Sorting priorities:
  // 1. Available first (isAvailable desc)
  // 2. Nearest distance first (distance asc)
  // 3. Highest rating first (rating desc)
  // 4. Least total jobs first (total_jobs asc)
  enriched.sort((a, b) => {
    if (b.isAvailable !== a.isAvailable) {
      return b.isAvailable - a.isAvailable;
    }
    if (Math.abs(a.distance - b.distance) > 0.1) {
      return a.distance - b.distance;
    }
    if (b.rating !== a.rating) {
      return b.rating - a.rating;
    }
    return a.total_jobs - b.total_jobs;
  });

  return enriched;
}

/**
 * Starts the cascading SOS dispatch process for emergencies or high-priority bookings
 */
export function startSOSDispatch(db, io, bookingId, lat, lng, isEmergency = false) {
  console.log(`Starting SOS dispatch for ${isEmergency ? 'Emergency' : 'Booking'} ID: ${bookingId}`);
  
  // Clear any existing timeout for this booking
  if (activeDispatchTimeouts.has(bookingId)) {
    clearTimeout(activeDispatchTimeouts.get(bookingId));
    activeDispatchTimeouts.delete(bookingId);
  }

  const eligibleMechanics = findEligibleMechanics(db, lat, lng);
  if (eligibleMechanics.length === 0) {
    console.log(`No mechanics available for SOS dispatch of Booking ID: ${bookingId}`);
    return false;
  }

  const mechanicQueue = eligibleMechanics.map(m => m.id);
  dispatchNextMechanic(db, io, bookingId, mechanicQueue, isEmergency);
  return true;
}

/**
 * Dispatches the next mechanic in the queue
 */
export function dispatchNextMechanic(db, io, bookingId, queue, isEmergency) {
  // If queue is empty, no mechanics could be assigned
  if (queue.length === 0) {
    console.log(`SOS Dispatch cascade exhausted for Booking ID: ${bookingId}. No mechanics accepted.`);
    
    // Set status back to pending / admin_review
    const finalStatus = isEmergency ? 'pending' : 'admin_review';
    db.prepare('UPDATE bookings SET status = ?, assigned_mechanic_id = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(finalStatus, bookingId);
    
    db.prepare(`
      INSERT INTO booking_history (id, booking_id, old_status, new_status, updated_by, remarks)
      VALUES (?, ?, ?, ?, 'system', 'SOS dispatch cascade exhausted. No available mechanic accepted.')
    `).run(uuidv4(), bookingId, isEmergency ? 'assigned' : 'mechanic_assigned', finalStatus);

    sendNotification({
      db, io,
      type: 'dispatch_failed',
      title: 'SOS Dispatch Failed',
      message: `No available mechanics accepted the SOS dispatch for booking ${bookingId}.`,
      bookingId,
      targetRole: 'admin',
      socketEvent: 'bookingUpdated',
      socketData: { bookingId, status: finalStatus }
    });

    return;
  }

  const currentMechanicId = queue[0];
  const remainingQueue = queue.slice(1);

  // Check if booking/emergency is still active and needs a mechanic
  const table = isEmergency ? 'emergencies' : 'bookings';
  const booking = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(bookingId);

  if (!booking) {
    console.log(`Booking ${bookingId} not found. Terminating dispatch cascade.`);
    return;
  }

  // If already accepted, cancelled, resolved, or completed, stop cascading
  const currentStatus = booking.status.toLowerCase();
  if (['accepted', 'completed', 'resolved', 'cancelled', 'service_started', 'arrived', 'en_route'].includes(currentStatus)) {
    console.log(`Booking ${bookingId} has status '${booking.status}'. Terminating dispatch cascade.`);
    return;
  }

  console.log(`Dispatching Booking ${bookingId} to Mechanic: ${currentMechanicId}`);

  db.transaction(() => {
    // 1. Create a booking assignment record
    const assignmentId = uuidv4();
    db.prepare(`
      INSERT INTO booking_assignment (id, booking_id, mechanic_id, status)
      VALUES (?, ?, ?, 'pending')
    `).run(assignmentId, bookingId, currentMechanicId);

    // 2. Assign the mechanic and update status
    const newStatus = isEmergency ? 'assigned' : 'mechanic_assigned';
    
    if (isEmergency) {
      db.prepare('UPDATE emergencies SET status = ?, assigned_mechanic = ?, updated_time = CURRENT_TIMESTAMP WHERE id = ?')
        .run(newStatus, currentMechanicId, bookingId);
    } else {
      db.prepare('UPDATE bookings SET status = ?, assigned_mechanic_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(newStatus, currentMechanicId, bookingId);
    }

    // 3. Record history log
    db.prepare(`
      INSERT INTO booking_history (id, booking_id, old_status, new_status, updated_by, remarks)
      VALUES (?, ?, ?, ?, 'system', ?)
    `).run(uuidv4(), bookingId, booking.status, newStatus, `Auto-assigned to mechanic ${currentMechanicId}`);
  })();

  // 4. Send Notifications
  const mechanic = db.prepare('SELECT name FROM mechanics WHERE id = ?').get(currentMechanicId);
  
  sendNotification({
    db, io,
    type: 'mechanic_assigned',
    title: 'New Emergency Assigned',
    message: isEmergency 
      ? `High-priority SOS emergency assigned to you. Please accept or reject immediately.`
      : `New roadside assistance booking assigned to you.`,
    bookingId,
    targetRole: 'mechanic',
    targetId: currentMechanicId,
    socketEvent: isEmergency ? 'emergencyAssigned' : 'bookingAssigned',
    socketData: { bookingId, mechanicId: currentMechanicId, mechanicName: mechanic?.name }
  });

  // Notify user
  if (booking.user_id) {
    sendNotification({
      db, io,
      type: 'booking_updated',
      title: 'Mechanic Assigned',
      message: `Mechanic ${mechanic?.name || 'Partner'} has been assigned to your request.`,
      bookingId,
      targetRole: 'user',
      targetId: booking.user_id,
      socketEvent: 'bookingUpdated',
      socketData: { bookingId, status: isEmergency ? 'assigned' : 'mechanic_assigned' }
    });
  }

  // 5. Start dispatch timer (45 seconds timeout)
  const timeoutId = setTimeout(() => {
    activeDispatchTimeouts.delete(bookingId);
    handleAssignmentTimeout(db, io, bookingId, currentMechanicId, remainingQueue, isEmergency);
  }, 45000);

  activeDispatchTimeouts.set(bookingId, timeoutId);
}

/**
 * Handles the timeout when a mechanic fails to accept the assignment in time
 */
function handleAssignmentTimeout(db, io, bookingId, mechanicId, remainingQueue, isEmergency) {
  const table = isEmergency ? 'emergencies' : 'bookings';
  const booking = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(bookingId);
  
  if (!booking) return;

  // Verify that the mechanic is still assigned and has not accepted/declined
  const isCurrentlyAssigned = isEmergency 
    ? booking.assigned_mechanic === mechanicId 
    : booking.assigned_mechanic_id === mechanicId;

  if (isCurrentlyAssigned && booking.status.toLowerCase() === (isEmergency ? 'assigned' : 'mechanic_assigned')) {
    console.log(`Assignment for Booking ${bookingId} to Mechanic ${mechanicId} has TIMED OUT.`);

    db.transaction(() => {
      // Mark assignment as expired
      db.prepare(`
        UPDATE booking_assignment 
        SET status = 'expired', responded_at = CURRENT_TIMESTAMP 
        WHERE booking_id = ? AND mechanic_id = ? AND status = 'pending'
      `).run(bookingId, mechanicId);

      // Record history
      db.prepare(`
        INSERT INTO booking_history (id, booking_id, old_status, new_status, updated_by, remarks)
        VALUES (?, ?, ?, ?, 'system', ?)
      `).run(uuidv4(), bookingId, booking.status, booking.status, `Assignment to ${mechanicId} expired (no response within 45s).`);
    })();

    // Notify mechanic of expired job
    sendNotification({
      db, io,
      type: 'assignment_expired',
      title: 'Job Request Expired',
      message: 'The assigned job request has expired due to inactivity.',
      bookingId,
      targetRole: 'mechanic',
      targetId: mechanicId,
      socketEvent: 'bookingUpdated',
      socketData: { bookingId, status: 'expired' }
    });

    // Cascade to next mechanic in queue
    dispatchNextMechanic(db, io, bookingId, remainingQueue, isEmergency);
  }
}

/**
 * Cancels active dispatch timeouts for a booking (e.g. when accepted or cancelled)
 */
export function cancelActiveDispatch(bookingId) {
  if (activeDispatchTimeouts.has(bookingId)) {
    clearTimeout(activeDispatchTimeouts.get(bookingId));
    activeDispatchTimeouts.delete(bookingId);
    console.log(`Cancelled active dispatch timeout for Booking ID: ${bookingId}`);
  }
}
