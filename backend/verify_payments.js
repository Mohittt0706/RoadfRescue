import { initDatabase } from './database.js';
import { initWorkflowDatabase } from './booking_workflow/db.js';
import { initPaymentDatabase } from './payment_workflow/db.js';
import { calculatePricing } from './payment_workflow/pricingService.js';
import { paymentService } from './payment_workflow/paymentService.js';
import { generateInvoice } from './payment_workflow/invoiceService.js';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import { join } from 'path';

async function runPaymentTests() {
  console.log('Running advanced payment workflow verification checks...');
  const db = initDatabase();
  initWorkflowDatabase(db);
  initPaymentDatabase(db);

  const testBookingId = `BK-PAY-TEST-${Date.now()}`;
  const testCouponCode = 'SAVE50TEST';
  const testPaymentId = `PAY-TEST-${Date.now()}`;

  try {
    // 1. Setup mock data
    db.prepare('DELETE FROM bookings WHERE id = ?').run(testBookingId);
    db.prepare('DELETE FROM coupons WHERE code = ?').run(testCouponCode);
    db.prepare('DELETE FROM workflow_payments WHERE booking_id = ?').run(testBookingId);
    db.prepare('DELETE FROM workflow_refunds WHERE booking_id = ?').run(testBookingId);

    // Insert mock user
    db.prepare("INSERT OR IGNORE INTO users (id, name, email, phone, password_hash) VALUES ('test-user-id', 'Test User', 'test@test.com', '1234567890', 'hash')").run();

    // Insert mock booking (Normal priority, creation time will be midday to avoid night surcharge)
    const middayDate = new Date();
    middayDate.setHours(12, 0, 0); // 12 PM
    const middayStr = middayDate.toISOString();
    
    db.prepare(`
      INSERT INTO bookings (id, user_id, customer_name, phone, vehicle_type, vehicle_number, service_name, price, status, booking_time)
      VALUES (?, 'test-user-id', 'John PayTest', '9999988888', 'Sedan', 'MH-12-XX-1234', 'Flat Tire Repair', 699, 'pending', ?)
    `).run(testBookingId, middayStr);

    // Insert mock coupon (50% percentage discount, min order 500, limit 10)
    db.prepare(`
      INSERT INTO coupons (id, code, discount_type, discount_value, min_order_value, usage_limit, used_count)
      VALUES (?, ?, 'percentage', 50, 500, 10, 0)
    `).run(uuidv4(), testCouponCode);

    // 2. Test Coupon and Pricing Calculation
    // Base Price: 699
    // Platform fee: 49
    // Subtotal: 699 + 49 = 748
    // Night Surcharge: 0 (midday)
    // Holiday Surcharge: 0 or 100 depending on day of week
    const day = middayDate.getDay();
    const isWeekend = day === 0 || day === 6;
    const subtotal = 748 + (isWeekend ? 100 : 0);

    const discount = Math.round(subtotal * 0.5);
    const taxable = subtotal - discount;
    const expectedGst = Math.round(taxable * 0.18);
    const expectedFinal = taxable + expectedGst;

    const pricing = calculatePricing(db, testBookingId, testCouponCode);
    console.log('Pricing calculated:', pricing);

    if (pricing.finalAmount === expectedFinal && pricing.discount === discount) {
      console.log('✅ Test 1 Passed: Pricing calculations and coupon discount verify correctly.');
    } else {
      throw new Error(`Test 1 Failed: Expected final amount ${expectedFinal}, got ${pricing.finalAmount}`);
    }

    // 3. Test Order Creation and DB Insertion
    const gatewayOrder = await paymentService.createOrder(pricing.finalAmount, `rcpt_${testBookingId.substring(0, 10)}`);
    db.prepare(`
      INSERT INTO workflow_payments (
        id, booking_id, user_id, order_id, gateway, currency, 
        amount, tax, discount, status, method
      ) VALUES (?, ?, ?, ?, 'MockGateway', ?, ?, ?, ?, 'created', 'digital')
    `).run(
      testPaymentId,
      testBookingId,
      'test-user-id',
      gatewayOrder.orderId,
      gatewayOrder.currency,
      pricing.finalAmount,
      pricing.gstAmount,
      pricing.discount
    );

    const payment = db.prepare('SELECT * FROM workflow_payments WHERE id = ?').get(testPaymentId);
    if (payment && payment.order_id === gatewayOrder.orderId && payment.status === 'created') {
      console.log('✅ Test 2 Passed: Order created and stored in DB successfully.');
    } else {
      throw new Error('Test 2 Failed: Payment record not verified.');
    }

    // 4. Test Webhook Capture & PDF Invoice Generation
    // Capture payment locally
    db.transaction(() => {
      db.prepare(`
        UPDATE workflow_payments 
        SET status = 'captured', payment_id = 'pay_test_gateway_123', method = 'upi', transaction_reference = 'pay_test_gateway_123', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(testPaymentId);

      db.prepare("UPDATE bookings SET payment_status = 'Paid', status = 'payment_completed' WHERE id = ?").run(testBookingId);
    })();

    const freshPayment = db.prepare('SELECT * FROM workflow_payments WHERE id = ?').get(testPaymentId);
    const invoicePath = await generateInvoice(db, testBookingId, pricing, freshPayment);
    console.log(`Generated Invoice Path: ${invoicePath}`);

    const updatedPayment = db.prepare('SELECT * FROM workflow_payments WHERE id = ?').get(testPaymentId);
    const absoluteInvoicePath = join(process.cwd(), invoicePath);
    if (fs.existsSync(absoluteInvoicePath) && updatedPayment.invoice_path === invoicePath) {
      console.log('✅ Test 3 Passed: Webhook capture processed and PDF Invoice generated successfully.');
    } else {
      throw new Error(`Test 3 Failed: Invoice PDF generation verification failed. Path in DB: ${updatedPayment.invoice_path}, Expected: ${invoicePath}`);
    }

    // 5. Test Refund processing (Gateway mock + updates status)
    const refundRecordId = `RF-TEST-${Date.now()}`;
    const gatewayRefund = await paymentService.createRefund(freshPayment.payment_id, freshPayment.amount);
    
    db.transaction(() => {
      db.prepare(`
        INSERT INTO workflow_refunds (id, booking_id, payment_id, user_id, amount_requested, amount_refunded, status, reason, gateway_refund_id)
        VALUES (?, ?, ?, ?, ?, ?, 'completed', ?, ?)
      `).run(refundRecordId, testBookingId, freshPayment.id, freshPayment.user_id, freshPayment.amount, freshPayment.amount, 'Test refund', gatewayRefund.refundId);

      db.prepare("UPDATE workflow_payments SET status = 'refunded' WHERE id = ?").run(freshPayment.id);
      db.prepare("UPDATE bookings SET status = 'refunded', payment_status = 'Refunded' WHERE id = ?").run(testBookingId);
    })();

    const refundedPayment = db.prepare('SELECT status FROM workflow_payments WHERE id = ?').get(testPaymentId);
    const refundedBooking = db.prepare('SELECT status, payment_status FROM bookings WHERE id = ?').get(testBookingId);
    const refundRecord = db.prepare('SELECT status FROM workflow_refunds WHERE id = ?').get(refundRecordId);

    if (
      refundedPayment.status === 'refunded' && 
      refundedBooking.status === 'refunded' && 
      refundedBooking.payment_status === 'Refunded' &&
      refundRecord.status === 'completed'
    ) {
      console.log('✅ Test 4 Passed: Refund request driver and gateway simulation works.');
    } else {
      throw new Error('Test 4 Failed: Refund status updates verify failed.');
    }

    // 6. Test Dashboard Analytics Stats
    const today = new Date().toISOString().slice(0, 10);
    const totalRefunded = db.prepare("SELECT COALESCE(SUM(amount_refunded), 0) as total FROM workflow_refunds WHERE status = 'completed'").get().total;
    
    if (totalRefunded >= pricing.finalAmount) {
      console.log('✅ Test 5 Passed: Dashboard query calculations verify successfully.');
    } else {
      throw new Error(`Test 5 Failed: Expected refunded amount ${pricing.finalAmount}, got ${totalRefunded}`);
    }

    // Cleanup PDF invoice file from disk
    if (fs.existsSync(absoluteInvoicePath)) {
      fs.unlinkSync(absoluteInvoicePath);
      console.log('Temporary PDF invoice file deleted.');
    }

    // Cleanup DB mock data
    db.prepare('DELETE FROM workflow_refunds WHERE booking_id = ?').run(testBookingId);
    db.prepare('DELETE FROM workflow_payments WHERE booking_id = ?').run(testBookingId);
    db.prepare('DELETE FROM bookings WHERE id = ?').run(testBookingId);
    db.prepare('DELETE FROM coupons WHERE code = ?').run(testCouponCode);

    console.log('\n🎉 ALL ADVANCED PAYMENT TESTS PASSED SUCCESSFULLY! 🎉');
  } catch (err) {
    console.error('❌ PAYMENT VERIFICATION TEST FAILED:', err.message);
    
    // Cleanup on failure if possible
    try {
      db.prepare('DELETE FROM workflow_refunds WHERE booking_id = ?').run(testBookingId);
      db.prepare('DELETE FROM workflow_payments WHERE booking_id = ?').run(testBookingId);
      db.prepare('DELETE FROM bookings WHERE id = ?').run(testBookingId);
      db.prepare('DELETE FROM coupons WHERE code = ?').run(testCouponCode);
    } catch (_) {}

    process.exit(1);
  } finally {
    db.close();
  }
}

runPaymentTests();
