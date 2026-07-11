/**
 * @fileoverview Reliability & Production Readiness tables.
 * Creates tables for feature flags, notification logs, and socket failure logs.
 * @version 6
 */

const migration = {
  version: 6,
  name: '006_reliability_production_readiness',

  up(db) {
    db.exec(`
      -- Feature Flags: runtime-configurable feature toggles
      CREATE TABLE IF NOT EXISTS feature_flags (
        id TEXT PRIMARY KEY,
        flag_name TEXT NOT NULL UNIQUE,
        is_enabled INTEGER DEFAULT 1,
        description TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );

      -- Notification Logs: track every notification lifecycle
      CREATE TABLE IF NOT EXISTS notification_logs (
        id TEXT PRIMARY KEY,
        recipient_id TEXT,
        notification_type TEXT NOT NULL,
        title TEXT,
        message TEXT,
        payload TEXT,
        status TEXT DEFAULT 'queued',
        retry_count INTEGER DEFAULT 0,
        max_retries INTEGER DEFAULT 3,
        error_message TEXT,
        sent_at TEXT,
        delivered_at TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );

      -- Socket Failure Logs: track failed socket emissions
      CREATE TABLE IF NOT EXISTS socket_failure_logs (
        id TEXT PRIMARY KEY,
        event_name TEXT NOT NULL,
        socket_id TEXT,
        payload TEXT,
        reason TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      );

      -- Indexes for reliability tables
      CREATE INDEX IF NOT EXISTS idx_feature_flags_name ON feature_flags(flag_name);
      CREATE INDEX IF NOT EXISTS idx_notification_logs_recipient ON notification_logs(recipient_id);
      CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON notification_logs(status);
      CREATE INDEX IF NOT EXISTS idx_notification_logs_type ON notification_logs(notification_type);
      CREATE INDEX IF NOT EXISTS idx_notification_logs_created ON notification_logs(created_at);
      CREATE INDEX IF NOT EXISTS idx_socket_failure_logs_event ON socket_failure_logs(event_name);
      CREATE INDEX IF NOT EXISTS idx_socket_failure_logs_created ON socket_failure_logs(created_at);
    `);

    // Seed default feature flags
    const flags = [
      ['ff-enablePayments', 'enablePayments', 1, 'Enable payment processing'],
      ['ff-enableAI', 'enableAI', 1, 'Enable AI-powered chat and image analysis'],
      ['ff-enableEmergencyMode', 'enableEmergencyMode', 1, 'Enable emergency request handling'],
      ['ff-enableLiveTracking', 'enableLiveTracking', 1, 'Enable real-time mechanic tracking'],
      ['ff-enableNotifications', 'enableNotifications', 1, 'Enable push/email notifications'],
      ['ff-enableAdminPanel', 'enableAdminPanel', 1, 'Enable admin dashboard access'],
      ['ff-enableBookingSystem', 'enableBookingSystem', 1, 'Enable booking creation and management'],
      ['ff-enableChatSystem', 'enableChatSystem', 1, 'Enable chat and messaging'],
      ['ff-enablePricingEngine', 'enablePricingEngine', 1, 'Enable dynamic pricing calculations'],
      ['ff-enableAnalytics', 'enableAnalytics', 1, 'Enable analytics and reporting'],
      ['ff-maintenanceMode', 'maintenanceMode', 0, 'Enable maintenance mode (blocks non-admin access)'],
    ];
    const insertFlag = db.prepare(
      'INSERT OR IGNORE INTO feature_flags (id, flag_name, is_enabled, description) VALUES (?, ?, ?, ?)'
    );
    for (const row of flags) {
      insertFlag.run(...row);
    }
  },

  down(db) {
    db.exec(`
      DROP TABLE IF EXISTS socket_failure_logs;
      DROP TABLE IF EXISTS notification_logs;
      DROP TABLE IF EXISTS feature_flags;

      DROP INDEX IF EXISTS idx_feature_flags_name;
      DROP INDEX IF EXISTS idx_notification_logs_recipient;
      DROP INDEX IF EXISTS idx_notification_logs_status;
      DROP INDEX IF EXISTS idx_notification_logs_type;
      DROP INDEX IF EXISTS idx_notification_logs_created;
      DROP INDEX IF EXISTS idx_socket_failure_logs_event;
      DROP INDEX IF EXISTS idx_socket_failure_logs_created;
    `);
  },
};

export default migration;
