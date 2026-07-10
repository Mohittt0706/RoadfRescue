/**
 * Retry Utility
 *
 * Provides configurable retry logic with exponential backoff.
 * Used for transient failures: socket emit, notification send, DB save, etc.
 */

import logger from '../middleware/logger.js';

/**
 * Default retry configuration.
 */
const DEFAULT_CONFIG = {
  maxAttempts: 3,
  baseDelay: 1000,     // 1 second
  maxDelay: 30000,     // 30 seconds
  backoffFactor: 2,    // Exponential multiplier
  jitter: true,        // Add randomness to prevent thundering herd
};

/**
 * Calculate delay for a given attempt with exponential backoff.
 * @param {number} attempt - Current attempt number (0-based)
 * @param {object} config - Retry configuration
 * @returns {number} Delay in milliseconds
 */
function calculateDelay(attempt, config) {
  let delay = config.baseDelay * Math.pow(config.backoffFactor, attempt);
  delay = Math.min(delay, config.maxDelay);

  if (config.jitter) {
    delay = delay * (0.5 + Math.random() * 0.5);
  }

  return Math.round(delay);
}

/**
 * Sleep for a specified duration.
 * @param {number} ms - Duration in milliseconds
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Execute an operation with retry logic.
 *
 * @param {Function} fn - Async function to execute
 * @param {object} options - Retry options
 * @param {string} options.operationName - Name for logging
 * @param {number} options.maxAttempts - Maximum number of attempts
 * @param {number} options.baseDelay - Base delay in ms
 * @param {number} options.maxDelay - Maximum delay in ms
 * @param {number} options.backoffFactor - Exponential backoff factor
 * @param {boolean} options.jitter - Whether to add jitter
 * @param {Function} options.shouldRetry - Custom function to decide if retry is needed
 * @param {Function} options.onRetry - Callback before each retry
 * @returns {Promise<*>} Result of the operation
 * @throws {Error} Last error after all retries exhausted
 */
export async function withRetry(fn, options = {}) {
  const config = { ...DEFAULT_CONFIG, ...options };
  const { operationName = 'operation', maxAttempts, shouldRetry, onRetry } = config;

  let lastError;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn(attempt);
    } catch (error) {
      lastError = error;

      // Check if we should retry this error
      if (shouldRetry && !shouldRetry(error, attempt)) {
        logger.warn(`[Retry] ${operationName}: Not retryable`, {
          attempt: attempt + 1,
          error: error.message,
        });
        throw error;
      }

      // If this was the last attempt, don't retry
      if (attempt >= maxAttempts - 1) {
        logger.error(`[Retry] ${operationName}: All ${maxAttempts} attempts failed`, {
          error: error.message,
          totalAttempts: maxAttempts,
        });
        throw error;
      }

      const delay = calculateDelay(attempt, config);

      logger.warn(`[Retry] ${operationName}: Attempt ${attempt + 1}/${maxAttempts} failed, retrying in ${delay}ms`, {
        error: error.message,
        attempt: attempt + 1,
        nextRetryIn: `${delay}ms`,
      });

      if (onRetry) {
        onRetry(error, attempt + 1, delay);
      }

      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Create a retry-enabled wrapper for a function.
 * Returns a new function that applies retry logic automatically.
 *
 * @param {Function} fn - Function to wrap
 * @param {object} options - Retry options
 * @returns {Function} Wrapped function with retry logic
 */
export function createRetryWrapper(fn, options = {}) {
  return async (...args) => {
    return withRetry(() => fn(...args), options);
  };
}

/**
 * Retry configuration presets for common operations.
 */
export const RETRY_PRESETS = {
  socketEmit: {
    operationName: 'Socket Emit',
    maxAttempts: 3,
    baseDelay: 500,
    maxDelay: 5000,
  },
  notificationSend: {
    operationName: 'Notification Send',
    maxAttempts: 3,
    baseDelay: 2000,
    maxDelay: 30000,
  },
  databaseSave: {
    operationName: 'Database Save',
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 10000,
  },
  emergencyRequest: {
    operationName: 'Emergency Request',
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 15000,
  },
};

export default { withRetry, createRetryWrapper, RETRY_PRESETS };
