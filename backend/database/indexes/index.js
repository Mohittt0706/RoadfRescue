/**
 * Database Indexes Documentation
 * 
 * Complete list of all database indexes for query optimization.
 * Applied via migration 002_add_indexes.js.
 */

export const indexes = {
  bookings: [
    { name: 'idx_bookings_user_id', columns: ['user_id'], purpose: 'Fast lookup of bookings by user' },
    { name: 'idx_bookings_mechanic_id', columns: ['assigned_mechanic_id'], purpose: 'Fast lookup of bookings by mechanic' },
    { name: 'idx_bookings_status', columns: ['status'], purpose: 'Filter bookings by status (Pending, Accepted, etc.)' },
    { name: 'idx_bookings_created_at', columns: ['booking_time'], purpose: 'Sort/filter by creation date' },
    { name: 'idx_bookings_payment_status', columns: ['payment_status'], purpose: 'Filter by payment status' },
  ],
  emergencies: [
    { name: 'idx_emergencies_status', columns: ['status'], purpose: 'Filter emergencies by status' },
    { name: 'idx_emergencies_priority', columns: ['priority'], purpose: 'Filter by priority level' },
    { name: 'idx_emergencies_created_at', columns: ['created_time'], purpose: 'Sort/filter by creation date' },
    { name: 'idx_emergencies_location', columns: ['latitude', 'longitude'], purpose: 'Geospatial queries for nearby emergencies' },
    { name: 'idx_emergencies_type', columns: ['emergency_type'], purpose: 'Filter by emergency type' },
  ],
  payments: [
    { name: 'idx_payments_booking_id', columns: ['booking_id'], purpose: 'Lookup payments by booking' },
    { name: 'idx_payments_status', columns: ['status'], purpose: 'Filter by payment status' },
    { name: 'idx_payments_created_at', columns: ['created_at'], purpose: 'Sort/filter by date' },
  ],
  users: [
    { name: 'idx_users_email', columns: ['email'], purpose: 'Fast login lookup' },
    { name: 'idx_users_phone', columns: ['phone'], purpose: 'Phone-based lookup' },
    { name: 'idx_users_status', columns: ['status'], purpose: 'Filter active/inactive users' },
  ],
  mechanics: [
    { name: 'idx_mechanics_status', columns: ['status'], purpose: 'Find available/busy mechanics' },
    { name: 'idx_mechanics_approval', columns: ['approval_status'], purpose: 'Filter by approval status' },
    { name: 'idx_mechanics_specialization', columns: ['specialization'], purpose: 'Filter by service type' },
    { name: 'idx_mechanics_location', columns: ['latitude', 'longitude'], purpose: 'Geospatial queries for nearby mechanics' },
  ],
  notifications: [
    { name: 'idx_notifications_target', columns: ['target_role', 'target_id'], purpose: 'Find notifications for specific role/user' },
    { name: 'idx_notifications_read', columns: ['read'], purpose: 'Filter unread notifications' },
  ],
  booking_logs: [
    { name: 'idx_booking_logs_booking_id', columns: ['booking_id'], purpose: 'Lookup logs by booking' },
  ],
  refresh_tokens: [
    { name: 'idx_refresh_tokens_user_id', columns: ['user_id'], purpose: 'Lookup tokens by user' },
  ],
  chat: [
    { name: 'idx_chat_messages_conversation', columns: ['conversation_id'], purpose: 'Lookup messages by conversation' },
    { name: 'idx_conversations_user_id', columns: ['user_id'], purpose: 'Lookup conversations by user' },
  ],
  audit_logs: [
    { name: 'idx_audit_logs_entity', columns: ['entity', 'entity_id'], purpose: 'Lookup audit trail for entity' },
    { name: 'idx_audit_logs_admin', columns: ['admin_id'], purpose: 'Filter by admin who performed action' },
    { name: 'idx_audit_logs_timestamp', columns: ['timestamp'], purpose: 'Date range queries' },
  ],
  active_jobs: [
    { name: 'idx_active_jobs_mechanic', columns: ['mechanic_id'], purpose: 'Find active job for mechanic' },
    { name: 'idx_active_jobs_booking', columns: ['booking_id'], purpose: 'Find active job for booking' },
    { name: 'idx_active_jobs_status', columns: ['status'], purpose: 'Filter by job status' },
    { name: 'idx_active_jobs_emergency', columns: ['emergency_id'], purpose: 'Find active job for emergency' },
  ],
  audit_history: [
    { name: 'idx_audit_history_entity', columns: ['entity', 'entity_id'], purpose: 'Lookup history for entity' },
    { name: 'idx_audit_history_performed_by', columns: ['performed_by'], purpose: 'Filter by actor' },
    { name: 'idx_audit_history_timestamp', columns: ['timestamp'], purpose: 'Date range queries' },
    { name: 'idx_audit_history_action', columns: ['action'], purpose: 'Filter by action type' },
  ],
};

export default indexes;
