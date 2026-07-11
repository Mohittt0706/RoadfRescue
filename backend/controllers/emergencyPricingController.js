/**
 * Emergency Pricing Controller
 *
 * Manages emergency priority level pricing configurations.
 */
export class EmergencyPricingController {

  /**
   * GET /api/emergency-pricing
   * List all emergency pricing levels with stats.
   */
  static async listLevels(req, res) {
    try {
      const levels = req.repos.emergencyPricing.findAllWithStats();
      return res.status(200).json({ success: true, data: levels });
    } catch (error) {
      console.error('List emergency pricing error:', error);
      return res.status(500).json({ success: false, message: 'Failed to list emergency pricing' });
    }
  }

  /**
   * GET /api/emergency-pricing/:level
   * Get pricing for a specific priority level.
   */
  static async getLevel(req, res) {
    try {
      const { level } = req.params;
      const pricing = req.repos.emergencyPricing.getPricingForLevel(level);
      if (!pricing) {
        return res.status(404).json({ success: false, message: 'Priority level not found' });
      }
      return res.status(200).json({ success: true, data: pricing });
    } catch (error) {
      console.error('Get emergency pricing error:', error);
      return res.status(500).json({ success: false, message: 'Failed to get emergency pricing' });
    }
  }

  /**
   * POST /api/emergency-pricing
   * Create or update emergency pricing for a priority level.
   */
  static async upsertLevel(req, res) {
    try {
      const { priorityLevel, multiplier, fixedCharge, priorityCharge, estimatedResponseTime, displayName, description, isActive } = req.body;

      if (!priorityLevel) {
        return res.status(400).json({ success: false, message: 'Priority level is required' });
      }

      const existing = req.repos.emergencyPricing.findByPriorityLevel(priorityLevel);

      if (existing) {
        const updates = {};
        if (multiplier !== undefined) updates.multiplier = Number(multiplier);
        if (fixedCharge !== undefined) updates.fixed_charge = Number(fixedCharge);
        if (priorityCharge !== undefined) updates.priority_charge = Number(priorityCharge);
        if (estimatedResponseTime !== undefined) updates.estimated_response_time = estimatedResponseTime;
        if (displayName !== undefined) updates.display_name = displayName;
        if (description !== undefined) updates.description = description;
        if (isActive !== undefined) updates.is_active = isActive ? 1 : 0;
        updates.updated_at = new Date().toISOString();

        const updated = req.repos.emergencyPricing.update(existing.id, updates);
        return res.status(200).json({ success: true, data: updated });
      } else {
        const id = `ep-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
        const created = req.repos.emergencyPricing.create({
          id,
          priority_level: priorityLevel.toLowerCase(),
          display_name: displayName || priorityLevel,
          multiplier: Number(multiplier) || 1,
          fixed_charge: Number(fixedCharge) || 0,
          priority_charge: Number(priorityCharge) || 0,
          estimated_response_time: estimatedResponseTime || null,
          description: description || null,
          is_active: isActive !== false ? 1 : 0,
        });
        return res.status(201).json({ success: true, data: created });
      }
    } catch (error) {
      console.error('Upsert emergency pricing error:', error);
      return res.status(500).json({ success: false, message: 'Failed to update emergency pricing' });
    }
  }
}
