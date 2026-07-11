/**
 * Centralized Logging System
 *
 * Provides structured, leveled logging with file rotation.
 * All application logs flow through this module.
 *
 * Levels: error, warn, info, debug
 * Destinations: console + rotating file logs
 */

import { appendFileSync, existsSync, mkdirSync, readdirSync, statSync, renameSync, unlinkSync } from 'fs';
import { join } from 'path';

const LOG_LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const COLORS = {
  error: '\x1b[31m',
  warn: '\x1b[33m',
  info: '\x1b[36m',
  debug: '\x1b[90m',
  reset: '\x1b[0m',
};

const MAX_LOG_SIZE = 5 * 1024 * 1024; // 5MB per log file
const MAX_LOG_FILES = 5; // Keep up to 5 rotated files

let logLevel = LOG_LEVELS[process.env.LOG_LEVEL || 'info'] ?? LOG_LEVELS.info;
let logDir = null;

/**
 * Initialize the logger with a log directory.
 * @param {string} directory - Path to store log files
 */
export function initLogger(directory) {
  logDir = directory;
  if (!existsSync(logDir)) {
    mkdirSync(logDir, { recursive: true });
  }
}

/**
 * Set the minimum log level.
 * @param {string} level - 'error', 'warn', 'info', 'debug'
 */
export function setLogLevel(level) {
  if (LOG_LEVELS[level] !== undefined) {
    logLevel = LOG_LEVELS[level];
  }
}

/**
 * Rotate a log file if it exceeds MAX_LOG_SIZE.
 */
function rotateLogFile(filePath) {
  if (!existsSync(filePath)) return;

  const stat = statSync(filePath);
  if (stat.size < MAX_LOG_SIZE) return;

  for (let i = MAX_LOG_FILES - 1; i >= 1; i--) {
    const from = `${filePath}.${i}`;
    const to = `${filePath}.${i + 1}`;
    if (existsSync(from)) {
      if (i + 1 >= MAX_LOG_FILES) {
        unlinkSync(from);
      } else {
        renameSync(from, to);
      }
    }
  }
  renameSync(filePath, `${filePath}.1`);
}

/**
 * Write a log entry to file.
 */
function writeToFile(level, message, meta) {
  if (!logDir) return;

  try {
    const logFile = join(logDir, `${level}.log`);
    rotateLogFile(logFile);
    const entry = formatEntry(level, message, meta, false);
    appendFileSync(logFile, entry + '\n', 'utf-8');
  } catch {
    // Silent fail for file logging
  }
}

/**
 * Format a log entry.
 */
function formatEntry(level, message, meta, colorize = true) {
  const timestamp = new Date().toISOString();
  const prefix = colorize ? `${COLORS[level]}[${timestamp}] [${level.toUpperCase()}]${COLORS.reset}` : `[${timestamp}] [${level.toUpperCase()}]`;
  const metaStr = meta && Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
  return `${prefix} ${message}${metaStr}`;
}

/**
 * Core logging function.
 */
function log(level, message, meta = {}) {
  if (LOG_LEVELS[level] > logLevel) return;

  const consoleFn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
  consoleFn(formatEntry(level, message, meta, true));
  writeToFile(level, message, meta);
}

/**
 * Logger instance with leveled methods.
 */
const logger = {
  error: (message, meta) => log('error', message, meta),
  warn: (message, meta) => log('warn', message, meta),
  info: (message, meta) => log('info', message, meta),
  debug: (message, meta) => log('debug', message, meta),
  setLevel: setLogLevel,
  init: initLogger,
};

/**
 * Express request logging middleware.
 * Logs every incoming request with method, URL, and response time.
 */
export function requestLogger(req, res, next) {
  const start = Date.now();
  const { method, originalUrl } = req;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
    log(level, `${method} ${originalUrl} ${res.statusCode}`, {
      method,
      url: originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userId: req.user?.id || null,
    });
  });

  next();
}

/**
 * Middleware to capture unhandled errors in async route handlers.
 */
export function asyncErrorHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export default logger;
