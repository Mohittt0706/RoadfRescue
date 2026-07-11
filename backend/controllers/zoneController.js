/**
 * Zone Controller
 *
 * Manages geographic zones for location-based pricing.
 */
export class ZoneController {

  /**
   * GET /api/zones
   * List all active zones.
   */
  static async listZones(req, res) {
    try {
      let page = 1, limit = 50;
      try { page = parseInt(req.query.page) || 1; limit = parseInt(req.query.limit) || 50; } catch (e) {}

      const { city } = req.query;
      let zones;
      if (city) {
        zones = req.repos.zones.findByCity(city);
      } else {
        zones = req.repos.zones.findActive();
      }

      return res.status(200).json({ success: true, data: zones });
    } catch (error) {
      console.error('List zones error:', error);
      return res.status(500).json({ success: false, message: 'Failed to list zones' });
    }
  }

  /**
   * GET /api/zones/:id
   * Get a specific zone.
   */
  static async getZone(req, res) {
    try {
      const { id } = req.params;
      const zone = req.repos.zones.findById(id);
      if (!zone) {
        return res.status(404).json({ success: false, message: 'Zone not found' });
      }
      return res.status(200).json({ success: true, data: zone });
    } catch (error) {
      console.error('Get zone error:', error);
      return res.status(500).json({ success: false, message: 'Failed to get zone' });
    }
  }

  /**
   * POST /api/zones
   * Create a new zone.
   */
  static async createZone(req, res) {
    try {
      const { zoneName, city, extraCharge, description, latitude, longitude, radiusKm } = req.body;

      if (!zoneName || !city) {
        return res.status(400).json({ success: false, message: 'Zone name and city are required' });
      }

      const existing = req.repos.zones.findByNameAndCity(zoneName, city);
      if (existing) {
        return res.status(409).json({ success: false, message: 'Zone already exists in this city' });
      }

      const id = `zone-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      const zone = req.repos.zones.create({
        id,
        zone_name: zoneName,
        city,
        extra_charge: Number(extraCharge) || 0,
        description: description || null,
        latitude: latitude ? Number(latitude) : null,
        longitude: longitude ? Number(longitude) : null,
        radius_km: radiusKm ? Number(radiusKm) : null,
        is_active: 1,
      });

      return res.status(201).json({ success: true, data: zone });
    } catch (error) {
      console.error('Create zone error:', error);
      return res.status(500).json({ success: false, message: 'Failed to create zone' });
    }
  }

  /**
   * PUT /api/zones/:id
   * Update a zone.
   */
  static async updateZone(req, res) {
    try {
      const { id } = req.params;
      const existing = req.repos.zones.findById(id);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Zone not found' });
      }

      const { zoneName, city, extraCharge, description, latitude, longitude, radiusKm, isActive } = req.body;

      const updates = {};
      if (zoneName !== undefined) updates.zone_name = zoneName;
      if (city !== undefined) updates.city = city;
      if (extraCharge !== undefined) updates.extra_charge = Number(extraCharge);
      if (description !== undefined) updates.description = description;
      if (latitude !== undefined) updates.latitude = latitude ? Number(latitude) : null;
      if (longitude !== undefined) updates.longitude = longitude ? Number(longitude) : null;
      if (radiusKm !== undefined) updates.radius_km = radiusKm ? Number(radiusKm) : null;
      if (isActive !== undefined) updates.is_active = isActive ? 1 : 0;
      updates.updated_at = new Date().toISOString();

      const updated = req.repos.zones.update(id, updates);
      return res.status(200).json({ success: true, data: updated });
    } catch (error) {
      console.error('Update zone error:', error);
      return res.status(500).json({ success: false, message: 'Failed to update zone' });
    }
  }

  /**
   * DELETE /api/zones/:id
   * Soft-delete a zone.
   */
  static async deleteZone(req, res) {
    try {
      const { id } = req.params;
      const existing = req.repos.zones.findById(id);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Zone not found' });
      }

      req.repos.zones.update(id, { is_active: 0, updated_at: new Date().toISOString() });
      return res.status(200).json({ success: true, message: 'Zone deactivated' });
    } catch (error) {
      console.error('Delete zone error:', error);
      return res.status(500).json({ success: false, message: 'Failed to delete zone' });
    }
  }

  /**
   * POST /api/zones/nearest
   * Find the nearest zone based on coordinates.
   */
  static async findNearest(req, res) {
    try {
      const { latitude, longitude } = req.body;
      if (!latitude || !longitude) {
        return res.status(400).json({ success: false, message: 'Latitude and longitude are required' });
      }

      const zone = req.repos.zones.findNearestZone(Number(latitude), Number(longitude));
      if (!zone) {
        return res.status(404).json({ success: false, message: 'No zones found nearby' });
      }

      return res.status(200).json({ success: true, data: zone });
    } catch (error) {
      console.error('Find nearest zone error:', error);
      return res.status(500).json({ success: false, message: 'Failed to find nearest zone' });
    }
  }
}
