import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'roadrescue_jwt_secret_change_in_production';

// Middleware: Verify JWT token from Authorization header
export function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, email, role }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

// Middleware: Verify token AND require admin role
export function verifyAdmin(req, res, next) {
  verifyToken(req, res, () => {
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }
    next();
  });
}

// Middleware: Verify token AND require user role
export function verifyUser(req, res, next) {
  verifyToken(req, res, () => {
    if (req.user.role !== 'user') {
      return res.status(403).json({ error: 'Access denied. User privileges required.' });
    }
    next();
  });
}

export { JWT_SECRET };
