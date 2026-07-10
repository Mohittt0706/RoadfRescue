/**
 * Feature Controller
 *
 * Endpoints for managing feature flags.
 * Public: GET /api/features (read-only)
 * Admin: PUT /api/features (update flags)
 */

export class FeatureController {

  /**
   * GET /api/features
   * Get all feature flags (public, read-only).
   */
  static async getAllFlags(req, res) {
    try {
      const flags = req.services.featureFlags.getAllFlags();
      return res.status(200).json({ success: true, data: flags });
    } catch (error) {
      console.error('Get feature flags error:', error);
      return res.status(500).json({ success: false, message: 'Failed to get feature flags' });
    }
  }

  /**
   * GET /api/features/:flagName
   * Get a specific feature flag.
   */
  static async getFlag(req, res) {
    try {
      const { flagName } = req.params;
      const flag = req.services.featureFlags.getFlag(flagName);

      if (!flag) {
        return res.status(404).json({ success: false, message: `Feature flag '${flagName}' not found` });
      }

      return res.status(200).json({
        success: true,
        data: { ...flag, is_enabled: flag.is_enabled === 1 },
      });
    } catch (error) {
      console.error('Get feature flag error:', error);
      return res.status(500).json({ success: false, message: 'Failed to get feature flag' });
    }
  }

  /**
   * GET /api/features/check/:flagName
   * Check if a specific feature is enabled (simple boolean response).
   */
  static async checkFlag(req, res) {
    try {
      const { flagName } = req.params;
      const enabled = req.services.featureFlags.isEnabled(flagName);

      return res.status(200).json({
        success: true,
        data: { flag: flagName, enabled },
      });
    } catch (error) {
      console.error('Check feature flag error:', error);
      return res.status(500).json({ success: false, message: 'Failed to check feature flag' });
    }
  }

  /**
   * PUT /api/features
   * Update feature flags. Admin only.
   * Body: { flags: { flagName: { enabled: boolean, description?: string } } }
   */
  static async updateFlags(req, res) {
    try {
      const { flags } = req.body;

      if (!flags || typeof flags !== 'object') {
        return res.status(400).json({ success: false, message: 'Invalid flags object' });
      }

      const results = req.services.featureFlags.bulkUpdate(flags);

      return res.status(200).json({
        success: true,
        message: 'Feature flags updated',
        data: results.map(f => ({
          name: f.flag_name,
          enabled: f.is_enabled === 1,
          description: f.description,
        })),
      });
    } catch (error) {
      console.error('Update feature flags error:', error);
      return res.status(500).json({ success: false, message: 'Failed to update feature flags' });
    }
  }

  /**
   * PUT /api/features/:flagName
   * Update a single feature flag. Admin only.
   * Body: { enabled: boolean, description?: string }
   */
  static async updateFlag(req, res) {
    try {
      const { flagName } = req.params;
      const { enabled, description } = req.body;

      if (enabled === undefined) {
        return res.status(400).json({ success: false, message: 'enabled field is required' });
      }

      const result = req.services.featureFlags.updateFlag(flagName, enabled, description);

      return res.status(200).json({
        success: true,
        message: `Feature flag '${flagName}' updated`,
        data: {
          name: result.flag_name,
          enabled: result.is_enabled === 1,
          description: result.description,
        },
      });
    } catch (error) {
      console.error('Update feature flag error:', error);
      return res.status(500).json({ success: false, message: 'Failed to update feature flag' });
    }
  }
}
