import { Router } from 'express';
import { ConfigController } from '../controllers/configController.js';
import { verifyToken, verifyAdmin } from '../authentication/middleware.js';

const router = Router();

// View configuration (admin only)
router.get('/', verifyToken, verifyAdmin, ConfigController.getConfig);

// Update configuration (admin only)
router.put('/', verifyToken, verifyAdmin, ConfigController.updateConfig);

// Notification logs (admin only)
router.get('/notifications', verifyToken, verifyAdmin, ConfigController.getNotificationLogs);

// Socket failure logs (admin only)
router.get('/socket-failures', verifyToken, verifyAdmin, ConfigController.getSocketFailures);

export default router;
