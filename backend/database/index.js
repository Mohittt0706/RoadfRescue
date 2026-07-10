/**
 * Database Layer - Main Entry Point
 * 
 * Re-exports all database components for easy importing.
 * 
 * Usage:
 *   import { bootstrapDatabase, getRepositories, getServices } from './database/index.js';
 */

export { bootstrapDatabase, getDatabaseStatus, closeDatabase } from './bootstrap.js';
export { runMigrations, rollbackMigrations, getCurrentVersion, getMigrationStatus } from './migrations/runner.js';
export { initRepositories, getRepositories } from './repositories/index.js';
export { initServices, getServices } from './services/index.js';
export { schema } from './schema/index.js';
export { default as migrations } from './migrations/index.js';
