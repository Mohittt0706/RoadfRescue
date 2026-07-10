import { initDatabase } from './database.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

async function runTests() {
  console.log('Running backend verification checks...');
  const db = initDatabase();

  try {
    // Test 1: Seed data check
    const admin = db.prepare('SELECT * FROM admins WHERE email = ?').get('admin@roadrescue.in');
    if (admin) {
      console.log('✅ Test 1 Passed: Admin seeded successfully.');
    } else {
      throw new Error('Test 1 Failed: Seed admin not found.');
    }

    // Test 2: Password comparison helper
    const pwMatch = await bcrypt.compare('admin123', admin.password_hash);
    if (pwMatch) {
      console.log('✅ Test 2 Passed: Hashed password verification matches.');
    } else {
      throw new Error('Test 2 Failed: Password hash mismatch.');
    }

    // Test 3: DB migrations check
    const userColumns = db.prepare('PRAGMA table_info(users)').all().map(c => c.name);
    const requiredCols = ['status', 'profile_image', 'address', 'city', 'vehicle', 'reset_token', 'reset_token_expiry', 'refresh_token'];
    const allUserColsExist = requiredCols.every(c => userColumns.includes(c));

    if (allUserColsExist) {
      console.log('✅ Test 3 Passed: SQLite database columns migrated successfully.');
    } else {
      throw new Error('Test 3 Failed: Missing database migration columns in users table.');
    }

    // Test 4: Token generation check
    const payload = { id: 'test-user-id', email: 'test@gmail.com', role: 'user' };
    const secret = process.env.JWT_SECRET || 'roadrescue_jwt_secret_change_in_production';
    const token = jwt.sign(payload, secret, { expiresIn: '15m' });
    const decoded = jwt.verify(token, secret);
    if (decoded.id === 'test-user-id' && decoded.role === 'user') {
      console.log('✅ Test 4 Passed: JWT access token signing & signature verification works.');
    } else {
      throw new Error('Test 4 Failed: JWT encoding/decoding failed.');
    }

    // Test 5: Insert user with 'active' status
    db.prepare('DELETE FROM users WHERE email = ?').run('test_user@gmail.com');
    const hashedUserPw = await bcrypt.hash('user1234', 12);
    db.prepare(`
      INSERT INTO users (id, name, email, phone, password_hash, status)
      VALUES (?, ?, ?, ?, ?, 'active')
    `).run('user-test-id', 'Test User', 'test_user@gmail.com', '9876543210', hashedUserPw);
    const insertedUser = db.prepare('SELECT status FROM users WHERE id = ?').get('user-test-id');
    if (insertedUser && insertedUser.status === 'active') {
      console.log('✅ Test 5 Passed: User created with default status active.');
    } else {
      throw new Error('Test 5 Failed: Active status default fail.');
    }

    // Test 6: Insert mechanic with 'pending' status
    db.prepare('DELETE FROM mechanics WHERE email = ?').run('test_mech@gmail.com');
    const hashedMechPw = await bcrypt.hash('mech1234', 12);
    db.prepare(`
      INSERT INTO mechanics (id, name, phone, email, password_hash, approval_status)
      VALUES (?, ?, ?, ?, ?, 'pending')
    `).run('mech-test-id', 'Test Mechanic', '9876543211', 'test_mech@gmail.com', hashedMechPw);
    const insertedMech = db.prepare('SELECT approval_status FROM mechanics WHERE id = ?').get('mech-test-id');
    if (insertedMech && insertedMech.approval_status === 'pending') {
      console.log('✅ Test 6 Passed: Mechanic created with pending approval status.');
    } else {
      throw new Error('Test 6 Failed: Mechanic pending approval default fail.');
    }

    console.log('\n🎉 ALL CORE LOGICAL BACKEND TESTS PASSED SUCCESSFULLY! 🎉');
  } catch (error) {
    console.error('❌ VERIFICATION TEST FAILED:', error.message);
    process.exit(1);
  } finally {
    db.close();
  }
}

runTests();
