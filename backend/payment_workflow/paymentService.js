import Razorpay from 'razorpay';
import crypto from 'crypto';

class RazorpayProvider {
  constructor(keyId, keySecret) {
    this.razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret
    });
  }

  async createOrder(amount, currency = 'INR', receipt = '') {
    // Razorpay expects amount in paise (1 INR = 100 paise)
    const options = {
      amount: Math.round(amount * 100),
      currency,
      receipt
    };
    const order = await this.razorpay.orders.create(options);
    return {
      orderId: order.id,
      amount: order.amount / 100,
      currency: order.currency,
      status: order.status
    };
  }

  verifyWebhookSignature(body, signature, webhookSecret) {
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');
    return expectedSignature === signature;
  }

  async createRefund(paymentId, amount = null) {
    const options = {};
    if (amount) {
      options.amount = Math.round(amount * 100);
    }
    const refund = await this.razorpay.payments.refund(paymentId, options);
    return {
      refundId: refund.id,
      paymentId: refund.payment_id,
      amount: refund.amount / 100,
      status: refund.status
    };
  }
}

class MockPaymentProvider {
  async createOrder(amount, currency = 'INR', receipt = '') {
    const mockOrderId = `order_mock_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    console.log(`[MOCK GATEWAY] Order created: ${mockOrderId} for amount ${amount} ${currency}`);
    return {
      orderId: mockOrderId,
      amount,
      currency,
      status: 'created'
    };
  }

  verifyWebhookSignature(body, signature, webhookSecret) {
    // If webhook secret is 'mock_secret', accept any signature for testing
    // Or check if signature is 'mock_signature'
    console.log('[MOCK GATEWAY] Verifying webhook signature:', signature);
    return signature === 'mock_signature' || webhookSecret === 'mock_secret' || signature === 'valid_mock_sig';
  }

  async createRefund(paymentId, amount = null) {
    const mockRefundId = `rf_mock_${Date.now()}`;
    console.log(`[MOCK GATEWAY] Refund created: ${mockRefundId} for payment ${paymentId}`);
    return {
      refundId: mockRefundId,
      paymentId,
      amount: amount || 0,
      status: 'processed'
    };
  }
}

// Payment Service Factory
class PaymentService {
  constructor() {
    this.keyId = process.env.RAZORPAY_KEY_ID;
    this.keySecret = process.env.RAZORPAY_KEY_SECRET;
    this.webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'mock_secret';

    if (this.keyId && this.keySecret) {
      console.log('Payment Gateway: Razorpay Initialized.');
      this.provider = new RazorpayProvider(this.keyId, this.keySecret);
      this.isMock = false;
    } else {
      console.warn('⚠️ Razorpay credentials missing in .env. Initializing Mock Payment Provider for development.');
      this.provider = new MockPaymentProvider();
      this.isMock = true;
    }
  }

  async createOrder(amount, receipt = '') {
    return await this.provider.createOrder(amount, 'INR', receipt);
  }

  verifyWebhookSignature(body, signature) {
    // Allow fallback webhook verification
    return this.provider.verifyWebhookSignature(body, signature, this.webhookSecret);
  }

  async createRefund(paymentId, amount = null) {
    return await this.provider.createRefund(paymentId, amount);
  }
}

export const paymentService = new PaymentService();
export { MockPaymentProvider, RazorpayProvider };
