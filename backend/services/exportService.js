/**
 * Export Service
 * Provides filtered data queries for CSV exports.
 */

export const exportService = {
  /**
   * Build WHERE clause from optional filters.
   * @param {Object} filters - Filter parameters.
   * @returns {{ clause: string, params: Array }} SQL WHERE fragment and params.
   */
  buildFilterClause(filters = {}) {
    let clause = 'WHERE 1=1';
    const params = [];

    if (filters.dateFrom) {
      clause += ' AND DATE(booking_time) >= DATE(?)';
      params.push(filters.dateFrom);
    }
    if (filters.dateTo) {
      clause += ' AND DATE(booking_time) <= DATE(?)';
      params.push(filters.dateTo);
    }
    if (filters.status) {
      clause += ' AND status = ?';
      params.push(filters.status);
    }
    if (filters.mechanicId) {
      clause += ' AND assigned_mechanic_id = ?';
      params.push(filters.mechanicId);
    }
    if (filters.userId) {
      clause += ' AND user_id = ?';
      params.push(filters.userId);
    }

    return { clause, params };
  },

  /**
   * Get bookings with optional filters.
   */
  getBookings(db, filters = {}) {
    const { clause, params } = this.buildFilterClause(filters);
    const query = `
      SELECT id, user_id, customer_name, phone, email, vehicle_type, vehicle_number,
             service_name, price, status, address, payment_method, payment_status,
             assigned_mechanic_id, booking_time, updated_at
      FROM bookings ${clause}
      ORDER BY booking_time DESC
    `;
    return db.prepare(query).all(...params);
  },

  /**
   * Get payments with optional filters (via bookings join).
   */
  getPayments(db, filters = {}) {
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (filters.dateFrom) {
      whereClause += ' AND DATE(p.created_at) >= DATE(?)';
      params.push(filters.dateFrom);
    }
    if (filters.dateTo) {
      whereClause += ' AND DATE(p.created_at) <= DATE(?)';
      params.push(filters.dateTo);
    }
    if (filters.status) {
      whereClause += ' AND p.status = ?';
      params.push(filters.status);
    }
    if (filters.mechanicId) {
      whereClause += ' AND b.assigned_mechanic_id = ?';
      params.push(filters.mechanicId);
    }
    if (filters.userId) {
      whereClause += ' AND b.user_id = ?';
      params.push(filters.userId);
    }

    const query = `
      SELECT p.id, p.booking_id, p.amount, p.method, p.status as payment_status,
             p.transaction_id, p.created_at,
             b.customer_name, b.service_name, b.phone
      FROM payments p
      LEFT JOIN bookings b ON p.booking_id = b.id
      ${whereClause}
      ORDER BY p.created_at DESC
    `;
    return db.prepare(query).all(...params);
  },

  /**
   * Get emergencies with optional filters.
   */
  getEmergencies(db, filters = {}) {
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (filters.dateFrom) {
      whereClause += ' AND DATE(created_time) >= DATE(?)';
      params.push(filters.dateFrom);
    }
    if (filters.dateTo) {
      whereClause += ' AND DATE(created_time) <= DATE(?)';
      params.push(filters.dateTo);
    }
    if (filters.status) {
      whereClause += ' AND status = ?';
      params.push(filters.status);
    }

    const query = `
      SELECT id, customer_name, phone, email, vehicle, vehicle_number,
             emergency_type, price, status, priority, address,
             assigned_mechanic, payment_status, created_time, updated_time
      FROM emergencies
      ${whereClause}
      ORDER BY created_time DESC
    `;
    return db.prepare(query).all(...params);
  },
};
