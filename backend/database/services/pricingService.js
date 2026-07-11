/**
 * Pricing Service
 *
 * Core pricing engine that calculates final prices dynamically.
 * Formula: Final Price = Base Price + Emergency Charge + Zone Charge + Priority Charge + GST - Discount
 *
 * Uses repositories for all data access. No hardcoded prices.
 */
export class PricingService {
  constructor(db, repositories) {
    this.db = db;
    this.repos = repositories;
  }

  /**
   * Calculate the final price for a service booking.
   *
   * @param {object} params - Calculation parameters
   * @param {string} params.serviceId - Service ID
   * @param {string} [params.zoneId] - Zone ID for location-based pricing
   * @param {string} [params.priority='low'] - Emergency priority level
   * @param {number} [params.discount=0] - Discount amount (flat or percentage)
   * @param {string} [params.discountType='flat'] - 'flat' or 'percentage'
   * @param {string} [params.bookingId] - Associated booking ID
   * @param {string} [params.emergencyId] - Associated emergency ID
   * @param {string} [params.calculatedBy] - Who triggered the calculation
   * @returns {object} Detailed price breakdown
   */
  async calculatePrice(params) {
    const {
      serviceId,
      zoneId = null,
      priority = 'low',
      discount = 0,
      discountType = 'flat',
      bookingId = null,
      emergencyId = null,
      calculatedBy = null,
    } = params;

    // 1. Get service base price
    const service = this.repos.services.findById(serviceId);
    if (!service) {
      throw new Error('Service not found');
    }
    const basePrice = service.price || 0;

    // 2. Get zone charge
    let zoneCharge = 0;
    let zone = null;
    if (zoneId) {
      zone = this.repos.zones.findById(zoneId);
      if (zone && zone.is_active) {
        zoneCharge = zone.extra_charge || 0;
      }
    }

    // 3. Get emergency/priority pricing
    let emergencyCharge = 0;
    let priorityCharge = 0;
    let emergencyMultiplier = 1;
    let emergencyPricing = null;
    if (priority && priority !== 'low') {
      emergencyPricing = this.repos.emergencyPricing.findByPriorityLevel(priority);
      if (emergencyPricing && emergencyPricing.is_active) {
        emergencyMultiplier = emergencyPricing.multiplier || 1;
        emergencyCharge = emergencyPricing.fixed_charge || 0;
        priorityCharge = emergencyPricing.priority_charge || 0;
      }
    }

    // 4. Get applicable pricing rules for the service
    const { totalFixed: rulesFixed, totalMultiplier: rulesMultiplier } =
      this.repos.pricingRules.calculateServiceCharges(serviceId);

    // 5. Calculate subtotal before tax
    // Apply rules multiplier first, then emergency multiplier
    const subtotalBeforeCharges = basePrice * rulesMultiplier * emergencyMultiplier;
    const chargesTotal = rulesFixed + zoneCharge + emergencyCharge + priorityCharge;
    let subtotal = subtotalBeforeCharges + chargesTotal;

    // 6. Apply discount
    let discountAmount = 0;
    if (discount > 0) {
      if (discountType === 'percentage') {
        discountAmount = Math.round((subtotal * discount / 100) * 100) / 100;
      } else {
        discountAmount = Math.min(discount, subtotal); // Can't discount more than subtotal
      }
    }
    subtotal = Math.max(0, subtotal - discountAmount);

    // 7. Calculate tax
    const taxCategory = service.category || 'General';
    const { totalTaxAmount, breakdown: taxBreakdown } =
      this.repos.taxConfig.calculateTax(subtotal, taxCategory);

    // 8. Calculate grand total
    const grandTotal = Math.round((subtotal + totalTaxAmount) * 100) / 100;

    const result = {
      service: {
        id: service.id,
        name: service.name,
        category: service.category,
        basePrice,
      },
      zone: zone ? {
        id: zone.id,
        name: zone.zone_name,
        city: zone.city,
        charge: zoneCharge,
      } : null,
      emergency: emergencyPricing ? {
        level: emergencyPricing.priority_level,
        displayName: emergencyPricing.display_name,
        multiplier: emergencyMultiplier,
        fixedCharge: emergencyCharge,
        priorityCharge,
        estimatedResponseTime: emergencyPricing.estimated_response_time,
      } : null,
      pricing: {
        basePrice,
        rulesApplied: rulesFixed > 0 || rulesMultiplier !== 1 ? { fixed: rulesFixed, multiplier: rulesMultiplier } : null,
        zoneCharge,
        emergencyCharge,
        priorityCharge,
        subtotalBeforeDiscount: subtotal + discountAmount,
        discountAmount,
        discountType: discount > 0 ? discountType : null,
        subtotalAfterDiscount: subtotal,
        tax: {
          total: totalTaxAmount,
          breakdown: taxBreakdown,
        },
        grandTotal,
      },
      calculationDetails: {
        formula: 'Base × RulesMultiplier × EmergencyMultiplier + Charges - Discount + Tax',
        serviceId,
        zoneId,
        priority,
        timestamp: new Date().toISOString(),
      },
    };

    // 9. Record pricing history
    const historyId = `ph-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    this.repos.pricingHistory.create({
      id: historyId,
      booking_id: bookingId,
      emergency_id: emergencyId,
      service_id: serviceId,
      zone_id: zoneId,
      base_price: basePrice,
      zone_charge: zoneCharge,
      emergency_charge: emergencyCharge,
      priority_charge: priorityCharge,
      discount: discountAmount,
      tax_amount: totalTaxAmount,
      total_price: grandTotal,
      calculation_details: JSON.stringify(result.calculationDetails),
      calculated_by: calculatedBy,
    });

    return result;
  }

  /**
   * Quick price estimate (lightweight - no history recording).
   */
  async getEstimate(serviceId, zoneId = null, priority = 'low', discount = 0, discountType = 'flat') {
    const service = this.repos.services.findById(serviceId);
    if (!service) throw new Error('Service not found');

    const basePrice = service.price || 0;
    let zoneCharge = 0;
    if (zoneId) {
      const zone = this.repos.zones.findById(zoneId);
      if (zone && zone.is_active) zoneCharge = zone.extra_charge || 0;
    }

    let emergencyCharge = 0, priorityCharge = 0, emergencyMultiplier = 1;
    if (priority && priority !== 'low') {
      const ep = this.repos.emergencyPricing.findByPriorityLevel(priority);
      if (ep && ep.is_active) {
        emergencyMultiplier = ep.multiplier || 1;
        emergencyCharge = ep.fixed_charge || 0;
        priorityCharge = ep.priority_charge || 0;
      }
    }

    const { totalFixed: rulesFixed, totalMultiplier: rulesMultiplier } =
      this.repos.pricingRules.calculateServiceCharges(serviceId);

    let subtotal = (basePrice * rulesMultiplier * emergencyMultiplier) + rulesFixed + zoneCharge + emergencyCharge + priorityCharge;

    let discountAmount = 0;
    if (discount > 0) {
      discountAmount = discountType === 'percentage'
        ? Math.round((subtotal * discount / 100) * 100) / 100
        : Math.min(discount, subtotal);
    }
    subtotal = Math.max(0, subtotal - discountAmount);

    const { totalTaxAmount, breakdown: taxBreakdown } =
      this.repos.taxConfig.calculateTax(subtotal, service.category || 'General');
    const grandTotal = Math.round((subtotal + totalTaxAmount) * 100) / 100;

    return {
      basePrice,
      zoneCharge,
      emergencyCharge,
      priorityCharge,
      discountAmount,
      tax: { total: totalTaxAmount, breakdown: taxBreakdown },
      grandTotal,
    };
  }
}
