/**
 * Service Controller
 *
 * Enhanced service management with pricing integration.
 * Handles CRUD for services, pricing rules, and zone-based pricing.
 */
export class ServiceController {

  /**
   * GET /api/services
   * List all services with optional filters.
   */
  static async listServices(req, res) {
    try {
      let page = 1, limit = 20;
      try { page = parseInt(req.query.page) || 1; limit = parseInt(req.query.limit) || 20; } catch (e) {}

      const { category, isActive, search } = req.query;
      const filters = {};
      if (category) filters.category = category;
      if (isActive !== undefined) filters.is_active = isActive === 'true' ? 1 : 0;
      if (search) filters.name = search;

      const services = req.repos.services.findAll(filters, {
        page, limit,
        orderBy: 'category ASC, name ASC',
      });

      return res.status(200).json({ success: true, data: services });
    } catch (error) {
      console.error('List services error:', error);
      return res.status(500).json({ success: false, message: 'Failed to list services' });
    }
  }

  /**
   * GET /api/services/:id
   * Get a single service with its pricing rules.
   */
  static async getService(req, res) {
    try {
      const { id } = req.params;
      const service = req.repos.services.findById(id);
      if (!service) {
        return res.status(404).json({ success: false, message: 'Service not found' });
      }

      const pricingRules = req.repos.pricingRules.findByServiceId(id);

      return res.status(200).json({
        success: true,
        data: { ...service, pricingRules },
      });
    } catch (error) {
      console.error('Get service error:', error);
      return res.status(500).json({ success: false, message: 'Failed to get service' });
    }
  }

  /**
   * POST /api/services
   * Create a new service.
   */
  static async createService(req, res) {
    try {
      const { name, description, price, durationEstimate, category, isEmergencySupported, pricingModel } = req.body;

      if (!name || price === undefined) {
        return res.status(400).json({ success: false, message: 'Name and price are required' });
      }

      const id = `svc-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      const service = req.repos.services.create({
        id,
        name,
        description: description || null,
        price: Number(price),
        duration_estimate: durationEstimate || null,
        category: category || 'General',
        is_emergency_supported: isEmergencySupported ? 1 : 0,
        pricing_model: pricingModel || 'fixed',
        is_active: 1,
      });

      return res.status(201).json({ success: true, data: service });
    } catch (error) {
      console.error('Create service error:', error);
      return res.status(500).json({ success: false, message: 'Failed to create service' });
    }
  }

  /**
   * PUT /api/services/:id
   * Update a service.
   */
  static async updateService(req, res) {
    try {
      const { id } = req.params;
      const existing = req.repos.services.findById(id);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Service not found' });
      }

      const { name, description, price, durationEstimate, category, isEmergencySupported, pricingModel, isActive } = req.body;

      const updates = {};
      if (name !== undefined) updates.name = name;
      if (description !== undefined) updates.description = description;
      if (price !== undefined) updates.price = Number(price);
      if (durationEstimate !== undefined) updates.duration_estimate = durationEstimate;
      if (category !== undefined) updates.category = category;
      if (isEmergencySupported !== undefined) updates.is_emergency_supported = isEmergencySupported ? 1 : 0;
      if (pricingModel !== undefined) updates.pricing_model = pricingModel;
      if (isActive !== undefined) updates.is_active = isActive ? 1 : 0;
      updates.updated_at = new Date().toISOString();

      const updated = req.repos.services.update(id, updates);
      return res.status(200).json({ success: true, data: updated });
    } catch (error) {
      console.error('Update service error:', error);
      return res.status(500).json({ success: false, message: 'Failed to update service' });
    }
  }

  /**
   * DELETE /api/services/:id
   * Soft-delete a service (set is_active = 0).
   */
  static async deleteService(req, res) {
    try {
      const { id } = req.params;
      const existing = req.repos.services.findById(id);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Service not found' });
      }

      req.repos.services.update(id, { is_active: 0, updated_at: new Date().toISOString() });
      return res.status(200).json({ success: true, message: 'Service deactivated' });
    } catch (error) {
      console.error('Delete service error:', error);
      return res.status(500).json({ success: false, message: 'Failed to delete service' });
    }
  }

  /**
   * POST /api/services/:id/pricing-rules
   * Add a pricing rule to a service.
   */
  static async addPricingRule(req, res) {
    try {
      const { id } = req.params;
      const service = req.repos.services.findById(id);
      if (!service) {
        return res.status(404).json({ success: false, message: 'Service not found' });
      }

      const { ruleType, value, unit, description, priority } = req.body;
      if (!ruleType || value === undefined || !unit) {
        return res.status(400).json({ success: false, message: 'ruleType, value, and unit are required' });
      }

      const ruleId = `rule-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      const rule = req.repos.pricingRules.create({
        id: ruleId,
        service_id: id,
        rule_type: ruleType,
        value: Number(value),
        unit,
        description: description || null,
        priority: priority || 0,
        is_active: 1,
      });

      return res.status(201).json({ success: true, data: rule });
    } catch (error) {
      console.error('Add pricing rule error:', error);
      return res.status(500).json({ success: false, message: 'Failed to add pricing rule' });
    }
  }

  /**
   * DELETE /api/services/:serviceId/pricing-rules/:ruleId
   * Remove a pricing rule.
   */
  static async removePricingRule(req, res) {
    try {
      const { serviceId, ruleId } = req.params;
      const rule = req.repos.pricingRules.findById(ruleId);
      if (!rule || rule.service_id !== serviceId) {
        return res.status(404).json({ success: false, message: 'Pricing rule not found' });
      }

      req.repos.pricingRules.update(ruleId, { is_active: 0 });
      return res.status(200).json({ success: true, message: 'Pricing rule removed' });
    } catch (error) {
      console.error('Remove pricing rule error:', error);
      return res.status(500).json({ success: false, message: 'Failed to remove pricing rule' });
    }
  }
}
