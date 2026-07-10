import rateLimit from 'express-rate-limit';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 requests per windowMs for auth routes
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
    error: 'Too Many Requests'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // Limit each IP to 100 requests per minute
  message: {
    success: false,
    message: 'Too many requests. Please slow down.',
    error: 'Too Many Requests'
  },
  standardHeaders: true,
  legacyHeaders: false
});
