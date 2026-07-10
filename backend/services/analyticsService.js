/**
 * Analytics Service
 * Provides analytics queries for admin dashboard.
 */

export const analyticsService = {
  /**
   * Service analytics: most/least requested, completed/cancelled, avg completion time.
   */
  getServiceAnalytics(db) {
    const mostRequested = db.prepare(`
      SELECT service_name, COUNT(*) as count
      FROM bookings GROUP BY service_name ORDER BY count DESC LIMIT 1
    `).get();

    const leastRequested = db.prepare(`
      SELECT service_name, COUNT(*) as count
      FROM bookings GROUP BY service_name ORDER BY count ASC LIMIT 1
    `).get();

    const completedBookings = db.prepare(
      "SELECT COUNT(*) as count FROM bookings WHERE status = 'Completed'"
    ).get().count;

    const cancelledBookings = db.prepare(
      "SELECT COUNT(*) as count FROM bookings WHERE status = 'Cancelled'"
    ).get().count;

    // Average completion time from booking_logs (Pending -> Completed)
    const avgCompletionTime = db.prepare(`
      SELECT AVG(julianday(cl.created_at) - julianday(bl.created_at)) * 24 * 60 AS avg_minutes
      FROM booking_logs bl
      JOIN booking_logs cl ON bl.booking_id = cl.booking_id
      WHERE bl.status = 'Pending' AND cl.status = 'Completed'
        AND bl.created_at < cl.created_at
    `).get();

    const serviceDistribution = db.prepare(`
      SELECT service_name, COUNT(*) as count, SUM(price) as revenue
      FROM bookings GROUP BY service_name ORDER BY count DESC
    `).all();

    return {
      mostRequested: mostRequested || { service_name: 'N/A', count: 0 },
      leastRequested: leastRequested || { service_name: 'N/A', count: 0 },
      completedBookings,
      cancelledBookings,
      averageCompletionTime: avgCompletionTime?.avg_minutes
        ? Math.round(avgCompletionTime.avg_minutes) + ' min'
        : 'N/A',
      serviceDistribution,
    };
  },

  /**
   * Mechanic analytics: total, available, busy, completed jobs, avg rating, avg response.
   */
  getMechanicAnalytics(db) {
    const totalMechanics = db.prepare('SELECT COUNT(*) as count FROM mechanics').get().count;
    const availableMechanics = db.prepare(
      "SELECT COUNT(*) as count FROM mechanics WHERE status = 'available'"
    ).get().count;
    const busyMechanics = db.prepare(
      "SELECT COUNT(*) as count FROM mechanics WHERE status = 'busy'"
    ).get().count;

    const completedJobs = db.prepare(
      "SELECT COALESCE(SUM(total_jobs), 0) as total FROM mechanics"
    ).get().total;

    const avgRating = db.prepare(
      'SELECT COALESCE(AVG(rating), 0) as avg_rating FROM mechanics'
    ).get().avg_rating;

    // Average response time: time from booking creation to mechanic acceptance
    const avgResponseTime = db.prepare(`
      SELECT AVG(julianday(bl.created_at) - julianday(b.booking_time)) * 24 * 60 AS avg_minutes
      FROM bookings b
      JOIN booking_logs bl ON b.id = bl.booking_id
      WHERE bl.status = 'Accepted'
        AND b.assigned_mechanic_id IS NOT NULL
    `).get();

    const mechanicsBySpecialization = db.prepare(`
      SELECT specialization, COUNT(*) as count, AVG(rating) as avg_rating
      FROM mechanics GROUP BY specialization
    `).all();

    return {
      totalMechanics,
      availableMechanics,
      busyMechanics,
      completedJobs,
      averageRating: Number(avgRating.toFixed(2)),
      averageResponseTime: avgResponseTime?.avg_minutes
        ? Math.round(avgResponseTime.avg_minutes) + ' min'
        : 'N/A',
      mechanicsBySpecialization,
    };
  },

  /**
   * Revenue analytics with period grouping.
   * @param {'daily'|'weekly'|'monthly'|'yearly'} period
   */
  getRevenueAnalytics(db, period = 'daily') {
    let groupBy, dateFormat;
    switch (period) {
      case 'weekly':
        groupBy = "strftime('%Y-W%W', booking_time)";
        dateFormat = 'Week';
        break;
      case 'monthly':
        groupBy = "strftime('%Y-%m', booking_time)";
        dateFormat = 'Month';
        break;
      case 'yearly':
        groupBy = "strftime('%Y', booking_time)";
        dateFormat = 'Year';
        break;
      default: // daily
        groupBy = "DATE(booking_time)";
        dateFormat = 'Date';
    }

    const revenueByPeriod = db.prepare(`
      SELECT ${groupBy} as period,
             COALESCE(SUM(price), 0) as revenue,
             COUNT(*) as booking_count
      FROM bookings
      WHERE payment_status = 'Paid'
      GROUP BY ${groupBy}
      ORDER BY period DESC
      LIMIT 30
    `).all();

    const totalRevenue = db.prepare(
      "SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'Completed'"
    ).get().total;

    const completedPayments = db.prepare(
      "SELECT COUNT(*) as count FROM payments WHERE status = 'Completed'"
    ).get().count;

    const pendingPayments = db.prepare(
      "SELECT COUNT(*) as count FROM payments WHERE status = 'Pending'"
    ).get().count;

    const avgBookingValue = db.prepare(
      "SELECT COALESCE(AVG(price), 0) as avg FROM bookings WHERE payment_status = 'Paid'"
    ).get().avg;

    return {
      period: dateFormat,
      revenueByPeriod,
      totalRevenue,
      completedPayments,
      pendingPayments,
      averageBookingValue: Number(avgBookingValue.toFixed(2)),
    };
  },

  /**
   * Emergency response analytics.
   */
  getEmergencyAnalytics(db) {
    const avgResponseTime = db.prepare(`
      SELECT AVG(eta_minutes) as avg_minutes
      FROM emergencies WHERE status != 'Pending' AND eta_minutes > 0
    `).get();

    const fastestResponse = db.prepare(`
      SELECT MIN(eta_minutes) as min_minutes, customer_name, emergency_type
      FROM emergencies WHERE status != 'Pending' AND eta_minutes > 0
    `).get();

    const slowestResponse = db.prepare(`
      SELECT MAX(eta_minutes) as max_minutes, customer_name, emergency_type
      FROM emergencies WHERE status != 'Pending' AND eta_minutes > 0
    `).get();

    const requestsByType = db.prepare(`
      SELECT emergency_type, COUNT(*) as count, AVG(price) as avg_price
      FROM emergencies GROUP BY emergency_type ORDER BY count DESC
    `).all();

    const responseByCity = db.prepare(`
      SELECT
        CASE
          WHEN address LIKE '%Ahmedabad%' THEN 'Ahmedabad'
          WHEN address LIKE '%Anand%' THEN 'Anand'
          WHEN address LIKE '%Vadodara%' THEN 'Vadodara'
          WHEN address LIKE '%Surat%' THEN 'Surat'
          WHEN address LIKE '%Rajkot%' THEN 'Rajkot'
          WHEN address LIKE '%Gandhinagar%' THEN 'Gandhinagar'
          ELSE COALESCE(address, 'Unknown')
        END as city,
        COUNT(*) as count,
        AVG(eta_minutes) as avg_eta
      FROM emergencies
      GROUP BY city
      ORDER BY count DESC
    `).all();

    const totalEmergencies = db.prepare('SELECT COUNT(*) as count FROM emergencies').get().count;
    const completedEmergencies = db.prepare(
      "SELECT COUNT(*) as count FROM emergencies WHERE status = 'Completed'"
    ).get().count;

    return {
      averageResponseTime: avgResponseTime?.avg_minutes
        ? Math.round(avgResponseTime.avg_minutes) + ' min'
        : 'N/A',
      fastestResponse: fastestResponse?.min_minutes
        ? { time: fastestResponse.min_minutes + ' min', customer: fastestResponse.customer_name, type: fastestResponse.emergency_type }
        : null,
      slowestResponse: slowestResponse?.max_minutes
        ? { time: slowestResponse.max_minutes + ' min', customer: slowestResponse.customer_name, type: slowestResponse.emergency_type }
        : null,
      totalEmergencies,
      completedEmergencies,
      requestsByType,
      responseByCity,
    };
  },
};
