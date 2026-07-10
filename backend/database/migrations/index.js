import migration001 from './001_initial_schema.js';
import migration002 from './002_add_indexes.js';
import migration003 from './003_add_active_jobs.js';
import migration004 from './004_add_audit_history.js';

/**
 * All database migrations in execution order.
 * Each migration has: { version, name, up(db), down(db) }
 */
const migrations = [
  migration001,
  migration002,
  migration003,
  migration004,
];

export default migrations;
