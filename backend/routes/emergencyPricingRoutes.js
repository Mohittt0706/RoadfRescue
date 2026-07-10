import { Router } from 'express';
import { EmergencyPricingController } from '../controllers/emergencyPricingController.js';
import { verifyToken, verifyAdmin } from '../authentication/middleware.js';

const router = Router();

// List all emergency pricing levels (admin only)
router.get('/', verifyToken, verifyAdmin, EmergencyPricingController.listLevels);

// Get pricing for a specific level (admin only)
router.get('/:level', verifyToken, verifyAdmin, EmergencyPricingController.getLevel);

// Create or update pricing for a level (admin only)
router.post('/', verifyToken, verifyAdmin, EmergencyPricingController.upsertLevel);

export default router;
