import rateLimit from 'express-rate-limit';

/**
 * Rate limiter configuration using environment variables.
 * Provides multiple limiters for different route sensitivities.
 */

// General API rate limiter - applied to all /api/ routes
export const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
    error: 'Too Many Requests'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict limiter for authentication routes (login, register, password reset)
export const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 20, // 20 attempts per 5 min
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after a few minutes.',
    error: 'Too Many Requests'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});

// Payment rate limiter - strict to prevent abuse
export const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.PAYMENT_RATE_LIMIT_MAX) || 20,
  message: {
    success: false,
    message: 'Too many payment requests. Please try again later.',
    error: 'Too Many Requests'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Emergency rate limiter - moderate to allow public access but prevent spam
export const emergencyLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 15,
  message: {
    success: false,
    message: 'Too many emergency requests. Please wait before trying again.',
    error: 'Too Many Requests'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Admin operations limiter - generous but tracked
export const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: {
    success: false,
    message: 'Too many admin requests. Please try again later.',
    error: 'Too Many Requests'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
