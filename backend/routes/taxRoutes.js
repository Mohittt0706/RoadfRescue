import { Router } from 'express';
import { TaxController } from '../controllers/taxController.js';
import { verifyToken, verifyAdmin } from '../authentication/middleware.js';

const router = Router();

// List all taxes (admin only)
router.get('/', verifyToken, verifyAdmin, TaxController.listTaxes);

// Get single tax (admin only)
router.get('/:id', verifyToken, verifyAdmin, TaxController.getTax);

// Create tax (admin only)
router.post('/', verifyToken, verifyAdmin, TaxController.createTax);

// Update tax (admin only)
router.put('/:id', verifyToken, verifyAdmin, TaxController.updateTax);

// Delete tax (admin only)
router.delete('/:id', verifyToken, verifyAdmin, TaxController.deleteTax);

// Calculate tax for amount (requires auth)
router.post('/calculate', verifyToken, TaxController.calculateTax);

export default router;
