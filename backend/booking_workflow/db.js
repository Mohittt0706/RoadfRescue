export function initWorkflowDatabase(db) {
  console.log('Running workflow database migrations...');

  // 1. Create booking_history table
  db.exec(`
    CREATE TABLE IF NOT EXISTS booking_history (
      id TEXT PRIMARY KEY,
      booking_id TEXT NOT NULL,
      old_status TEXT,
      new_status TEXT NOT NULL,
      updated_by TEXT NOT NULL, -- 'user', 'mechanic', 'admin', 'system'
      remarks TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 2. Create booking_assignment table for SOS / automatic cascades
  db.exec(`
    CREATE TABLE IF NOT EXISTS booking_assignment (
      id TEXT PRIMARY KEY,
      booking_id TEXT NOT NULL,
      mechanic_id TEXT NOT NULL,
      status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'rejected', 'expired'
      assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      responded_at DATETIME,
      decline_reason TEXT,
      FOREIGN KEY (mechanic_id) REFERENCES mechanics(id)
    );
  `);

  // 3. Create mechanic_locations table
  db.exec(`
    CREATE TABLE IF NOT EXISTS mechanic_locations (
      mechanic_id TEXT PRIMARY KEY,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (mechanic_id) REFERENCES mechanics(id)
    );
  `);

  // 4. Create reviews table
  db.exec(`
    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      booking_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      mechanic_id TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
      review_text TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (booking_id) REFERENCES bookings(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (mechanic_id) REFERENCES mechanics(id)
    );
  `);

  // 5. Create refund_requests table
  db.exec(`
    CREATE TABLE IF NOT EXISTS refund_requests (
      id TEXT PRIMARY KEY,
      booking_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      amount REAL NOT NULL,
      status TEXT DEFAULT 'requested', -- 'requested', 'approved', 'rejected', 'completed'
      reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (booking_id) REFERENCES bookings(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  // Run alterations safely for bookings and emergencies if needed
  const addColumnIfNeeded = (tableName, columnName, columnDef) => {
    try {
      const tableInfo = db.prepare(`PRAGMA table_info(${tableName})`).all();
      const columnExists = tableInfo.some(col => col.name === columnName);
      if (!columnExists) {
        db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDef}`);
        console.log(`Workflow Migration: Added column '${columnName}' to table '${tableName}'`);
      }
    } catch (err) {
      console.error(`Workflow Migration error adding '${columnName}' to '${tableName}':`, err);
    }
  };

  addColumnIfNeeded('bookings', 'cancelled_by', 'TEXT DEFAULT NULL');
  addColumnIfNeeded('bookings', 'cancel_reason', 'TEXT DEFAULT NULL');
  addColumnIfNeeded('bookings', 'cancelled_at', 'DATETIME DEFAULT NULL');

  console.log('✅ Workflow database migrations complete.');
}
