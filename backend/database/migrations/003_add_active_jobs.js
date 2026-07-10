export default {
  version: 3,
  name: '003_add_active_jobs',
  up(db) {
    db.exec(`
      CREATE TABLE active_jobs (
        id TEXT PRIMARY KEY,
        booking_id TEXT NOT NULL,
        mechanic_id TEXT NOT NULL,
        emergency_id TEXT,
        assigned_at TEXT DEFAULT (datetime('now')),
        started_at TEXT,
        completed_at TEXT,
        status TEXT DEFAULT 'assigned',
        current_latitude REAL,
        current_longitude REAL,
        eta TEXT,
        eta_minutes INTEGER,
        notes TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (booking_id) REFERENCES bookings(id),
        FOREIGN KEY (mechanic_id) REFERENCES mechanics(id)
      )
    `);

    db.exec(`CREATE INDEX IF NOT EXISTS idx_active_jobs_mechanic ON active_jobs(mechanic_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_active_jobs_booking ON active_jobs(booking_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_active_jobs_status ON active_jobs(status)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_active_jobs_emergency ON active_jobs(emergency_id)`);
  },
  down(db) {
    db.exec(`DROP INDEX IF EXISTS idx_active_jobs_mechanic`);
    db.exec(`DROP INDEX IF EXISTS idx_active_jobs_booking`);
    db.exec(`DROP INDEX IF EXISTS idx_active_jobs_status`);
    db.exec(`DROP INDEX IF EXISTS idx_active_jobs_emergency`);
    db.exec(`DROP TABLE IF EXISTS active_jobs`);
  }
};
