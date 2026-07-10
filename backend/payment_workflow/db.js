export function initPaymentDatabase(db) {
  console.log('Running workflow payment database migrations...');

  // 1. Create coupons table
  db.exec(`
    CREATE TABLE IF NOT EXISTS coupons (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      discount_type TEXT NOT NULL, -- 'percentage', 'flat'
      discount_value REAL NOT NULL,
      min_order_value REAL DEFAULT 0,
      usage_limit INTEGER DEFAULT 0, -- 0 for unlimited
      used_count INTEGER DEFAULT 0,
      expiry_date DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 2. Create workflow_payments table
  db.exec(`
    CREATE TABLE IF NOT EXISTS workflow_payments (
      id TEXT PRIMARY KEY,
      booking_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      order_id TEXT,
      payment_id TEXT,
      gateway TEXT DEFAULT 'Razorpay',
      currency TEXT DEFAULT 'INR',
      amount REAL NOT NULL,
      tax REAL DEFAULT 0,
      discount REAL DEFAULT 0,
      status TEXT DEFAULT 'created', -- 'created', 'pending', 'authorized', 'captured', 'failed', 'cancelled', 'refunded', 'partial_refund', 'expired'
      method TEXT,
      transaction_reference TEXT,
      gateway_response TEXT,
      invoice_path TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (booking_id) REFERENCES bookings(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  // 3. Create workflow_refunds table
  db.exec(`
    CREATE TABLE IF NOT EXISTS workflow_refunds (
      id TEXT PRIMARY KEY,
      booking_id TEXT NOT NULL,
      payment_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      amount_requested REAL NOT NULL,
      amount_refunded REAL DEFAULT 0,
      status TEXT DEFAULT 'requested', -- 'requested', 'approved', 'processing', 'completed', 'failed', 'rejected'
      reason TEXT,
      gateway_refund_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (booking_id) REFERENCES bookings(id),
      FOREIGN KEY (payment_id) REFERENCES workflow_payments(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  console.log('✅ Workflow payment database migrations complete.');
}
