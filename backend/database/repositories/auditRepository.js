import { BaseRepository } from './baseRepository.js';

/**
 * Audit Repository - Data access layer for audit_logs and audit_history tables.
 */
export class AuditRepository extends BaseRepository {
  constructor(db) {
    super(db, 'audit_logs');
  }

  /** Insert audit log entry */
  log(data) {
    const id = `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    return this.create({
      id,
      admin_id: data.adminId || null,
      action: data.action,
      entity: data.entity,
      entity_id: data.entityId,
      description: data.description,
      ip_address: data.ipAddress || null,
      timestamp: new Date().toISOString()
    });
  }

  /** Get paginated audit logs with filters */
  findPaginated(filters = {}, options = {}) {
    const { page = 1, limit = 20 } = options;
    const { adminId, action, entity, dateFrom, dateTo, search } = filters;
    const offset = (page - 1) * limit;
    
    let query = 'SELECT * FROM audit_logs WHERE 1=1';
    const params = [];

    if (adminId) { query += ' AND admin_id = ?'; params.push(adminId); }
    if (action) { query += ' AND action = ?'; params.push(action); }
    if (entity) { query += ' AND entity = ?'; params.push(entity); }
    if (dateFrom) { query += ' AND timestamp >= ?'; params.push(dateFrom); }
    if (dateTo) { query += ' AND timestamp <= ?'; params.push(dateTo); }
    if (search) {
      query += ' AND (description LIKE ? OR entity_id LIKE ? OR admin_id LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as count');
    const total = this.db.prepare(countQuery).get(...params).count;

    query += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const data = this.db.prepare(query).all(...params);
    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    };
  }
}
