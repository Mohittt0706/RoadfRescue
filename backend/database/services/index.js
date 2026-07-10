import { AuditHistoryService } from './auditHistoryService.js';
import { ActiveJobService } from './activeJobService.js';
import { PricingService } from './pricingService.js';
import { TaxService } from './taxService.js';

/**
 * Database Service Layer
 *
 * High-level services that coordinate between repositories
 * and provide business logic operations.
 */
let services = {};

/**
 * Initialize all database services.
 * Must be called after repositories are initialized.
 */
export function initServices(db, repositories) {
  services = {
    auditHistory: new AuditHistoryService(db),
    activeJobs: new ActiveJobService(db, repositories),
    pricing: new PricingService(db, repositories),
    tax: new TaxService(db, repositories),
  };
  return services;
}

/**
 * Get all initialized services.
 */
export function getServices() {
  return services;
}

export { AuditHistoryService, ActiveJobService, PricingService, TaxService };
