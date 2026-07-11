import { BaseRepository } from './baseRepository.js';

/**
 * Emergency Type Repository - Data access layer for emergency_types table.
 */
export class EmergencyTypeRepository extends BaseRepository {
  constructor(db) {
    super(db, 'emergency_types');
  }

  /** Find active emergency types only */
  findActive() {
    return this.findAll({ is_active: 1 });
  }

  /** Get type with usage statistics */
  findByIdWithStats(id) {
    const type = this.findById(id);
    if (!type) return null;
    
    const stats = this.db.prepare(`
      SELECT
        COUNT(*) as total_requests,
        SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed,
        AVG(price) as average_price,
        AVG(eta_minutes) as average_eta
      FROM emergencies WHERE emergency_type = ?
    `).get(type.name);
    
    return { ...type, stats };
  }
}
