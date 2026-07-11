import { Router } from 'express';
import { getAuditLogs } from '../controllers/auditController.js';

const router = Router();

// Audit Logs
router.get('/', getAuditLogs);

export default router;
