/**
 * @fileoverview Initial schema migration for RoadRescue SQLite database.
 * Creates all core tables required for the application.
 * @version 1
 */

const migration = {
  /** @type {number} */
  version: 1,

  /** @type {string} */
  name: '001_initial_schema',

  /**
   * Apply the migration – creates all tables.
   * @param {import('better-sqlite3').Database} db
   */
  up(db) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT,
        password_hash TEXT NOT NULL,
        vehicle_type TEXT DEFAULT 'Sedan',
        vehicle_number TEXT,
        emergency_contact TEXT,
        status TEXT DEFAULT 'active',
        profile_image TEXT,
        address TEXT,
        city TEXT,
        vehicle TEXT,
        reset_token TEXT,
        reset_token_expiry TEXT,
        refresh_token TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS admins (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'admin',
        created_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS mechanics (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT,
        role TEXT DEFAULT 'mechanic',
        experience_years INTEGER DEFAULT 0,
        rating REAL DEFAULT 4.5,
        total_jobs INTEGER DEFAULT 0,
        status TEXT DEFAULT 'available',
        current_booking_id TEXT,
        specialization TEXT DEFAULT 'General Repair',
        latitude REAL,
        longitude REAL,
        approval_status TEXT DEFAULT 'pending',
        profile_image TEXT,
        address TEXT,
        city TEXT,
        reset_token TEXT,
        reset_token_expiry TEXT,
        refresh_token TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS bookings (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        customer_name TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        vehicle_type TEXT,
        vehicle_number TEXT,
        service_name TEXT,
        price REAL DEFAULT 0,
        status TEXT DEFAULT 'Pending',
        latitude REAL DEFAULT 23.0225,
        longitude REAL DEFAULT 72.5714,
        address TEXT,
        notes TEXT,
        payment_method TEXT DEFAULT 'Cash',
        payment_status TEXT DEFAULT 'Pending',
        assigned_mechanic_id TEXT,
        estimated_arrival TEXT DEFAULT '15-20 min',
        booking_time TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (assigned_mechanic_id) REFERENCES mechanics(id)
      );

      CREATE TABLE IF NOT EXISTS payments (
        id TEXT PRIMARY KEY,
        booking_id TEXT,
        amount REAL DEFAULT 0,
        method TEXT,
        status TEXT DEFAULT 'Pending',
        transaction_id TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (booking_id) REFERENCES bookings(id)
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        type TEXT,
        title TEXT,
        message TEXT,
        booking_id TEXT,
        read INTEGER DEFAULT 0,
        target_role TEXT,
        target_id TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS booking_logs (
        id TEXT PRIMARY KEY,
        booking_id TEXT,
        status TEXT,
        note TEXT,
        created_by TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (booking_id) REFERENCES bookings(id)
      );

      CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        title TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS chat_messages (
        id TEXT PRIMARY KEY,
        conversation_id TEXT,
        sender TEXT,
        content TEXT,
        image_url TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (conversation_id) REFERENCES conversations(id)
      );

      CREATE TABLE IF NOT EXISTS image_analyses (
        id TEXT PRIMARY KEY,
        conversation_id TEXT,
        image_url TEXT,
        diagnosis TEXT,
        confidence REAL,
        severity TEXT,
        booking_id TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (conversation_id) REFERENCES conversations(id)
      );

      CREATE TABLE IF NOT EXISTS emergencies (
        id TEXT PRIMARY KEY,
        customer_name TEXT,
        phone TEXT,
        email TEXT,
        vehicle TEXT,
        vehicle_number TEXT,
        emergency_type TEXT,
        price REAL DEFAULT 0,
        latitude REAL,
        longitude REAL,
        address TEXT,
        notes TEXT,
        priority TEXT DEFAULT 'Normal',
        status TEXT DEFAULT 'Pending',
        created_time TEXT DEFAULT (datetime('now')),
        updated_time TEXT DEFAULT (datetime('now')),
        assigned_mechanic TEXT,
        eta TEXT,
        eta_minutes INTEGER,
        payment_method TEXT DEFAULT 'UPI',
        payment_status TEXT DEFAULT 'Pending',
        invoice_id TEXT,
        total_distance_km REAL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS refresh_tokens (
        token TEXT PRIMARY KEY,
        user_id TEXT,
        role TEXT,
        expires_at TEXT,
        blacklisted INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS services (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        price REAL DEFAULT 0,
        duration_estimate TEXT,
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS emergency_types (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        base_price REAL DEFAULT 0,
        eta_min INTEGER DEFAULT 15,
        eta_max INTEGER DEFAULT 30,
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        admin_id TEXT,
        action TEXT,
        entity TEXT,
        entity_id TEXT,
        description TEXT,
        ip_address TEXT,
        timestamp TEXT DEFAULT (datetime('now'))
      );
    `);
  },

  /**
   * Rollback the migration – drops all tables in reverse order.
   * @param {import('better-sqlite3').Database} db
   */
  down(db) {
    db.exec(`
      DROP TABLE IF EXISTS audit_logs;
      DROP TABLE IF EXISTS emergency_types;
      DROP TABLE IF EXISTS services;
      DROP TABLE IF EXISTS refresh_tokens;
      DROP TABLE IF EXISTS emergencies;
      DROP TABLE IF EXISTS image_analyses;
      DROP TABLE IF EXISTS chat_messages;
      DROP TABLE IF EXISTS conversations;
      DROP TABLE IF EXISTS booking_logs;
      DROP TABLE IF EXISTS notifications;
      DROP TABLE IF EXISTS payments;
      DROP TABLE IF EXISTS bookings;
      DROP TABLE IF EXISTS mechanics;
      DROP TABLE IF EXISTS admins;
      DROP TABLE IF EXISTS users;
    `);
  },
};

export default migration;
