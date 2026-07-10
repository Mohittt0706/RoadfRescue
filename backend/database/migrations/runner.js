/**
 * Migration Runner
 * 
 * Manages database schema migrations with version tracking.
 * Each migration has: name, version, up(), down()
 * Migrations are tracked in schema_migrations table.
 * Only executes once per migration.
 */

/**
 * Ensure the schema_migrations tracking table exists.
 */
function ensureMigrationsTable(db) {
  db.prepare(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      executed_at TEXT DEFAULT (datetime('now'))
    )
  `).run();
}

/**
 * Get all executed migration versions.
 */
function getExecutedMigrations(db) {
  ensureMigrationsTable(db);
  const rows = db.prepare('SELECT version FROM schema_migrations ORDER BY version ASC').all();
  return new Set(rows.map(r => r.version));
}

/**
 * Record a migration as executed.
 */
function recordMigration(db, version, name) {
  db.prepare(`
    INSERT INTO schema_migrations (version, name, executed_at)
    VALUES (?, ?, datetime('now'))
  `).run(version, name);
}

/**
 * Remove a migration record (for rollback).
 */
function removeMigrationRecord(db, version) {
  db.prepare('DELETE FROM schema_migrations WHERE version = ?').run(version);
}

/**
 * Run all pending migrations in order.
 * @param {object} db - better-sqlite3 database instance
 * @param {Array} migrations - array of migration objects [{version, name, up, down}]
 * @returns {Array} list of executed migration names
 */
export function runMigrations(db, migrations) {
  ensureMigrationsTable(db);
  const executed = getExecutedMigrations(db);
  const pending = migrations
    .filter(m => !executed.has(m.version))
    .sort((a, b) => a.version - b.version);

  const results = [];

  if (pending.length === 0) {
    console.log('[Migrations] No pending migrations.');
    return results;
  }

  console.log(`[Migrations] Running ${pending.length} pending migration(s)...`);

  // Use a transaction for each migration for atomicity
  for (const migration of pending) {
    try {
      const runInTransaction = db.transaction(() => {
        migration.up(db);
        recordMigration(db, migration.version, migration.name);
      });
      runInTransaction();
      results.push(migration.name);
      console.log(`  ✓ ${migration.name} (v${migration.version})`);
    } catch (err) {
      console.error(`  ✗ FAILED: ${migration.name} (v${migration.version})`);
      console.error(`    Error: ${err.message}`);
      throw new Error(`Migration ${migration.name} failed: ${err.message}`);
    }
  }

  console.log(`[Migrations] ${results.length} migration(s) completed successfully.`);
  return results;
}

/**
 * Rollback the last N migrations.
 * @param {object} db - better-sqlite3 database instance
 * @param {Array} migrations - array of migration objects
 * @param {number} count - number of migrations to rollback (default: 1)
 */
export function rollbackMigrations(db, migrations, count = 1) {
  ensureMigrationsTable(db);
  const executed = db.prepare(
    'SELECT version, name FROM schema_migrations ORDER BY version DESC LIMIT ?'
  ).all(count);

  if (executed.length === 0) {
    console.log('[Migrations] No migrations to rollback.');
    return [];
  }

  const results = [];
  const migrationMap = new Map(migrations.map(m => [m.version, m]));

  for (const { version, name } of executed) {
    const migration = migrationMap.get(version);
    if (!migration) {
      console.warn(`  ⚠ Migration v${version} (${name}) not found in migration files. Skipping.`);
      continue;
    }

    try {
      const runInTransaction = db.transaction(() => {
        migration.down(db);
        removeMigrationRecord(db, version);
      });
      runInTransaction();
      results.push(name);
      console.log(`  ✓ Rolled back: ${name} (v${version})`);
    } catch (err) {
      console.error(`  ✗ Rollback FAILED: ${name} (v${version})`);
      console.error(`    Error: ${err.message}`);
      throw new Error(`Rollback of ${name} failed: ${err.message}`);
    }
  }

  console.log(`[Migrations] Rolled back ${results.length} migration(s).`);
  return results;
}

/**
 * Get current schema version (latest executed migration version).
 */
export function getCurrentVersion(db) {
  ensureMigrationsTable(db);
  const row = db.prepare('SELECT MAX(version) as version FROM schema_migrations').get();
  return row?.version || 0;
}

/**
 * Get migration status report.
 */
export function getMigrationStatus(db, migrations) {
  ensureMigrationsTable(db);
  const executed = getExecutedMigrations(db);
  return migrations
    .sort((a, b) => a.version - b.version)
    .map(m => ({
      version: m.version,
      name: m.name,
      status: executed.has(m.version) ? 'executed' : 'pending'
    }));
}
