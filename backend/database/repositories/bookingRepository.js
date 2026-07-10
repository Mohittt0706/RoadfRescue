import { BaseRepository } from './baseRepository.js';

/**
 * Booking Repository - Data access layer for bookings table.
 */
export class BookingRepository extends BaseRepository {
  constructor(db) {
    super(db, 'bookings');
  }

  /** Find bookings with role-based filtering */
  findByRole(role, userId, options = {}) {
    const { status, search, page = 1, limit = 50 } = options;
    const offset = (page - 1) * limit;
    let query = 'SELECT * FROM bookings WHERE 1=1';
    const params = [];

    if (role === 'user') {
      query += ' AND user_id = ?';
      params.push(userId);
    } else if (role === 'mechanic') {
      query += ' AND assigned_mechanic_id = ?';
      params.push(userId);
    }

    if (status && status !== 'all') {
      query += ' AND status = ?';
      params.push(status);
    }

    if (search) {
      query += ' AND (customer_name LIKE ? OR phone LIKE ? OR id LIKE ? OR vehicle_number LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as count');
    const total = this.db.prepare(countQuery).get(...params).count;

    query += ' ORDER BY booking_time DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const data = this.db.prepare(query).all(...params);
    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    };
  }

  /** Find booking with all related data (logs, payments, mechanic) */
  findByIdWithDetails(id) {
    const booking = this.findById(id);
    if (!booking) return null;

    const logs = this.db.prepare(
      'SELECT * FROM booking_logs WHERE booking_id = ? ORDER BY created_at ASC'
    ).all(id);

    const payments = this.db.prepare(
      'SELECT * FROM payments WHERE booking_id = ? ORDER BY created_at DESC'
    ).all(id);

    let mechanic = null;
    if (booking.assigned_mechanic_id) {
      mechanic = this.db.prepare(
        'SELECT id, name, phone, email, specialization, rating FROM mechanics WHERE id = ?'
      ).get(booking.assigned_mechanic_id);
    }

    return { booking, logs, payments, mechanic };
  }

  /** Get dashboard statistics */
  getDashboardStats() {
    const stats = this.db.prepare(`
      SELECT
        COUNT(*) as totalBookings,
        SUM(CASE WHEN DATE(booking_time) = DATE('now') THEN 1 ELSE 0 END) as todayBookings,
        SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pendingJobs,
        SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completedJobs,
        SUM(CASE WHEN status = 'Accepted' THEN 1 ELSE 0 END) as acceptedJobs,
        SUM(CASE WHEN payment_status = 'Paid' AND DATE(booking_time) = DATE('now') THEN price ELSE 0 END) as revenueToday,
        SUM(CASE WHEN payment_status = 'Paid' AND strftime('%Y-%m', booking_time) = strftime('%Y-%m', 'now') THEN price ELSE 0 END) as revenueMonth
      FROM bookings
    `).get();

    const mechanics = this.db.prepare(`
      SELECT
        SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as availableMechanics,
        SUM(CASE WHEN status = 'busy' THEN 1 ELSE 0 END) as busyMechanics
      FROM mechanics
    `).get();

    const unreadNotifications = this.db.prepare(
      "SELECT COUNT(*) as count FROM notifications WHERE target_role = 'admin' AND read = 0"
    ).get().count;

    return { ...stats, ...mechanics, unreadNotifications };
  }

  /** Get chart data for dashboard */
  getChartData() {
    const bookingsPerDay = this.db.prepare(`
      SELECT DATE(booking_time) as date, COUNT(*) as count
      FROM bookings
      WHERE booking_time >= datetime('now', '-7 days')
      GROUP BY DATE(booking_time)
      ORDER BY date ASC
    `).all();

    const serviceDistribution = this.db.prepare(`
      SELECT service_name as service, COUNT(*) as count, SUM(price) as revenue
      FROM bookings
      GROUP BY service_name
    `).all();

    const revenueGraph = this.db.prepare(`
      SELECT DATE(booking_time) as date, SUM(price) as revenue
      FROM bookings
      WHERE booking_time >= datetime('now', '-7 days') AND payment_status = 'Paid'
      GROUP BY DATE(booking_time)
      ORDER BY date ASC
    `).all();

    return { bookingsPerDay, serviceDistribution, revenueGraph };
  }

  /** Update booking status with audit */
  updateStatus(id, status, note, role) {
    const booking = this.findById(id);
    this.update(id, { status, updated_at: new Date().toISOString() });
    
    this.db.prepare(`
      INSERT INTO booking_logs (id, booking_id, status, note, created_by)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      id, status, note || `Status updated to ${status}`, role
    );

    if (status === 'Completed') {
      this.update(id, { payment_status: 'Paid' });
    }

    return this.findById(id);
  }

  /** Assign mechanic to booking */
  assignMechanic(bookingId, mechanicId) {
    this.update(bookingId, { 
      assigned_mechanic_id: mechanicId, 
      status: 'Accepted',
      updated_at: new Date().toISOString() 
    });
    
    this.db.prepare(
      "UPDATE mechanics SET status = 'busy', current_booking_id = ?, updated_at = datetime('now') WHERE id = ?"
    ).run(bookingId, mechanicId);
    
    return this.findById(bookingId);
  }
}
