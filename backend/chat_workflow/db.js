export function initChatWorkflowDatabase(db) {
  console.log('Running workflow chat database migrations...');

  const addColumnSafe = (table, column, type, defaultValue) => {
    try {
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${type} DEFAULT ${defaultValue}`);
      console.log(`Chat Migration: Added column '${column}' to table '${table}'`);
    } catch (err) {
      if (!err.message.includes('duplicate column name') && !err.message.includes('already exists')) {
        console.warn(`Warning migrating column '${column}' in table '${table}':`, err.message);
      }
    }
  };

  // 1. Add fields to conversations table
  addColumnSafe('conversations', 'type', 'TEXT', "'User-AI'");
  addColumnSafe('conversations', 'participants', 'TEXT', 'NULL');
  addColumnSafe('conversations', 'created_by', 'TEXT', 'NULL');
  addColumnSafe('conversations', 'last_message', 'TEXT', 'NULL');
  addColumnSafe('conversations', 'last_message_time', 'DATETIME', 'NULL');
  addColumnSafe('conversations', 'status', 'TEXT', "'active'");

  // 2. Add fields to chat_messages table
  addColumnSafe('chat_messages', 'sender_role', 'TEXT', "'user'");
  addColumnSafe('chat_messages', 'message_type', 'TEXT', "'Text'");
  addColumnSafe('chat_messages', 'attachment', 'TEXT', 'NULL');
  addColumnSafe('chat_messages', 'status', 'TEXT', "'sent'");
  addColumnSafe('chat_messages', 'edited_at', 'DATETIME', 'NULL');
  addColumnSafe('chat_messages', 'deleted_at', 'DATETIME', 'NULL');
  addColumnSafe('chat_messages', 'reply_to', 'TEXT', 'NULL');

  // 3. Create workflow_attachments table
  db.exec(`
    CREATE TABLE IF NOT EXISTS workflow_attachments (
      id TEXT PRIMARY KEY,
      message_id TEXT NOT NULL,
      filename TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      file_path TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (message_id) REFERENCES chat_messages(id)
    );
  `);

  // 4. Create ai_history table
  db.exec(`
    CREATE TABLE IF NOT EXISTS ai_history (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      conversation_id TEXT NOT NULL,
      prompt TEXT NOT NULL,
      response TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      helpful_rating TEXT DEFAULT 'N/A', -- 'Helpful', 'Not Helpful', 'Report Incorrect'
      response_time_ms INTEGER DEFAULT 0,
      FOREIGN KEY (conversation_id) REFERENCES conversations(id)
    );
  `);

  // 5. Create message_reads table
  db.exec(`
    CREATE TABLE IF NOT EXISTS message_reads (
      id TEXT PRIMARY KEY,
      message_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      read_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (message_id) REFERENCES chat_messages(id)
    );
  `);

  // 6. Create message_edits table
  db.exec(`
    CREATE TABLE IF NOT EXISTS message_edits (
      id TEXT PRIMARY KEY,
      message_id TEXT NOT NULL,
      old_content TEXT NOT NULL,
      edited_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (message_id) REFERENCES chat_messages(id)
    );
  `);

  // 7. Create ai_feedback table
  db.exec(`
    CREATE TABLE IF NOT EXISTS ai_feedback (
      id TEXT PRIMARY KEY,
      ai_history_id TEXT NOT NULL,
      rating TEXT NOT NULL, -- 'Helpful', 'Not Helpful', 'Report Incorrect'
      remarks TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ai_history_id) REFERENCES ai_history(id)
    );
  `);

  console.log('✅ Workflow chat database migrations complete.');
}
