/**
 * Database Schema Definition
 *
 * Canonical reference for all table structures.
 * Used for documentation, validation, and migration generation.
 */
export const schema = {
  users: {
    columns: {
      id: 'TEXT PRIMARY KEY',
      name: 'TEXT NOT NULL',
      email: 'TEXT UNIQUE NOT NULL',
      phone: 'TEXT',
      password_hash: 'TEXT NOT NULL',
      vehicle_type: "TEXT DEFAULT 'Sedan'",
      vehicle_number: 'TEXT',
      emergency_contact: 'TEXT',
      status: "TEXT DEFAULT 'active'",
      profile_image: 'TEXT',
      address: 'TEXT',
      city: 'TEXT',
      vehicle: 'TEXT',
      reset_token: 'TEXT',
      reset_token_expiry: 'TEXT',
      refresh_token: 'TEXT',
      created_at: "TEXT DEFAULT (datetime('now'))",
      updated_at: "TEXT DEFAULT (datetime('now'))",
    }
  },
  admins: {
    columns: {
      id: 'TEXT PRIMARY KEY',
      name: 'TEXT NOT NULL',
      email: 'TEXT UNIQUE NOT NULL',
      password_hash: 'TEXT NOT NULL',
      role: "TEXT DEFAULT 'admin'",
      created_at: "TEXT DEFAULT (datetime('now'))",
    }
  },
  mechanics: {
    columns: {
      id: 'TEXT PRIMARY KEY',
      name: 'TEXT NOT NULL',
      phone: 'TEXT',
      email: 'TEXT UNIQUE NOT NULL',
      password_hash: 'TEXT',
      role: "TEXT DEFAULT 'mechanic'",
      experience_years: 'INTEGER DEFAULT 0',
      rating: 'REAL DEFAULT 4.5',
      total_jobs: 'INTEGER DEFAULT 0',
      status: "TEXT DEFAULT 'available'",
      current_booking_id: 'TEXT',
      specialization: "TEXT DEFAULT 'General Repair'",
      latitude: 'REAL',
      longitude: 'REAL',
      approval_status: "TEXT DEFAULT 'pending'",
      profile_image: 'TEXT',
      address: 'TEXT',
      city: 'TEXT',
      reset_token: 'TEXT',
      reset_token_expiry: 'TEXT',
      refresh_token: 'TEXT',
      created_at: "TEXT DEFAULT (datetime('now'))",
      updated_at: "TEXT DEFAULT (datetime('now'))",
    }
  },
  bookings: {
    columns: {
      id: 'TEXT PRIMARY KEY',
      user_id: 'TEXT',
      customer_name: 'TEXT NOT NULL',
      phone: 'TEXT',
      email: 'TEXT',
      vehicle_type: 'TEXT',
      vehicle_number: 'TEXT',
      service_name: 'TEXT',
      price: 'REAL DEFAULT 0',
      status: "TEXT DEFAULT 'Pending'",
      latitude: 'REAL DEFAULT 23.0225',
      longitude: 'REAL DEFAULT 72.5714',
      address: 'TEXT',
      notes: 'TEXT',
      payment_method: "TEXT DEFAULT 'Cash'",
      payment_status: "TEXT DEFAULT 'Pending'",
      assigned_mechanic_id: 'TEXT',
      estimated_arrival: "TEXT DEFAULT '15-20 min'",
      booking_time: "TEXT DEFAULT (datetime('now'))",
      updated_at: "TEXT DEFAULT (datetime('now'))",
    }
  },
  payments: {
    columns: {
      id: 'TEXT PRIMARY KEY',
      booking_id: 'TEXT',
      amount: 'REAL DEFAULT 0',
      method: 'TEXT',
      status: "TEXT DEFAULT 'Pending'",
      transaction_id: 'TEXT',
      created_at: "TEXT DEFAULT (datetime('now'))",
    }
  },
  emergencies: {
    columns: {
      id: 'TEXT PRIMARY KEY',
      customer_name: 'TEXT',
      phone: 'TEXT',
      email: 'TEXT',
      vehicle: 'TEXT',
      vehicle_number: 'TEXT',
      emergency_type: 'TEXT',
      price: 'REAL DEFAULT 0',
      latitude: 'REAL',
      longitude: 'REAL',
      address: 'TEXT',
      notes: 'TEXT',
      priority: "TEXT DEFAULT 'Normal'",
      status: "TEXT DEFAULT 'Pending'",
      created_time: "TEXT DEFAULT (datetime('now'))",
      updated_time: "TEXT DEFAULT (datetime('now'))",
      assigned_mechanic: 'TEXT',
      eta: 'TEXT',
      eta_minutes: 'INTEGER',
      payment_method: "TEXT DEFAULT 'UPI'",
      payment_status: "TEXT DEFAULT 'Pending'",
      invoice_id: 'TEXT',
      total_distance_km: 'REAL DEFAULT 0',
    }
  },
  active_jobs: {
    columns: {
      id: 'TEXT PRIMARY KEY',
      booking_id: 'TEXT NOT NULL',
      mechanic_id: 'TEXT NOT NULL',
      emergency_id: 'TEXT',
      assigned_at: "TEXT DEFAULT (datetime('now'))",
      started_at: 'TEXT',
      completed_at: 'TEXT',
      status: "TEXT DEFAULT 'assigned'",
      current_latitude: 'REAL',
      current_longitude: 'REAL',
      eta: 'TEXT',
      eta_minutes: 'INTEGER',
      notes: 'TEXT',
      created_at: "TEXT DEFAULT (datetime('now'))",
      updated_at: "TEXT DEFAULT (datetime('now'))",
    }
  },
  audit_history: {
    columns: {
      id: 'TEXT PRIMARY KEY',
      entity: 'TEXT NOT NULL',
      entity_id: 'TEXT NOT NULL',
      action: 'TEXT NOT NULL',
      performed_by: 'TEXT',
      performed_by_role: 'TEXT',
      old_value: 'TEXT',
      new_value: 'TEXT',
      description: 'TEXT',
      ip_address: 'TEXT',
      timestamp: "TEXT DEFAULT (datetime('now'))",
    }
  },
};

export default schema;
