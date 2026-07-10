import { BaseRepository } from './baseRepository.js';

/**
 * Chat Repository - Data access layer for conversations, chat_messages, image_analyses tables.
 */
export class ChatRepository {
  constructor(db) {
    this.db = db;
  }

  /** Create a conversation */
  createConversation(userId, title) {
    const id = `conv-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    this.db.prepare(`
      INSERT INTO conversations (id, user_id, title, created_at, updated_at)
      VALUES (?, ?, ?, datetime('now'), datetime('now'))
    `).run(id, userId, title);
    return this.db.prepare('SELECT * FROM conversations WHERE id = ?').get(id);
  }

  /** Get conversations for a user */
  getUserConversations(userId, role) {
    if (role === 'admin' || role === 'super_admin') {
      return this.db.prepare('SELECT * FROM conversations ORDER BY updated_at DESC').all();
    }
    return this.db.prepare(
      'SELECT * FROM conversations WHERE user_id = ? ORDER BY updated_at DESC'
    ).all(userId);
  }

  /** Get messages for a conversation */
  getMessages(conversationId) {
    return this.db.prepare(
      'SELECT * FROM chat_messages WHERE conversation_id = ? ORDER BY created_at ASC'
    ).all(conversationId);
  }

  /** Add a message to a conversation */
  addMessage(conversationId, sender, content, imageUrl = null) {
    const id = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    this.db.prepare(`
      INSERT INTO chat_messages (id, conversation_id, sender, content, image_url, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).run(id, conversationId, sender, content, imageUrl);
    
    this.db.prepare(
      "UPDATE conversations SET updated_at = datetime('now') WHERE id = ?"
    ).run(conversationId);
    
    return this.db.prepare('SELECT * FROM chat_messages WHERE id = ?').get(id);
  }

  /** Delete a conversation and its messages */
  deleteConversation(conversationId) {
    this.db.prepare('DELETE FROM chat_messages WHERE conversation_id = ?').run(conversationId);
    this.db.prepare('DELETE FROM image_analyses WHERE conversation_id = ?').run(conversationId);
    return this.db.prepare('DELETE FROM conversations WHERE id = ?').run(conversationId);
  }

  /** Get all conversations for admin dashboard */
  getAllConversations(limit = 50) {
    return this.db.prepare(`
      SELECT c.*, u.name as user_name, u.email as user_email,
        (SELECT COUNT(*) FROM chat_messages WHERE conversation_id = c.id) as message_count
      FROM conversations c
      LEFT JOIN users u ON c.user_id = u.id
      ORDER BY c.updated_at DESC LIMIT ?
    `).all(limit);
  }

  /** Get all image analyses for admin dashboard */
  getAllImageAnalyses(limit = 50) {
    return this.db.prepare(`
      SELECT ia.*, c.user_id, u.name as user_name
      FROM image_analyses ia
      LEFT JOIN conversations c ON ia.conversation_id = c.id
      LEFT JOIN users u ON c.user_id = u.id
      ORDER BY ia.created_at DESC LIMIT ?
    `).all(limit);
  }

  /** Save image analysis result */
  saveImageAnalysis(conversationId, imageUrl, diagnosis) {
    const id = `ia-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    this.db.prepare(`
      INSERT INTO image_analyses (id, conversation_id, image_url, diagnosis, confidence, severity, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(id, conversationId, imageUrl, 
      JSON.stringify(diagnosis), diagnosis.confidence, diagnosis.severity);
    return this.db.prepare('SELECT * FROM image_analyses WHERE id = ?').get(id);
  }
}
