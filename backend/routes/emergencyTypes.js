import { Router } from 'express';
import {
  getAllEmergencyTypes,
  getEmergencyTypeById,
  createEmergencyType,
  updateEmergencyType,
  deleteEmergencyType,
} from '../controllers/adminController.js';
import { validate, createEmergencyTypeValidator, updateEmergencyTypeValidator, idParamValidator } from '../authentication/validators.js';

const router = Router();

// Emergency Types CRUD
router.get('/', getAllEmergencyTypes);
router.get('/:id', idParamValidator, validate, getEmergencyTypeById);
router.post('/', createEmergencyTypeValidator, validate, createEmergencyType);
router.put('/:id', updateEmergencyTypeValidator, validate, updateEmergencyType);
router.delete('/:id', idParamValidator, validate, deleteEmergencyType);

export default router;
