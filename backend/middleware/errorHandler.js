/**
 * Centralized Error Handler Middleware
 * 
 * Handles all error types uniformly:
 * - Validation errors (express-validator)
 * - Authentication/Authorization errors
 * - Database errors
 * - 404 Not Found
 * - 500 Internal Server errors
 * 
 * Never exposes stack traces in production.
 */

import logger from './logger.js';

/**
 * Custom API Error class for throwing structured errors
 */
export class AppError extends Error {
  constructor(message, statusCode, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Handle SQLite database errors
 */
function handleDatabaseError(err) {
  // SQLite constraint violations
  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    return new AppError('A record with this data already exists.', 409);
  }
  if (err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
    return new AppError('Referenced record does not exist.', 400);
  }
  if (err.code === 'SQLITE_CONSTRAINT_NOTNULL') {
    return new AppError('Required field is missing.', 400);
  }
  return new AppError('Database operation failed.', 500);
}

/**
 * Handle JWT authentication errors
 */
function handleJWTError(err) {
  if (err.name === 'JsonWebTokenError') {
    return new AppError('Invalid token. Please log in again.', 401);
  }
  if (err.name === 'TokenExpiredError') {
    return new AppError('Token has expired. Please log in again.', 401);
  }
  return new AppError('Authentication failed.', 401);
}

/**
 * Global error handler middleware
 * Must have 4 parameters (err, req, res, next) for Express to recognize it as error handler
 */
export function errorHandler(err, req, res, next) {
  // Default values
  let statusCode = err.statusCode || 500;
  let message = err.message || 'An unexpected server error occurred.';
  let errors = err.errors || [];

  // Handle specific error types
  if (err.code && err.code.startsWith('SQLITE_')) {
    const dbError = handleDatabaseError(err);
    statusCode = dbError.statusCode;
    message = dbError.message;
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    const jwtError = handleJWTError(err);
    statusCode = jwtError.statusCode;
    message = jwtError.message;
  }

  // Log error in all environments
  if (statusCode >= 500) {
    logger.error(`${statusCode} ${message}`, {
      path: req.originalUrl,
      method: req.method,
      stack: err.stack,
    });
  } else {
    logger.warn(`${statusCode} ${message}`, {
      path: req.originalUrl,
      method: req.method,
    });
  }

  // Send response
  const response = {
    success: false,
    message,
  };

  // Include validation errors if present
  if (errors.length > 0) {
    response.errors = errors;
  }

  // Only include stack trace in development
  if (process.env.NODE_ENV !== 'production' && statusCode >= 500) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
}

/**
 * 404 Not Found handler for undefined routes
 */
export function notFoundHandler(req, res, next) {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
}
