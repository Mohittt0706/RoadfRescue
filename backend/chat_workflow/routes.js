import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import { join, extname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { verifyToken, verifyAdmin } from '../authentication/middleware.js';
import { chatService } from './chatService.js';
import { aiService, getOpenAI } from './aiService.js';
import { insertAuditLog, getClientIP } from '../utils/auditLogger.js';

const router = Router();

// ==========================================
// File Upload Configuration (Multer)
// ==========================================
const chatUploadsDir = join(process.cwd(), 'uploads', 'chat');
if (!existsSync(chatUploadsDir)) {
  mkdirSync(chatUploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, chatUploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
      'application/pdf', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, PNG, WEBP, PDF, and DOC files are allowed.'));
    }
  }
});

// ==========================================
// 1. Conversation APIs
// ==========================================

// POST /api/chat/conversations - Create a conversation thread
router.post('/chat/conversations', verifyToken, (req, res) => {
  const { db } = req;
  const { type, participants } = req.body; // type: 'User-Mechanic', 'User-AI', 'Admin-User', 'Admin-Mechanic'
  const { id: userId, role } = req.user;

  if (!type || !participants || !Array.isArray(participants)) {
    return res.status(400).json({ success: false, message: 'type and participants array are required.' });
  }

  // Ensure caller is in participants unless admin
  if (role !== 'admin' && role !== 'super_admin' && !participants.includes(userId)) {
    participants.push(userId);
  }

  try {
    const cleanParticipants = [...new Set(participants)].sort();
    const participantsStr = JSON.stringify(cleanParticipants);

    // Check if conversation already exists for these participants & type
    const existing = db.prepare(`
      SELECT * FROM conversations 
      WHERE type = ? AND participants = ?
    `).get(type, participantsStr);

    if (existing) {
      return res.json({ success: true, conversation: existing, exists: true });
    }

    const conversationId = `CONV-${Date.now()}`;
    const title = type === 'User-AI' ? 'AI Diagnostic Assistant' : 'Roadside Support Chat';

    db.prepare(`
      INSERT INTO conversations (id, user_id, title, type, participants, created_by, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).run(conversationId, userId, title, type, participantsStr, userId);

    const created = db.prepare('SELECT * FROM conversations WHERE id = ?').get(conversationId);
    
    insertAuditLog(db, {
      adminId: role === 'admin' ? userId : 'system',
      action: 'CREATE',
      entity: 'conversation',
      entityId: conversationId,
      description: `Created conversation ${conversationId} of type: ${type}`,
      ipAddress: getClientIP(req)
    });

    res.status(201).json({ success: true, conversation: created });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create conversation.', error: err.message });
  }
});

// GET /api/chat/conversations - Get user conversations with filters & search
router.get('/chat/conversations', verifyToken, (req, res) => {
  const { db } = req;
  const { id: userId, role } = req.user;
  const { limit = 10, offset = 0, search, status } = req.query;

  try {
    let query = 'SELECT * FROM conversations WHERE 1=1';
    const params = [];

    if (role !== 'admin' && role !== 'super_admin') {
      // Filter for user participating conversations
      query += ' AND (participants LIKE ? OR user_id = ?)';
      params.push(`%"${userId}"%`, userId);
    }

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (search) {
      query += ' AND (title LIKE ? OR last_message LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s);
    }

    query += ' ORDER BY last_message_time DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const conversations = db.prepare(query).all(...params);
    res.json({ success: true, conversations });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve conversations.', error: err.message });
  }
});

// GET /api/chat/conversations/:id - Conversation details
router.get('/chat/conversations/:id', verifyToken, (req, res) => {
  const { db } = req;
  const { id: userId, role } = req.user;
  const convId = req.params.id;

  try {
    const conversation = db.prepare('SELECT * FROM conversations WHERE id = ?').get(convId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }

    // Auth verification
    const participants = conversation.participants ? JSON.parse(conversation.participants) : [];
    if (role !== 'admin' && role !== 'super_admin' && conversation.user_id !== userId && !participants.includes(userId)) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.json({ success: true, conversation });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to get conversation.', error: err.message });
  }
});

// ==========================================
// 2. Messaging APIs
// ==========================================

// POST /api/chat/messages - Send a message to a chat thread
router.post('/chat/messages', verifyToken, async (req, res) => {
  const { db, io } = req;
  const { id: userId, role } = req.user;
  const { conversationId, message, messageType = 'Text', attachment = null, replyTo = null } = req.body;

  if (!conversationId || !message) {
    return res.status(400).json({ success: false, message: 'conversationId and message are required.' });
  }

  try {
    const msg = await chatService.sendMessage(db, io, {
      conversationId,
      senderId: userId,
      senderRole: role,
      message,
      messageType,
      attachment,
      replyTo
    });

    res.status(201).json({ success: true, message: msg });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to send message.', error: err.message });
  }
});

// GET /api/chat/messages/:conversationId - Get messages for a conversation (Paginated)
router.get('/chat/messages/:conversationId', verifyToken, (req, res) => {
  const { db } = req;
  const { id: userId, role } = req.user;
  const convId = req.params.conversationId;
  const { limit = 30, offset = 0 } = req.query;

  try {
    const conversation = db.prepare('SELECT * FROM conversations WHERE id = ?').get(convId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }

    // Validate ownership
    const participants = conversation.participants ? JSON.parse(conversation.participants) : [];
    if (role !== 'admin' && role !== 'super_admin' && conversation.user_id !== userId && !participants.includes(userId)) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const messages = db.prepare(`
      SELECT * FROM chat_messages 
      WHERE conversation_id = ? AND (deleted_at IS NULL OR content = 'This message was deleted.')
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `).all(convId, parseInt(limit), parseInt(offset));

    res.json({ success: true, messages: messages.reverse() });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to get messages.', error: err.message });
  }
});

// PUT /api/chat/messages/:id/read - Mark message read receipt
router.put('/chat/messages/:id/read', verifyToken, async (req, res) => {
  const { db, io } = req;
  const { id: userId } = req.user;
  const msgId = req.params.id;

  try {
    await chatService.markRead(db, io, msgId, userId);
    res.json({ success: true, message: 'Message read receipt updated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update read receipt.', error: err.message });
  }
});

// PUT /api/chat/messages/:id/edit - Edit message (15 mins window)
router.put('/chat/messages/:id/edit', verifyToken, async (req, res) => {
  const { db, io } = req;
  const { id: userId } = req.user;
  const msgId = req.params.id;
  const { newContent } = req.body;

  if (!newContent) {
    return res.status(400).json({ success: false, message: 'newContent is required.' });
  }

  try {
    const updated = await chatService.editMessage(db, io, msgId, newContent, userId);
    res.json({ success: true, message: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to edit message.', error: err.message });
  }
});

// DELETE /api/chat/messages/:id - Soft delete message
router.delete('/chat/messages/:id', verifyToken, async (req, res) => {
  const { db, io } = req;
  const { id: userId } = req.user;
  const msgId = req.params.id;
  const { deleteType = 'everyone' } = req.body; // 'everyone' or 'me'

  try {
    await chatService.deleteMessage(db, io, msgId, deleteType, userId);
    res.json({ success: true, message: `Message deleted for ${deleteType}.` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete message.', error: err.message });
  }
});

// ==========================================
// 3. Upload File API
// ==========================================

// POST /api/chat/upload - Upload file attachments (jpg, png, pdf, docs)
router.post('/chat/upload', verifyToken, upload.single('file'), (req, res) => {
  const { db } = req;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ success: false, message: 'No file uploaded.' });
  }

  try {
    const relativePath = `/uploads/chat/${file.filename}`;
    
    // Insert into workflow_attachments
    const attachmentId = `ATT-${Date.now()}`;
    db.prepare(`
      INSERT INTO workflow_attachments (id, message_id, filename, mime_type, file_size, file_path)
      VALUES (?, 'pending', ?, ?, ?, ?)
    `).run(attachmentId, file.originalname, file.mimetype, file.size, relativePath);

    res.status(201).json({
      success: true,
      attachmentId,
      url: relativePath,
      filename: file.originalname,
      mimeType: file.mimetype,
      fileSize: file.size
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to record attachment.', error: err.message });
  }
});

// ==========================================
// 4. AI Feedback & History APIs
// ==========================================

// POST /api/chat/ai/feedback - Submit rating helpfulness
router.post('/chat/ai/feedback', verifyToken, (req, res) => {
  const { db } = req;
  const { aiHistoryId, rating, remarks = '' } = req.body;

  if (!aiHistoryId || !['Helpful', 'Not Helpful', 'Report Incorrect'].includes(rating)) {
    return res.status(400).json({ success: false, message: 'aiHistoryId and valid rating status are required.' });
  }

  try {
    const feedbackId = aiService.saveAiFeedback(db, { aiHistoryId, rating, remarks });
    res.json({ success: true, message: 'AI Feedback recorded successfully.', feedbackId });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to submit feedback.', error: err.message });
  }
});

// GET /api/chat/ai/history - User fetches AI diagnostic history logs
router.get('/chat/ai/history', verifyToken, (req, res) => {
  const { db } = req;
  const { id: userId } = req.user;

  try {
    const history = db.prepare('SELECT * FROM ai_history WHERE user_id = ? ORDER BY timestamp DESC').all(userId);
    res.json({ success: true, history });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch AI history.', error: err.message });
  }
});

// DELETE /api/chat/ai/history - User clears AI diagnostic history logs
router.delete('/chat/ai/history', verifyToken, (req, res) => {
  const { db } = req;
  const { id: userId } = req.user;

  try {
    db.prepare('DELETE FROM ai_history WHERE user_id = ?').run(userId);
    res.json({ success: true, message: 'AI history cleared.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to clear AI history.', error: err.message });
  }
});

// ==========================================
// 5. Admin Moderation APIs
// ==========================================

// GET /api/admin/chat/conversations - Admin moderation conversations index
router.get('/admin/chat/conversations', verifyAdmin, (req, res) => {
  const { db } = req;
  const { search } = req.query;

  try {
    let query = 'SELECT * FROM conversations';
    const params = [];

    if (search) {
      query += ' WHERE title LIKE ? OR last_message LIKE ?';
      const s = `%${search}%`;
      params.push(s, s);
    }
    query += ' ORDER BY last_message_time DESC';

    const conversations = db.prepare(query).all(...params);
    res.json({ success: true, conversations });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load conversations.', error: err.message });
  }
});

// GET /api/admin/chat/messages - Admin moderation messages index
router.get('/admin/chat/messages', verifyAdmin, (req, res) => {
  const { db } = req;
  const { search } = req.query;

  try {
    let query = 'SELECT * FROM chat_messages';
    const params = [];

    if (search) {
      query += ' WHERE content LIKE ?';
      const s = `%${search}%`;
      params.push(s);
    }
    query += ' ORDER BY created_at DESC';

    const messages = db.prepare(query).all(...params);
    res.json({ success: true, messages });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load messages.', error: err.message });
  }
});

// DELETE /api/admin/chat/message/:id - Flag and hide message (Admin Only)
router.delete('/admin/chat/message/:id', verifyAdmin, (req, res) => {
  const { db, io } = req;
  const msgId = req.params.id;

  try {
    const message = db.prepare('SELECT * FROM chat_messages WHERE id = ?').get(msgId);
    if (!message) return res.status(404).json({ success: false, message: 'Message not found.' });

    // Mark as soft deleted with moderation flag
    db.prepare(`
      UPDATE chat_messages 
      SET content = 'This message was hidden by moderator.', deleted_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(msgId);

    if (io) {
      io.to(`conversation_${message.conversation_id}`).emit('messageDeleted', { messageId: msgId, deleteType: 'moderation' });
    }

    res.json({ success: true, message: 'Message hidden successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to hide message.', error: err.message });
  }
});

// DELETE /api/admin/chat/conversation/:id - Delete whole conversation (Admin Only)
router.delete('/admin/chat/conversation/:id', verifyAdmin, (req, res) => {
  const { db } = req;
  const convId = req.params.id;

  try {
    db.transaction(() => {
      db.prepare('DELETE FROM chat_messages WHERE conversation_id = ?').run(convId);
      db.prepare('DELETE FROM conversations WHERE id = ?').run(convId);
    })();
    res.json({ success: true, message: 'Conversation deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete conversation.', error: err.message });
  }
});

// ==========================================
// 6. Admin Analytics APIs
// ==========================================

// GET /api/admin/chat/analytics/dashboard - Analytics statistics summary (Admin Only)
router.get('/admin/chat/analytics/dashboard', verifyAdmin, (req, res) => {
  const { db } = req;

  try {
    const totalChats = db.prepare('SELECT COUNT(*) as count FROM ai_history').get().count;
    const avgResponseTime = db.prepare('SELECT COALESCE(AVG(response_time_ms), 0) as avg FROM ai_history').get().avg;
    const analysesCount = db.prepare('SELECT COUNT(*) as count FROM image_analyses').get().count;

    // Feedback statistics breakdown
    const helpful = db.prepare("SELECT COUNT(*) as count FROM ai_feedback WHERE rating = 'Helpful'").get().count;
    const unhelpful = db.prepare("SELECT COUNT(*) as count FROM ai_feedback WHERE rating = 'Not Helpful'").get().count;
    const incorrect = db.prepare("SELECT COUNT(*) as count FROM ai_feedback WHERE rating = 'Report Incorrect'").get().count;

    // Popular questions
    const popular = db.prepare(`
      SELECT prompt, COUNT(*) as count 
      FROM ai_history 
      GROUP BY prompt 
      ORDER BY count DESC 
      LIMIT 3
    `).all();

    // Most active users
    const activeUsers = db.prepare(`
      SELECT user_id, COUNT(*) as count 
      FROM ai_history 
      GROUP BY user_id 
      ORDER BY count DESC 
      LIMIT 3
    `).all();

    res.json({
      success: true,
      analytics: {
        totalAIChats: totalChats,
        averageResponseTimeMs: Math.round(avgResponseTime),
        imageAnalysisCount: analysesCount,
        feedback: {
          helpful,
          unhelpful,
          incorrect
        },
        popularQuestions: popular,
        mostActiveUsers: activeUsers
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to compile AI analytics.', error: err.message });
  }
});

export default router;
