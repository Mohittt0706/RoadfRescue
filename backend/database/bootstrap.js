/**
 * Database Bootstrap Module
 * 
 * Orchestrates:
 * 1. SQLite database initialization (WAL mode, foreign keys)
 * 2. Migration execution (only runs pending migrations)
 * 3. Repository layer initialization
 * 4. Service layer initialization
 * 
 * Usage:
 *   import { bootstrapDatabase } from './database/bootstrap.js';
 *   const { db, repositories, services } = bootstrapDatabase();
 */

import Database from 'better-sqlite3';
import { join } from 'path';
import migrations from './migrations/index.js';
import { runMigrations, getCurrentVersion, getMigrationStatus } from './migrations/runner.js';
import { initRepositories } from './repositories/index.js';
import { initServices } from './services/index.js';

/**
 * Initialize the SQLite database with optimal settings.
 */
function initializeSQLite(dbPath) {
  const db = new Database(dbPath);
  
  // Performance optimizations for SQLite
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('synchronous = NORMAL');
  db.pragma('cache_size = -64000'); // 64MB cache
  db.pragma('busy_timeout = 5000'); // 5 second busy timeout
  
  return db;
}

/**
 * Bootstrap the entire database layer.
 * 
 * @param {string} dbPath - Path to SQLite database file
 * @returns {{ db, repositories, services, migrationResults }}
 */
export function bootstrapDatabase(dbPath) {
  const resolvedPath = dbPath || join(process.cwd(), 'roadrescue.db');
  
  console.log(`[DB] Initializing database at: ${resolvedPath}`);
  const db = initializeSQLite(resolvedPath);
  
  // Run migrations
  console.log('[DB] Running migrations...');
  const migrationResults = runMigrations(db, migrations);
  
  const currentVersion = getCurrentVersion(db);
  console.log(`[DB] Schema version: ${currentVersion}`);
  
  // Initialize repositories
  console.log('[DB] Initializing repositories...');
  const repositories = initRepositories(db);
  
  // Initialize services
  console.log('[DB] Initializing services...');
  const services = initServices(db, repositories);
  
  console.log('[DB] Bootstrap complete.');
  
  return { db, repositories, services, migrationResults };
}

/**
 * Get database health status.
 */
export function getDatabaseStatus(db) {
  try {
    const version = getCurrentVersion(db);
    const status = getMigrationStatus(db, migrations);
    const tables = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
    ).all();
    
    return {
      healthy: true,
      schemaVersion: version,
      totalMigrations: migrations.length,
      pendingMigrations: status.filter(s => s.status === 'pending').length,
      tables: tables.map(t => t.name),
    };
  } catch (err) {
    return {
      healthy: false,
      error: err.message,
    };
  }
}

/**
 * Gracefully close the database connection.
 */
export function closeDatabase(db) {
  if (db) {
    db.close();
    console.log('[DB] Database connection closed.');
  }
}

export default bootstrapDatabase;
