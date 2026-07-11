import { BaseRepository } from './baseRepository.js';

/**
 * TaxConfiguration Repository - Data access for tax_configuration table.
 * Stores GST, state tax, and other tax configurations.
 */
export class TaxConfigurationRepository extends BaseRepository {
  constructor(db) {
    super(db, 'tax_configuration');
  }

  /** Find all active taxes */
  findActive() {
    return this.findAll({ is_active: 1 }, { orderBy: 'rate DESC' });
  }

  /** Find taxes by type (gst, cess, state, other) */
  findByType(taxType) {
    return this.findAll({ tax_type: taxType, is_active: 1 });
  }

  /** Find taxes that apply to a specific service category */
  findByAppliesTo(appliesTo) {
    return this.raw(`
      SELECT * FROM tax_configuration
      WHERE is_active = 1
      AND (applies_to = 'all' OR applies_to = ?)
      ORDER BY rate DESC
    `, [appliesTo]);
  }

  /** Calculate total tax for an amount */
  calculateTax(amount, appliesTo = 'all') {
    const taxes = this.findByAppliesTo(appliesTo);
    let totalTaxAmount = 0;
    const taxBreakdown = [];

    for (const tax of taxes) {
      const taxAmount = tax.is_percentage
        ? Math.round((amount * tax.rate) / 100 * 100) / 100
        : tax.rate;
      totalTaxAmount += taxAmount;
      taxBreakdown.push({
        id: tax.id,
        name: tax.tax_name,
        type: tax.tax_type,
        rate: tax.rate,
        is_percentage: tax.is_percentage,
        amount: taxAmount,
      });
    }

    return {
      totalTaxAmount: Math.round(totalTaxAmount * 100) / 100,
      breakdown: taxBreakdown,
    };
  }
}
