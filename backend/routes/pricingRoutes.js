import { Router } from 'express';
import { PricingController } from '../controllers/pricingController.js';
import { verifyToken } from '../authentication/middleware.js';

const router = Router();

// Price calculation (requires auth)
router.post('/calculate', verifyToken, PricingController.calculatePrice);

// Quick estimate (requires auth)
router.get('/estimate/:serviceId', verifyToken, PricingController.getEstimate);

// Pricing history (requires auth)
router.get('/history', verifyToken, PricingController.getHistory);
router.get('/history/booking/:bookingId', verifyToken, PricingController.getHistoryByBooking);
router.get('/history/emergency/:emergencyId', verifyToken, PricingController.getHistoryByEmergency);

// Pricing analytics (admin only - use verifyAdmin for real admin-only access)
router.get('/analytics', verifyToken, PricingController.getAnalytics);

export default router;
