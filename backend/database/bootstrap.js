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
import bcrypt from 'bcryptjs';
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
  
  // Seed demo data (idempotent - safe to run on every boot)
  console.log('[DB] Seeding demo data...');
  seedDemoData(db);
  
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

/**
 * Seed demo data.
 * Uses INSERT OR IGNORE so it never duplicates or overwrites existing data.
 * Safe to run on every boot.
 */
function seedDemoData(db) {
  try {
    // --- Demo User (email UNIQUE constraint prevents duplicates) ---
    const userHash = bcrypt.hashSync('user123', 12);
    const userResult = db.prepare(`
      INSERT OR IGNORE INTO users (id, name, email, phone, password_hash, vehicle_type, vehicle_number, emergency_contact, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run('user-demo-001', 'Demo User', 'user@roadrescue.in', '9876543210', userHash, 'Sedan', 'GJ-01-AB-1234', '9876543211', 'active');
    if (userResult.changes > 0) {
      console.log('[DB] Seeded demo user: user@roadrescue.in / user123');
    } else {
      // User exists - ensure password_hash is valid (not plaintext)
      const existing = db.prepare('SELECT id, password_hash FROM users WHERE email = ?').get('user@roadrescue.in');
      if (existing && existing.password_hash && !existing.password_hash.startsWith('$2')) {
        const rehash = bcrypt.hashSync('user123', 12);
        db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(rehash, existing.id);
        console.log('[DB] Migrated demo user password to bcrypt hash');
      } else {
        console.log('[DB] Demo user already exists: user@roadrescue.in');
      }
    }

    // --- Demo Mechanic ---
    const mechHash = bcrypt.hashSync('mechanic123', 12);
    const mechResult = db.prepare(`
      INSERT OR IGNORE INTO mechanics (id, name, phone, email, password_hash, role, experience_years, rating, total_jobs, status, specialization, latitude, longitude, approval_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run('mech-demo-001', 'Demo Mechanic', '+91 98765 43210', 'mechanic@roadrescue.in', mechHash, 'mechanic', 8, 4.7, 150, 'available', 'General Repair', 23.0225, 72.5714, 'approved');
    if (mechResult.changes > 0) {
      console.log('[DB] Seeded demo mechanic: mechanic@roadrescue.in / mechanic123');
    } else {
      const existing = db.prepare('SELECT id, password_hash FROM mechanics WHERE email = ?').get('mechanic@roadrescue.in');
      if (existing && existing.password_hash && !existing.password_hash.startsWith('$2')) {
        const rehash = bcrypt.hashSync('mechanic123', 12);
        db.prepare('UPDATE mechanics SET password_hash = ? WHERE id = ?').run(rehash, existing.id);
        console.log('[DB] Migrated demo mechanic password to bcrypt hash');
      } else {
        console.log('[DB] Demo mechanic already exists: mechanic@roadrescue.in');
      }
    }

    // --- Demo Admin ---
    const adminHash = bcrypt.hashSync('admin123', 12);
    const adminResult = db.prepare(`
      INSERT OR IGNORE INTO admins (id, name, email, password_hash, role)
      VALUES (?, ?, ?, ?, ?)
    `).run('admin-demo-001', 'Demo Admin', 'admin@roadrescue.in', adminHash, 'super_admin');
    if (adminResult.changes > 0) {
      console.log('[DB] Seeded demo admin: admin@roadrescue.in / admin123');
    } else {
      const existing = db.prepare('SELECT id, password_hash FROM admins WHERE email = ?').get('admin@roadrescue.in');
      if (existing && existing.password_hash && !existing.password_hash.startsWith('$2')) {
        const rehash = bcrypt.hashSync('admin123', 12);
        db.prepare('UPDATE admins SET password_hash = ? WHERE id = ?').run(rehash, existing.id);
        console.log('[DB] Migrated demo admin password to bcrypt hash');
      } else {
        console.log('[DB] Demo admin already exists: admin@roadrescue.in');
      }
    }

    // --- Seed reference data if empty ---
    const svcCount = db.prepare('SELECT COUNT(*) as count FROM services').get();
    if (svcCount.count === 0) {
      const insertSvc = db.prepare(`INSERT OR IGNORE INTO services (id, name, description, price, duration_estimate, is_active) VALUES (?, ?, ?, ?, ?, ?)`);
      const services = [
        ['svc-001', 'Flat Tire Repair', 'Repair or replace flat tires on roadside', 699, '30-45 min', 1],
        ['svc-002', 'Battery Jump Start', 'Jump start dead battery or replace if needed', 999, '20-30 min', 1],
        ['svc-003', 'Fuel Delivery', 'Emergency fuel delivery to your location', 799, '25-35 min', 1],
        ['svc-004', 'Engine Breakdown Diagnosis', 'Complete engine diagnosis and temporary fix', 1499, '45-60 min', 1],
        ['svc-005', 'Car Towing', 'Tow vehicle to nearest authorized workshop', 1999, '30-50 min', 1],
        ['svc-006', 'Lockout Assistance', 'Unlock vehicle when keys are locked inside', 899, '15-25 min', 1],
      ];
      for (const s of services) insertSvc.run(...s);
      console.log('[DB] Seeded 6 services');
    }

    const etCount = db.prepare('SELECT COUNT(*) as count FROM emergency_types').get();
    if (etCount.count === 0) {
      const insertEt = db.prepare(`INSERT OR IGNORE INTO emergency_types (id, name, description, base_price, eta_min, eta_max, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)`);
      const types = [
        ['et-001', 'Flat Tire', 'Puncture or blowout', 699, 15, 25, 1],
        ['et-002', 'Dead Battery', 'Battery drained or dead', 999, 10, 20, 1],
        ['et-003', 'Fuel Delivery', 'Ran out of fuel', 799, 20, 30, 1],
        ['et-004', 'Car Towing', 'Vehicle immobile', 1999, 25, 40, 1],
        ['et-005', 'Engine Breakdown', 'Engine failure or overheating', 1499, 20, 35, 1],
        ['et-006', 'Lockout Assistance', 'Locked keys inside', 899, 10, 20, 1],
        ['et-007', 'Accident', 'Vehicle accident', 2499, 15, 30, 1],
        ['et-008', 'Other', 'Other emergency', 999, 15, 30, 1],
      ];
      for (const t of types) insertEt.run(...t);
      console.log('[DB] Seeded 8 emergency types');
    }

    // --- Verify demo users exist ---
    const demoUser = db.prepare('SELECT id, email FROM users WHERE email = ?').get('user@roadrescue.in');
    const demoMech = db.prepare('SELECT id, email FROM mechanics WHERE email = ?').get('mechanic@roadrescue.in');
    const demoAdmin = db.prepare('SELECT id, email FROM admins WHERE email = ?').get('admin@roadrescue.in');
    console.log('[DB] Demo user verification:', {
      user: demoUser ? demoUser.email : 'MISSING',
      mechanic: demoMech ? demoMech.email : 'MISSING',
      admin: demoAdmin ? demoAdmin.email : 'MISSING',
    });
  } catch (err) {
    console.error('[DB] Seed error:', err.message);
  }
}

export default bootstrapDatabase;
