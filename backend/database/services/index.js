import { AuditHistoryService } from './auditHistoryService.js';
import { ActiveJobService } from './activeJobService.js';
import { PricingService } from './pricingService.js';
import { TaxService } from './taxService.js';
import { NotificationLogger } from '../../services/notificationLogger.js';
import { FeatureFlagService } from '../../services/featureFlagService.js';
import { RetryService } from '../../services/retryService.js';
import { HealthService } from '../../services/healthService.js';

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
export function initServices(db, repositories, io = null) {
  // Initialize feature flags first (other services may depend on them)
  const featureFlags = new FeatureFlagService(db);
  featureFlags.seedDefaults();

  services = {
    auditHistory: new AuditHistoryService(db),
    activeJobs: new ActiveJobService(db, repositories),
    pricing: new PricingService(db, repositories),
    tax: new TaxService(db, repositories),
    notificationLogger: new NotificationLogger(db),
    featureFlags,
    retry: new RetryService(db, repositories, null), // self-referencing below
    health: new HealthService(db, io),
  };

  // Wire up retry service with notification logger
  services.retry.services = services;

  return services;
}

/**
 * Get all initialized services.
 */
export function getServices() {
  return services;
}

export {
  AuditHistoryService,
  ActiveJobService,
  PricingService,
  TaxService,
  NotificationLogger,
  FeatureFlagService,
  RetryService,
  HealthService,
};
