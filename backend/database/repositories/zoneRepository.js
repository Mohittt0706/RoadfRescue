import { BaseRepository } from './baseRepository.js';

/**
 * Zone Repository - Data access for zones table.
 * Stores geographic zones with extra charges for location-based pricing.
 */
export class ZoneRepository extends BaseRepository {
  constructor(db) {
    super(db, 'zones');
  }

  /** Find all active zones */
  findActive() {
    return this.findAll({ is_active: 1 }, { orderBy: 'extra_charge ASC' });
  }

  /** Find zones by city */
  findByCity(city) {
    return this.findAll({ city, is_active: 1 }, { orderBy: 'extra_charge ASC' });
  }

  /** Find zone by name and city */
  findByNameAndCity(zoneName, city) {
    return this.findOne({ zone_name: zoneName, city });
  }

  /** Find zone by ID with full details */
  findByIdWithDetails(id) {
    return this.rawOne(`
      SELECT z.*,
        (SELECT COUNT(*) FROM pricing_history WHERE zone_id = z.id) as usage_count
      FROM zones z
      WHERE z.id = ?
    `, [id]);
  }

  /** Get all zones with usage stats */
  findAllWithStats() {
    return this.raw(`
      SELECT z.*,
        (SELECT COUNT(*) FROM pricing_history WHERE zone_id = z.id) as usage_count
      FROM zones z
      ORDER BY z.city ASC, z.extra_charge ASC
    `);
  }

  /** Find nearest zone based on coordinates */
  findNearestZone(latitude, longitude) {
    return this.rawOne(`
      SELECT *,
        (6371 * acos(
          cos(radians(?)) * cos(radians(latitude)) *
          cos(radians(longitude) - radians(?)) +
          sin(radians(?)) * sin(radians(latitude))
        )) AS distance_km
      FROM zones
      WHERE is_active = 1 AND latitude IS NOT NULL AND longitude IS NOT NULL
      ORDER BY distance_km ASC
      LIMIT 1
    `, [latitude, longitude, latitude]);
  }
}
