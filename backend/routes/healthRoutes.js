import { Router } from 'express';
import { HealthController } from '../controllers/healthController.js';

const router = Router();

// Health check endpoints (no auth required - used by load balancers)
router.get('/health', HealthController.getHealth);
router.get('/ready', HealthController.getReadiness);

export default router;
