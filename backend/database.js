import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';

export function initDatabase() {
  const db = new Database('./roadrescue.db');

  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Base schema creation
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      vehicle_type TEXT DEFAULT 'Sedan',
      vehicle_number TEXT,
      emergency_contact TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS admins (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS mechanics (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      password_hash TEXT,
      role TEXT DEFAULT 'mechanic',
      experience_years INTEGER DEFAULT 0,
      rating REAL DEFAULT 4.5,
      total_jobs INTEGER DEFAULT 0,
      status TEXT DEFAULT 'available',
      current_booking_id TEXT,
      specialization TEXT,
      latitude REAL DEFAULT 23.0225,
      longitude REAL DEFAULT 72.5714,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      customer_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      vehicle_type TEXT NOT NULL,
      vehicle_number TEXT NOT NULL,
      service_name TEXT NOT NULL,
      price REAL NOT NULL,
      status TEXT DEFAULT 'Pending',
      latitude REAL,
      longitude REAL,
      address TEXT,
      notes TEXT,
      payment_method TEXT DEFAULT 'Cash',
      payment_status TEXT DEFAULT 'Pending',
      assigned_mechanic_id TEXT,
      estimated_arrival TEXT,
      booking_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (assigned_mechanic_id) REFERENCES mechanics(id)
    );

    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      booking_id TEXT NOT NULL,
      amount REAL NOT NULL,
      method TEXT NOT NULL,
      status TEXT DEFAULT 'Pending',
      transaction_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (booking_id) REFERENCES bookings(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      booking_id TEXT,
      read INTEGER DEFAULT 0,
      target_role TEXT DEFAULT 'admin',
      target_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (booking_id) REFERENCES bookings(id)
    );

    CREATE TABLE IF NOT EXISTS booking_logs (
      id TEXT PRIMARY KEY,
      booking_id TEXT NOT NULL,
      status TEXT NOT NULL,
      note TEXT,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (booking_id) REFERENCES bookings(id)
    );

    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      title TEXT DEFAULT 'New Conversation',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      sender TEXT NOT NULL,
      content TEXT NOT NULL,
      image_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (conversation_id) REFERENCES conversations(id)
    );

    CREATE TABLE IF NOT EXISTS image_analyses (
      id TEXT PRIMARY KEY,
      conversation_id TEXT,
      image_url TEXT NOT NULL,
      diagnosis TEXT,
      confidence REAL DEFAULT 0,
      severity TEXT DEFAULT 'Medium',
      booking_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (conversation_id) REFERENCES conversations(id),
      FOREIGN KEY (booking_id) REFERENCES bookings(id)
    );

    CREATE TABLE IF NOT EXISTS emergencies (
      id TEXT PRIMARY KEY,
      customer_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      vehicle TEXT NOT NULL,
      vehicle_number TEXT NOT NULL,
      emergency_type TEXT NOT NULL,
      price REAL DEFAULT 0,
      latitude REAL,
      longitude REAL,
      address TEXT,
      notes TEXT,
      priority TEXT DEFAULT 'Normal',
      status TEXT DEFAULT 'Pending',
      created_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      assigned_mechanic TEXT,
      eta TEXT,
      eta_minutes INTEGER DEFAULT 0,
      payment_method TEXT DEFAULT 'UPI',
      payment_status TEXT DEFAULT 'Pending',
      invoice_id TEXT,
      total_distance_km REAL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS refresh_tokens (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL,
      expires_at DATETIME NOT NULL,
      blacklisted INTEGER DEFAULT 0
    );
  `);

  // Run migrations safely
  runMigrations(db);

  // Seed default data
  seedData(db);

  return db;
}

function runMigrations(db) {
  // Safe column adder helper
  const addColumnIfNeeded = (tableName, columnName, columnDef) => {
    try {
      const tableInfo = db.prepare(`PRAGMA table_info(${tableName})`).all();
      const columnExists = tableInfo.some(col => col.name === columnName);
      if (!columnExists) {
        db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDef}`);
        console.log(`Migration: Added column '${columnName}' to table '${tableName}'`);
      }
    } catch (err) {
      console.error(`Migration error adding '${columnName}' to '${tableName}':`, err);
    }
  };

  // 1. Users Migrations
  addColumnIfNeeded('users', 'status', "TEXT DEFAULT 'active'");
  addColumnIfNeeded('users', 'profile_image', 'TEXT DEFAULT NULL');
  addColumnIfNeeded('users', 'address', 'TEXT DEFAULT NULL');
  addColumnIfNeeded('users', 'city', 'TEXT DEFAULT NULL');
  addColumnIfNeeded('users', 'vehicle', 'TEXT DEFAULT NULL');
  addColumnIfNeeded('users', 'reset_token', 'TEXT DEFAULT NULL');
  addColumnIfNeeded('users', 'reset_token_expiry', 'DATETIME DEFAULT NULL');
  addColumnIfNeeded('users', 'refresh_token', 'TEXT DEFAULT NULL');
  addColumnIfNeeded('users', 'updated_at', 'DATETIME DEFAULT CURRENT_TIMESTAMP');

  // 2. Mechanics Migrations
  addColumnIfNeeded('mechanics', 'approval_status', "TEXT DEFAULT 'pending'");
  addColumnIfNeeded('mechanics', 'profile_image', 'TEXT DEFAULT NULL');
  addColumnIfNeeded('mechanics', 'address', 'TEXT DEFAULT NULL');
  addColumnIfNeeded('mechanics', 'city', 'TEXT DEFAULT NULL');
  addColumnIfNeeded('mechanics', 'reset_token', 'TEXT DEFAULT NULL');
  addColumnIfNeeded('mechanics', 'reset_token_expiry', 'DATETIME DEFAULT NULL');
  addColumnIfNeeded('mechanics', 'refresh_token', 'TEXT DEFAULT NULL');
  addColumnIfNeeded('mechanics', 'updated_at', 'DATETIME DEFAULT CURRENT_TIMESTAMP');
}

function seedData(db) {
  // Check and upgrade mechanics password_hash if needed (compatibility code from original)
  try {
    db.exec('ALTER TABLE mechanics ADD COLUMN password_hash TEXT');
  } catch (_) { /* already exists */ }
  try {
    db.exec('ALTER TABLE mechanics ADD COLUMN role TEXT DEFAULT \'mechanic\'');
  } catch (_) { /* already exists */ }

  // Set default password for existing mechanics that have no password_hash
  const mechanicsWithoutPw = db.prepare('SELECT id FROM mechanics WHERE password_hash IS NULL').all();
  if (mechanicsWithoutPw.length > 0) {
    const defaultPw = bcrypt.hashSync('mechanic123', 12);
    const updatePw = db.prepare('UPDATE mechanics SET password_hash = ? WHERE id = ?');
    const updateMany = db.transaction((items) => {
      for (const m of items) {
        updatePw.run(defaultPw, m.id);
      }
    });
    updateMany(mechanicsWithoutPw);
    console.log(`Set default password for ${mechanicsWithoutPw.length} existing mechanics`);
  }

  // Populate mechanics with approval_status = 'approved'
  const mechanicCount = db.prepare('SELECT COUNT(*) as count FROM mechanics').get();
  if (mechanicCount.count === 0) {
    const insertMechanic = db.prepare(`
      INSERT INTO mechanics (id, name, phone, email, password_hash, role, experience_years, rating, total_jobs, status, specialization, latitude, longitude, approval_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const defaultPw = bcrypt.hashSync('mechanic123', 12);
    const mechanics = [
      ['m1', 'Rajesh Kumar', '+91 98765 43210', 'rajesh@roadrescue.in', defaultPw, 'mechanic', 12, 4.8, 342, 'available', 'Engine & Towing', 23.0225, 72.5714, 'approved'],
      ['m2', 'Amit Patel', '+91 98765 43211', 'amit@roadrescue.in', defaultPw, 'mechanic', 8, 4.7, 218, 'available', 'Battery & Electrical', 23.0300, 72.5600, 'approved'],
      ['m3', 'Suresh Yadav', '+91 98765 43212', 'suresh@roadrescue.in', defaultPw, 'mechanic', 15, 4.9, 456, 'available', 'Tire & Suspension', 23.0150, 72.5800, 'approved'],
      ['m4', 'Vikram Singh', '+91 98765 43213', 'vikram@roadrescue.in', defaultPw, 'mechanic', 6, 4.5, 134, 'busy', 'Fuel & Lockout', 23.0400, 72.5500, 'approved'],
      ['m5', 'Prakash Mehta', '+91 98765 43214', 'prakash@roadrescue.in', defaultPw, 'mechanic', 10, 4.6, 289, 'available', 'General Repair', 23.0100, 72.5900, 'approved'],
    ];

    const insertMany = db.transaction((items) => {
      for (const item of items) {
        insertMechanic.run(...item);
      }
    });
    insertMany(mechanics);
  }

  // Populate admin
  const adminCount = db.prepare('SELECT COUNT(*) as count FROM admins').get();
  if (adminCount.count === 0) {
    const hashedPassword = bcrypt.hashSync('admin123', 12);
    db.prepare(`
      INSERT INTO admins (id, name, email, password_hash, role)
      VALUES (?, ?, ?, ?, ?)
    `).run('admin1', 'Disha Admin', 'admin@roadrescue.in', hashedPassword, 'super_admin');
  }
}
