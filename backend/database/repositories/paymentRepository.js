import { BaseRepository } from './baseRepository.js';

/**
 * Payment Repository - Data access layer for payments table.
 */
export class PaymentRepository extends BaseRepository {
  constructor(db) {
    super(db, 'payments');
  }

  /** Find payments by booking ID */
  findByBookingId(bookingId) {
    return this.findAll({ booking_id: bookingId }, { orderBy: 'created_at DESC' });
  }

  /** Get payment statistics */
  getStats() {
    const today = this.db.prepare(
      "SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE DATE(created_at) = DATE('now') AND status = 'Completed'"
    ).get().total;

    const month = this.db.prepare(
      "SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now') AND status = 'Completed'"
    ).get().total;

    const total = this.db.prepare(
      "SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'Completed'"
    ).get().total;

    const methodBreakdown = this.db.prepare(`
      SELECT method, COUNT(*) as count, SUM(amount) as total
      FROM payments WHERE status = 'Completed'
      GROUP BY method
    `).all();

    return { today, month, total, methodBreakdown };
  }

  /** Get payments with booking details for export */
  findWithBookingDetails(filters = {}) {
    let query = `
      SELECT p.*, b.customer_name, b.service_name, b.phone, b.vehicle_number
      FROM payments p
      LEFT JOIN bookings b ON p.booking_id = b.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.dateFrom) {
      query += ' AND p.created_at >= ?';
      params.push(filters.dateFrom);
    }
    if (filters.dateTo) {
      query += ' AND p.created_at <= ?';
      params.push(filters.dateTo);
    }
    if (filters.status) {
      query += ' AND p.status = ?';
      params.push(filters.status);
    }

    query += ' ORDER BY p.created_at DESC';
    return this.db.prepare(query).all(...params);
  }
}
