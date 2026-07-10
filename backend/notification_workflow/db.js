export function initNotificationWorkflowDatabase(db) {
  console.log('Running workflow notification database migrations...');

  // 1. Create workflow_notifications table
  db.exec(`
    CREATE TABLE IF NOT EXISTS workflow_notifications (
      id TEXT PRIMARY KEY,
      recipient_id TEXT NOT NULL,
      recipient_role TEXT NOT NULL, -- 'user', 'mechanic', 'admin', 'all'
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL,
      priority TEXT DEFAULT 'Normal', -- 'Low', 'Normal', 'High', 'Critical'
      related_entity TEXT, -- 'booking', 'emergency', 'payment', 'chat'
      related_entity_id TEXT,
      is_read INTEGER DEFAULT 0,
      is_delivered INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      read_at DATETIME,
      delivered_at DATETIME,
      expires_at DATETIME,
      metadata TEXT -- JSON string
    );
  `);

  // 2. Create notification_preferences table
  db.exec(`
    CREATE TABLE IF NOT EXISTS notification_preferences (
      user_id TEXT PRIMARY KEY,
      push_enabled INTEGER DEFAULT 1,
      email_enabled INTEGER DEFAULT 1,
      sms_enabled INTEGER DEFAULT 1,
      booking_updates INTEGER DEFAULT 1,
      emergency_updates INTEGER DEFAULT 1,
      payment_updates INTEGER DEFAULT 1,
      chat_notifications INTEGER DEFAULT 1,
      marketing_notifications INTEGER DEFAULT 0
    );
  `);

  // 3. Create push_device_tokens table
  db.exec(`
    CREATE TABLE IF NOT EXISTS push_device_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      device_token TEXT NOT NULL UNIQUE,
      platform TEXT NOT NULL, -- 'ios', 'android', 'web'
      last_active DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('✅ Workflow notification database migrations complete.');
}
