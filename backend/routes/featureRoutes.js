import { Router } from 'express';
import { FeatureController } from '../controllers/featureController.js';
import { verifyToken, verifyAdmin } from '../authentication/middleware.js';

const router = Router();

// Get all feature flags (public read-only)
router.get('/', FeatureController.getAllFlags);

// Check a specific flag (public read-only)
router.get('/check/:flagName', FeatureController.checkFlag);

// Get a specific flag details (public read-only)
router.get('/:flagName', FeatureController.getFlag);

// Update feature flags (admin only)
router.put('/', verifyToken, verifyAdmin, FeatureController.updateFlags);

// Update a single flag (admin only)
router.put('/:flagName', verifyToken, verifyAdmin, FeatureController.updateFlag);

export default router;
