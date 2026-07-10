/**
 * Pricing Controller
 *
 * Handles all pricing calculation and management requests.
 * Services are accessed via req.services.pricing.
 */
export class PricingController {

  /**
   * POST /api/pricing/calculate
   * Calculate final price for a service with all components.
   */
  static async calculatePrice(req, res) {
    try {
      const { serviceId, zoneId, priority, discount, discountType, bookingId, emergencyId } = req.body;

      if (!serviceId) {
        return res.status(400).json({ success: false, message: 'Service ID is required' });
      }

      const result = await req.services.pricing.calculatePrice({
        serviceId,
        zoneId: zoneId || null,
        priority: priority || 'low',
        discount: discount || 0,
        discountType: discountType || 'flat',
        bookingId: bookingId || null,
        emergencyId: emergencyId || null,
        calculatedBy: req.user?.id || 'system',
      });

      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      console.error('Calculate price error:', error);
      return res.status(500).json({ success: false, message: error.message || 'Failed to calculate price' });
    }
  }

  /**
   * GET /api/pricing/estimate/:serviceId
   * Quick price estimate (no history recording).
   */
  static async getEstimate(req, res) {
    try {
      const { serviceId } = req.params;
      const { zoneId, priority, discount, discountType } = req.query;

      const result = await req.services.pricing.getEstimate(
        serviceId,
        zoneId || null,
        priority || 'low',
        discount ? Number(discount) : 0,
        discountType || 'flat'
      );

      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      console.error('Get estimate error:', error);
      return res.status(500).json({ success: false, message: error.message || 'Failed to get estimate' });
    }
  }

  /**
   * GET /api/pricing/history
   * Get pricing calculation history with pagination.
   */
  static async getHistory(req, res) {
    try {
      let page = 1, limit = 50;
      try {
        page = parseInt(req.query.page) || 1;
        limit = parseInt(req.query.limit) || 50;
      } catch (e) { /* Express 5: req.query is read-only getter, use as-is */ }

      const result = req.repos.pricingHistory.findAllWithDetails({ page, limit });
      return res.status(200).json({ success: true, ...result });
    } catch (error) {
      console.error('Get pricing history error:', error);
      return res.status(500).json({ success: false, message: 'Failed to get pricing history' });
    }
  }

  /**
   * GET /api/pricing/history/booking/:bookingId
   * Get pricing history for a specific booking.
   */
  static async getHistoryByBooking(req, res) {
    try {
      const { bookingId } = req.params;
      const history = req.repos.pricingHistory.findByBookingId(bookingId);
      return res.status(200).json({ success: true, data: history });
    } catch (error) {
      console.error('Get booking pricing history error:', error);
      return res.status(500).json({ success: false, message: 'Failed to get booking pricing history' });
    }
  }

  /**
   * GET /api/pricing/history/emergency/:emergencyId
   * Get pricing history for a specific emergency.
   */
  static async getHistoryByEmergency(req, res) {
    try {
      const { emergencyId } = req.params;
      const history = req.repos.pricingHistory.findByEmergencyId(emergencyId);
      return res.status(200).json({ success: true, data: history });
    } catch (error) {
      console.error('Get emergency pricing history error:', error);
      return res.status(500).json({ success: false, message: 'Failed to get emergency pricing history' });
    }
  }

  /**
   * GET /api/pricing/analytics
   * Get pricing analytics and revenue data.
   */
  static async getAnalytics(req, res) {
    try {
      let period = 'daily', days = 30;
      try {
        period = req.query.period || 'daily';
        days = parseInt(req.query.days) || 30;
      } catch (e) { /* Express 5 */ }

      const summary = req.repos.pricingHistory.getAnalytics();
      const revenue = req.repos.pricingHistory.getRevenueByPeriod(period, days);

      return res.status(200).json({
        success: true,
        data: { summary, revenueByPeriod: revenue },
      });
    } catch (error) {
      console.error('Get pricing analytics error:', error);
      return res.status(500).json({ success: false, message: 'Failed to get pricing analytics' });
    }
  }
}
