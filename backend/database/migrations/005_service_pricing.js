/**
 * @fileoverview Service & Pricing Management tables.
 * Creates tables for dynamic pricing, zones, emergency pricing, tax config, and pricing history.
 * @version 5
 */

const migration = {
  version: 5,
  name: '005_service_pricing_management',

  up(db) {
    db.exec(`
      -- Enhanced services table (extends existing services with pricing fields)
      -- We add new columns to the existing services table
      ALTER TABLE services ADD COLUMN category TEXT DEFAULT 'General';
      ALTER TABLE services ADD COLUMN is_emergency_supported INTEGER DEFAULT 0;
      ALTER TABLE services ADD COLUMN pricing_model TEXT DEFAULT 'fixed';

      -- Pricing Rules: configurable multipliers and charges
      CREATE TABLE IF NOT EXISTS pricing_rules (
        id TEXT PRIMARY KEY,
        service_id TEXT,
        rule_name TEXT NOT NULL,
        rule_type TEXT NOT NULL,
        value REAL DEFAULT 0,
        unit TEXT DEFAULT 'fixed',
        description TEXT,
        priority INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (service_id) REFERENCES services(id)
      );

      -- Zones: geographic zones with extra charges
      CREATE TABLE IF NOT EXISTS zones (
        id TEXT PRIMARY KEY,
        zone_name TEXT NOT NULL,
        city TEXT NOT NULL,
        state TEXT DEFAULT 'Gujarat',
        radius_km REAL DEFAULT 10,
        extra_charge REAL DEFAULT 0,
        latitude REAL,
        longitude REAL,
        description TEXT,
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );

      -- Emergency Pricing: configurable per priority level
      CREATE TABLE IF NOT EXISTS emergency_pricing (
        id TEXT PRIMARY KEY,
        priority_level TEXT NOT NULL UNIQUE,
        display_name TEXT NOT NULL,
        multiplier REAL DEFAULT 1.0,
        fixed_charge REAL DEFAULT 0,
        priority_charge REAL DEFAULT 0,
        estimated_response_time TEXT DEFAULT '30-45 mins',
        description TEXT,
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );

      -- Tax Configuration: GST and other taxes
      CREATE TABLE IF NOT EXISTS tax_configuration (
        id TEXT PRIMARY KEY,
        tax_name TEXT NOT NULL,
        tax_type TEXT NOT NULL,
        rate REAL DEFAULT 0,
        is_percentage INTEGER DEFAULT 1,
        applies_to TEXT DEFAULT 'all',
        state TEXT,
        description TEXT,
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );

      -- Pricing History: audit trail for all price calculations
      CREATE TABLE IF NOT EXISTS pricing_history (
        id TEXT PRIMARY KEY,
        booking_id TEXT,
        emergency_id TEXT,
        service_id TEXT,
        zone_id TEXT,
        base_price REAL DEFAULT 0,
        zone_charge REAL DEFAULT 0,
        emergency_charge REAL DEFAULT 0,
        priority_charge REAL DEFAULT 0,
        discount REAL DEFAULT 0,
        tax_amount REAL DEFAULT 0,
        total_price REAL DEFAULT 0,
        calculation_details TEXT,
        calculated_by TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (booking_id) REFERENCES bookings(id),
        FOREIGN KEY (service_id) REFERENCES services(id),
        FOREIGN KEY (zone_id) REFERENCES zones(id)
      );

      -- Indexes for pricing tables
      CREATE INDEX IF NOT EXISTS idx_pricing_rules_service ON pricing_rules(service_id);
      CREATE INDEX IF NOT EXISTS idx_pricing_rules_type ON pricing_rules(rule_type);
      CREATE INDEX IF NOT EXISTS idx_zones_city ON zones(city);
      CREATE INDEX IF NOT EXISTS idx_zones_active ON zones(is_active);
      CREATE INDEX IF NOT EXISTS idx_emergency_pricing_level ON emergency_pricing(priority_level);
      CREATE INDEX IF NOT EXISTS idx_tax_configuration_type ON tax_configuration(tax_type);
      CREATE INDEX IF NOT EXISTS idx_pricing_history_booking ON pricing_history(booking_id);
      CREATE INDEX IF NOT EXISTS idx_pricing_history_emergency ON pricing_history(emergency_id);
      CREATE INDEX IF NOT EXISTS idx_pricing_history_service ON pricing_history(service_id);
      CREATE INDEX IF NOT EXISTS idx_pricing_history_created ON pricing_history(created_at);
    `);

    // Seed default emergency pricing levels
    const emergencyLevels = [
      ['ep-low', 'Low', 'low', 1.0, 0, 0, '45-60 mins', 'Standard priority emergency'],
      ['ep-medium', 'Medium', 'medium', 1.15, 50, 25, '30-45 mins', 'Elevated priority with faster response'],
      ['ep-high', 'High', 'high', 1.35, 100, 50, '20-30 mins', 'High priority requiring immediate attention'],
      ['ep-critical', 'Critical', 'critical', 1.5, 200, 100, '10-20 mins', 'Life-threatening or safety-critical emergency'],
    ];
    const insertEmergency = db.prepare(
      'INSERT OR IGNORE INTO emergency_pricing (id, display_name, priority_level, multiplier, fixed_charge, priority_charge, estimated_response_time, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );
    for (const row of emergencyLevels) {
      insertEmergency.run(...row);
    }

    // Seed default tax configuration
    const taxes = [
      ['tax-gst-18', 'GST', 'gst', 18, 1, 'all', null, 'Goods and Services Tax (18%)'],
      ['tax-gst-5', 'GST (Essential)', 'gst', 5, 1, 'essential', null, 'Reduced GST for essential services'],
      ['tax-cess', 'Health Cess', 'cess', 1, 1, 'all', null, 'Health and education cess'],
    ];
    const insertTax = db.prepare(
      'INSERT OR IGNORE INTO tax_configuration (id, tax_name, tax_type, rate, is_percentage, applies_to, state, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );
    for (const row of taxes) {
      insertTax.run(...row);
    }

    // Seed default zones
    const zones = [
      ['zone-anand-central', 'Anand Central', 'Anand', 'Gujarat', 5, 0, 22.5646, 72.9520, 'Central Anand city area'],
      ['zone-anand-extended', 'Anand Extended', 'Anand', 'Gujarat', 15, 50, 22.5646, 72.9520, 'Extended Anand area within 15km'],
      ['zone-vallabh-vidyanagar', 'Vallabh Vidyanagar', 'Anand', 'Gujarat', 8, 30, 22.5307, 72.9309, 'Vallabh Vidyanagar area'],
      ['zone-godhra', 'Godhra', 'Panchmahal', 'Gujarat', 20, 100, 22.7739, 73.6214, 'Godhra city and surrounding areas'],
      ['zone-vadodara', 'Vadodara', 'Vadodara', 'Gujarat', 25, 150, 22.3072, 73.1812, 'Vadodara metropolitan area'],
    ];
    const insertZone = db.prepare(
      'INSERT OR IGNORE INTO zones (id, zone_name, city, state, radius_km, extra_charge, latitude, longitude, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    for (const row of zones) {
      insertZone.run(...row);
    }
  },

  down(db) {
    db.exec(`
      DROP TABLE IF EXISTS pricing_history;
      DROP TABLE IF EXISTS tax_configuration;
      DROP TABLE IF EXISTS emergency_pricing;
      DROP TABLE IF EXISTS zones;
      DROP TABLE IF EXISTS pricing_rules;

      DROP INDEX IF EXISTS idx_pricing_rules_service;
      DROP INDEX IF EXISTS idx_pricing_rules_type;
      DROP INDEX IF EXISTS idx_zones_city;
      DROP INDEX IF EXISTS idx_zones_active;
      DROP INDEX IF EXISTS idx_emergency_pricing_level;
      DROP INDEX IF EXISTS idx_tax_configuration_type;
      DROP INDEX IF EXISTS idx_pricing_history_booking;
      DROP INDEX IF EXISTS idx_pricing_history_emergency;
      DROP INDEX IF EXISTS idx_pricing_history_service;
      DROP INDEX IF EXISTS idx_pricing_history_created;
    `);
  },
};

export default migration;
