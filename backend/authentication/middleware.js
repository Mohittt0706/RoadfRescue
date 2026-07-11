import jwt from 'jsonwebtoken';

/**
 * JWT Secret - MUST come from environment variable.
 * No hardcoded fallback in production to prevent security vulnerabilities.
 */
function getJWTSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('[FATAL] JWT_SECRET environment variable is not set. Authentication will fail.');
    throw new Error('JWT_SECRET environment variable is required');
  }
  return secret;
}

// Lazy-load the secret so the module doesn't crash on import if env isn't loaded yet
let _jwtSecret = null;
function jwtSecret() {
  if (!_jwtSecret) _jwtSecret = getJWTSecret();
  return _jwtSecret;
}

/**
 * Middleware: Verify JWT access token
 * Extracts Bearer token from Authorization header, verifies signature,
 * and attaches decoded payload { id, email, role } to req.user
 */
export function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.',
      error: 'Unauthorized'
    });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Malformed token.',
      error: 'Unauthorized'
    });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret());
    req.user = decoded; // { id, email, role }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired. Please refresh your token.',
        error: 'TokenExpired'
      });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.',
        error: 'InvalidToken'
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Authentication failed.',
      error: 'Unauthorized'
    });
  }
}

/**
 * Middleware: Verify token AND require active user role
 * Also checks database to ensure user account is still active
 */
export function verifyUser(req, res, next) {
  verifyToken(req, res, () => {
    if (req.user.role !== 'user') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. User privileges required.',
        error: 'Forbidden'
      });
    }

    try {
      const user = req.db.prepare('SELECT status FROM users WHERE id = ?').get(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User account not found.',
          error: 'Not Found'
        });
      }

      if (user.status !== 'active') {
        return res.status(403).json({
          success: false,
          message: `Your account status is '${user.status}'. Access denied.`,
          error: 'Forbidden'
        });
      }

      next();
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: 'Database error verifying account status.',
        error: 'Internal Server Error'
      });
    }
  });
}

/**
 * Middleware: Verify token AND require approved mechanic role
 * Checks both JWT token role and database approval status
 */
export function verifyMechanic(req, res, next) {
  verifyToken(req, res, () => {
    if (req.user.role !== 'mechanic') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Mechanic privileges required.',
        error: 'Forbidden'
      });
    }

    try {
      const mechanic = req.db.prepare('SELECT approval_status FROM mechanics WHERE id = ?').get(req.user.id);
      if (!mechanic) {
        return res.status(404).json({
          success: false,
          message: 'Mechanic account not found.',
          error: 'Not Found'
        });
      }

      if (mechanic.approval_status !== 'approved') {
        return res.status(403).json({
          success: false,
          message: `Your mechanic account status is '${mechanic.approval_status}'. Access denied.`,
          error: 'Forbidden'
        });
      }

      next();
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: 'Database error verifying mechanic status.',
        error: 'Internal Server Error'
      });
    }
  });
}

/**
 * Middleware: Verify token AND require admin role
 */
export function verifyAdmin(req, res, next) {
  verifyToken(req, res, () => {
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
        error: 'Forbidden'
      });
    }
    next();
  });
}

/**
 * Middleware factory: Require specific roles
 * @param  {...string} roles - Allowed roles
 */
export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
        error: 'Unauthorized'
      });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}.`,
        error: 'Forbidden'
      });
    }
    next();
  };
}

export { jwtSecret };
