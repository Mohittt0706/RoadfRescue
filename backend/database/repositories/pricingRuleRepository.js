import { BaseRepository } from './baseRepository.js';

/**
 * PricingRule Repository - Data access for pricing_rules table.
 * Stores configurable multipliers, charges, and pricing rules per service.
 */
export class PricingRuleRepository extends BaseRepository {
  constructor(db) {
    super(db, 'pricing_rules');
  }

  /** Find all active rules for a service */
  findByServiceId(serviceId) {
    return this.findAll({ service_id: serviceId, is_active: 1 }, { orderBy: 'priority ASC' });
  }

  /** Find rules by type (surcharge, discount, multiplier, fixed) */
  findByType(ruleType) {
    return this.findAll({ rule_type: ruleType, is_active: 1 });
  }

  /** Find all active rules */
  findActive() {
    return this.findAll({ is_active: 1 }, { orderBy: 'priority ASC' });
  }

  /** Get rule with service details */
  findByIdWithService(id) {
    return this.rawOne(`
      SELECT pr.*, s.name as service_name, s.category as service_category
      FROM pricing_rules pr
      LEFT JOIN services s ON pr.service_id = s.id
      WHERE pr.id = ?
    `, [id]);
  }

  /** Get all rules with service details */
  findAllWithService() {
    return this.raw(`
      SELECT pr.*, s.name as service_name, s.category as service_category
      FROM pricing_rules pr
      LEFT JOIN services s ON pr.service_id = s.id
      ORDER BY pr.priority ASC
    `);
  }

  /** Calculate total applicable charges for a service */
  calculateServiceCharges(serviceId) {
    const rules = this.findByServiceId(serviceId);
    let totalFixed = 0;
    let totalMultiplier = 1;

    for (const rule of rules) {
      if (rule.unit === 'fixed') {
        totalFixed += rule.value;
      } else if (rule.unit === 'multiplier') {
        totalMultiplier *= rule.value;
      } else if (rule.unit === 'percentage') {
        totalMultiplier *= (1 + rule.value / 100);
      }
    }

    return { rules, totalFixed, totalMultiplier };
  }
}
