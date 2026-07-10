import { v4 as uuidv4 } from 'uuid';

/**
 * Creates a notification in the database and broadcasts it via Socket.IO
 * 
 * @param {object} params
 * @param {object} params.db Database connection
 * @param {object} params.io Socket.IO server instance
 * @param {string} params.type Notification type (e.g., 'booking_created')
 * @param {string} params.title Title of the notification
 * @param {string} params.message Description of the notification
 * @param {string} [params.bookingId] Optional booking reference ID
 * @param {string} [params.targetRole] Target role ('admin', 'mechanic', 'user')
 * @param {string} [params.targetId] Target user/mechanic ID
 * @param {string} [params.socketEvent] Name of the Socket.IO event to emit
 * @param {object} [params.socketData] Custom data payload to emit
 */
export function sendNotification({
  db,
  io,
  type,
  title,
  message,
  bookingId = null,
  targetRole = 'admin',
  targetId = null,
  socketEvent = null,
  socketData = null
}) {
  const notificationId = uuidv4();
  
  try {
    // 1. Insert into database
    db.prepare(`
      INSERT INTO notifications (id, type, title, message, booking_id, read, target_role, target_id)
      VALUES (?, ?, ?, ?, ?, 0, ?, ?)
    `).run(notificationId, type, title, message, bookingId, targetRole, targetId);
  } catch (err) {
    console.error('Failed to save notification to DB:', err);
  }

  // 2. Broadcast via Socket.IO
  const payload = {
    notification: {
      id: notificationId,
      type,
      title,
      message,
      bookingId,
      read: 0,
      targetRole,
      targetId,
      createdAt: new Date().toISOString()
    },
    ...(socketData || {})
  };

  if (socketEvent && io) {
    // Send to specific target rooms or broadcast
    if (targetRole === 'admin') {
      io.to('admin_room').emit(socketEvent, payload);
    }
    
    if (targetId) {
      if (targetRole === 'mechanic') {
        io.to(`user_${targetId}`).emit(socketEvent, payload); // Note: socket room name for user/mech is user_${id} in backend/index.js
      } else {
        io.to(`user_${targetId}`).emit(socketEvent, payload);
      }
    } else {
      // General broadcast for specific status updates
      io.emit(socketEvent, payload);
    }
  }

  console.log(`Notification Sent [${type}] - Target: ${targetRole}/${targetId || 'all'} - Title: ${title}`);
}
