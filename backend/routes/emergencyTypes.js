import { Router } from 'express';
import {
  getAllEmergencyTypes,
  getEmergencyTypeById,
  createEmergencyType,
  updateEmergencyType,
  deleteEmergencyType,
} from '../controllers/adminController.js';

const router = Router();

// Emergency Types CRUD
router.get('/', getAllEmergencyTypes);
router.get('/:id', getEmergencyTypeById);
router.post('/', createEmergencyType);
router.put('/:id', updateEmergencyType);
router.delete('/:id', deleteEmergencyType);

export default router;
