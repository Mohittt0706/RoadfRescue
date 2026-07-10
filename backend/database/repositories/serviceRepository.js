import { BaseRepository } from './baseRepository.js';

/**
 * Service Repository - Data access layer for services table.
 */
export class ServiceRepository extends BaseRepository {
  constructor(db) {
    super(db, 'services');
  }

  /** Find active services only */
  findActive() {
    return this.findAll({ is_active: 1 });
  }

  /** Get service with booking statistics */
  findByIdWithStats(id) {
    const service = this.findById(id);
    if (!service) return null;
    
    const stats = this.db.prepare(`
      SELECT
        COUNT(*) as total_bookings,
        SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'Cancelled' THEN 1 ELSE 0 END) as cancelled,
        AVG(price) as average_price
      FROM bookings WHERE service_name = ?
    `).get(service.name);
    
    return { ...service, stats };
  }

  /** Get service analytics */
  getAnalytics() {
    const mostRequested = this.db.prepare(`
      SELECT service_name as service, COUNT(*) as count, SUM(price) as revenue
      FROM bookings
      GROUP BY service_name
      ORDER BY count DESC
    `).all();

    const distribution = this.db.prepare(`
      SELECT s.name, COUNT(b.id) as bookings, COALESCE(SUM(b.price), 0) as revenue
      FROM services s
      LEFT JOIN bookings b ON s.name = b.service_name
      GROUP BY s.name
      ORDER BY bookings DESC
    `).all();

    return { mostRequested, distribution };
  }
}
