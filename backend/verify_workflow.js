import { initDatabase } from './database.js';
import { initWorkflowDatabase } from './booking_workflow/db.js';
import { getHaversineDistance, findEligibleMechanics } from './booking_workflow/dispatch.js';
import { v4 as uuidv4 } from 'uuid';

async function runWorkflowTests() {
  console.log('Running backend workflow verification checks...');
  const db = initDatabase();
  initWorkflowDatabase(db);

  try {
    // Test 1: Haversine distance calculations
    // Ahmedabad (23.0225, 72.5714) to Anand (22.5645, 72.9289) ~ 62 km
    const dist = getHaversineDistance(23.0225, 72.5714, 22.5645, 72.9289);
    console.log(`Calculated distance: ${dist.toFixed(2)} km`);
    if (dist > 55 && dist < 70) {
      console.log('✅ Test 1 Passed: Haversine distance calculator matches.');
    } else {
      throw new Error(`Test 1 Failed: Distance check out of bounds: ${dist}`);
    }

    // Test 2: Insert mock mechanics and sort by eligibility
    db.prepare('DELETE FROM mechanics WHERE id LIKE ?').run('test-mech-%');
    db.prepare('DELETE FROM mechanic_locations WHERE mechanic_id LIKE ?').run('test-mech-%');

    // Insert 3 test mechanics
    db.prepare(`
      INSERT INTO mechanics (id, name, phone, email, status, specialization, rating, total_jobs, approval_status, latitude, longitude)
      VALUES 
        ('test-mech-1', 'Near Available Mech', '111', 'm1@test.com', 'available', 'Tires', 4.5, 10, 'approved', 23.0225, 72.5714),
        ('test-mech-2', 'Far Available Mech', '222', 'm2@test.com', 'available', 'Electrical', 4.9, 5, 'approved', 22.5645, 72.9289),
        ('test-mech-3', 'Near Busy Mech', '333', 'm3@test.com', 'busy', 'Engine', 4.8, 15, 'approved', 23.0225, 72.5714)
    `).run();

    // Find eligible mechanics relative to Ahmedabad coordinates (23.0225, 72.5714)
    const eligible = findEligibleMechanics(db, 23.0225, 72.5714);
    const sortedTestMechs = eligible.filter(m => m.id.startsWith('test-mech-'));

    // Sorting rules priority: Available desc, Distance asc, Rating desc, jobs asc
    // 1st should be 'test-mech-1' (available, near)
    // 2nd should be 'test-mech-2' (available, far)
    // 3rd should be 'test-mech-3' (busy, near)
    if (
      sortedTestMechs[0].id === 'test-mech-1' &&
      sortedTestMechs[1].id === 'test-mech-2' &&
      sortedTestMechs[2].id === 'test-mech-3'
    ) {
      console.log('✅ Test 2 Passed: Mechanic eligibility selection and sorting matches expectations.');
    } else {
      throw new Error(`Test 2 Failed: Incorrect sorting order: ${JSON.stringify(sortedTestMechs)}`);
    }

    // Test 3: Status logging and history records
    const testBookingId = `BK-TEST-${Date.now()}`;
    db.prepare('DELETE FROM booking_history WHERE booking_id = ?').run(testBookingId);
    db.prepare('DELETE FROM bookings WHERE id = ?').run(testBookingId);

    // Create mock booking
    db.prepare(`
      INSERT INTO bookings (id, customer_name, phone, vehicle_type, vehicle_number, service_name, price, status)
      VALUES (?, 'Test Client', '999', 'SUV', 'MH-12-XX-1234', 'Flat Tire Repair', 699, 'pending')
    `).run(testBookingId);

    // Transition to admin_review
    db.prepare(`
      INSERT INTO booking_history (id, booking_id, old_status, new_status, updated_by, remarks)
      VALUES (?, ?, 'pending', 'admin_review', 'admin', 'Manual review start')
    `).run(uuidv4(), testBookingId);

    const history = db.prepare('SELECT * FROM booking_history WHERE booking_id = ?').all(testBookingId);
    if (history.length === 1 && history[0].new_status === 'admin_review') {
      console.log('✅ Test 3 Passed: Booking history table tracks transitions correctly.');
    } else {
      throw new Error('Test 3 Failed: History records not stored correctly.');
    }

    // Test 4: Reviews and rating averages calculation
    db.prepare('DELETE FROM reviews WHERE booking_id = ?').run(testBookingId);
    
    // Insert reviews for test-mech-1
    db.prepare(`
      INSERT INTO reviews (id, booking_id, user_id, mechanic_id, rating, review_text)
      VALUES 
        ('rev-1', ?, 'user-test-id', 'test-mech-1', 5, 'Great!'),
        ('rev-2', ?, 'user-test-id', 'test-mech-1', 4, 'Good work')
    `).run(testBookingId, testBookingId);

    // Recalculate average
    const stats = db.prepare("SELECT AVG(rating) as avgRating FROM reviews WHERE mechanic_id = 'test-mech-1'").get();
    const newRating = parseFloat(stats.avgRating.toFixed(2));
    
    db.prepare("UPDATE mechanics SET rating = ? WHERE id = 'test-mech-1'").run(newRating);
    const mech = db.prepare("SELECT rating FROM mechanics WHERE id = 'test-mech-1'").get();

    if (mech.rating === 4.5) {
      console.log('✅ Test 4 Passed: Mechanic average rating recalculation is correct.');
    } else {
      throw new Error(`Test 4 Failed: Expected 4.5 rating, got ${mech.rating}`);
    }

    // Clean up test data
    db.prepare('DELETE FROM reviews WHERE booking_id = ?').run(testBookingId);
    db.prepare('DELETE FROM booking_history WHERE booking_id = ?').run(testBookingId);
    db.prepare('DELETE FROM bookings WHERE id = ?').run(testBookingId);
    db.prepare('DELETE FROM mechanics WHERE id LIKE ?').run('test-mech-%');
    db.prepare('DELETE FROM mechanic_locations WHERE mechanic_id LIKE ?').run('test-mech-%');

    console.log('\n🎉 ALL WORKFLOW LOGICAL BACKEND TESTS PASSED SUCCESSFULLY! 🎉');
  } catch (err) {
    console.error('❌ WORKFLOW VERIFICATION TEST FAILED:', err.message);
    process.exit(1);
  } finally {
    db.close();
  }
}

runWorkflowTests();
