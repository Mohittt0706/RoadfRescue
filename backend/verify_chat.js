import { initDatabase } from './database.js';
import { initWorkflowDatabase } from './booking_workflow/db.js';
import { initChatWorkflowDatabase } from './chat_workflow/db.js';
import { chatService } from './chat_workflow/chatService.js';
import { aiService } from './chat_workflow/aiService.js';
import { v4 as uuidv4 } from 'uuid';

async function runChatTests() {
  console.log('Running advanced chat workflow verification checks...');
  const db = initDatabase();
  initWorkflowDatabase(db);
  initChatWorkflowDatabase(db);

  const testUserId = `USR-CHAT-TEST-${Date.now()}`;
  const testConvId = `CONV-TEST-${Date.now()}`;
  const testMsgId = `MSG-TEST-${Date.now()}`;

  try {
    // 1. Setup mock data
    db.prepare('DELETE FROM conversations WHERE id = ?').run(testConvId);
    db.prepare('DELETE FROM chat_messages WHERE conversation_id = ?').run(testConvId);
    db.prepare('DELETE FROM ai_history WHERE user_id = ?').run(testUserId);
    db.prepare('DELETE FROM users WHERE id = ?').run(testUserId);

    // Insert mock user
    db.prepare("INSERT OR IGNORE INTO users (id, name, email, phone, password_hash) VALUES (?, 'Chat User', 'chat@test.com', '1212121212', 'hash')").run(testUserId);

    // 2. Test Conversation creation and participants
    const participants = JSON.stringify([testUserId, 'mechanic_123']);
    db.prepare(`
      INSERT INTO conversations (id, user_id, title, type, participants, status)
      VALUES (?, ?, 'Test Conversation', 'User-Mechanic', ?, 'active')
    `).run(testConvId, testUserId, participants);

    const conv = db.prepare('SELECT * FROM conversations WHERE id = ?').get(testConvId);
    if (conv && conv.type === 'User-Mechanic' && conv.status === 'active') {
      console.log('✅ Test 1 Passed: Conversation created with custom metadata columns.');
    } else {
      throw new Error('Test 1 Failed: Conversation fields mismatch.');
    }

    // 3. Test Message sending with replyTo
    const sentMsg = await chatService.sendMessage(db, null, {
      conversationId: testConvId,
      senderId: testUserId,
      senderRole: 'user',
      message: 'Hello mechanic, please reply.',
      replyTo: null
    });

    const replyMsg = await chatService.sendMessage(db, null, {
      conversationId: testConvId,
      senderId: 'mechanic_123',
      senderRole: 'mechanic',
      message: 'Sure, I am on it.',
      replyTo: sentMsg.id
    });

    const queriedReply = db.prepare('SELECT * FROM chat_messages WHERE id = ?').get(replyMsg.id);
    if (queriedReply && queriedReply.reply_to === sentMsg.id && queriedReply.sender_role === 'mechanic') {
      console.log('✅ Test 2 Passed: Messaging sending with replyTo links and sender roles works.');
    } else {
      throw new Error('Test 2 Failed: Reply message mismatch.');
    }

    // 4. Test Edit Message within 15 minutes
    const edited = await chatService.editMessage(db, null, sentMsg.id, 'Hello mechanic, please help!', testUserId);
    const queriedEdit = db.prepare('SELECT * FROM chat_messages WHERE id = ?').get(sentMsg.id);
    const editHistory = db.prepare('SELECT * FROM message_edits WHERE message_id = ?').get(sentMsg.id);

    if (queriedEdit.content === 'Hello mechanic, please help!' && editHistory && editHistory.old_content === 'Hello mechanic, please reply.') {
      console.log('✅ Test 3 Passed: Message editing and change history tracking verified.');
    } else {
      throw new Error('Test 3 Failed: Edit mismatch.');
    }

    // 5. Test Soft Delete for Everyone
    await chatService.deleteMessage(db, null, sentMsg.id, 'everyone', testUserId);
    const queriedDeleted = db.prepare('SELECT * FROM chat_messages WHERE id = ?').get(sentMsg.id);
    if (queriedDeleted && queriedDeleted.content === 'This message was deleted.' && queriedDeleted.deleted_at) {
      console.log('✅ Test 4 Passed: Soft deleting messages "for everyone" verified.');
    } else {
      throw new Error('Test 4 Failed: Soft delete mismatch.');
    }

    // 6. Test Read receipts
    await chatService.markRead(db, null, replyMsg.id, testUserId);
    const queriedRead = db.prepare('SELECT status FROM chat_messages WHERE id = ?').get(replyMsg.id);
    const readReceipt = db.prepare('SELECT * FROM message_reads WHERE message_id = ?').get(replyMsg.id);

    if (queriedRead.status === 'read' && readReceipt && readReceipt.user_id === testUserId) {
      console.log('✅ Test 5 Passed: Message read receipts and log records verified.');
    } else {
      throw new Error('Test 5 Failed: Read receipt mismatch.');
    }

    // 7. Test AI rate limiter and quotas
    aiService.verifyAiLimits(testUserId, 'Test Prompt');
    console.log('✅ Test 6 Passed: AI Rate limits verify (under limits).');

    try {
      aiService.verifyAiLimits(testUserId, 'a'.repeat(1005));
      throw new Error('Rate limit check did not restrict long prompt.');
    } catch (err) {
      if (err.message.includes('exceeds maximum limit')) {
        console.log('✅ Test 7 Passed: Prompt length validator successfully rejects over-sized strings.');
      } else {
        throw err;
      }
    }

    // 8. Test AI historical logging and ratings feedback
    const historyId = aiService.saveAiHistory(db, {
      userId: testUserId,
      conversationId: testConvId,
      prompt: 'My radiator is smoking.',
      response: 'Turn engine off immediately.',
      responseTimeMs: 250
    });

    const originalHist = db.prepare('SELECT helpful_rating FROM ai_history WHERE id = ?').get(historyId);
    aiService.saveAiFeedback(db, {
      aiHistoryId: historyId,
      rating: 'Helpful',
      remarks: 'Saved my car!'
    });

    const ratedHist = db.prepare('SELECT helpful_rating FROM ai_history WHERE id = ?').get(historyId);
    const feedbackRecord = db.prepare('SELECT * FROM ai_feedback WHERE ai_history_id = ?').get(historyId);

    if (originalHist.helpful_rating === 'N/A' && ratedHist.helpful_rating === 'Helpful' && feedbackRecord.remarks === 'Saved my car!') {
      console.log('✅ Test 8 Passed: AI response log archiving and ratings feedback verified.');
    } else {
      throw new Error('Test 8 Failed: AI logs or feedback mismatch.');
    }

    // Cleanup mock data
    db.prepare('DELETE FROM ai_feedback WHERE ai_history_id = ?').run(historyId);
    db.prepare('DELETE FROM ai_history WHERE user_id = ?').run(testUserId);
    db.prepare('DELETE FROM message_reads WHERE user_id = ?').run(testUserId);
    db.prepare('DELETE FROM message_edits WHERE message_id = ?').run(sentMsg.id);
    db.prepare('DELETE FROM chat_messages WHERE conversation_id = ?').run(testConvId);
    db.prepare('DELETE FROM conversations WHERE id = ?').run(testConvId);
    db.prepare('DELETE FROM users WHERE id = ?').run(testUserId);

    console.log('\n🎉 ALL ADVANCED CHAT & AI TESTS PASSED SUCCESSFULLY! 🎉');
  } catch (err) {
    console.error('❌ CHAT VERIFICATION TEST FAILED:', err.message);
    
    // Cleanup on failure
    try {
      db.prepare('DELETE FROM ai_history WHERE user_id = ?').run(testUserId);
      db.prepare('DELETE FROM chat_messages WHERE conversation_id = ?').run(testConvId);
      db.prepare('DELETE FROM conversations WHERE id = ?').run(testConvId);
      db.prepare('DELETE FROM users WHERE id = ?').run(testUserId);
    } catch (_) {}

    process.exit(1);
  } finally {
    db.close();
  }
}

runChatTests();
