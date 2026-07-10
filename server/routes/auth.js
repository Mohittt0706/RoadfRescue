import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { JWT_SECRET } from '../middleware/auth.js';

const router = Router();

// POST /api/auth/register - Register a new user
router.post('/register', async (req, res) => {
  const { db } = req;
  const { name, email, phone, password, vehicleType, vehicleNumber, emergencyContact } = req.body;

  if (!name || !email || !phone || !password) {
    return res.status(400).json({ error: 'Name, email, phone, and password are required.' });
  }

  // Check if user already exists
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 12);
    const userId = `user-${uuidv4().substring(0, 8)}`;

    db.prepare(`
      INSERT INTO users (id, name, email, phone, password_hash, vehicle_type, vehicle_number, emergency_contact)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(userId, name, email, phone, hashedPassword, vehicleType || 'Sedan', vehicleNumber || '', emergencyContact || '');

    const token = jwt.sign({ id: userId, email, role: 'user' }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      success: true,
      token,
      user: { id: userId, name, email, phone, role: 'user' }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Failed to create account.' });
  }
});

// POST /api/auth/login - User login
router.post('/login', async (req, res) => {
  const { db } = req;
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: 'user' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        vehicle_type: user.vehicle_type,
        vehicle_number: user.vehicle_number,
        role: 'user'
      }
    });
  } catch (err) {
    console.error('User login error:', err);
    res.status(500).json({ error: 'Login failed.' });
  }
});

// POST /api/auth/mechanic/login - Mechanic login
router.post('/mechanic/login', async (req, res) => {
  const { db } = req;
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const mechanic = db.prepare('SELECT * FROM mechanics WHERE email = ?').get(email);
    if (!mechanic) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (!mechanic.password_hash) {
      return res.status(401).json({ error: 'No password set for this account. Contact admin.' });
    }

    const validPassword = await bcrypt.compare(password, mechanic.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: mechanic.id, email: mechanic.email, role: 'mechanic' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      mechanic: {
        id: mechanic.id,
        name: mechanic.name,
        email: mechanic.email,
        phone: mechanic.phone,
        role: 'mechanic',
        specialization: mechanic.specialization,
        status: mechanic.status,
        rating: mechanic.rating
      }
    });
  } catch (err) {
    console.error('Mechanic login error:', err);
    res.status(500).json({ error: 'Login failed.' });
  }
});

// POST /api/auth/admin/login - Admin login
router.post('/admin/login', async (req, res) => {
  const { db } = req;
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const admin = db.prepare('SELECT * FROM admins WHERE email = ?').get(email);
    if (!admin) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Support both bcrypt-hashed and legacy plain-text passwords
    let validPassword = false;
    if (admin.password_hash.startsWith('$2')) {
      validPassword = await bcrypt.compare(password, admin.password_hash);
    } else {
      // Legacy plain text password fallback
      validPassword = password === admin.password_hash;
      if (validPassword) {
        // Upgrade to hashed password
        const hashed = await bcrypt.hash(password, 12);
        db.prepare('UPDATE admins SET password_hash = ? WHERE id = ?').run(hashed, admin.id);
      }
    }

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: 'admin' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ error: 'Login failed.' });
  }
});

// GET /api/auth/me - Get current user from token
router.get('/me', async (req, res) => {
  const { db } = req;
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.role === 'admin') {
      const admin = db.prepare('SELECT id, name, email, role FROM admins WHERE id = ?').get(decoded.id);
      if (!admin) return res.status(401).json({ error: 'Admin not found' });
      return res.json({ ...admin, role: 'admin' });
    } else if (decoded.role === 'mechanic') {
      const mechanic = db.prepare('SELECT id, name, email, phone, specialization, status, rating, role FROM mechanics WHERE id = ?').get(decoded.id);
      if (!mechanic) return res.status(401).json({ error: 'Mechanic not found' });
      return res.json({ ...mechanic, role: 'mechanic' });
    } else {
      const user = db.prepare('SELECT id, name, email, phone, vehicle_type, vehicle_number, role FROM users WHERE id = ?').get(decoded.id);
      if (!user) return res.status(401).json({ error: 'User not found' });
      return res.json({ ...user, role: 'user' });
    }
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
