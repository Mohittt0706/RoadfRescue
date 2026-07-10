/**
 * Health Service
 *
 * Orchestrates health checks for all system components.
 * Provides /health and /ready endpoint data.
 * Records startup checks and ongoing health status.
 */

import { runHealthChecks, checkDatabase, checkSocket, checkStorage, checkEnvironment, getMemoryUsage, getCpuUsage } from '../utils/healthCheck.js';
import logger from '../middleware/logger.js';

const SERVER_VERSION = process.env.npm_package_version || '1.0.0';
const startTime = Date.now();

export class HealthService {
  constructor(db, io) {
    this.db = db;
    this.io = io;
    this.startupChecks = null;
    this.ready = false;
  }

  /**
   * Run startup checks. Called once during server boot.
   * @returns {object} Startup check results
   */
  runStartupChecks() {
    logger.info('[Health] Running startup checks...');

    const checks = {
      database: checkDatabase(this.db),
      socket: checkSocket(this.io),
      storage: checkStorage(),
      environment: checkEnvironment(['JWT_SECRET', 'NODE_ENV', 'PORT']),
      timestamp: new Date().toISOString(),
    };

    // Determine if server is ready
    this.ready = checks.database.status === 'connected'
      && checks.environment.status === 'valid';

    if (this.ready) {
      logger.info('[Health] Startup checks passed - server is ready');
    } else {
      logger.warn('[Health] Startup checks completed with warnings', {
        database: checks.database.status,
        environment: checks.environment.status,
        missingVars: checks.environment.missingVars,
      });
    }

    this.startupChecks = checks;
    return checks;
  }

  /**
   * GET /health - Full health report.
   * Returns detailed system status for monitoring.
   * @returns {object} Health report
   */
  getHealthReport() {
    let checks;
    try {
      checks = runHealthChecks({ db: this.db, io: this.io });
    } catch (err) {
      checks = {
        database: { status: 'error', message: err.message },
        socket: { status: 'error', message: err.message },
        storage: { status: 'error', message: err.message },
        environment: { status: 'error', message: err.message },
        memory: getMemoryUsage(),
        cpu: getCpuUsage(),
      };
    }

    const allHealthy = checks.database.status === 'connected'
      && checks.storage.status !== 'error'
      && checks.environment.status !== 'missing';

    return {
      status: allHealthy ? 'UP' : 'DEGRADED',
      timestamp: new Date().toISOString(),
      uptime: `${Math.floor((Date.now() - startTime) / 1000)}s`,
      version: SERVER_VERSION,
      database: checks.database,
      socket: checks.socket,
      storage: checks.storage,
      environment: {
        status: checks.environment.status,
        nodeEnv: process.env.NODE_ENV || 'development',
        configuredVars: checks.environment.configured,
        missingVars: checks.environment.missing,
      },
      memory: checks.memory,
      cpu: checks.cpu,
    };
  }

  /**
   * GET /ready - Readiness probe.
   * Returns 200 if ready to accept traffic, 503 otherwise.
   * @returns {object} Ready status
   */
  getReadinessReport() {
    const dbCheck = checkDatabase(this.db);
    const envCheck = checkEnvironment(['JWT_SECRET']);
    const socketCheck = checkSocket(this.io);
    const storageCheck = checkStorage();

    const isReady = dbCheck.status === 'connected'
      && envCheck.status === 'valid'
      && socketCheck.status === 'running';

    return {
      status: isReady ? 'ready' : 'not_ready',
      timestamp: new Date().toISOString(),
      checks: {
        database: dbCheck,
        socket: socketCheck,
        storage: storageCheck,
        environment: envCheck,
      },
      startupChecks: this.startupChecks,
    };
  }

  /**
   * Get the HTTP status code for readiness.
   * @returns {number} 200 if ready, 503 if not
   */
  getReadinessStatusCode() {
    const report = this.getReadinessReport();
    return report.status === 'ready' ? 200 : 503;
  }
}

export default HealthService;
