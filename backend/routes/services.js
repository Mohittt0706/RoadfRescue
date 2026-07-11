import { Router } from 'express';
import {
  getAllServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
} from '../controllers/adminController.js';
import { validate, createServiceValidator, updateServiceValidator, idParamValidator } from '../authentication/validators.js';

const router = Router();

// Services CRUD
router.get('/', getAllServices);
router.get('/:id', idParamValidator, validate, getServiceById);
router.post('/', createServiceValidator, validate, createService);
router.put('/:id', updateServiceValidator, validate, updateService);
router.delete('/:id', idParamValidator, validate, deleteService);

export default router;
