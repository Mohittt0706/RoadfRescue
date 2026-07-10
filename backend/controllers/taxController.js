/**
 * Tax Controller
 *
 * Manages tax configurations and tax calculations.
 * Services are accessed via req.services.tax.
 */
export class TaxController {

  /**
   * GET /api/taxes
   * List all active tax configurations.
   */
  static async listTaxes(req, res) {
    try {
      const taxes = req.services.tax.getAllTaxes();
      return res.status(200).json({ success: true, data: taxes });
    } catch (error) {
      console.error('List taxes error:', error);
      return res.status(500).json({ success: false, message: 'Failed to list taxes' });
    }
  }

  /**
   * GET /api/taxes/:id
   * Get a specific tax configuration.
   */
  static async getTax(req, res) {
    try {
      const { id } = req.params;
      const tax = req.services.tax.getTaxById(id);
      if (!tax) {
        return res.status(404).json({ success: false, message: 'Tax configuration not found' });
      }
      return res.status(200).json({ success: true, data: tax });
    } catch (error) {
      console.error('Get tax error:', error);
      return res.status(500).json({ success: false, message: 'Failed to get tax' });
    }
  }

  /**
   * POST /api/taxes
   * Create a new tax configuration.
   */
  static async createTax(req, res) {
    try {
      const { taxName, taxType, rate, isPercentage, appliesTo, state, description } = req.body;

      if (!taxName || rate === undefined) {
        return res.status(400).json({ success: false, message: 'Tax name and rate are required' });
      }

      const tax = req.services.tax.createTax({
        tax_name: taxName,
        tax_type: taxType || 'gst',
        rate: Number(rate),
        is_percentage: isPercentage !== false,
        applies_to: appliesTo || 'all',
        state: state || null,
        description: description || null,
      });

      return res.status(201).json({ success: true, data: tax });
    } catch (error) {
      console.error('Create tax error:', error);
      return res.status(500).json({ success: false, message: 'Failed to create tax' });
    }
  }

  /**
   * PUT /api/taxes/:id
   * Update a tax configuration.
   */
  static async updateTax(req, res) {
    try {
      const { id } = req.params;
      const existing = req.services.tax.getTaxById(id);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Tax configuration not found' });
      }

      const { taxName, taxType, rate, isPercentage, appliesTo, state, description, isActive } = req.body;

      const updated = req.services.tax.updateTax(id, {
        tax_name: taxName,
        tax_type: taxType,
        rate: rate !== undefined ? Number(rate) : undefined,
        is_percentage: isPercentage,
        applies_to: appliesTo,
        state,
        description,
        is_active: isActive,
      });

      return res.status(200).json({ success: true, data: updated });
    } catch (error) {
      console.error('Update tax error:', error);
      return res.status(500).json({ success: false, message: 'Failed to update tax' });
    }
  }

  /**
   * DELETE /api/taxes/:id
   * Delete a tax configuration.
   */
  static async deleteTax(req, res) {
    try {
      const { id } = req.params;
      const existing = req.services.tax.getTaxById(id);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Tax configuration not found' });
      }

      req.services.tax.deleteTax(id);
      return res.status(200).json({ success: true, message: 'Tax configuration deleted' });
    } catch (error) {
      console.error('Delete tax error:', error);
      return res.status(500).json({ success: false, message: 'Failed to delete tax' });
    }
  }

  /**
   * POST /api/taxes/calculate
   * Calculate tax for a given amount and category.
   */
  static async calculateTax(req, res) {
    try {
      const { amount, category } = req.body;

      if (amount === undefined || amount < 0) {
        return res.status(400).json({ success: false, message: 'Valid amount is required' });
      }

      const result = req.services.tax.getTaxSummary(Number(amount), category || 'all');
      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      console.error('Calculate tax error:', error);
      return res.status(500).json({ success: false, message: 'Failed to calculate tax' });
    }
  }
}
