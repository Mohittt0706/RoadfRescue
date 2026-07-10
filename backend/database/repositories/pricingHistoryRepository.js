import { BaseRepository } from './baseRepository.js';

/**
 * PricingHistory Repository - Data access for pricing_history table.
 * Records all price calculations for audit and analytics.
 */
export class PricingHistoryRepository extends BaseRepository {
  constructor(db) {
    super(db, 'pricing_history');
  }

  /** Find history by booking ID */
  findByBookingId(bookingId) {
    return this.findAll({ booking_id: bookingId }, { orderBy: 'created_at DESC' });
  }

  /** Find history by emergency ID */
  findByEmergencyId(emergencyId) {
    return this.findAll({ emergency_id: emergencyId }, { orderBy: 'created_at DESC' });
  }

  /** Find history with service and zone details */
  findAllWithDetails(options = {}) {
    const { page = 1, limit = 50 } = options;
    const offset = (page - 1) * limit;

    const data = this.raw(`
      SELECT ph.*,
        s.name as service_name,
        s.category as service_category,
        z.zone_name,
        z.city as zone_city
      FROM pricing_history ph
      LEFT JOIN services s ON ph.service_id = s.id
      LEFT JOIN zones z ON ph.zone_id = z.id
      ORDER BY ph.created_at DESC
      LIMIT ? OFFSET ?
    `, [limit, offset]);

    const total = this.count();

    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    };
  }

  /** Get pricing analytics */
  getAnalytics() {
    return this.rawOne(`
      SELECT
        COUNT(*) as total_calculations,
        AVG(total_price) as average_price,
        SUM(total_price) as total_revenue,
        AVG(tax_amount) as average_tax,
        SUM(discount) as total_discounts,
        AVG(base_price) as average_base_price,
        AVG(zone_charge) as average_zone_charge,
        AVG(emergency_charge) as average_emergency_charge
      FROM pricing_history
    `);
  }

  /** Get revenue by period */
  getRevenueByPeriod(period = 'daily', days = 30) {
    let dateFormat;
    switch (period) {
      case 'hourly': dateFormat = '%Y-%m-%d %H:00'; break;
      case 'daily': dateFormat = '%Y-%m-%d'; break;
      case 'weekly': dateFormat = '%Y-W%W'; break;
      case 'monthly': dateFormat = '%Y-%m'; break;
      default: dateFormat = '%Y-%m-%d';
    }

    return this.raw(`
      SELECT
        strftime('${dateFormat}', created_at) as period,
        COUNT(*) as count,
        SUM(total_price) as revenue,
        SUM(tax_amount) as tax_collected,
        SUM(discount) as discounts_given
      FROM pricing_history
      WHERE created_at >= datetime('now', '-${days} days')
      GROUP BY period
      ORDER BY period ASC
    `);
  }
}
