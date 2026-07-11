import { v4 as uuidv4 } from 'uuid';

/**
 * Active Job Service
 *
 * Manages real-time job lifecycle:
 * - Assignment (booking or emergency)
 * - Status tracking (assigned -> in_progress -> completed)
 * - Location updates
 * - ETA management
 *
 * Automatically updates related entities (bookings, mechanics, emergencies).
 */
export class ActiveJobService {
  constructor(db, repositories) {
    this.db = db;
    this.repos = repositories;
  }

  /**
   * Assign a mechanic to a booking. Creates an active job record.
   */
  assignToBooking(bookingId, mechanicId, options = {}) {
    const booking = this.repos.bookings.findById(bookingId);
    const mechanic = this.repos.mechanics.findById(mechanicId);

    if (!booking) throw new Error('Booking not found');
    if (!mechanic) throw new Error('Mechanic not found');
    if (mechanic.status === 'busy') throw new Error('Mechanic is currently busy');

    // Create active job
    const job = this.repos.activeJobs.assign({
      bookingId,
      mechanicId,
      eta: options.eta || '15-20 mins',
      etaMinutes: options.etaMinutes || 18
    });

    // Update booking
    this.repos.bookings.update(bookingId, {
      assigned_mechanic_id: mechanicId,
      status: 'Accepted',
      updated_at: new Date().toISOString()
    });

    // Update mechanic status
    this.repos.mechanics.update(mechanicId, {
      status: 'busy',
      current_booking_id: bookingId,
      updated_at: new Date().toISOString()
    });

    return { job, booking: this.repos.bookings.findById(bookingId), mechanic };
  }

  /**
   * Assign a mechanic to an emergency. Creates an active job record.
   */
  assignToEmergency(emergencyId, mechanicName, options = {}) {
    const emergency = this.repos.emergencies.findById(emergencyId);
    if (!emergency) throw new Error('Emergency not found');

    // Create active job
    const job = this.repos.activeJobs.assign({
      bookingId: null,
      mechanicId: null,
      emergencyId,
      eta: options.eta || emergency.eta,
      etaMinutes: options.etaMinutes || emergency.eta_minutes
    });

    // Update emergency
    this.repos.emergencies.assignMechanic(emergencyId, mechanicName, options.eta, options.price);

    return { job, emergency: this.repos.emergencies.findById(emergencyId) };
  }

  /**
   * Mechanic starts the job (en route).
   */
  startJob(jobId) {
    const job = this.repos.activeJobs.startJob(jobId);
    if (job.booking_id) {
      this.repos.bookings.updateStatus(job.booking_id, 'Accepted', 'Mechanic en route', 'system');
    }
    return job;
  }

  /**
   * Mechanic arrives at location.
   */
  arriveAtLocation(jobId) {
    const job = this.repos.activeJobs.findById(jobId);
    if (!job) throw new Error('Active job not found');

    if (job.booking_id) {
      this.repos.bookings.updateStatus(job.booking_id, 'Arrived', 'Mechanic arrived at location', 'system');
    }
    return job;
  }

  /**
   * Complete the job.
   */
  completeJob(jobId) {
    const job = this.repos.activeJobs.completeJob(jobId);
    if (!job) throw new Error('Active job not found');

    // Update booking if applicable
    if (job.booking_id) {
      this.repos.bookings.update(job.booking_id, {
        status: 'Completed',
        payment_status: 'Paid',
        updated_at: new Date().toISOString()
      });

      // Log the completion
      this.db.prepare(`
        INSERT INTO booking_logs (id, booking_id, status, note, created_by)
        VALUES (?, ?, 'Completed', 'Job completed', 'system')
      `).run(`log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`, job.booking_id);
    }

    // Free up the mechanic
    if (job.mechanic_id) {
      this.repos.mechanics.update(job.mechanic_id, {
        status: 'available',
        current_booking_id: null,
        updated_at: new Date().toISOString()
      });
      this.repos.mechanics.incrementJobs(job.mechanic_id);
    }

    return this.repos.activeJobs.findById(jobId);
  }

  /**
   * Cancel an active job.
   */
  cancelJob(jobId, reason = 'Cancelled') {
    const job = this.repos.activeJobs.cancelJob(jobId);
    if (!job) throw new Error('Active job not found');

    if (job.booking_id) {
      this.repos.bookings.updateStatus(job.booking_id, 'Cancelled', reason, 'system');
    }

    if (job.mechanic_id) {
      this.repos.mechanics.update(job.mechanic_id, {
        status: 'available',
        current_booking_id: null,
        updated_at: new Date().toISOString()
      });
    }

    return this.repos.activeJobs.findById(jobId);
  }

  /**
   * Update mechanic's real-time location.
   */
  updateLocation(jobId, latitude, longitude) {
    return this.repos.activeJobs.updateLocation(jobId, latitude, longitude);
  }

  /**
   * Update job ETA.
   */
  updateETA(jobId, eta, etaMinutes) {
    return this.repos.activeJobs.updateETA(jobId, eta, etaMinutes);
  }

  /**
   * Get all active jobs (admin dashboard).
   */
  getActiveJobs() {
    return this.repos.activeJobs.findAllActive();
  }

  /**
   * Get job history for a mechanic.
   */
  getMechanicJobHistory(mechanicId, limit = 20) {
    return this.repos.activeJobs.getMechanicHistory(mechanicId, limit);
  }
}
