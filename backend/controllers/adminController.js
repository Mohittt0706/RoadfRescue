import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { insertAuditLog, getClientIP } from '../utils/auditLogger.js';
import { serviceQueries, emergencyTypeQueries, userQueries, mechanicQueries } from '../database/queries/adminQueries.js';

// ========================
// SERVICES CRUD
// ========================

/**
 * GET /api/admin/services - List all services.
 */
export function getAllServices(req, res) {
  const { db } = req;
  try {
    const services = db.prepare(serviceQueries.getAll()).all();
    res.json({ success: true, data: services });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch services.', error: err.message });
  }
}

/**
 * GET /api/admin/services/:id - Get service by ID.
 */
export function getServiceById(req, res) {
  const { db } = req;
  try {
    const service = db.prepare(serviceQueries.getById()).get(req.params.id);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found.' });
    }
    res.json({ success: true, data: service });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch service.', error: err.message });
  }
}

/**
 * POST /api/admin/services - Create a new service.
 */
export function createService(req, res) {
  const { db } = req;
  const { name, description, price, duration_estimate, is_active } = req.body;

  if (!name || price === undefined) {
    return res.status(400).json({ success: false, message: 'Name and price are required.' });
  }

  if (typeof price !== 'number' || price < 0) {
    return res.status(400).json({ success: false, message: 'Price must be a non-negative number.' });
  }

  try {
    const id = `svc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    db.prepare(serviceQueries.create()).run(
      id, name, description || '', price, duration_estimate || '', is_active !== undefined ? (is_active ? 1 : 0) : 1
    );

    const service = db.prepare(serviceQueries.getById()).get(id);

    insertAuditLog(db, {
      adminId: req.user.id,
      action: 'CREATE',
      entity: 'service',
      entityId: id,
      description: `Created service: ${name} (₹${price})`,
      ipAddress: getClientIP(req),
    });

    res.status(201).json({ success: true, message: 'Service created successfully.', data: service });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create service.', error: err.message });
  }
}

/**
 * PUT /api/admin/services/:id - Update a service.
 */
export function updateService(req, res) {
  const { db } = req;
  const { name, description, price, duration_estimate, is_active } = req.body;
  const serviceId = req.params.id;

  try {
    const existing = db.prepare(serviceQueries.getById()).get(serviceId);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Service not found.' });
    }

    if (price !== undefined && (typeof price !== 'number' || price < 0)) {
      return res.status(400).json({ success: false, message: 'Price must be a non-negative number.' });
    }

    const updatedName = name !== undefined ? name : existing.name;
    const updatedDesc = description !== undefined ? description : existing.description;
    const updatedPrice = price !== undefined ? price : existing.price;
    const updatedDuration = duration_estimate !== undefined ? duration_estimate : existing.duration_estimate;
    const updatedActive = is_active !== undefined ? (is_active ? 1 : 0) : existing.is_active;

    db.prepare(serviceQueries.update()).run(
      updatedName, updatedDesc, updatedPrice, updatedDuration, updatedActive, serviceId
    );

    const service = db.prepare(serviceQueries.getById()).get(serviceId);

    insertAuditLog(db, {
      adminId: req.user.id,
      action: 'UPDATE',
      entity: 'service',
      entityId: serviceId,
      description: `Updated service: ${updatedName}`,
      ipAddress: getClientIP(req),
    });

    res.json({ success: true, message: 'Service updated successfully.', data: service });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update service.', error: err.message });
  }
}

/**
 * DELETE /api/admin/services/:id - Delete a service.
 */
export function deleteService(req, res) {
  const { db } = req;
  const serviceId = req.params.id;

  try {
    const existing = db.prepare(serviceQueries.getById()).get(serviceId);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Service not found.' });
    }

    db.prepare(serviceQueries.delete()).run(serviceId);

    insertAuditLog(db, {
      adminId: req.user.id,
      action: 'DELETE',
      entity: 'service',
      entityId: serviceId,
      description: `Deleted service: ${existing.name}`,
      ipAddress: getClientIP(req),
    });

    res.json({ success: true, message: 'Service deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete service.', error: err.message });
  }
}

// ========================
// EMERGENCY TYPES CRUD
// ========================

/**
 * GET /api/admin/emergency-types - List all emergency types.
 */
export function getAllEmergencyTypes(req, res) {
  const { db } = req;
  try {
    const types = db.prepare(emergencyTypeQueries.getAll()).all();
    res.json({ success: true, data: types });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch emergency types.', error: err.message });
  }
}

/**
 * GET /api/admin/emergency-types/:id - Get emergency type by ID.
 */
export function getEmergencyTypeById(req, res) {
  const { db } = req;
  try {
    const type = db.prepare(emergencyTypeQueries.getById()).get(req.params.id);
    if (!type) {
      return res.status(404).json({ success: false, message: 'Emergency type not found.' });
    }
    res.json({ success: true, data: type });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch emergency type.', error: err.message });
  }
}

/**
 * POST /api/admin/emergency-types - Create a new emergency type.
 */
export function createEmergencyType(req, res) {
  const { db } = req;
  const { name, description, base_price, eta_min, eta_max, is_active } = req.body;

  if (!name || base_price === undefined) {
    return res.status(400).json({ success: false, message: 'Name and base_price are required.' });
  }

  if (typeof base_price !== 'number' || base_price < 0) {
    return res.status(400).json({ success: false, message: 'Base price must be a non-negative number.' });
  }

  try {
    const id = `et-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    db.prepare(emergencyTypeQueries.create()).run(
      id, name, description || '', base_price,
      eta_min || 15, eta_max || 30,
      is_active !== undefined ? (is_active ? 1 : 0) : 1
    );

    const type = db.prepare(emergencyTypeQueries.getById()).get(id);

    insertAuditLog(db, {
      adminId: req.user.id,
      action: 'CREATE',
      entity: 'emergency_type',
      entityId: id,
      description: `Created emergency type: ${name} (₹${base_price})`,
      ipAddress: getClientIP(req),
    });

    res.status(201).json({ success: true, message: 'Emergency type created successfully.', data: type });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create emergency type.', error: err.message });
  }
}

/**
 * PUT /api/admin/emergency-types/:id - Update an emergency type.
 */
export function updateEmergencyType(req, res) {
  const { db } = req;
  const { name, description, base_price, eta_min, eta_max, is_active } = req.body;
  const typeId = req.params.id;

  try {
    const existing = db.prepare(emergencyTypeQueries.getById()).get(typeId);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Emergency type not found.' });
    }

    if (base_price !== undefined && (typeof base_price !== 'number' || base_price < 0)) {
      return res.status(400).json({ success: false, message: 'Base price must be a non-negative number.' });
    }

    const updatedName = name !== undefined ? name : existing.name;
    const updatedDesc = description !== undefined ? description : existing.description;
    const updatedPrice = base_price !== undefined ? base_price : existing.base_price;
    const updatedEtaMin = eta_min !== undefined ? eta_min : existing.eta_min;
    const updatedEtaMax = eta_max !== undefined ? eta_max : existing.eta_max;
    const updatedActive = is_active !== undefined ? (is_active ? 1 : 0) : existing.is_active;

    db.prepare(emergencyTypeQueries.update()).run(
      updatedName, updatedDesc, updatedPrice, updatedEtaMin, updatedEtaMax, updatedActive, typeId
    );

    const type = db.prepare(emergencyTypeQueries.getById()).get(typeId);

    insertAuditLog(db, {
      adminId: req.user.id,
      action: 'UPDATE',
      entity: 'emergency_type',
      entityId: typeId,
      description: `Updated emergency type: ${updatedName}`,
      ipAddress: getClientIP(req),
    });

    res.json({ success: true, message: 'Emergency type updated successfully.', data: type });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update emergency type.', error: err.message });
  }
}

/**
 * DELETE /api/admin/emergency-types/:id - Delete an emergency type.
 */
export function deleteEmergencyType(req, res) {
  const { db } = req;
  const typeId = req.params.id;

  try {
    const existing = db.prepare(emergencyTypeQueries.getById()).get(typeId);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Emergency type not found.' });
    }

    db.prepare(emergencyTypeQueries.delete()).run(typeId);

    insertAuditLog(db, {
      adminId: req.user.id,
      action: 'DELETE',
      entity: 'emergency_type',
      entityId: typeId,
      description: `Deleted emergency type: ${existing.name}`,
      ipAddress: getClientIP(req),
    });

    res.json({ success: true, message: 'Emergency type deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete emergency type.', error: err.message });
  }
}

// ========================
// USER MANAGEMENT (extending existing admin routes)
// ========================

/**
 * POST /api/admin/users - Create a new user (admin-initiated).
 */
export function createUser(req, res) {
  const { db } = req;
  const { name, email, phone, vehicle_type, vehicle_number, address, city } = req.body;

  if (!name || !email || !phone) {
    return res.status(400).json({ success: false, message: 'Name, email, and phone are required.' });
  }

  try {
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(409).json({ success: false, message: 'A user with this email already exists.' });
    }

    const id = `user-${uuidv4().substring(0, 8)}`;
    const defaultHash = bcrypt.hashSync('password123', 12);

    db.prepare(`
      INSERT INTO users (id, name, email, phone, password_hash, vehicle_type, vehicle_number, address, city, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
    `).run(id, name, email, phone, defaultHash, vehicle_type || 'Sedan', vehicle_number || '', address || '', city || '');

    const user = db.prepare(userQueries.getById()).get(id);

    insertAuditLog(db, {
      adminId: req.user.id,
      action: 'CREATE',
      entity: 'user',
      entityId: id,
      description: `Created user: ${name} (${email})`,
      ipAddress: getClientIP(req),
    });

    res.status(201).json({ success: true, message: 'User created successfully.', data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create user.', error: err.message });
  }
}

// ========================
// MECHANIC MANAGEMENT (extending existing admin routes)
// ========================

/**
 * GET /api/admin/mechanics/:id - Get mechanic by ID.
 */
export function getMechanicById(req, res) {
  const { db } = req;
  try {
    const mechanic = db.prepare(mechanicQueries.getById()).get(req.params.id);
    if (!mechanic) {
      return res.status(404).json({ success: false, message: 'Mechanic not found.' });
    }
    res.json({ success: true, data: mechanic });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch mechanic.', error: err.message });
  }
}
