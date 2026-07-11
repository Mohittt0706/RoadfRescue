import { Router } from 'express';
import { ServiceController } from '../controllers/serviceController.js';
import { verifyToken, verifyAdmin } from '../authentication/middleware.js';

const router = Router();

// List and search services (public)
router.get('/', ServiceController.listServices);

// Get single service with pricing rules (public)
router.get('/:id', ServiceController.getService);

// Create service (admin only)
router.post('/', verifyToken, verifyAdmin, ServiceController.createService);

// Update service (admin only)
router.put('/:id', verifyToken, verifyAdmin, ServiceController.updateService);

// Delete/deactivate service (admin only)
router.delete('/:id', verifyToken, verifyAdmin, ServiceController.deleteService);

// Pricing rules management (admin only)
router.post('/:id/pricing-rules', verifyToken, verifyAdmin, ServiceController.addPricingRule);
router.delete('/:serviceId/pricing-rules/:ruleId', verifyToken, verifyAdmin, ServiceController.removePricingRule);

export default router;
