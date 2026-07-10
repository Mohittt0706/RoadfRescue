import { Router } from 'express';
import { ZoneController } from '../controllers/zoneController.js';
import { verifyToken, verifyAdmin } from '../authentication/middleware.js';

const router = Router();

// List zones (public)
router.get('/', ZoneController.listZones);

// Find nearest zone (requires auth)
router.post('/nearest', verifyToken, ZoneController.findNearest);

// Get single zone (public)
router.get('/:id', ZoneController.getZone);

// Create zone (admin only)
router.post('/', verifyToken, verifyAdmin, ZoneController.createZone);

// Update zone (admin only)
router.put('/:id', verifyToken, verifyAdmin, ZoneController.updateZone);

// Delete/deactivate zone (admin only)
router.delete('/:id', verifyToken, verifyAdmin, ZoneController.deleteZone);

export default router;
