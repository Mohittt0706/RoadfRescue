import OpenAI from 'openai';

const rpmStore = {}; // userId -> timestamp[]
const dailyStore = {}; // userId -> { count, date }

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === 'your_openai_api_key_here') {
    return null;
  }
  return new OpenAI({ apiKey });
}

class AIService {
  /**
   * Enforces prompt length, RPM, and daily caps
   */
  verifyAiLimits(userId, prompt) {
    // 1. Max prompt length (1000 characters)
    if (prompt && prompt.length > 1000) {
      throw new Error('Prompt exceeds maximum limit of 1000 characters.');
    }

    const now = Date.now();

    // 2. RPM Limiter (10 requests per minute)
    if (!rpmStore[userId]) {
      rpmStore[userId] = [];
    }
    // Clean old timestamps (> 60s)
    rpmStore[userId] = rpmStore[userId].filter(ts => now - ts < 60 * 1000);
    if (rpmStore[userId].length >= 10) {
      throw new Error('AI Rate limit exceeded. Maximum 10 requests per minute.');
    }

    // 3. Daily request limit (50 requests per day)
    const todayStr = new Date().toISOString().slice(0, 10);
    if (!dailyStore[userId] || dailyStore[userId].date !== todayStr) {
      dailyStore[userId] = { count: 0, date: todayStr };
    }
    if (dailyStore[userId].count >= 50) {
      throw new Error('Daily AI request quota reached (50 requests maximum).');
    }

    // Track request
    rpmStore[userId].push(now);
    dailyStore[userId].count += 1;
  }

  /**
   * Log AI chat interaction in database
   */
  saveAiHistory(db, { userId, conversationId, prompt, response, responseTimeMs }) {
    const id = `AI-HIST-${Date.now()}`;
    db.prepare(`
      INSERT INTO ai_history (id, user_id, conversation_id, prompt, response, timestamp, response_time_ms)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)
    `).run(id, userId, conversationId, prompt, response, responseTimeMs);
    return id;
  }

  /**
   * Submit helpfulness rating feedback for AI
   */
  saveAiFeedback(db, { aiHistoryId, rating, remarks = '' }) {
    const id = `AI-FEED-${Date.now()}`;
    db.transaction(() => {
      // Create feedback log
      db.prepare(`
        INSERT INTO ai_feedback (id, ai_history_id, rating, remarks, created_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(id, aiHistoryId, rating, remarks);

      // Update state in ai_history
      db.prepare('UPDATE ai_history SET helpful_rating = ? WHERE id = ?').run(rating, aiHistoryId);
    })();
    return id;
  }

  /**
   * Log visual image analysis in database
   */
  saveImageAnalysis(db, { userId, conversationId, imageUrl, diagnosis, confidence, severity, aiModel = 'gpt-4o' }) {
    const id = `IMG-ANALY-${Date.now()}`;
    db.prepare(`
      INSERT INTO image_analyses (id, conversation_id, image_url, diagnosis, confidence, severity, user_id, ai_model, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(id, conversationId, imageUrl, typeof diagnosis === 'object' ? JSON.stringify(diagnosis) : diagnosis, confidence, severity, userId, aiModel);
    return id;
  }
}

export const aiService = new AIService();
export { getOpenAI };
