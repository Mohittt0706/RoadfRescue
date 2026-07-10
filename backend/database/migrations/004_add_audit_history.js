export default {
  version: 4,
  name: '004_add_audit_history',
  up(db) {
    db.exec(`
      CREATE TABLE audit_history (
        id TEXT PRIMARY KEY,
        entity TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        action TEXT NOT NULL,
        performed_by TEXT,
        performed_by_role TEXT,
        old_value TEXT,
        new_value TEXT,
        description TEXT,
        ip_address TEXT,
        timestamp TEXT DEFAULT (datetime('now'))
      )
    `);

    db.exec(`CREATE INDEX IF NOT EXISTS idx_audit_history_entity ON audit_history(entity, entity_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_audit_history_performed_by ON audit_history(performed_by)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_audit_history_timestamp ON audit_history(timestamp)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_audit_history_action ON audit_history(action)`);
  },
  down(db) {
    db.exec(`DROP INDEX IF EXISTS idx_audit_history_entity`);
    db.exec(`DROP INDEX IF EXISTS idx_audit_history_performed_by`);
    db.exec(`DROP INDEX IF EXISTS idx_audit_history_timestamp`);
    db.exec(`DROP INDEX IF EXISTS idx_audit_history_action`);
    db.exec(`DROP TABLE IF EXISTS audit_history`);
  }
};
