/**
 * Health Check Utilities
 *
 * Provides functions to check various system components:
 * - Database connectivity
 * - Socket.IO server
 * - Storage (uploads directory)
 * - Environment variables
 * - Memory usage
 * - CPU usage
 */

import { existsSync, statSync } from 'fs';
import { join } from 'path';

/**
 * Check database connectivity and return status.
 * @param {object} db - better-sqlite3 database instance
 * @returns {object} Database health status
 */
export function checkDatabase(db) {
  try {
    const start = Date.now();
    const result = db.prepare('SELECT 1 as ok').get();
    const latency = Date.now() - start;

    if (result && result.ok === 1) {
      const tables = db.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
      ).all();

      const version = db.prepare(
        'SELECT MAX(version) as version FROM schema_migrations'
      ).get();

      return {
        status: 'connected',
        latency: `${latency}ms`,
        tables: tables.length,
        schemaVersion: version?.version || 0,
      };
    }
    return { status: 'error', message: 'Query returned unexpected result' };
  } catch (err) {
    return { status: 'error', message: err.message };
  }
}

/**
 * Check Socket.IO server status.
 * @param {object} io - Socket.IO server instance
 * @returns {object} Socket health status
 */
export function checkSocket(io) {
  try {
    if (!io) {
      return { status: 'not_initialized', message: 'Socket.IO not initialized' };
    }

    let connections = 0;
    try {
      if (io.engine && typeof io.engine.clientsCount === 'number') {
        connections = io.engine.clientsCount;
      } else if (io.of && io.of('/')) {
        connections = io.of('/').sockets.size;
      }
    } catch {
      connections = 0;
    }

    return {
      status: 'running',
      connections,
    };
  } catch (err) {
    return { status: 'error', message: err.message };
  }
}

/**
 * Check storage directory accessibility.
 * @param {string} uploadsDir - Path to uploads directory
 * @returns {object} Storage health status
 */
export function checkStorage(uploadsDir) {
  try {
    const dirPath = uploadsDir || join(process.cwd(), 'uploads');
    if (typeof dirPath !== 'string') {
      return { status: 'error', message: 'Invalid uploads directory path' };
    }

    if (!existsSync(dirPath)) {
      return { status: 'missing', message: 'Uploads directory does not exist', path: dirPath };
    }

    const stat = statSync(dirPath);
    if (!stat.isDirectory()) {
      return { status: 'error', message: 'Uploads path exists but is not a directory' };
    }

    return {
      status: 'accessible',
      path: dirPath,
    };
  } catch (err) {
    return { status: 'error', message: err.message };
  }
}

/**
 * Check required environment variables.
 * @param {string[]} requiredVars - List of required environment variable names
 * @returns {object} Environment health status
 */
export function checkEnvironment(requiredVars = []) {
  const configured = [];
  const missing = [];

  for (const varName of requiredVars) {
    if (process.env[varName]) {
      configured.push(varName);
    } else {
      missing.push(varName);
    }
  }

  return {
    status: missing.length === 0 ? 'valid' : 'incomplete',
    configured: configured.length,
    missing: missing.length,
    missingVars: missing,
  };
}

/**
 * Get current memory usage statistics.
 * @returns {object} Memory usage breakdown
 */
export function getMemoryUsage() {
  const usage = process.memoryUsage();
  return {
    rss: formatBytes(usage.rss),
    heapTotal: formatBytes(usage.heapTotal),
    heapUsed: formatBytes(usage.heapUsed),
    external: formatBytes(usage.external),
    arrayBuffers: formatBytes(usage.arrayBuffers || 0),
  };
}

/**
 * Get CPU usage information.
 * @returns {object} CPU info
 */
export function getCpuUsage() {
  try {
    const cpus = typeof process.cpus === 'function' ? process.cpus() : [];
    const loadAvg = typeof process.loadavg === 'function' ? process.loadavg() : [0, 0, 0];

    return {
      model: cpus[0]?.model || 'unknown',
      cores: cpus.length,
      loadAverage: {
        '1m': loadAvg[0]?.toFixed(2) || '0.00',
        '5m': loadAvg[1]?.toFixed(2) || '0.00',
        '15m': loadAvg[2]?.toFixed(2) || '0.00',
      },
    };
  } catch {
    return {
      model: 'unknown',
      cores: 0,
      loadAverage: { '1m': '0.00', '5m': '0.00', '15m': '0.00' },
    };
  }
}

/**
 * Format bytes to human-readable string.
 * @param {number} bytes
 * @returns {string} Formatted string
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Run all health checks.
 * @param {object} deps - Dependencies { db, io, uploadsDir }
 * @returns {object} Complete health report
 */
export function runHealthChecks(deps = {}) {
  const { db, io, uploadsDir = join(process.cwd(), 'uploads') } = deps;

  const requiredEnvVars = [
    'JWT_SECRET',
    'NODE_ENV',
    'PORT',
  ];

  return {
    database: db ? checkDatabase(db) : { status: 'not_initialized' },
    socket: checkSocket(io),
    storage: checkStorage(uploadsDir),
    environment: checkEnvironment(requiredEnvVars),
    memory: getMemoryUsage(),
    cpu: getCpuUsage(),
  };
}

export default {
  checkDatabase,
  checkSocket,
  checkStorage,
  checkEnvironment,
  getMemoryUsage,
  getCpuUsage,
  runHealthChecks,
};
