import { BaseRepository } from './baseRepository.js';

/**
 * EmergencyPricing Repository - Data access for emergency_pricing table.
 * Stores configurable pricing per emergency priority level.
 */
export class EmergencyPricingRepository extends BaseRepository {
  constructor(db) {
    super(db, 'emergency_pricing');
  }

  /** Find all active emergency pricing levels */
  findActive() {
    return this.findAll({ is_active: 1 }, { orderBy: 'multiplier ASC' });
  }

  /** Find by priority level (low, medium, high, critical) */
  findByPriorityLevel(level) {
    return this.findOne({ priority_level: level.toLowerCase() });
  }

  /** Get all levels with usage statistics */
  findAllWithStats() {
    return this.raw(`
      SELECT ep.*,
        (SELECT COUNT(*) FROM emergencies WHERE priority = ep.priority_level) as usage_count
      FROM emergency_pricing ep
      ORDER BY ep.multiplier ASC
    `);
  }

  /** Get pricing for a specific priority level */
  getPricingForLevel(level) {
    return this.rawOne(`
      SELECT ep.*
      FROM emergency_pricing ep
      WHERE ep.priority_level = ? AND ep.is_active = 1
    `, [level.toLowerCase()]);
  }
}
