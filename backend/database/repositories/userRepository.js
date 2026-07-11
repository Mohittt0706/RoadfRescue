import { BaseRepository } from './baseRepository.js';

/**
 * User Repository - Data access layer for users table.
 */
export class UserRepository extends BaseRepository {
  constructor(db) {
    super(db, 'users');
  }

  /** Find user by email */
  findByEmail(email) {
    return this.findOne({ email });
  }

  /** Find active users only */
  findActive() {
    return this.findAll({ status: 'active' });
  }

  /** Get user with booking count */
  findByIdWithStats(id) {
    const user = this.findById(id);
    if (!user) return null;
    
    const stats = this.db.prepare(`
      SELECT 
        COUNT(*) as total_bookings,
        SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed_bookings,
        SUM(CASE WHEN payment_status = 'Paid' THEN price ELSE 0 END) as total_spent
      FROM bookings WHERE user_id = ?
    `).get(id);
    
    return { ...user, stats };
  }

  /** Search users by name, email, or phone */
  search(query, options = {}) {
    const searchTerm = `%${query}%`;
    const { page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;
    
    const data = this.db.prepare(`
      SELECT id, name, email, phone, vehicle_type, vehicle_number, status, profile_image, address, city, created_at
      FROM users
      WHERE name LIKE ? OR email LIKE ? OR phone LIKE ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(searchTerm, searchTerm, searchTerm, limit, offset);
    
    const countResult = this.db.prepare(`
      SELECT COUNT(*) as count FROM users
      WHERE name LIKE ? OR email LIKE ? OR phone LIKE ?
    `).get(searchTerm, searchTerm, searchTerm);
    
    return {
      data,
      pagination: { page, limit, total: countResult.count, totalPages: Math.ceil(countResult.count / limit) }
    };
  }

  /** Update user status */
  updateStatus(id, status) {
    return this.update(id, { status, updated_at: new Date().toISOString() });
  }
}
