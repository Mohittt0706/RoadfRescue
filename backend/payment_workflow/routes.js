import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { verifyToken, verifyAdmin } from '../authentication/middleware.js';
import { calculatePricing } from './pricingService.js';
import { paymentService } from './paymentService.js';
import { generateInvoice } from './invoiceService.js';
import { sendNotification } from '../booking_workflow/notifications.js';
import { insertAuditLog, getClientIP } from '../utils/auditLogger.js';
import { join } from 'path';
import fs from 'fs';

const router = Router();

// ==========================================
// 1. Order Creation API
// ==========================================

// POST /api/payments/create-order - Initiate order with payment gateway
router.post('/payments/create-order', verifyToken, async (req, res) => {
  const { db } = req;
  const { bookingId, couponCode = null } = req.body;
  const { id: userId, role } = req.user;

  if (!bookingId) {
    return res.status(400).json({ success: false, message: 'bookingId is required.' });
  }

  try {
    // 1. Fetch booking & authorize
    let booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);
    let isEmergency = false;

    if (!booking) {
      booking = db.prepare('SELECT * FROM emergencies WHERE id = ?').get(bookingId);
      if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
      isEmergency = true;
    }

    const bookingUserId = isEmergency ? null : booking.user_id;
    if (role === 'user' && bookingUserId && bookingUserId !== userId) {
      return res.status(403).json({ success: false, message: 'Access denied. You do not own this booking.' });
    }

    // Check if a captured payment already exists to prevent duplicate payments
    const existingPayment = db.prepare(`
      SELECT id FROM workflow_payments 
      WHERE booking_id = ? AND status = 'captured'
    `).get(bookingId);
    
    if (existingPayment) {
      return res.status(400).json({ success: false, message: 'This booking has already been paid for.' });
    }

    // 2. Pricing Engine execution
    const pricing = calculatePricing(db, bookingId, couponCode);

    // 3. Create order on Payment Gateway (Razorpay/Mock)
    const receiptId = `rcpt_${bookingId.substring(0, 10)}`;
    const gatewayOrder = await paymentService.createOrder(pricing.finalAmount, receiptId);

    // 4. Save Payment record in database
    const paymentRecordId = `PAY-${Date.now()}`;
    db.prepare(`
      INSERT INTO workflow_payments (
        id, booking_id, user_id, order_id, gateway, currency, 
        amount, tax, discount, status, method, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'created', 'digital', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).run(
      paymentRecordId,
      bookingId,
      bookingUserId || 'guest',
      gatewayOrder.orderId,
      paymentService.isMock ? 'MockGateway' : 'Razorpay',
      gatewayOrder.currency,
      pricing.finalAmount,
      pricing.gstAmount,
      pricing.discount
    );

    // 5. Audit Logging
    insertAuditLog(db, {
      adminId: role === 'admin' ? userId : 'system',
      action: 'CREATE',
      entity: 'payment',
      entityId: paymentRecordId,
      description: `Created payment order ${gatewayOrder.orderId} for booking ${bookingId} (Amount: ₹${pricing.finalAmount})`,
      ipAddress: getClientIP(req)
    });

    res.status(201).json({
      success: true,
      orderId: gatewayOrder.orderId,
      amount: gatewayOrder.amount,
      currency: gatewayOrder.currency,
      bookingId,
      pricing
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create payment order.', error: err.message });
  }
});

// ==========================================
// 2. Webhook Verification & Processing
// ==========================================

// POST /api/payments/webhook - Secure webhook listener for gateway callbacks
router.post('/payments/webhook', async (req, res) => {
  const { db, io } = req;
  const signature = req.headers['x-razorpay-signature'] || 'mock_signature';
  const rawBody = JSON.stringify(req.body);

  try {
    // 1. Verify Signature
    const isValid = paymentService.verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid webhook signature verification failed.' });
    }

    const event = req.body.event || 'payment.captured';
    const payload = req.body.payload || {};
    const paymentDetails = payload.payment?.entity || req.body;

    const orderId = paymentDetails.order_id;
    const gatewayPaymentId = paymentDetails.id;
    const amount = (paymentDetails.amount) ? paymentDetails.amount / 100 : paymentDetails.amount;
    const method = paymentDetails.method || 'upi';

    if (!orderId) {
      return res.status(400).json({ error: 'Missing order_id references.' });
    }

    // 2. Retrieve local payment record
    const payment = db.prepare('SELECT * FROM workflow_payments WHERE order_id = ?').get(orderId);
    if (!payment) {
      return res.status(404).json({ error: 'Matching payment order not found.' });
    }

    if (event === 'payment.captured' || event === 'order.paid') {
      if (payment.status === 'captured') {
        return res.json({ status: 'ok', message: 'Payment already processed.' });
      }

      // 3. Process capture successfully
      db.transaction(() => {
        // Update payment table
        db.prepare(`
          UPDATE workflow_payments 
          SET status = 'captured', payment_id = ?, method = ?, transaction_reference = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(gatewayPaymentId, method, gatewayPaymentId, payment.id);

        // Update booking tables (conforming status mappings)
        let isEmergency = false;
        let booking = db.prepare('SELECT id, user_id FROM bookings WHERE id = ?').get(payment.booking_id);
        if (!booking) {
          booking = db.prepare('SELECT id FROM emergencies WHERE id = ?').get(payment.booking_id);
          isEmergency = true;
        }

        if (isEmergency) {
          db.prepare("UPDATE emergencies SET payment_status = 'Completed' WHERE id = ?").run(payment.booking_id);
        } else {
          db.prepare("UPDATE bookings SET payment_status = 'Paid', status = 'payment_completed', updated_at = CURRENT_TIMESTAMP WHERE id = ?")
            .run(payment.booking_id);

          // Record history log
          db.prepare(`
            INSERT INTO booking_history (id, booking_id, old_status, new_status, updated_by, remarks)
            VALUES (?, ?, 'completed', 'payment_completed', 'system', 'Payment completed via gateway.')
          `).run(uuidv4(), payment.booking_id);
        }

        // Copy completed payment to legacy payments table for backward compatibility!
        try {
          db.prepare(`
            INSERT INTO payments (id, booking_id, amount, method, status, transaction_id)
            VALUES (?, ?, ?, ?, 'Completed', ?)
          `).run(uuidv4(), payment.booking_id, payment.amount, method, gatewayPaymentId);
        } catch (legacyErr) {
          console.warn('Skipped duplicate entry in legacy payments table:', legacyErr.message);
        }

        // Deduct coupon limit if coupon was applied
        const pricing = calculatePricing(db, payment.booking_id);
        if (pricing.appliedCoupon) {
          db.prepare('UPDATE coupons SET used_count = used_count + 1 WHERE code = ?').run(pricing.appliedCoupon);
        }
      })();

      // 4. Generate PDF Invoice (async outside transaction)
      try {
        const pricing = calculatePricing(db, payment.booking_id);
        const freshPayment = db.prepare('SELECT * FROM workflow_payments WHERE id = ?').get(payment.id);
        const invoicePath = await generateInvoice(db, payment.booking_id, pricing, freshPayment);
        console.log(`Invoice successfully generated at: ${invoicePath}`);
      } catch (invErr) {
        console.error('Invoice creation during webhook failed:', invErr);
      }

      // 5. Send notifications & socket triggers
      const updatedPayment = db.prepare('SELECT * FROM workflow_payments WHERE id = ?').get(payment.id);
      
      sendNotification({
        db, io,
        type: 'payment_success',
        title: 'Payment Successful',
        message: `Your payment of ₹${payment.amount} has been successfully processed.`,
        bookingId: payment.booking_id,
        targetRole: 'user',
        targetId: payment.user_id,
        socketEvent: 'paymentUpdated',
        socketData: { payment: updatedPayment }
      });

      sendNotification({
        db, io,
        type: 'payment_received',
        title: 'Payment Confirmed',
        message: `Payment order ${orderId} received. Amount: ₹${payment.amount}`,
        bookingId: payment.booking_id,
        targetRole: 'admin',
        socketEvent: 'paymentUpdated',
        socketData: { payment: updatedPayment }
      });

      insertAuditLog(db, {
        adminId: 'system',
        action: 'UPDATE',
        entity: 'payment',
        entityId: payment.id,
        description: `Captured payment of ₹${payment.amount} for booking ${payment.booking_id}`,
        ipAddress: '127.0.0.1'
      });

    } else if (event === 'payment.failed') {
      db.prepare(`
        UPDATE workflow_payments 
        SET status = 'failed', gateway_response = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(JSON.stringify(paymentDetails), payment.id);

      sendNotification({
        db, io,
        type: 'payment_failed',
        title: 'Payment Failed',
        message: `Payment attempt of ₹${payment.amount} has failed. Please try again.`,
        bookingId: payment.booking_id,
        targetRole: 'user',
        targetId: payment.user_id,
        socketEvent: 'paymentUpdated',
        socketData: { status: 'failed' }
      });
    }

    res.json({ status: 'ok' });
  } catch (err) {
    res.status(500).json({ error: 'Webhook processing failed', details: err.message });
  }
});

// ==========================================
// 3. Coupons API
// ==========================================

// POST /api/payments/apply-coupon - Apply coupon code to see discounts
router.post('/payments/apply-coupon', verifyToken, (req, res) => {
  const { db } = req;
  const { bookingId, couponCode } = req.body;

  if (!bookingId || !couponCode) {
    return res.status(400).json({ success: false, message: 'bookingId and couponCode are required.' });
  }

  try {
    const pricing = calculatePricing(db, bookingId, couponCode);
    if (!pricing.appliedCoupon) {
      return res.status(400).json({ success: false, message: 'Coupon code is invalid, expired, or min purchase limit not met.' });
    }
    res.json({ success: true, pricing });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error applying coupon.', error: err.message });
  }
});

// POST /api/admin/coupons - Admin creates a new coupon
router.post('/admin/coupons', verifyAdmin, (req, res) => {
  const { db } = req;
  const { code, discountType, discountValue, minOrderValue = 0, usageLimit = 0, expiryDate = null } = req.body;

  if (!code || !discountType || !discountValue) {
    return res.status(400).json({ success: false, message: 'code, discountType and discountValue are required.' });
  }

  try {
    const id = uuidv4();
    db.prepare(`
      INSERT INTO coupons (id, code, discount_type, discount_value, min_order_value, usage_limit, expiry_date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, code.toUpperCase().trim(), discountType, discountValue, minOrderValue, usageLimit, expiryDate);

    res.status(201).json({ success: true, message: 'Coupon created successfully.', couponId: id });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create coupon.', error: err.message });
  }
});

// PUT /api/admin/coupons/:id - Admin updates a coupon
router.put('/admin/coupons/:id', verifyAdmin, (req, res) => {
  const { db } = req;
  const { discountValue, minOrderValue, usageLimit, expiryDate } = req.body;
  const couponId = req.params.id;

  try {
    const coupon = db.prepare('SELECT * FROM coupons WHERE id = ?').get(couponId);
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found.' });

    db.prepare(`
      UPDATE coupons 
      SET discount_value = ?, min_order_value = ?, usage_limit = ?, expiry_date = ?
      WHERE id = ?
    `).run(
      discountValue !== undefined ? discountValue : coupon.discount_value,
      minOrderValue !== undefined ? minOrderValue : coupon.min_order_value,
      usageLimit !== undefined ? usageLimit : coupon.usage_limit,
      expiryDate !== undefined ? expiryDate : coupon.expiry_date,
      couponId
    );

    res.json({ success: true, message: 'Coupon updated successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update coupon.', error: err.message });
  }
});

// DELETE /api/admin/coupons/:id - Admin deletes a coupon
router.delete('/admin/coupons/:id', verifyAdmin, (req, res) => {
  const { db } = req;
  const couponId = req.params.id;

  try {
    db.prepare('DELETE FROM coupons WHERE id = ?').run(couponId);
    res.json({ success: true, message: 'Coupon deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete coupon.', error: err.message });
  }
});

// ==========================================
// 4. Refund APIs
// ==========================================

// POST /api/payments/refund - Initiate a refund request
router.post('/payments/refund', verifyToken, async (req, res) => {
  const { db, io } = req;
  const { bookingId, refundAmount = null, reason = 'Customer requested refund.' } = req.body;
  const { id: userId, role } = req.user;

  try {
    // 1. Verify booking & captured payment
    const payment = db.prepare("SELECT * FROM workflow_payments WHERE booking_id = ? AND status = 'captured'").get(bookingId);
    if (!payment) {
      return res.status(400).json({ success: false, message: 'No captured payment found for this booking.' });
    }

    // Users can request refunds, but only admins can trigger direct payment refunds
    const requestedAmt = refundAmount ? parseFloat(refundAmount) : payment.amount;
    if (requestedAmt > payment.amount) {
      return res.status(400).json({ success: false, message: 'Refund amount cannot exceed payment amount.' });
    }

    const refundRecordId = `RF-${Date.now()}`;

    if (role === 'admin' || role === 'super_admin') {
      // 2. Perform payment gateway refund (Razorpay/Mock)
      const gatewayRefund = await paymentService.createRefund(payment.payment_id, requestedAmt);
      
      db.transaction(() => {
        // Record refund
        db.prepare(`
          INSERT INTO workflow_refunds (id, booking_id, payment_id, user_id, amount_requested, amount_refunded, status, reason, gateway_refund_id)
          VALUES (?, ?, ?, ?, ?, ?, 'completed', ?, ?)
        `).run(refundRecordId, bookingId, payment.id, payment.user_id, requestedAmt, requestedAmt, reason, gatewayRefund.refundId);

        // Update payment status
        const isPartial = requestedAmt < payment.amount;
        const newPaymentStatus = isPartial ? 'partial_refund' : 'refunded';
        
        db.prepare('UPDATE workflow_payments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
          .run(newPaymentStatus, payment.id);

        // Update booking status
        db.prepare("UPDATE bookings SET status = 'refunded', payment_status = 'Refunded', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(bookingId);

        db.prepare(`
          INSERT INTO booking_history (id, booking_id, old_status, new_status, updated_by, remarks)
          VALUES (?, ?, 'payment_completed', 'refunded', 'admin', ?)
        `).run(uuidv4(), bookingId, `Refunded ₹${requestedAmt}. Reason: ${reason}`);
      })();

      sendNotification({
        db, io,
        type: 'refund_completed',
        title: 'Refund Processed',
        message: `A refund of ₹${requestedAmt} has been credited back to your account.`,
        bookingId,
        targetRole: 'user',
        targetId: payment.user_id,
        socketEvent: 'paymentUpdated',
        socketData: { bookingId, refundAmount: requestedAmt, status: 'completed' }
      });

      return res.json({ success: true, message: 'Refund processed successfully.', refundId: refundRecordId });
    } else {
      // Users can only submit a request for review
      db.prepare(`
        INSERT INTO workflow_refunds (id, booking_id, payment_id, user_id, amount_requested, status, reason)
        VALUES (?, ?, ?, ?, ?, 'requested', ?)
      `).run(refundRecordId, bookingId, payment.id, userId, requestedAmt, reason);

      sendNotification({
        db, io,
        type: 'refund_requested',
        title: 'Refund Request Received',
        message: `Refund request submitted for booking ${bookingId}. Amount: ₹${requestedAmt}`,
        bookingId,
        targetRole: 'admin',
        socketEvent: 'paymentUpdated',
        socketData: { bookingId, status: 'requested' }
      });

      return res.json({ success: true, message: 'Refund request submitted to administrator.', refundId: refundRecordId });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to process refund.', error: err.message });
  }
});

// GET /api/payments/refunds - Get refund list (Protected)
router.get('/payments/refunds', verifyToken, (req, res) => {
  const { db } = req;
  const { id: userId, role } = req.user;

  try {
    let query = 'SELECT * FROM workflow_refunds';
    const params = [];

    if (role === 'user') {
      query += ' WHERE user_id = ?';
      params.push(userId);
    }
    query += ' ORDER BY created_at DESC';

    const refunds = db.prepare(query).all(...params);
    res.json({ success: true, refunds });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch refunds.', error: err.message });
  }
});

// PUT /api/admin/refunds/:id - Admin approves/rejects refund request
router.put('/admin/refunds/:id', verifyAdmin, async (req, res) => {
  const { db, io } = req;
  const refundId = req.params.id;
  const { status, remarks = '' } = req.body; // status: 'approved', 'rejected'

  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid refund status.' });
  }

  try {
    const refund = db.prepare('SELECT * FROM workflow_refunds WHERE id = ?').get(refundId);
    if (!refund) return res.status(404).json({ success: false, message: 'Refund request not found.' });

    const payment = db.prepare('SELECT * FROM workflow_payments WHERE id = ?').get(refund.payment_id);

    if (status === 'approved') {
      // Trigger gateway refund
      const gatewayRefund = await paymentService.createRefund(payment.payment_id, refund.amount_requested);
      
      db.transaction(() => {
        db.prepare(`
          UPDATE workflow_refunds 
          SET status = 'completed', amount_refunded = ?, gateway_refund_id = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(refund.amount_requested, gatewayRefund.refundId, refundId);

        const isPartial = refund.amount_requested < payment.amount;
        db.prepare('UPDATE workflow_payments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
          .run(isPartial ? 'partial_refund' : 'refunded', payment.id);

        db.prepare("UPDATE bookings SET status = 'refunded', payment_status = 'Refunded', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(refund.booking_id);

        db.prepare(`
          INSERT INTO booking_history (id, booking_id, old_status, new_status, updated_by, remarks)
          VALUES (?, ?, 'payment_completed', 'refunded', 'admin', ?)
        `).run(uuidv4(), refund.booking_id, `Refund approved. Remarks: ${remarks}`);
      })();

      sendNotification({
        db, io,
        type: 'refund_completed',
        title: 'Refund Approved',
        message: `Your refund of ₹${refund.amount_requested} has been completed.`,
        bookingId: refund.booking_id,
        targetRole: 'user',
        targetId: refund.user_id,
        socketEvent: 'paymentUpdated',
        socketData: { bookingId: refund.booking_id, status: 'completed' }
      });
    } else {
      db.prepare("UPDATE workflow_refunds SET status = 'rejected', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(refundId);
      
      sendNotification({
        db, io,
        type: 'refund_rejected',
        title: 'Refund Request Rejected',
        message: `Your refund request for booking ${refund.booking_id} was rejected. Remarks: ${remarks}`,
        bookingId: refund.booking_id,
        targetRole: 'user',
        targetId: refund.user_id,
        socketEvent: 'paymentUpdated',
        socketData: { bookingId: refund.booking_id, status: 'rejected' }
      });
    }

    res.json({ success: true, message: `Refund request updated to ${status}.` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update refund request.', error: err.message });
  }
});

// ==========================================
// 5. Invoicing & Download
// ==========================================

// GET /api/payments/invoice/:bookingId - Download generated tax invoice PDF
router.get('/payments/invoice/:bookingId', verifyToken, (req, res) => {
  const { db } = req;
  const bookingId = req.params.bookingId;
  const { id: userId, role } = req.user;

  try {
    const payment = db.prepare("SELECT * FROM workflow_payments WHERE booking_id = ? AND status = 'captured'").get(bookingId);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'No captured payment found for this booking.' });
    }

    // Auth validation
    if (role === 'user' && payment.user_id !== userId) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    if (!payment.invoice_path) {
      return res.status(404).json({ success: false, message: 'Invoice PDF has not been generated for this payment.' });
    }

    const absolutePath = join(process.cwd(), payment.invoice_path);
    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ success: false, message: 'Invoice PDF file not found on disk.' });
    }

    res.download(absolutePath, `Invoice-${bookingId}.pdf`);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to download invoice.', error: err.message });
  }
});

// ==========================================
// 6. Payment Histories (Filtering & Pagination)
// ==========================================

// GET /api/payments/history - User self payment history
router.get('/payments/history', verifyToken, (req, res) => {
  const { db } = req;
  const { id: userId } = req.user;
  const { limit = 10, offset = 0, status } = req.query;

  try {
    let query = 'SELECT * FROM workflow_payments WHERE user_id = ?';
    const params = [userId];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const history = db.prepare(query).all(...params);
    res.json({ success: true, history });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve payment history.', error: err.message });
  }
});

// GET /api/admin/payments - Admin view of all payments
router.get('/admin/payments', verifyAdmin, (req, res) => {
  const { db } = req;
  const { limit = 20, offset = 0, status, search, minAmount, maxAmount } = req.query;

  try {
    let query = 'SELECT p.*, u.name as customer_name FROM workflow_payments p LEFT JOIN users u ON p.user_id = u.id WHERE 1=1';
    const params = [];

    if (status) {
      query += ' AND p.status = ?';
      params.push(status);
    }
    if (minAmount) {
      query += ' AND p.amount >= ?';
      params.push(parseFloat(minAmount));
    }
    if (maxAmount) {
      query += ' AND p.amount <= ?';
      params.push(parseFloat(maxAmount));
    }
    if (search) {
      query += ' AND (p.booking_id LIKE ? OR p.order_id LIKE ? OR p.payment_id LIKE ? OR u.name LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const payments = db.prepare(query).all(...params);
    res.json({ success: true, payments });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve payments list.', error: err.message });
  }
});

// ==========================================
// 7. Advanced Payment Analytics Dashboard
// ==========================================

// GET /api/admin/payments/dashboard/statistics - Dashboard stats
router.get('/admin/payments/dashboard/statistics', verifyAdmin, (req, res) => {
  const { db } = req;

  try {
    // 1. Revenue totals (Today, Month, Year)
    const today = new Date().toISOString().slice(0, 10);
    const thisMonth = new Date().toISOString().slice(0, 7);
    const thisYear = new Date().toISOString().slice(0, 4);

    const todayRev = db.prepare(`SELECT COALESCE(SUM(amount), 0) as total FROM workflow_payments WHERE DATE(created_at) = ? AND status = 'captured'`).get(today).total;
    const monthRev = db.prepare(`SELECT COALESCE(SUM(amount), 0) as total FROM workflow_payments WHERE strftime('%Y-%m', created_at) = ? AND status = 'captured'`).get(thisMonth).total;
    const yearRev = db.prepare(`SELECT COALESCE(SUM(amount), 0) as total FROM workflow_payments WHERE strftime('%Y', created_at) = ? AND status = 'captured'`).get(thisYear).total;

    // 2. Pending and Failed counts
    const pendingCount = db.prepare(`SELECT COUNT(*) as count FROM workflow_payments WHERE status = 'created' OR status = 'pending'`).get().count;
    const failedCount = db.prepare(`SELECT COUNT(*) as count FROM workflow_payments WHERE status = 'failed'`).get().count;

    // 3. Refund Metrics
    const refundCount = db.prepare(`SELECT COUNT(*) as count FROM workflow_refunds WHERE status = 'completed'`).get().count;
    const refundAmount = db.prepare(`SELECT COALESCE(SUM(amount_refunded), 0) as total FROM workflow_refunds WHERE status = 'completed'`).get().total;

    // 4. Avg booking value
    const avgVal = db.prepare(`SELECT COALESCE(AVG(amount), 0) as avg FROM workflow_payments WHERE status = 'captured'`).get().avg;

    // 5. Most used payment method
    const methodStats = db.prepare(`
      SELECT method, COUNT(*) as count 
      FROM workflow_payments 
      WHERE status = 'captured'
      GROUP BY method 
      ORDER BY count DESC 
      LIMIT 1
    `).get();

    res.json({
      success: true,
      statistics: {
        revenueToday: todayRev,
        revenueThisMonth: monthRev,
        revenueThisYear: yearRev,
        pendingPaymentsCount: pendingCount,
        failedPaymentsCount: failedCount,
        completedRefundsCount: refundCount,
        totalRefundedAmount: refundAmount,
        averageBookingValue: parseFloat(avgVal.toFixed(2)),
        mostPopularPaymentMethod: methodStats ? methodStats.method : 'N/A'
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve analytics.', error: err.message });
  }
});

// ==========================================
// 8. CSV Reports Export
// ==========================================

// GET /api/admin/payments/reports/export - Export transactions report
router.get('/admin/payments/reports/export', verifyAdmin, (req, res) => {
  const { db } = req;
  const { startDate, endDate } = req.query;

  try {
    let query = `
      SELECT p.id, p.booking_id, p.user_id, p.amount, p.tax, p.discount, p.status, p.method, p.created_at 
      FROM workflow_payments p 
      WHERE 1=1
    `;
    const params = [];

    if (startDate) {
      query += ' AND DATE(p.created_at) >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND DATE(p.created_at) <= ?';
      params.push(endDate);
    }

    query += ' ORDER BY p.created_at DESC';
    const payments = db.prepare(query).all(...params);

    // Convert list to CSV string
    let csvContent = 'PaymentID,BookingID,UserID,FinalAmount,GSTPaid,DiscountGiven,Status,Method,CreatedAt\n';
    
    for (const p of payments) {
      csvContent += `${p.id},${p.booking_id},${p.user_id},${p.amount},${p.tax},${p.discount},${p.status},${p.method},${p.created_at}\n`;
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=payments-report-${Date.now()}.csv`);
    res.send(csvContent);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to export report.', error: err.message });
  }
});

export default router;
