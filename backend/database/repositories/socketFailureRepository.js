/**
 * SocketFailureRepository - Data access for socket_failure_logs table.
 * Stores failed socket emissions for monitoring and debugging.
 */

import { BaseRepository } from './baseRepository.js';

export class SocketFailureRepository extends BaseRepository {
  constructor(db) {
    super(db, 'socket_failure_logs');
  }

  /** Find failures by event name */
  findByEventName(eventName, limit = 50) {
    return this.db.prepare(
      'SELECT * FROM socket_failure_logs WHERE event_name = ? ORDER BY created_at DESC LIMIT ?'
    ).all(eventName, limit);
  }

  /** Get recent failures */
  findRecent(limit = 100) {
    return this.db.prepare(
      'SELECT * FROM socket_failure_logs ORDER BY created_at DESC LIMIT ?'
    ).all(limit);
  }

  /** Get failure statistics grouped by event */
  getStats() {
    return this.db.prepare(`
      SELECT
        event_name,
        COUNT(*) as count,
        MAX(created_at) as last_occurrence
      FROM socket_failure_logs
      GROUP BY event_name
      ORDER BY count DESC
    `).all();
  }

  /** Clean up old failure logs */
  cleanup(daysOld = 7) {
    return this.db.prepare(
      "DELETE FROM socket_failure_logs WHERE created_at < datetime('now', ?)"
    ).run(`-${daysOld} days`);
  }
}
