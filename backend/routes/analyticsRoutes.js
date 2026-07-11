import { Router } from 'express';
import {
  getServiceAnalytics,
  getMechanicAnalytics,
  getRevenueAnalytics,
  getEmergencyAnalytics,
} from '../controllers/analyticsController.js';

const router = Router();

// Analytics endpoints
router.get('/services', getServiceAnalytics);
router.get('/mechanics', getMechanicAnalytics);
router.get('/revenue', getRevenueAnalytics);
router.get('/emergency-response', getEmergencyAnalytics);

export default router;
