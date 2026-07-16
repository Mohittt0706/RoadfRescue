import { Router } from 'express';
import {
  getServiceAnalytics,
  getMechanicAnalytics,
  getRevenueAnalytics,
  getEmergencyAnalytics,
} from '../controllers/analyticsController.js';

const router = Router();

// Root analytics endpoint - returns overview
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Analytics API',
    endpoints: {
      services: '/api/admin/analytics/services',
      mechanics: '/api/admin/analytics/mechanics',
      revenue: '/api/admin/analytics/revenue',
      emergency: '/api/admin/analytics/emergency-response',
    },
  });
});

// Analytics endpoints
router.get('/services', getServiceAnalytics);
router.get('/mechanics', getMechanicAnalytics);
router.get('/revenue', getRevenueAnalytics);
router.get('/emergency-response', getEmergencyAnalytics);

export default router;
