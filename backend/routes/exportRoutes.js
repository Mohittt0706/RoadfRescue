import { Router } from 'express';
import {
  exportBookings,
  exportPayments,
  exportEmergencies,
} from '../controllers/exportController.js';

const router = Router();

// CSV Export endpoints
router.get('/bookings', exportBookings);
router.get('/payments', exportPayments);
router.get('/emergencies', exportEmergencies);

export default router;
