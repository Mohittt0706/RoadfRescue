import { BaseRepository } from './baseRepository.js';

/**
 * Emergency Repository - Centralized data access for emergencies table.
 * This replaces the dual MongoDB/SQLite approach with pure SQLite.
 */
export class EmergencyRepository extends BaseRepository {
  constructor(db) {
    super(db, 'emergencies');
  }

  /** Find emergencies with filtering */
  findFiltered(filters = {}, options = {}) {
    const { status, priority, emergency_type, search } = filters;
    const { page = 1, limit = 50, orderBy = 'created_time DESC' } = options;
    const offset = (page - 1) * limit;
    
    let query = 'SELECT * FROM emergencies WHERE 1=1';
    const params = [];

    if (status && status !== 'all') {
      query += ' AND status = ?';
      params.push(status);
    }
    if (priority && priority !== 'all') {
      query += ' AND priority = ?';
      params.push(priority);
    }
    if (emergency_type && emergency_type !== 'all') {
      query += ' AND emergency_type = ?';
      params.push(emergency_type);
    }
    if (search) {
      query += ' AND (customer_name LIKE ? OR phone LIKE ? OR id LIKE ? OR vehicle_number LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as count');
    const total = this.db.prepare(countQuery).get(...params).count;

    query += ` ORDER BY ${orderBy} LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const data = this.db.prepare(query).all(...params);
    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    };
  }

  /** Find recent emergencies by phone (for duplicate detection) */
  findRecentByPhone(phone, minutesAgo = 10) {
    return this.db.prepare(`
      SELECT * FROM emergencies 
      WHERE phone = ? 
      AND created_time >= datetime('now', '-' || ? || ' minutes')
      ORDER BY created_time DESC
    `).all(phone, minutesAgo);
  }

  /** Find emergency with full details for invoice */
  findByIdForInvoice(id) {
    const emergency = this.findById(id);
    if (!emergency) return null;
    
    return {
      invoice_id: emergency.invoice_id || `INV-${Date.now().toString(36).toUpperCase()}`,
      emergency_id: emergency.id,
      customer_name: emergency.customer_name,
      phone: emergency.phone,
      email: emergency.email,
      vehicle: emergency.vehicle,
      vehicle_number: emergency.vehicle_number,
      emergency_type: emergency.emergency_type,
      price: emergency.price,
      payment_method: emergency.payment_method,
      payment_status: emergency.payment_status,
      status: emergency.status,
      assigned_mechanic: emergency.assigned_mechanic,
      eta: emergency.eta,
      address: emergency.address,
      created_time: emergency.created_time,
      completed_time: emergency.status === 'Completed' ? emergency.updated_time : null,
      items: [
        { description: `${emergency.emergency_type} Service`, amount: emergency.price },
        { description: 'Service Call Fee', amount: 0, note: 'Included' },
        { description: 'GST (18%)', amount: Math.round(emergency.price * 0.18) }
      ],
      total: Math.round(emergency.price * 1.18)
    };
  }

  /** Update emergency status */
  updateStatus(id, status, extras = {}) {
    const updates = { status, updated_time: new Date().toISOString(), ...extras };
    
    if (status === 'Completed') {
      updates.payment_status = 'Paid';
      updates.invoice_id = extras.invoice_id || `INV-${Date.now().toString(36).toUpperCase()}`;
    }
    if (status === 'Cancelled') {
      updates.payment_status = 'Cancelled';
    }
    
    return this.update(id, updates);
  }

  /** Assign mechanic to emergency */
  assignMechanic(id, mechanicName, eta, price) {
    const updates = {
      assigned_mechanic: mechanicName,
      status: 'Mechanic Assigned',
      updated_time: new Date().toISOString()
    };
    if (eta) {
      updates.eta = eta;
      const match = eta.match(/(\d+)-(\d+)/);
      if (match) {
        updates.eta_minutes = Math.round((parseInt(match[1]) + parseInt(match[2])) / 2);
      }
    }
    if (price !== undefined) {
      updates.price = parseFloat(price);
    }
    return this.update(id, updates);
  }

  /** Get emergency statistics */
  getStats() {
    return this.db.prepare(`
      SELECT
        COUNT(*) as totalEmergencies,
        SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completedEmergencies,
        SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pendingEmergencies,
        AVG(CASE WHEN status = 'Completed' 
          THEN (julianday(updated_time) - julianday(created_time)) * 24 * 60 
          ELSE NULL END) as averageResponseMinutes
      FROM emergencies
    `).get();
  }

  /** Get emergencies by type distribution */
  getTypeDistribution() {
    return this.db.prepare(`
      SELECT emergency_type as type, COUNT(*) as count, SUM(price) as revenue
      FROM emergencies
      GROUP BY emergency_type
      ORDER BY count DESC
    `).all();
  }
}
