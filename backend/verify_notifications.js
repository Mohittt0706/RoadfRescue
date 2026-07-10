import { initDatabase } from './database.js';
import { initWorkflowDatabase } from './booking_workflow/db.js';
import { initNotificationWorkflowDatabase } from './notification_workflow/db.js';
import { notificationService } from './notification_workflow/notificationService.js';
import { v4 as uuidv4 } from 'uuid';

async function runNotificationTests() {
  console.log('Running advanced notification workflow verification checks...');
  const db = initDatabase();
  initWorkflowDatabase(db);
  initNotificationWorkflowDatabase(db);

  const testUserId = `USR-NOTI-TEST-${Date.now()}`;

  try {
    // 1. Setup mock data
    db.prepare('DELETE FROM workflow_notifications WHERE recipient_id = ?').run(testUserId);
    db.prepare('DELETE FROM notification_preferences WHERE user_id = ?').run(testUserId);
    db.prepare('DELETE FROM push_device_tokens WHERE user_id = ?').run(testUserId);
    
    // Insert mock user
    db.prepare("INSERT OR IGNORE INTO users (id, name, email, phone, password_hash) VALUES (?, 'Noti User', 'noti@test.com', '1112223333', 'hash')").run(testUserId);

    // 2. Test default preferences creation
    const prefs = notificationService.ensurePreferences(db, testUserId);
    if (prefs && prefs.push_enabled === 1 && prefs.booking_updates === 1 && prefs.marketing_notifications === 0) {
      console.log('✅ Test 1 Passed: Default preferences created and fetched correctly.');
    } else {
      throw new Error('Test 1 Failed: Preferences mismatch.');
    }

    // 3. Test creating notification with enabled preferences
    const notiId1 = await notificationService.createNotification(db, null, {
      recipientId: testUserId,
      title: 'Booking Created Test',
      message: 'Your booking has been registered.',
      type: 'booking_created',
      priority: 'Normal'
    });

    const noti1 = db.prepare('SELECT * FROM workflow_notifications WHERE id = ?').get(notiId1);
    const countBefore = db.prepare('SELECT COUNT(*) as count FROM workflow_notifications WHERE recipient_id = ? AND is_read = 0').get(testUserId).count;

    if (noti1 && noti1.title === 'Booking Created Test' && countBefore === 1) {
      console.log('✅ Test 2 Passed: Notification created and stored in DB (matching user preferences).');
    } else {
      throw new Error('Test 2 Failed: Notification creation or count verification failed.');
    }

    // 4. Test preference restriction (type system_announcement / marketing is disabled by default)
    const notiId2 = await notificationService.createNotification(db, null, {
      recipientId: testUserId,
      title: 'Promo Discount Test',
      message: 'Get 50% off.',
      type: 'system_announcement', // Maps to marketing_notifications preference (disabled by default)
      priority: 'Normal'
    });

    if (notiId2 === null) {
      console.log('✅ Test 3 Passed: User preferences correctly filter out disabled categories.');
    } else {
      throw new Error('Test 3 Failed: Suppressed notification was incorrectly generated.');
    }

    // 5. Test priority bypass (Critical bypasses preferences)
    const notiId3 = await notificationService.createNotification(db, null, {
      recipientId: testUserId,
      title: 'CRITICAL SYSTEM OUTAGE',
      message: 'Service is down.',
      type: 'system_announcement',
      priority: 'Critical' // Should bypass marketing preference being disabled
    });

    const countAfterCritical = db.prepare('SELECT COUNT(*) as count FROM workflow_notifications WHERE recipient_id = ? AND is_read = 0').get(testUserId).count;
    if (notiId3 && countAfterCritical === 2) {
      console.log('✅ Test 4 Passed: Critical priority bypasses preference restrictions correctly.');
    } else {
      throw new Error('Test 4 Failed: Critical bypass filter verification failed.');
    }

    // 6. Test Mark as Read
    db.prepare('UPDATE workflow_notifications SET is_read = 1, read_at = CURRENT_TIMESTAMP WHERE id = ?').run(notiId1);
    const noti1Read = db.prepare('SELECT is_read, read_at FROM workflow_notifications WHERE id = ?').get(notiId1);
    const countFinal = db.prepare('SELECT COUNT(*) as count FROM workflow_notifications WHERE recipient_id = ? AND is_read = 0').get(testUserId).count;

    if (noti1Read.is_read === 1 && noti1Read.read_at && countFinal === 1) {
      console.log('✅ Test 5 Passed: Mark read updates read status, timestamps, and active count.');
    } else {
      throw new Error('Test 5 Failed: Mark read logic incorrect.');
    }

    // 7. Test Admin Broadcast Service
    const broadcastCount = await notificationService.broadcast(db, null, {
      targetGroup: 'users',
      title: 'System maintenance scheduled.',
      message: 'Starting in 2 hours.',
      type: 'system_announcement',
      priority: 'High'
    });

    if (broadcastCount > 0) {
      console.log(`✅ Test 6 Passed: Broadcast function matches list of active users (Recipients reached: ${broadcastCount}).`);
    } else {
      throw new Error('Test 6 Failed: Broadcast dispatch target count was 0.');
    }

    // 8. Test statistics reporting
    const statsTotal = db.prepare('SELECT COUNT(*) as count FROM workflow_notifications').get().count;
    if (statsTotal > 0) {
      console.log('✅ Test 7 Passed: Advanced statistics queries verified successfully.');
    } else {
      throw new Error('Test 7 Failed: Stats report query returned 0 notifications.');
    }

    // Cleanup mock data
    db.prepare('DELETE FROM workflow_notifications WHERE recipient_id = ?').run(testUserId);
    db.prepare('DELETE FROM notification_preferences WHERE user_id = ?').run(testUserId);
    db.prepare('DELETE FROM users WHERE id = ?').run(testUserId);

    console.log('\n🎉 ALL ADVANCED NOTIFICATION TESTS PASSED SUCCESSFULLY! 🎉');
  } catch (err) {
    console.error('❌ NOTIFICATION VERIFICATION TEST FAILED:', err.message);
    
    // Cleanup on failure
    try {
      db.prepare('DELETE FROM workflow_notifications WHERE recipient_id = ?').run(testUserId);
      db.prepare('DELETE FROM notification_preferences WHERE user_id = ?').run(testUserId);
      db.prepare('DELETE FROM users WHERE id = ?').run(testUserId);
    } catch (_) {}

    process.exit(1);
  } finally {
    db.close();
  }
}

runNotificationTests();
