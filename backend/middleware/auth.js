import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'roadrescue_jwt_secret_change_in_production';

// Middleware: Verify JWT access token
export function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Access denied. No token provided.', error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, email, role }
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.', error: 'Unauthorized' });
  }
}

// Middleware: Verify token AND require active user role
export function verifyUser(req, res, next) {
  verifyToken(req, res, () => {
    if (req.user.role !== 'user') {
      return res.status(403).json({ success: false, message: 'Access denied. User privileges required.', error: 'Forbidden' });
    }

    // Verify account status from database
    try {
      const user = req.db.prepare('SELECT status FROM users WHERE id = ?').get(req.user.id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User account not found.', error: 'Not Found' });
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
      return res.status(500).json({ success: false, message: 'Database error verifying status.', error: err.message });
    }
  });
}

// Middleware: Verify token AND require approved mechanic role
export function verifyMechanic(req, res, next) {
  verifyToken(req, res, () => {
    if (req.user.role !== 'mechanic') {
      return res.status(403).json({ success: false, message: 'Access denied. Mechanic privileges required.', error: 'Forbidden' });
    }

    // Verify mechanic approval status from database
    try {
      const mechanic = req.db.prepare('SELECT approval_status FROM mechanics WHERE id = ?').get(req.user.id);
      if (!mechanic) {
        return res.status(404).json({ success: false, message: 'Mechanic account not found.', error: 'Not Found' });
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
      return res.status(500).json({ success: false, message: 'Database error verifying status.', error: err.message });
    }
  });
}

// Middleware: Verify token AND require admin role
export function verifyAdmin(req, res, next) {
  verifyToken(req, res, () => {
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ success: false, message: 'Access denied. Admin privileges required.', error: 'Forbidden' });
    }
    next();
  });
}

export { JWT_SECRET };
