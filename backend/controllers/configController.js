/**
 * Config Controller
 *
 * Admin-only endpoints for viewing and updating server configuration.
 * GET /api/config - View current configuration
 * PUT /api/config - Update configuration (admin only)
 *
 * Also provides notification logs and retry information.
 */

export class ConfigController {

  /**
   * GET /api/config
   * Get current server configuration and status.
   */
  static async getConfig(req, res) {
    try {
      const healthReport = req.services.health.getHealthReport();
      const featureFlags = req.services.featureFlags.getFlagsMap();
      const socketStats = req.repos.socketLogger?.getSocketStats?.() || { note: 'SocketLogger not attached to repos' };
      const notificationStats = req.services.notificationLogger?.getStats?.() || [];

      return res.status(200).json({
        success: true,
        data: {
          server: {
            environment: process.env.NODE_ENV || 'development',
            port: process.env.PORT || 3001,
            uptime: healthReport.uptime,
            version: healthReport.version,
          },
          features: featureFlags,
          notifications: {
            stats: notificationStats,
          },
          socket: socketStats,
          database: healthReport.database,
          memory: healthReport.memory,
        },
      });
    } catch (error) {
      console.error('Get config error:', error);
      return res.status(500).json({ success: false, message: 'Failed to get configuration' });
    }
  }

  /**
   * PUT /api/config
   * Update server configuration. Admin only.
   * Currently supports: maintenance mode, feature flags.
   */
  static async updateConfig(req, res) {
    try {
      const { maintenanceMode, featureFlags } = req.body;

      const results = {};

      if (maintenanceMode !== undefined) {
        req.services.featureFlags.updateFlag('maintenanceMode', maintenanceMode);
        results.maintenanceMode = maintenanceMode;
      }

      if (featureFlags && typeof featureFlags === 'object') {
        const flagResults = req.services.featureFlags.bulkUpdate(featureFlags);
        results.featureFlags = flagResults.map(f => ({
          name: f.flag_name,
          enabled: f.is_enabled,
        }));
      }

      return res.status(200).json({
        success: true,
        message: 'Configuration updated',
        data: results,
      });
    } catch (error) {
      console.error('Update config error:', error);
      return res.status(500).json({ success: false, message: 'Failed to update configuration' });
    }
  }

  /**
   * GET /api/config/notifications
   * Get notification logs. Admin only.
   */
  static async getNotificationLogs(req, res) {
    try {
      let limit = 50;
      try { limit = parseInt(req.query.limit) || 50; } catch (e) {}

      const logs = req.services.notificationLogger.findRecent(limit);
      return res.status(200).json({ success: true, data: logs });
    } catch (error) {
      console.error('Get notification logs error:', error);
      return res.status(500).json({ success: false, message: 'Failed to get notification logs' });
    }
  }

  /**
   * GET /api/config/socket-failures
   * Get failed socket events. Admin only.
   */
  static async getSocketFailures(req, res) {
    try {
      const failures = req.repos.socketLogger?.getFailedEvents?.(50) || [];
      const stats = req.repos.socketLogger?.getSocketStats?.() || {};

      return res.status(200).json({
        success: true,
        data: { failures, stats },
      });
    } catch (error) {
      console.error('Get socket failures error:', error);
      return res.status(500).json({ success: false, message: 'Failed to get socket failures' });
    }
  }
}
