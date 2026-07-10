/**
 * Audit History Service
 *
 * Automatically logs entity changes with old/new values.
 * Supports: booking, emergency, mechanic, payment, user, service changes.
 * Uses the audit_history table (migration 004).
 */
export class AuditHistoryService {
  constructor(db) {
    this.db = db;
  }

  /**
   * Log an entity change with old and new values.
   */
  log(data) {
    const id = `ah-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    this.db.prepare(`
      INSERT INTO audit_history (id, entity, entity_id, action, performed_by, performed_by_role, old_value, new_value, description, ip_address, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(
      id,
      data.entity,
      data.entityId,
      data.action,
      data.performedBy || null,
      data.performedByRole || null,
      data.oldValue ? JSON.stringify(data.oldValue) : null,
      data.newValue ? JSON.stringify(data.newValue) : null,
      data.description || null,
      data.ipAddress || null
    );
    return id;
  }

  /**
   * Log a booking status change.
   */
  logBookingStatusChange(booking, oldStatus, newStatus, performedBy, performedByRole, ipAddress) {
    return this.log({
      entity: 'booking',
      entityId: booking.id,
      action: 'STATUS_CHANGE',
      performedBy,
      performedByRole,
      oldValue: { status: oldStatus, payment_status: booking.payment_status },
      newValue: { status: newStatus },
      description: `Booking status changed from "${oldStatus}" to "${newStatus}" for ${booking.customer_name}`,
      ipAddress
    });
  }

  /**
   * Log a mechanic assignment.
   */
  logMechanicAssignment(booking, mechanic, performedBy, performedByRole, ipAddress) {
    return this.log({
      entity: 'booking',
      entityId: booking.id,
      action: 'ASSIGN',
      performedBy,
      performedByRole,
      oldValue: { assigned_mechanic_id: booking.assigned_mechanic_id },
      newValue: { assigned_mechanic_id: mechanic.id, mechanic_name: mechanic.name },
      description: `Assigned mechanic "${mechanic.name}" to booking for ${booking.customer_name}`,
      ipAddress
    });
  }

  /**
   * Log an emergency status change.
   */
  logEmergencyStatusChange(emergency, oldStatus, newStatus, performedBy, performedByRole, ipAddress) {
    return this.log({
      entity: 'emergency',
      entityId: emergency.id,
      action: 'STATUS_CHANGE',
      performedBy,
      performedByRole,
      oldValue: { status: oldStatus, payment_status: emergency.payment_status },
      newValue: { status: newStatus },
      description: `Emergency status changed from "${oldStatus}" to "${newStatus}" for ${emergency.customer_name}`,
      ipAddress
    });
  }

  /**
   * Log an emergency mechanic assignment.
   */
  logEmergencyAssignment(emergency, mechanicName, performedBy, performedByRole, ipAddress) {
    return this.log({
      entity: 'emergency',
      entityId: emergency.id,
      action: 'ASSIGN',
      performedBy,
      performedByRole,
      oldValue: { assigned_mechanic: emergency.assigned_mechanic },
      newValue: { assigned_mechanic: mechanicName },
      description: `Assigned mechanic "${mechanicName}" to emergency for ${emergency.customer_name}`,
      ipAddress
    });
  }

  /**
   * Log a payment status change.
   */
  logPaymentStatusChange(payment, oldStatus, newStatus, performedBy, performedByRole, ipAddress) {
    return this.log({
      entity: 'payment',
      entityId: payment.id,
      action: 'STATUS_CHANGE',
      performedBy,
      performedByRole,
      oldValue: { status: oldStatus, amount: payment.amount },
      newValue: { status: newStatus },
      description: `Payment status changed from "${oldStatus}" to "${newStatus}" (₹${payment.amount})`,
      ipAddress
    });
  }

  /**
   * Log a user/mechanic entity update.
   */
  logEntityUpdate(entity, entityId, oldData, newData, performedBy, performedByRole, ipAddress) {
    const changedFields = {};
    for (const key of Object.keys(newData)) {
      if (oldData[key] !== newData[key]) {
        changedFields[key] = { from: oldData[key], to: newData[key] };
      }
    }

    if (Object.keys(changedFields).length === 0) return null;

    return this.log({
      entity,
      entityId,
      action: 'UPDATE',
      performedBy,
      performedByRole,
      oldValue: oldData,
      newValue: newData,
      description: `Updated ${entity}: ${Object.keys(changedFields).join(', ')}`,
      ipAddress
    });
  }

  /**
   * Log entity creation.
   */
  logEntityCreate(entity, entityId, data, performedBy, performedByRole, ipAddress) {
    return this.log({
      entity,
      entityId,
      action: 'CREATE',
      performedBy,
      performedByRole,
      oldValue: null,
      newValue: data,
      description: `Created ${entity}: ${data.name || data.customer_name || data.id}`,
      ipAddress
    });
  }

  /**
   * Log entity deletion.
   */
  logEntityDelete(entity, entityId, data, performedBy, performedByRole, ipAddress) {
    return this.log({
      entity,
      entityId,
      action: 'DELETE',
      performedBy,
      performedByRole,
      oldValue: data,
      newValue: null,
      description: `Deleted ${entity}: ${data.name || data.customer_name || data.id}`,
      ipAddress
    });
  }

  /**
   * Query audit history with filters and pagination.
   */
  query(filters = {}, options = {}) {
    const { page = 1, limit = 20 } = options;
    const { entity, entityId, action, performedBy, dateFrom, dateTo, search } = filters;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM audit_history WHERE 1=1';
    const params = [];

    if (entity) { query += ' AND entity = ?'; params.push(entity); }
    if (entityId) { query += ' AND entity_id = ?'; params.push(entityId); }
    if (action) { query += ' AND action = ?'; params.push(action); }
    if (performedBy) { query += ' AND performed_by = ?'; params.push(performedBy); }
    if (dateFrom) { query += ' AND timestamp >= ?'; params.push(dateFrom); }
    if (dateTo) { query += ' AND timestamp <= ?'; params.push(dateTo); }
    if (search) {
      query += ' AND (description LIKE ? OR entity_id LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s);
    }

    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as count');
    const total = this.db.prepare(countQuery).get(...params).count;

    query += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const data = this.db.prepare(query).all(...params).map(row => ({
      ...row,
      old_value: row.old_value ? JSON.parse(row.old_value) : null,
      new_value: row.new_value ? JSON.parse(row.new_value) : null,
    }));

    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    };
  }
}
