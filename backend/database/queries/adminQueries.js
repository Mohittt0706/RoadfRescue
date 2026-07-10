/**
 * Admin CRUD Queries
 * Reusable prepared statement builders for admin entity operations.
 */

// ========================
// SERVICES
// ========================

export const serviceQueries = {
  getAll: () => 'SELECT * FROM services ORDER BY created_at DESC',

  getById: () => 'SELECT * FROM services WHERE id = ?',

  create: () => `
    INSERT INTO services (id, name, description, price, duration_estimate, is_active)
    VALUES (?, ?, ?, ?, ?, ?)
  `,

  update: () => `
    UPDATE services SET name = ?, description = ?, price = ?, duration_estimate = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `,

  delete: () => 'DELETE FROM services WHERE id = ?',

  getActive: () => 'SELECT * FROM services WHERE is_active = 1 ORDER BY name ASC',
};

// ========================
// EMERGENCY TYPES
// ========================

export const emergencyTypeQueries = {
  getAll: () => 'SELECT * FROM emergency_types ORDER BY created_at DESC',

  getById: () => 'SELECT * FROM emergency_types WHERE id = ?',

  create: () => `
    INSERT INTO emergency_types (id, name, description, base_price, eta_min, eta_max, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `,

  update: () => `
    UPDATE emergency_types SET name = ?, description = ?, base_price = ?, eta_min = ?, eta_max = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `,

  delete: () => 'DELETE FROM emergency_types WHERE id = ?',

  getActive: () => 'SELECT * FROM emergency_types WHERE is_active = 1 ORDER BY name ASC',
};

// ========================
// USERS (admin CRUD)
// ========================

export const userQueries = {
  getAll: () => `
    SELECT id, name, email, phone, vehicle_type, vehicle_number, status, profile_image, address, city, created_at
    FROM users ORDER BY created_at DESC
  `,

  getById: () => `
    SELECT id, name, email, phone, vehicle_type, vehicle_number, status, profile_image, address, city, created_at
    FROM users WHERE id = ?
  `,

  update: () => `
    UPDATE users SET status = ?, name = ?, phone = ?, address = ?, city = ?, vehicle = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `,

  delete: () => 'DELETE FROM users WHERE id = ?',
};

// ========================
// MECHANICS (admin CRUD)
// ========================

export const mechanicQueries = {
  getAll: () => `
    SELECT id, name, phone, email, role, experience_years, rating, total_jobs, status, specialization,
           latitude, longitude, approval_status, profile_image, address, city, created_at
    FROM mechanics ORDER BY created_at DESC
  `,

  getById: () => 'SELECT * FROM mechanics WHERE id = ?',

  update: () => `
    UPDATE mechanics SET approval_status = ?, name = ?, phone = ?, experience_years = ?, specialization = ?, status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `,

  delete: () => 'DELETE FROM mechanics WHERE id = ?',
};
