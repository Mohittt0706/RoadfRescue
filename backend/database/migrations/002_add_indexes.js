export default {
  version: 2,
  name: '002_add_indexes',
  up(db) {
    db.exec(`CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_bookings_mechanic_id ON bookings(assigned_mechanic_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(booking_time)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON bookings(payment_status)`);

    db.exec(`CREATE INDEX IF NOT EXISTS idx_emergencies_status ON emergencies(status)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_emergencies_priority ON emergencies(priority)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_emergencies_created_at ON emergencies(created_time)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_emergencies_location ON emergencies(latitude, longitude)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_emergencies_type ON emergencies(emergency_type)`);

    db.exec(`CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments(booking_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at)`);

    db.exec(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_users_status ON users(status)`);

    db.exec(`CREATE INDEX IF NOT EXISTS idx_mechanics_status ON mechanics(status)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_mechanics_approval ON mechanics(approval_status)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_mechanics_specialization ON mechanics(specialization)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_mechanics_location ON mechanics(latitude, longitude)`);

    db.exec(`CREATE INDEX IF NOT EXISTS idx_notifications_target ON notifications(target_role, target_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read)`);

    db.exec(`CREATE INDEX IF NOT EXISTS idx_booking_logs_booking_id ON booking_logs(booking_id)`);

    db.exec(`CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id)`);

    db.exec(`CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON chat_messages(conversation_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id)`);

    db.exec(`CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity, entity_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_audit_logs_admin ON audit_logs(admin_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp)`);
  },
  down(db) {
    db.exec(`DROP INDEX IF EXISTS idx_bookings_user_id`);
    db.exec(`DROP INDEX IF EXISTS idx_bookings_mechanic_id`);
    db.exec(`DROP INDEX IF EXISTS idx_bookings_status`);
    db.exec(`DROP INDEX IF EXISTS idx_bookings_created_at`);
    db.exec(`DROP INDEX IF EXISTS idx_bookings_payment_status`);

    db.exec(`DROP INDEX IF EXISTS idx_emergencies_status`);
    db.exec(`DROP INDEX IF EXISTS idx_emergencies_priority`);
    db.exec(`DROP INDEX IF EXISTS idx_emergencies_created_at`);
    db.exec(`DROP INDEX IF EXISTS idx_emergencies_location`);
    db.exec(`DROP INDEX IF EXISTS idx_emergencies_type`);

    db.exec(`DROP INDEX IF EXISTS idx_payments_booking_id`);
    db.exec(`DROP INDEX IF EXISTS idx_payments_status`);
    db.exec(`DROP INDEX IF EXISTS idx_payments_created_at`);

    db.exec(`DROP INDEX IF EXISTS idx_users_email`);
    db.exec(`DROP INDEX IF EXISTS idx_users_phone`);
    db.exec(`DROP INDEX IF EXISTS idx_users_status`);

    db.exec(`DROP INDEX IF EXISTS idx_mechanics_status`);
    db.exec(`DROP INDEX IF EXISTS idx_mechanics_approval`);
    db.exec(`DROP INDEX IF EXISTS idx_mechanics_specialization`);
    db.exec(`DROP INDEX IF EXISTS idx_mechanics_location`);

    db.exec(`DROP INDEX IF EXISTS idx_notifications_target`);
    db.exec(`DROP INDEX IF EXISTS idx_notifications_read`);

    db.exec(`DROP INDEX IF EXISTS idx_booking_logs_booking_id`);

    db.exec(`DROP INDEX IF EXISTS idx_refresh_tokens_user_id`);

    db.exec(`DROP INDEX IF EXISTS idx_chat_messages_conversation`);
    db.exec(`DROP INDEX IF EXISTS idx_conversations_user_id`);

    db.exec(`DROP INDEX IF EXISTS idx_audit_logs_entity`);
    db.exec(`DROP INDEX IF EXISTS idx_audit_logs_admin`);
    db.exec(`DROP INDEX IF EXISTS idx_audit_logs_timestamp`);
  }
};
