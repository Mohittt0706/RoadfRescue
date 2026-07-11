/**
 * Feature Flag Service
 *
 * Allows enabling/disabling features without code changes.
 * Flags are stored in the database (feature_flags table).
 * Includes in-memory caching for fast reads.
 *
 * Default flags are seeded on first access.
 */

import logger from '../middleware/logger.js';

/**
 * Default feature flags.
 */
const DEFAULT_FLAGS = {
  enablePayments: { enabled: true, description: 'Enable payment processing' },
  enableAI: { enabled: true, description: 'Enable AI-powered chat and image analysis' },
  enableEmergencyMode: { enabled: true, description: 'Enable emergency request handling' },
  enableLiveTracking: { enabled: true, description: 'Enable real-time mechanic tracking' },
  enableNotifications: { enabled: true, description: 'Enable push/email notifications' },
  enableAdminPanel: { enabled: true, description: 'Enable admin dashboard access' },
  enableBookingSystem: { enabled: true, description: 'Enable booking creation and management' },
  enableChatSystem: { enabled: true, description: 'Enable chat and messaging' },
  enablePricingEngine: { enabled: true, description: 'Enable dynamic pricing calculations' },
  enableAnalytics: { enabled: true, description: 'Enable analytics and reporting' },
  maintenanceMode: { enabled: false, description: 'Enable maintenance mode (blocks non-admin access)' },
};

export class FeatureFlagService {
  constructor(db) {
    this.db = db;
    this.cache = new Map();
    this.cacheExpiry = 60 * 1000; // 1 minute cache
    this.lastCacheRefresh = 0;
  }

  /**
   * Ensure the feature_flags table exists and seed defaults.
   */
  ensureTable() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS feature_flags (
        id TEXT PRIMARY KEY,
        flag_name TEXT NOT NULL UNIQUE,
        is_enabled INTEGER DEFAULT 1,
        description TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )
    `);
  }

  /**
   * Seed default feature flags (only if table is empty).
   */
  seedDefaults() {
    this.ensureTable();
    const count = this.db.prepare('SELECT COUNT(*) as count FROM feature_flags').get().count;
    if (count > 0) return;

    const stmt = this.db.prepare(
      'INSERT OR IGNORE INTO feature_flags (id, flag_name, is_enabled, description) VALUES (?, ?, ?, ?)'
    );

    for (const [name, config] of Object.entries(DEFAULT_FLAGS)) {
      stmt.run(`ff-${name}`, name, config.enabled ? 1 : 0, config.description);
    }

    logger.info('[FeatureFlags] Seeded default feature flags');
  }

  /**
   * Refresh the in-memory cache from database.
   */
  refreshCache() {
    this.ensureTable();
    const rows = this.db.prepare('SELECT flag_name, is_enabled, description FROM feature_flags').all();

    this.cache.clear();
    for (const row of rows) {
      this.cache.set(row.flag_name, {
        enabled: row.is_enabled === 1,
        description: row.description,
      });
    }
    this.lastCacheRefresh = Date.now();
  }

  /**
   * Get cache, refreshing if stale.
   */
  getCache() {
    if (Date.now() - this.lastCacheRefresh > this.cacheExpiry || this.cache.size === 0) {
      this.refreshCache();
    }
    return this.cache;
  }

  /**
   * Check if a feature flag is enabled.
   * @param {string} flagName - Feature flag name
   * @returns {boolean} Whether the feature is enabled
   */
  isEnabled(flagName) {
    const cache = this.getCache();
    const flag = cache.get(flagName);
    return flag ? flag.enabled : false;
  }

  /**
   * Get all feature flags.
   * @returns {Array} All flags
   */
  getAllFlags() {
    this.ensureTable();
    this.refreshCache();
    return this.db.prepare('SELECT * FROM feature_flags ORDER BY flag_name').all().map(row => ({
      ...row,
      is_enabled: row.is_enabled === 1,
    }));
  }

  /**
   * Get a single feature flag.
   * @param {string} flagName - Flag name
   * @returns {object|null} Flag details
   */
  getFlag(flagName) {
    this.ensureTable();
    return this.db.prepare('SELECT * FROM feature_flags WHERE flag_name = ?').get(flagName) || null;
  }

  /**
   * Update a feature flag.
   * @param {string} flagName - Flag name
   * @param {boolean} enabled - New enabled state
   * @param {string} description - Optional description update
   * @returns {object} Updated flag
   */
  updateFlag(flagName, enabled, description = undefined) {
    this.ensureTable();
    const now = new Date().toISOString();

    const existing = this.db.prepare('SELECT * FROM feature_flags WHERE flag_name = ?').get(flagName);
    if (!existing) {
      // Create new flag
      const id = `ff-${flagName}`;
      this.db.prepare(
        'INSERT INTO feature_flags (id, flag_name, is_enabled, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(id, flagName, enabled ? 1 : 0, description || null, now, now);
    } else {
      const updates = { is_enabled: enabled ? 1 : 0, updated_at: now };
      if (description !== undefined) updates.description = description;

      const setClause = Object.keys(updates).map(k => `${k} = ?`).join(', ');
      const params = [...Object.values(updates), flagName];
      this.db.prepare(`UPDATE feature_flags SET ${setClause} WHERE flag_name = ?`).run(...params);
    }

    // Invalidate cache
    this.cache.delete(flagName);
    logger.info(`[FeatureFlags] Updated: ${flagName} = ${enabled}`);

    return this.getFlag(flagName);
  }

  /**
   * Bulk update feature flags.
   * @param {object} flags - Map of { flagName: { enabled, description } }
   * @returns {Array} Updated flags
   */
  bulkUpdate(flags) {
    const results = [];
    for (const [name, config] of Object.entries(flags)) {
      const result = this.updateFlag(name, config.enabled, config.description);
      results.push(result);
    }
    return results;
  }

  /**
   * Get feature flags as a simple key-value map.
   * @returns {object} { flagName: boolean }
   */
  getFlagsMap() {
    const cache = this.getCache();
    const map = {};
    for (const [name, flag] of cache) {
      map[name] = flag.enabled;
    }
    return map;
  }
}

export default FeatureFlagService;
