/**
 * Health Controller
 *
 * Handles GET /health and GET /ready endpoints.
 * HealthService is accessed via req.services.health.
 */

export class HealthController {

  /**
   * GET /health
   * Full health report with database, socket, memory, CPU info.
   */
  static async getHealth(req, res) {
    try {
      const report = req.services.health.getHealthReport();
      return res.status(200).json({ success: true, data: report });
    } catch (error) {
      return res.status(503).json({
        success: false,
        data: { status: 'DOWN', error: error.message, timestamp: new Date().toISOString() },
      });
    }
  }

  /**
   * GET /ready
   * Readiness probe. Returns 200 if ready, 503 if not.
   */
  static async getReadiness(req, res) {
    try {
      const report = req.services.health.getReadinessReport();
      const statusCode = req.services.health.getReadinessStatusCode();
      return res.status(statusCode).json({ success: statusCode === 200, data: report });
    } catch (error) {
      return res.status(503).json({
        success: false,
        data: { status: 'not_ready', error: error.message, timestamp: new Date().toISOString() },
      });
    }
  }
}
