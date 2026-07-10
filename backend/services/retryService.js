/**
 * Retry Service
 *
 * Provides retry logic for critical operations:
 * - Emergency request inserts
 * - Notification sends
 * - Socket emissions
 * - Database saves
 *
 * Uses exponential backoff with configurable strategies.
 * Integrates with the NotificationLogger for retry tracking.
 */

import { withRetry, RETRY_PRESETS } from '../utils/retry.js';
import logger from '../middleware/logger.js';

export class RetryService {
  constructor(db, repositories, services) {
    this.db = db;
    this.repos = repositories;
    this.services = services;
  }

  /**
   * Retry an emergency request insert.
   * @param {Function} insertFn - The insert operation
   * @param {string} emergencyId - Emergency ID for logging
   * @returns {Promise<*>} Insert result
   */
  async retryEmergencyInsert(insertFn, emergencyId) {
    return withRetry(insertFn, {
      ...RETRY_PRESETS.emergencyRequest,
      operationName: `Emergency Insert [${emergencyId}]`,
      onRetry: (error, attempt, delay) => {
        logger.warn(`[RetryService] Emergency insert retry`, {
          emergencyId,
          attempt,
          delay: `${delay}ms`,
          error: error.message,
        });
      },
    });
  }

  /**
   * Retry a notification send with status tracking.
   * @param {Function} sendFn - The send operation
   * @param {object} notificationLog - The notification log entry
   * @returns {Promise<*>} Send result
   */
  async retryNotificationSend(sendFn, notificationLog) {
    const nl = this.services?.notificationLogger;
    const logId = notificationLog?.id;

    if (nl && logId) {
      nl.markRetrying(logId, (notificationLog.retryCount || 0) + 1);
    }

    try {
      const result = await withRetry(sendFn, {
        ...RETRY_PRESETS.notificationSend,
        operationName: `Notification [${logId || 'unknown'}]`,
        onRetry: (error, attempt, delay) => {
          logger.warn(`[RetryService] Notification send retry`, {
            notificationId: logId,
            attempt,
            delay: `${delay}ms`,
            error: error.message,
          });
          if (nl && logId) {
            nl.markRetrying(logId, attempt);
          }
        },
      });

      if (nl && logId) {
        nl.markSent(logId);
      }
      return result;
    } catch (error) {
      if (nl && logId) {
        nl.markFailed(logId, error.message);
      }
      throw error;
    }
  }

  /**
   * Retry a socket emit operation.
   * @param {Function} emitFn - The emit operation
   * @param {string} eventName - Event name for logging
   * @returns {Promise<*>} Emit result
   */
  async retrySocketEmit(emitFn, eventName) {
    return withRetry(emitFn, {
      ...RETRY_PRESETS.socketEmit,
      operationName: `Socket Emit [${eventName}]`,
      onRetry: (error, attempt, delay) => {
        logger.warn(`[RetryService] Socket emit retry`, {
          event: eventName,
          attempt,
          delay: `${delay}ms`,
          error: error.message,
        });
      },
    });
  }

  /**
   * Retry a database save operation.
   * @param {Function} saveFn - The save operation
   * @param {string} operationName - Name for logging
   * @returns {Promise<*>} Save result
   */
  async retryDatabaseSave(saveFn, operationName) {
    return withRetry(saveFn, {
      ...RETRY_PRESETS.databaseSave,
      operationName: `DB Save [${operationName}]`,
      onRetry: (error, attempt, delay) => {
        logger.warn(`[RetryService] Database save retry`, {
          operation: operationName,
          attempt,
          delay: `${delay}ms`,
          error: error.message,
        });
      },
    });
  }

  /**
   * Generic retry with custom configuration.
   * @param {Function} fn - Operation to retry
   * @param {object} options - Custom retry options
   * @returns {Promise<*>} Operation result
   */
  async retryWithCustomConfig(fn, options = {}) {
    return withRetry(fn, options);
  }
}

export default RetryService;
