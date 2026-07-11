import { BaseRepository } from './baseRepository.js';

/**
 * Mechanic Repository - Data access layer for mechanics table.
 */
export class MechanicRepository extends BaseRepository {
  constructor(db) {
    super(db, 'mechanics');
  }

  /** Find mechanic by email */
  findByEmail(email) {
    return this.findOne({ email });
  }

  /** Find approved mechanics only */
  findApproved() {
    return this.findAll({ approval_status: 'approved' });
  }

  /** Find available mechanics */
  findAvailable() {
    return this.findAll({ status: 'available', approval_status: 'approved' });
  }

  /** Find mechanic by ID with stats */
  findByIdWithStats(id) {
    const mechanic = this.findById(id);
    if (!mechanic) return null;
    
    const stats = this.db.prepare(`
      SELECT 
        COUNT(*) as total_jobs,
        SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed_jobs,
        AVG(price) as average_job_value
      FROM bookings WHERE assigned_mechanic_id = ?
    `).get(id);
    
    const activeJob = this.db.prepare(`
      SELECT * FROM active_jobs 
      WHERE mechanic_id = ? AND status IN ('assigned', 'in_progress')
      ORDER BY assigned_at DESC LIMIT 1
    `).get(id);
    
    return { ...mechanic, stats, activeJob };
  }

  /** Get mechanic with recent jobs */
  findByIdWithRecentJobs(id, limit = 5) {
    const mechanic = this.findById(id);
    if (!mechanic) return null;
    
    const recentJobs = this.db.prepare(`
      SELECT * FROM bookings 
      WHERE assigned_mechanic_id = ? 
      ORDER BY booking_time DESC LIMIT ?
    `).all(id, limit);
    
    return { mechanic, recentJobs };
  }

  /** Search mechanics by name or specialization */
  search(query, options = {}) {
    const searchTerm = `%${query}%`;
    const { page = 1, limit = 20, approvedOnly = false } = options;
    const offset = (page - 1) * limit;
    
    let whereClause = '(name LIKE ? OR specialization LIKE ? OR email LIKE ?)';
    const params = [searchTerm, searchTerm, searchTerm];
    
    if (approvedOnly) {
      whereClause += ' AND approval_status = ?';
      params.push('approved');
    }
    
    const data = this.db.prepare(`
      SELECT id, name, phone, email, role, experience_years, rating, total_jobs, status, specialization, latitude, longitude, approval_status, profile_image, address, city
      FROM mechanics
      WHERE ${whereClause}
      ORDER BY rating DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);
    
    const countResult = this.db.prepare(`
      SELECT COUNT(*) as count FROM mechanics WHERE ${whereClause}
    `).get(...params);
    
    return {
      data,
      pagination: { page, limit, total: countResult.count, totalPages: Math.ceil(countResult.count / limit) }
    };
  }

  /** Update mechanic availability status */
  updateStatus(id, status) {
    return this.update(id, { status, updated_at: new Date().toISOString() });
  }

  /** Update approval status */
  updateApproval(id, approval_status) {
    return this.update(id, { approval_status, updated_at: new Date().toISOString() });
  }

  /** Increment total jobs count */
  incrementJobs(id) {
    this.db.prepare(`
      UPDATE mechanics SET total_jobs = total_jobs + 1, updated_at = datetime('now') WHERE id = ?
    `).run(id);
    return this.findById(id);
  }
}
