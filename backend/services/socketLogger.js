/**
 * Socket Logger Service
 *
 * Tracks all Socket.IO emit operations and logs failures.
 * Provides a reusable wrapper for safe socket emission with logging.
 *
 * Stores: event name, socket ID, payload, timestamp, reason
 * Provides: emitWithLogging, getFailedEvents, getSocketStats
 */

import logger from '../middleware/logger.js';

/**
 * In-memory store for failed socket events.
 * Limited to prevent memory leaks.
 */
const MAX_FAILED_EVENTS = 1000;
const failedEvents = [];
let emitCounter = 0;
let failCounter = 0;

/**
 * Safe socket emit with logging.
 * Wraps any socket.emit() call with error handling and logging.
 *
 * @param {object} socket - Socket.IO socket instance (or io server)
 * @param {string} event - Event name to emit
 * @param {any} payload - Data to send
 * @param {string} room - Optional room/namespace to emit to
 * @returns {boolean} Whether the emit succeeded
 */
export function emitWithLogging(socket, event, payload, room = null) {
  emitCounter++;
  const socketId = socket?.id || 'server';
  const timestamp = new Date().toISOString();

  try {
    if (room && socket.to) {
      socket.to(room).emit(event, payload);
    } else if (socket.emit) {
      socket.emit(event, payload);
    } else {
      throw new Error('Invalid socket instance');
    }

    logger.debug(`[Socket] Emitted: ${event}`, { socketId, room });
    return true;
  } catch (error) {
    failCounter++;
    const failedEvent = {
      id: `se-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      event,
      socketId,
      payload: typeof payload === 'string' ? payload : JSON.stringify(payload),
      timestamp,
      reason: error.message,
    };

    // Prevent memory leak by limiting stored events
    if (failedEvents.length >= MAX_FAILED_EVENTS) {
      failedEvents.shift();
    }
    failedEvents.push(failedEvent);

    logger.error(`[Socket] Emit failed: ${event}`, {
      socketId,
      room,
      reason: error.message,
    });

    return false;
  }
}

/**
 * Safe emit to a specific room via the io server.
 *
 * @param {object} io - Socket.IO server instance
 * @param {string} room - Room name to emit to
 * @param {string} event - Event name
 * @param {any} payload - Data to send
 * @returns {boolean} Whether the emit succeeded
 */
export function emitToRoom(io, room, event, payload) {
  emitCounter++;
  const timestamp = new Date().toISOString();

  try {
    io.to(room).emit(event, payload);
    logger.debug(`[Socket] Emitted to room: ${room} -> ${event}`, { room });
    return true;
  } catch (error) {
    failCounter++;
    const failedEvent = {
      id: `se-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      event,
      socketId: `room:${room}`,
      payload: typeof payload === 'string' ? payload : JSON.stringify(payload),
      timestamp,
      reason: error.message,
    };

    if (failedEvents.length >= MAX_FAILED_EVENTS) {
      failedEvents.shift();
    }
    failedEvents.push(failedEvent);

    logger.error(`[Socket] Room emit failed: ${room} -> ${event}`, {
      reason: error.message,
    });

    return false;
  }
}

/**
 * Safe broadcast to all connected clients.
 *
 * @param {object} io - Socket.IO server instance
 * @param {string} event - Event name
 * @param {any} payload - Data to send
 * @returns {boolean} Whether the emit succeeded
 */
export function broadcast(io, event, payload) {
  return emitToRoom(io, null, event, payload);
}

/**
 * Get all failed socket events.
 * @param {number} limit - Max events to return
 * @returns {Array} Failed events
 */
export function getFailedEvents(limit = 50) {
  return failedEvents.slice(-limit);
}

/**
 * Clear failed events log.
 */
export function clearFailedEvents() {
  failedEvents.length = 0;
}

/**
 * Get socket operation statistics.
 * @returns {object} Stats
 */
export function getSocketStats() {
  return {
    totalEmits: emitCounter,
    totalFailures: failCounter,
    successRate: emitCounter > 0
      ? `${((1 - failCounter / emitCounter) * 100).toFixed(2)}%`
      : 'N/A',
    storedFailedEvents: failedEvents.length,
  };
}

export default {
  emitWithLogging,
  emitToRoom,
  broadcast,
  getFailedEvents,
  clearFailedEvents,
  getSocketStats,
};
