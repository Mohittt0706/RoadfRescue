import { analyticsService } from '../services/analyticsService.js';

/**
 * GET /api/admin/analytics/services - Service analytics.
 */
export function getServiceAnalytics(req, res) {
  const { db } = req;
  try {
    const data = analyticsService.getServiceAnalytics(db);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch service analytics.', error: err.message });
  }
}

/**
 * GET /api/admin/analytics/mechanics - Mechanic analytics.
 */
export function getMechanicAnalytics(req, res) {
  const { db } = req;
  try {
    const data = analyticsService.getMechanicAnalytics(db);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch mechanic analytics.', error: err.message });
  }
}

/**
 * GET /api/admin/analytics/revenue - Revenue analytics.
 * Query params: period (daily, weekly, monthly, yearly)
 */
export function getRevenueAnalytics(req, res) {
  const { db } = req;
  const { period = 'daily' } = req.query;

  const validPeriods = ['daily', 'weekly', 'monthly', 'yearly'];
  if (!validPeriods.includes(period)) {
    return res.status(400).json({
      success: false,
      message: `Invalid period. Must be one of: ${validPeriods.join(', ')}`,
    });
  }

  try {
    const data = analyticsService.getRevenueAnalytics(db, period);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch revenue analytics.', error: err.message });
  }
}

/**
 * GET /api/admin/analytics/emergency-response - Emergency response analytics.
 */
export function getEmergencyAnalytics(req, res) {
  const { db } = req;
  try {
    const data = analyticsService.getEmergencyAnalytics(db);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch emergency analytics.', error: err.message });
  }
}
