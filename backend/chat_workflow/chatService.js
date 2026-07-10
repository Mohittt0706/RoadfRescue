import { v4 as uuidv4 } from 'uuid';
import { notificationService } from '../notification_workflow/notificationService.js';

class ChatService {
  /**
   * Send a new message to a conversation
   */
  async sendMessage(db, io, {
    conversationId,
    senderId,
    senderRole = 'user',
    message,
    messageType = 'Text',
    attachment = null,
    replyTo = null
  }) {
    const conversation = db.prepare('SELECT * FROM conversations WHERE id = ?').get(conversationId);
    if (!conversation) {
      throw new Error(`Conversation not found: ${conversationId}`);
    }

    // Verify participant list
    const participants = conversation.participants ? JSON.parse(conversation.participants) : [];
    if (participants.length > 0 && !participants.includes(senderId) && senderRole !== 'admin' && senderRole !== 'super_admin') {
      throw new Error('Access denied. You are not a participant in this conversation.');
    }

    const messageId = `MSG-${Date.now()}`;
    
    // 1. Insert into chat_messages
    db.prepare(`
      INSERT INTO chat_messages (
        id, conversation_id, sender, content, image_url, sender_role, message_type, attachment, status, reply_to
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'sent', ?)
    `).run(
      messageId,
      conversationId,
      senderId,
      message,
      messageType === 'Image' ? attachment : null,
      senderRole,
      messageType,
      attachment,
      replyTo
    );

    // 2. Update conversation last message values
    db.prepare(`
      UPDATE conversations 
      SET last_message = ?, last_message_time = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(message, conversationId);

    // 3. Emit real-time Socket.IO notification
    const freshMessage = db.prepare('SELECT * FROM chat_messages WHERE id = ?').get(messageId);
    
    if (io) {
      io.to(`conversation_${conversationId}`).to(`conv_${conversationId}`).emit('messageReceived', freshMessage);
    }

    // 4. Generate system alert/push notification for other participants
    const recipients = participants.filter(id => id !== senderId);
    for (const rId of recipients) {
      // Find role of recipient
      const isMechanic = db.prepare('SELECT id FROM mechanics WHERE id = ?').get(rId);
      const targetRole = isMechanic ? 'mechanic' : 'user';

      await notificationService.createNotification(db, io, {
        recipientId: rId,
        recipientRole: targetRole,
        title: 'New message received',
        message: `${senderId}: ${message.substring(0, 40)}`,
        type: 'chat_message',
        priority: 'Normal',
        relatedEntity: 'chat_message',
        relatedEntityId: messageId,
        metadata: { conversationId, senderId }
      });
    }

    return freshMessage;
  }

  /**
   * Mark a message as read
   */
  async markRead(db, io, messageId, userId) {
    const message = db.prepare('SELECT * FROM chat_messages WHERE id = ?').get(messageId);
    if (!message) {
      throw new Error('Message not found.');
    }

    if (message.sender === userId) {
      return; // Can't read-receipt own message
    }

    const readId = `READ-${Date.now()}`;
    db.transaction(() => {
      // Update status
      db.prepare("UPDATE chat_messages SET status = 'read' WHERE id = ?").run(messageId);
      
      // Log in message_reads
      db.prepare(`
        INSERT INTO message_reads (id, message_id, user_id, read_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      `).run(readId, messageId, userId);
    })();

    if (io) {
      io.to(`conversation_${message.conversation_id}`).to(`conv_${message.conversation_id}`).emit('messageRead', { messageId, userId, readAt: new Date().toISOString() });
    }

    return true;
  }

  /**
   * Edit a message (only within 15 minutes window)
   */
  async editMessage(db, io, messageId, newContent, userId) {
    const message = db.prepare('SELECT * FROM chat_messages WHERE id = ?').get(messageId);
    if (!message) {
      throw new Error('Message not found.');
    }

    if (message.sender !== userId) {
      throw new Error('Unauthorized. You can only edit your own messages.');
    }

    // Enforce 15-minute timeframe
    let createdTime = new Date(message.created_at);
    if (typeof message.created_at === 'string' && !message.created_at.endsWith('Z') && !message.created_at.includes('T')) {
      createdTime = new Date(message.created_at.replace(' ', 'T') + 'Z');
    }
    const fifteenMinutes = 15 * 60 * 1000;
    if (Date.now() - createdTime.getTime() > fifteenMinutes) {
      throw new Error(`Edit time window expired. Messages can only be edited within 15 minutes. Created: ${message.created_at}, Interpreted: ${createdTime.toISOString()}, Now: ${new Date().toISOString()}`);
    }

    const editId = `EDIT-${Date.now()}`;
    db.transaction(() => {
      // Record edit log history
      db.prepare(`
        INSERT INTO message_edits (id, message_id, old_content, edited_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      `).run(editId, messageId, message.content);

      // Update content
      db.prepare("UPDATE chat_messages SET content = ?, edited_at = CURRENT_TIMESTAMP WHERE id = ?").run(newContent, messageId);
    })();

    const updatedMessage = db.prepare('SELECT * FROM chat_messages WHERE id = ?').get(messageId);
    if (io) {
      io.to(`conversation_${message.conversation_id}`).to(`conv_${message.conversation_id}`).emit('messageEdited', updatedMessage);
    }

    return updatedMessage;
  }

  /**
   * Delete message (Soft delete)
   */
  async deleteMessage(db, io, messageId, deleteType, userId) {
    const message = db.prepare('SELECT * FROM chat_messages WHERE id = ?').get(messageId);
    if (!message) {
      throw new Error('Message not found.');
    }

    if (message.sender !== userId) {
      throw new Error('Unauthorized. You can only delete your own messages.');
    }

    if (deleteType === 'everyone') {
      db.prepare(`
        UPDATE chat_messages 
        SET content = 'This message was deleted.', deleted_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `).run(messageId);
      
      if (io) {
        io.to(`conversation_${message.conversation_id}`).to(`conv_${message.conversation_id}`).emit('messageDeleted', { messageId, deleteType: 'everyone' });
      }
    } else {
      // Delete just for me
      // Update content to show it has been hidden/deleted just for me
      db.prepare(`
        UPDATE chat_messages 
        SET deleted_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `).run(messageId);

      if (io) {
        io.to(`conversation_${message.conversation_id}`).to(`conv_${message.conversation_id}`).emit('messageDeleted', { messageId, deleteType: 'me', userId });
      }
    }

    return true;
  }
}

export const chatService = new ChatService();
