/**
 * Tax Service
 *
 * Centralized tax calculation and management.
 * Supports GST, state tax, cess, and custom taxes.
 * Returns structured breakdowns with proper rounding.
 */
export class TaxService {
  constructor(db, repositories) {
    this.db = db;
    this.repos = repositories;
  }

  /**
   * Calculate tax for a given amount and category.
   * @param {number} amount - The amount to calculate tax on
   * @param {string} [category='all'] - Service category for tax applicability
   * @returns {object} Tax breakdown with total and details
   */
  calculateTax(amount, category = 'all') {
    return this.repos.taxConfig.calculateTax(amount, category);
  }

  /**
   * Get all active tax configurations.
   */
  getAllTaxes() {
    return this.repos.taxConfig.findActive();
  }

  /**
   * Get tax configuration by ID.
   */
  getTaxById(id) {
    return this.repos.taxConfig.findById(id);
  }

  /**
   * Create a new tax configuration.
   */
  createTax(data) {
    const id = data.id || `tax-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    return this.repos.taxConfig.create({
      id,
      tax_name: data.tax_name,
      tax_type: data.tax_type,
      rate: data.rate || 0,
      is_percentage: data.is_percentage !== undefined ? (data.is_percentage ? 1 : 0) : 1,
      applies_to: data.applies_to || 'all',
      state: data.state || null,
      description: data.description || null,
      is_active: data.is_active !== undefined ? (data.is_active ? 1 : 0) : 1,
    });
  }

  /**
   * Update a tax configuration.
   */
  updateTax(id, data) {
    const updates = {};
    if (data.tax_name !== undefined) updates.tax_name = data.tax_name;
    if (data.tax_type !== undefined) updates.tax_type = data.tax_type;
    if (data.rate !== undefined) updates.rate = data.rate;
    if (data.is_percentage !== undefined) updates.is_percentage = data.is_percentage ? 1 : 0;
    if (data.applies_to !== undefined) updates.applies_to = data.applies_to;
    if (data.state !== undefined) updates.state = data.state;
    if (data.description !== undefined) updates.description = data.description;
    if (data.is_active !== undefined) updates.is_active = data.is_active ? 1 : 0;
    updates.updated_at = new Date().toISOString();

    return this.repos.taxConfig.update(id, updates);
  }

  /**
   * Delete a tax configuration.
   */
  deleteTax(id) {
    return this.repos.taxConfig.delete(id);
  }

  /**
   * Get tax summary for a given amount (used in receipts/invoices).
   */
  getTaxSummary(amount, category = 'all') {
    const { totalTaxAmount, breakdown } = this.calculateTax(amount, category);
    return {
      subtotal: amount,
      taxDetails: breakdown,
      totalTax: totalTaxAmount,
      totalWithTax: Math.round((amount + totalTaxAmount) * 100) / 100,
    };
  }
}
