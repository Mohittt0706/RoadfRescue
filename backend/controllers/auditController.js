/**
 * Audit Log Controller
 * Handles retrieval of audit logs with pagination and filtering.
 */

/**
 * GET /api/admin/audit-logs - Get audit logs with pagination and filters.
 * Query params: page, limit, adminId, action, entity, dateFrom, dateTo
 */
export function getAuditLogs(req, res) {
  const { db } = req;
  const {
    page = 1,
    limit = 20,
    adminId,
    action,
    entity,
    dateFrom,
    dateTo,
    search,
  } = req.query;

  try {
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (adminId) {
      whereClause += ' AND admin_id = ?';
      params.push(adminId);
    }
    if (action) {
      whereClause += ' AND action = ?';
      params.push(action);
    }
    if (entity) {
      whereClause += ' AND entity = ?';
      params.push(entity);
    }
    if (dateFrom) {
      whereClause += ' AND DATE(timestamp) >= DATE(?)';
      params.push(dateFrom);
    }
    if (dateTo) {
      whereClause += ' AND DATE(timestamp) <= DATE(?)';
      params.push(dateTo);
    }
    if (search) {
      whereClause += ' AND (description LIKE ? OR entity_id LIKE ? OR admin_id LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    // Get total count for pagination
    const countQuery = `SELECT COUNT(*) as total FROM audit_logs ${whereClause}`;
    const { total } = db.prepare(countQuery).get(...params);

    // Get paginated results
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    const dataQuery = `
      SELECT * FROM audit_logs ${whereClause}
      ORDER BY timestamp DESC
      LIMIT ? OFFSET ?
    `;
    const logs = db.prepare(dataQuery).all(...params, limitNum, offset);

    res.json({
      success: true,
      data: logs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch audit logs.', error: err.message });
  }
}
