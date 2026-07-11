import { BaseRepository } from './baseRepository.js';

/**
 * ActiveJob Repository - Data access layer for active_jobs table.
 * Tracks real-time mechanic job assignments and locations.
 */
export class ActiveJobRepository extends BaseRepository {
  constructor(db) {
    super(db, 'active_jobs');
  }

  /** Find active job for a mechanic */
  findActiveByMechanic(mechanicId) {
    return this.rawOne(
      `SELECT * FROM active_jobs WHERE mechanic_id = ? AND status IN ('assigned', 'in_progress') ORDER BY assigned_at DESC LIMIT 1`,
      [mechanicId]
    );
  }

  /** Find active job by booking ID */
  findActiveByBooking(bookingId) {
    return this.rawOne(
      `SELECT * FROM active_jobs WHERE booking_id = ? AND status IN ('assigned', 'in_progress') LIMIT 1`,
      [bookingId]
    );
  }

  /** Find active job by emergency ID */
  findActiveByEmergency(emergencyId) {
    return this.rawOne(
      `SELECT * FROM active_jobs WHERE emergency_id = ? AND status IN ('assigned', 'in_progress') LIMIT 1`,
      [emergencyId]
    );
  }

  /** Create a new active job assignment */
  assign(data) {
    const id = `aj-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    return this.create({
      id,
      booking_id: data.bookingId,
      mechanic_id: data.mechanicId,
      emergency_id: data.emergencyId || null,
      assigned_at: new Date().toISOString(),
      status: 'assigned',
      eta: data.eta || null,
      eta_minutes: data.etaMinutes || null,
      ...data
    });
  }

  /** Start an active job (mechanic en route) */
  startJob(id) {
    return this.update(id, {
      status: 'in_progress',
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  }

  /** Complete an active job */
  completeJob(id) {
    return this.update(id, {
      status: 'completed',
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  }

  /** Cancel an active job */
  cancelJob(id) {
    return this.update(id, {
      status: 'cancelled',
      updated_at: new Date().toISOString()
    });
  }

  /** Update mechanic location for a job */
  updateLocation(id, latitude, longitude) {
    return this.update(id, {
      current_latitude: latitude,
      current_longitude: longitude,
      updated_at: new Date().toISOString()
    });
  }

  /** Update ETA for a job */
  updateETA(id, eta, etaMinutes) {
    return this.update(id, {
      eta,
      eta_minutes: etaMinutes,
      updated_at: new Date().toISOString()
    });
  }

  /** Get all active jobs (for admin dashboard) */
  findAllActive() {
    return this.raw(`
      SELECT aj.*, 
        m.name as mechanic_name, m.phone as mechanic_phone,
        b.customer_name, b.service_name, b.phone as customer_phone
      FROM active_jobs aj
      LEFT JOIN mechanics m ON aj.mechanic_id = m.id
      LEFT JOIN bookings b ON aj.booking_id = b.id
      WHERE aj.status IN ('assigned', 'in_progress')
      ORDER BY aj.assigned_at DESC
    `);
  }

  /** Get job history for a mechanic */
  getMechanicHistory(mechanicId, limit = 20) {
    return this.raw(
      `SELECT * FROM active_jobs WHERE mechanic_id = ? ORDER BY assigned_at DESC LIMIT ?`,
      [mechanicId, limit]
    );
  }
}
