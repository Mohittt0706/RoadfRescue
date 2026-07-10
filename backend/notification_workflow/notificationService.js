import { v4 as uuidv4 } from 'uuid';

// Map notification types to preferences fields
const TYPE_PREFERENCE_MAP = {
  'booking_created': 'booking_updates',
  'booking_approved': 'booking_updates',
  'booking_assigned': 'booking_updates',
  'mechanic_accepted': 'booking_updates',
  'mechanic_rejected': 'booking_updates',
  'mechanic_en_route': 'booking_updates',
  'mechanic_arrived': 'booking_updates',
  'service_started': 'booking_updates',
  'service_completed': 'booking_updates',
  'booking_cancelled': 'booking_updates',
  
  'emergency_created': 'emergency_updates',
  'emergency_assigned': 'emergency_updates',
  'emergency_resolved': 'emergency_updates',
  
  'payment_pending': 'payment_updates',
  'payment_successful': 'payment_updates',
  'payment_failed': 'payment_updates',
  'refund_approved': 'payment_updates',
  'refund_completed': 'payment_updates',
  'invoice_generated': 'payment_updates',
  
  'chat_message': 'chat_notifications',
  
  'system_announcement': 'marketing_notifications',
  'profile_updated': 'booking_updates',
  'admin_alert': 'booking_updates'
};

class NotificationService {
  /**
   * Helper to ensure user preferences exist, otherwise insert defaults
   */
  ensurePreferences(db, userId) {
    const preferences = db.prepare('SELECT * FROM notification_preferences WHERE user_id = ?').get(userId);
    if (!preferences && userId !== 'all' && userId !== 'admin') {
      db.prepare(`
        INSERT INTO notification_preferences (
          user_id, push_enabled, email_enabled, sms_enabled, 
          booking_updates, emergency_updates, payment_updates, 
          chat_notifications, marketing_notifications
        ) VALUES (?, 1, 1, 1, 1, 1, 1, 1, 0)
      `).run(userId);
      return db.prepare('SELECT * FROM notification_preferences WHERE user_id = ?').get(userId);
    }
    return preferences;
  }

  /**
   * Send SMS via Twilio/Fast2SMS abstraction layer
   */
  async sendSMS(phone, message) {
    console.log(`[SMS SENDER] Sending SMS to ${phone} - Content: "${message}"`);
    // MSG91/Twilio implementation template:
    // const client = new twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
    // await client.messages.create({ body: message, to: phone, from: process.env.TWILIO_NUMBER });
    return true;
  }

  /**
   * Send Email via Nodemailer/SES abstraction layer
   */
  async sendEmail(email, subject, text) {
    console.log(`[EMAIL SENDER] Sending Email to ${email} - Subject: "${subject}" - Content: "${text.substring(0, 50)}..."`);
    // Nodemailer implementation template:
    // const transporter = nodemailer.createTransport({ host: process.env.MAIL_HOST, port: process.env.MAIL_PORT });
    // await transporter.sendMail({ from: process.env.MAIL_FROM, to: email, subject, text });
    return true;
  }

  /**
   * Send Push Notification via FCM (Firebase Cloud Messaging) abstraction layer
   */
  async sendPush(db, userId, title, message, payload = {}) {
    const tokens = db.prepare('SELECT device_token FROM push_device_tokens WHERE user_id = ?').all(userId);
    if (tokens.length === 0) {
      console.log(`[PUSH SENDER] No device tokens registered for User ${userId}`);
      return false;
    }

    for (const t of tokens) {
      console.log(`[PUSH SENDER] Sending FCM Push Alert to Token: ${t.device_token} - Title: "${title}"`);
      // FCM Admin SDK implementation:
      // await admin.messaging().send({ token: t.device_token, notification: { title, body: message }, data: payload });
    }
    return true;
  }

  /**
   * Main dispatch system: Creates database entries and triggers delivery based on user preferences
   */
  async createNotification(db, io, {
    recipientId,
    recipientRole = 'user',
    title,
    message,
    type,
    priority = 'Normal',
    relatedEntity = null,
    relatedEntityId = null,
    expiresMinutes = null,
    metadata = {}
  }) {
    const notificationId = uuidv4();
    const expiresAt = expiresMinutes 
      ? new Date(Date.now() + expiresMinutes * 60 * 1000).toISOString() 
      : null;

    // 1. Fetch preferences (Admins and announcements bypass preferences)
    let pushEnabled = true;
    let emailEnabled = true;
    let smsEnabled = true;
    let categoryEnabled = true;

    if (recipientId !== 'all' && recipientRole !== 'admin') {
      const prefs = this.ensurePreferences(db, recipientId);
      if (prefs) {
        pushEnabled = !!prefs.push_enabled;
        emailEnabled = !!prefs.email_enabled;
        smsEnabled = !!prefs.sms_enabled;

        // Check if the specific notification category is enabled
        const prefField = TYPE_PREFERENCE_MAP[type] || 'booking_updates';
        categoryEnabled = !!prefs[prefField];
      }
    }

    // Critical alerts bypass category preferences and are always forced
    const isCritical = priority === 'Critical';
    if (isCritical) {
      categoryEnabled = true;
    }

    if (!categoryEnabled) {
      console.log(`Notification of type [${type}] suppressed by user preference for recipient ${recipientId}`);
      return null;
    }

    // 2. Write to workflow_notifications database
    db.prepare(`
      INSERT INTO workflow_notifications (
        id, recipient_id, recipient_role, title, message, type, priority, 
        related_entity, related_entity_id, is_read, is_delivered, expires_at, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?)
    `).run(
      notificationId,
      recipientId,
      recipientRole,
      title,
      message,
      type,
      priority,
      relatedEntity,
      relatedEntityId,
      expiresAt,
      JSON.stringify(metadata)
    );

    // 3. Write to legacy notifications table for backward compatibility!
    try {
      db.prepare(`
        INSERT INTO notifications (id, type, title, message, booking_id, read, target_role, target_id)
        VALUES (?, ?, ?, ?, ?, 0, ?, ?)
      `).run(
        uuidv4(),
        type,
        title,
        message,
        relatedEntity === 'booking' ? relatedEntityId : null,
        recipientRole,
        recipientId === 'all' ? null : recipientId
      );
    } catch (legacyErr) {
      console.warn('Skipped writing to legacy notifications:', legacyErr.message);
    }

    // 4. Send asynchronous SMS / Email / Push based on preferences
    let smsSent = false;
    let emailSent = false;
    let pushSent = false;

    // Resolve user coordinates contact info
    let recipientPhone = null;
    let recipientEmail = null;

    if (recipientId !== 'all' && recipientId !== 'admin') {
      const user = recipientRole === 'mechanic' 
        ? db.prepare('SELECT phone, email FROM mechanics WHERE id = ?').get(recipientId)
        : db.prepare('SELECT phone, email FROM users WHERE id = ?').get(recipientId);
      
      if (user) {
        recipientPhone = user.phone;
        recipientEmail = user.email;
      }
    }

    try {
      if (pushEnabled) {
        pushSent = await this.sendPush(db, recipientId, title, message, { notificationId, type, relatedEntityId });
      }
      if (emailEnabled && recipientEmail) {
        emailSent = await this.sendEmail(recipientEmail, title, message);
      }
      if (smsEnabled && recipientPhone) {
        smsSent = await this.sendSMS(recipientPhone, message);
      }
    } catch (deliveryErr) {
      console.error('Error during push/sms/email notification delivery:', deliveryErr);
    }

    // 5. Deliver real-time update via Socket.IO
    let deliveredRealtime = false;
    if (io) {
      const socketPayload = {
        id: notificationId,
        recipientId,
        recipientRole,
        title,
        message,
        type,
        priority,
        relatedEntity,
        relatedEntityId,
        isRead: 0,
        createdAt: new Date().toISOString(),
        metadata
      };

      if (recipientRole === 'admin') {
        io.to('admin_room').emit('notificationCreated', socketPayload);
        deliveredRealtime = true;
      } else if (recipientId === 'all') {
        io.emit('notificationCreated', socketPayload); // Broadcast announcement
        deliveredRealtime = true;
      } else {
        io.to(`user_${recipientId}`).emit('notificationCreated', socketPayload);
        deliveredRealtime = true;
      }
    }

    // 6. Update delivery confirmation logs in DB
    const isDelivered = (deliveredRealtime || pushSent || smsSent || emailSent) ? 1 : 0;
    if (isDelivered) {
      db.prepare(`
        UPDATE workflow_notifications 
        SET is_delivered = 1, delivered_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `).run(notificationId);
    }

    return notificationId;
  }

  /**
   * Broadcasts target notifications to specific groupings (e.g. mechanics in a city)
   */
  async broadcast(db, io, {
    targetGroup, // 'all', 'mechanics', 'admins', 'users'
    targetCity = null,
    targetService = null,
    title,
    message,
    type = 'system_announcement',
    priority = 'Normal'
  }) {
    console.log(`Starting broadcast targeting: ${targetGroup} in city: ${targetCity || 'all'}`);
    let recipients = [];

    // Query DB for target recipient details
    if (targetGroup === 'admins') {
      recipients = db.prepare("SELECT id, 'admin' as role FROM admins").all();
    } else if (targetGroup === 'mechanics') {
      let query = "SELECT id, 'mechanic' as role FROM mechanics WHERE approval_status = 'approved'";
      const params = [];
      if (targetCity) {
        query += " AND city = ?";
        params.push(targetCity);
      }
      recipients = db.prepare(query).all(...params);
    } else if (targetGroup === 'users') {
      let query = "SELECT id, 'user' as role FROM users WHERE status = 'active'";
      const params = [];
      if (targetCity) {
        query += " AND city = ?";
        params.push(targetCity);
      }
      recipients = db.prepare(query).all(...params);
    } else {
      // All active users & mechanics
      const users = db.prepare("SELECT id, 'user' as role FROM users WHERE status = 'active'").all();
      const mechanics = db.prepare("SELECT id, 'mechanic' as role FROM mechanics WHERE approval_status = 'approved'").all();
      recipients = [...users, ...mechanics];
    }

    let broadcastCount = 0;
    for (const r of recipients) {
      await this.createNotification(db, io, {
        recipientId: r.id,
        recipientRole: r.role,
        title,
        message,
        type,
        priority
      });
      broadcastCount++;
    }

    console.log(`Broadcast completed. Sent to ${broadcastCount} recipients.`);
    return broadcastCount;
  }
}

export const notificationService = new NotificationService();
