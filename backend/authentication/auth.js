import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { JWT_SECRET, verifyToken, verifyUser } from './middleware.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { uploadProfileImage } from '../middleware/upload.js';
import {
  validate,
  registerValidator,
  mechanicRegisterValidator,
  loginValidator,
  profileUpdateValidator,
  changePasswordValidator,
  forgotPasswordValidator,
  resetPasswordValidator
} from './validators.js';

const router = Router();
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'roadrescue_jwt_refresh_secret_change_in_production';

// Helper: Generate Access and Refresh Tokens
function generateTokens(payload) {
  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
}

// Helper: Store Refresh Token in DB
function storeRefreshToken(db, token, userId, role) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  db.prepare(`
    INSERT INTO refresh_tokens (token, user_id, role, expires_at, blacklisted)
    VALUES (?, ?, ?, ?, 0)
  `).run(token, userId, role);
}

// POST /api/auth/register - Register a new user
router.post('/register', authLimiter, registerValidator, validate, async (req, res) => {
  const { db } = req;
  const { name, email, phone, password, vehicleType, vehicleNumber, emergencyContact } = req.body;

  try {
    // Check if user already exists in users or mechanics or admins
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.', error: 'Conflict' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const userId = `user-${uuidv4().substring(0, 8)}`;

    db.prepare(`
      INSERT INTO users (id, name, email, phone, password_hash, vehicle_type, vehicle_number, emergency_contact, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')
    `).run(userId, name, email, phone, hashedPassword, vehicleType || 'Sedan', vehicleNumber || '', emergencyContact || '');

    const { accessToken, refreshToken } = generateTokens({ id: userId, email, role: 'user' });
    storeRefreshToken(db, refreshToken, userId, 'user');

    res.status(201).json({
      success: true,
      message: 'Registration successful.',
      token: accessToken,
      refreshToken,
      user: { id: userId, name, email, phone, role: 'user' }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: 'Failed to create account.', error: err.message });
  }
});

// POST /api/auth/mechanic/register - Register a new mechanic (Pending Approval)
router.post('/mechanic/register', authLimiter, mechanicRegisterValidator, validate, async (req, res) => {
  const { db } = req;
  const { name, email, phone, password, experienceYears, specialization } = req.body;

  try {
    const existing = db.prepare('SELECT id FROM mechanics WHERE email = ?').get(email);
    if (existing) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.', error: 'Conflict' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const mechanicId = `mech-${uuidv4().substring(0, 8)}`;

    db.prepare(`
      INSERT INTO mechanics (id, name, phone, email, password_hash, role, experience_years, rating, total_jobs, status, specialization, approval_status)
      VALUES (?, ?, ?, ?, ?, 'mechanic', ?, 4.5, 0, 'available', ?, 'pending')
    `).run(mechanicId, name, phone, email, hashedPassword, experienceYears || 0, specialization || 'General Repair');

    res.status(201).json({
      success: true,
      message: 'Registration successful. Your account is pending admin approval.',
      mechanic: { id: mechanicId, name, email, phone, role: 'mechanic', status: 'pending' }
    });
  } catch (err) {
    console.error('Mechanic register error:', err);
    res.status(500).json({ success: false, message: 'Failed to register mechanic.', error: err.message });
  }
});

// POST /api/auth/login - User login
router.post('/login', authLimiter, loginValidator, validate, async (req, res) => {
  const { db } = req;
  const { email, password } = req.body;

  try {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.', error: 'Unauthorized' });
    }

    // Verify account status
    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: `Your account is ${user.status}. Please contact support.`,
        error: 'Forbidden'
      });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.', error: 'Unauthorized' });
    }

    const { accessToken, refreshToken } = generateTokens({ id: user.id, email: user.email, role: 'user' });
    storeRefreshToken(db, refreshToken, user.id, 'user');

    res.json({
      success: true,
      message: 'Login successful.',
      token: accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        vehicle_type: user.vehicle_type,
        vehicle_number: user.vehicle_number,
        profileImage: user.profile_image,
        role: 'user'
      }
    });
  } catch (err) {
    console.error('User login error:', err);
    res.status(500).json({ success: false, message: 'Login failed.', error: err.message });
  }
});

// POST /api/auth/mechanic/login - Mechanic login
router.post('/mechanic/login', authLimiter, loginValidator, validate, async (req, res) => {
  const { db } = req;
  const { email, password } = req.body;

  try {
    const mechanic = db.prepare('SELECT * FROM mechanics WHERE email = ?').get(email);
    if (!mechanic) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.', error: 'Unauthorized' });
    }

    // Verify mechanic approval status
    if (mechanic.approval_status !== 'approved') {
      let statusMsg = 'Your account is pending admin approval.';
      if (mechanic.approval_status === 'blocked') statusMsg = 'Your account is blocked. Please contact support.';
      if (mechanic.approval_status === 'rejected') statusMsg = 'Your application was rejected.';
      return res.status(403).json({
        success: false,
        message: statusMsg,
        error: 'Forbidden'
      });
    }

    if (!mechanic.password_hash) {
      return res.status(401).json({ success: false, message: 'No password set for this account. Contact admin.', error: 'Unauthorized' });
    }

    const validPassword = await bcrypt.compare(password, mechanic.password_hash);
    if (!validPassword) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.', error: 'Unauthorized' });
    }

    const { accessToken, refreshToken } = generateTokens({ id: mechanic.id, email: mechanic.email, role: 'mechanic' });
    storeRefreshToken(db, refreshToken, mechanic.id, 'mechanic');

    res.json({
      success: true,
      message: 'Login successful.',
      token: accessToken,
      refreshToken,
      mechanic: {
        id: mechanic.id,
        name: mechanic.name,
        email: mechanic.email,
        phone: mechanic.phone,
        role: 'mechanic',
        specialization: mechanic.specialization,
        status: mechanic.status,
        rating: mechanic.rating,
        profileImage: mechanic.profile_image
      }
    });
  } catch (err) {
    console.error('Mechanic login error:', err);
    res.status(500).json({ success: false, message: 'Login failed.', error: err.message });
  }
});

// POST /api/auth/admin/login - Admin login
router.post('/admin/login', authLimiter, loginValidator, validate, async (req, res) => {
  const { db } = req;
  const { email, password } = req.body;

  try {
    const admin = db.prepare('SELECT * FROM admins WHERE email = ?').get(email);
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.', error: 'Unauthorized' });
    }

    // Secure BCrypt authentication only (legacy plaintext fallback removed)
    const validPassword = await bcrypt.compare(password, admin.password_hash);
    if (!validPassword) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.', error: 'Unauthorized' });
    }

    const { accessToken, refreshToken } = generateTokens({ id: admin.id, email: admin.email, role: 'admin' });
    storeRefreshToken(db, refreshToken, admin.id, 'admin');

    res.json({
      success: true,
      message: 'Login successful.',
      token: accessToken,
      refreshToken,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ success: false, message: 'Login failed.', error: err.message });
  }
});

// POST /api/auth/refresh - Refresh Access Token
router.post('/refresh', async (req, res) => {
  const { db } = req;
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ success: false, message: 'Refresh token is required.', error: 'Bad Request' });
  }

  try {
    // 1. Verify token exists in database and is not blacklisted
    const storedToken = db.prepare('SELECT * FROM refresh_tokens WHERE token = ? AND blacklisted = 0').get(refreshToken);
    if (!storedToken) {
      return res.status(401).json({ success: false, message: 'Invalid or revoked refresh token.', error: 'Unauthorized' });
    }

    // 2. Verify token signature and expiration
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    } catch (jwtErr) {
      // If signature is invalid or expired, delete from DB and reject
      db.prepare('DELETE FROM refresh_tokens WHERE token = ?').run(refreshToken);
      return res.status(401).json({ success: false, message: 'Expired or tampered refresh token.', error: 'Unauthorized' });
    }

    // 3. Generate new Access and Refresh tokens (Token Rotation)
    const { accessToken, refreshToken: newRefreshToken } = generateTokens({
      id: decoded.id,
      email: decoded.email,
      role: decoded.role
    });

    // Replace old refresh token with new one in database
    db.prepare('DELETE FROM refresh_tokens WHERE token = ?').run(refreshToken);
    storeRefreshToken(db, newRefreshToken, decoded.id, decoded.role);

    res.json({
      success: true,
      message: 'Token refreshed successfully.',
      token: accessToken,
      refreshToken: newRefreshToken
    });
  } catch (err) {
    console.error('Token refresh error:', err);
    res.status(500).json({ success: false, message: 'Failed to refresh token.', error: err.message });
  }
});

// POST /api/auth/logout - Logout user / revoke refresh token
router.post('/logout', async (req, res) => {
  const { db } = req;
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ success: false, message: 'Refresh token is required.', error: 'Bad Request' });
  }

  try {
    db.prepare('DELETE FROM refresh_tokens WHERE token = ?').run(refreshToken);
    res.json({ success: true, message: 'Logout successful.' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ success: false, message: 'Logout failed.', error: err.message });
  }
});

// GET /api/auth/me - Get current user profile
router.get('/me', verifyToken, async (req, res) => {
  const { db } = req;
  const { id, role } = req.user;

  try {
    if (role === 'admin' || role === 'super_admin') {
      const admin = db.prepare('SELECT id, name, email, role FROM admins WHERE id = ?').get(id);
      if (!admin) return res.status(404).json({ success: false, message: 'Admin not found.' });
      return res.json({ success: true, user: { ...admin, role: 'admin' } });
    } else if (role === 'mechanic') {
      const mechanic = db.prepare('SELECT id, name, email, phone, role, experience_years, rating, total_jobs, status, specialization, approval_status, profile_image, address, city FROM mechanics WHERE id = ?').get(id);
      if (!mechanic) return res.status(404).json({ success: false, message: 'Mechanic not found.' });
      return res.json({ success: true, user: { ...mechanic, profileImage: mechanic.profile_image } });
    } else {
      const user = db.prepare('SELECT id, name, email, phone, role, vehicle_type, vehicle_number, status, profile_image, address, city, vehicle FROM users WHERE id = ?').get(id);
      if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
      return res.json({ success: true, user: { ...user, profileImage: user.profile_image } });
    }
  } catch (err) {
    console.error('Get profile (me) error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve profile.', error: err.message });
  }
});

// PUT /api/auth/profile - Update user profile
router.put('/profile', verifyToken, profileUpdateValidator, validate, async (req, res) => {
  const { db } = req;
  const { id, role } = req.user;
  const { name, phone, address, city, vehicle, profileImage } = req.body;

  try {
    if (role === 'user') {
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
      if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

      db.prepare(`
        UPDATE users 
        SET name = ?, phone = ?, address = ?, city = ?, vehicle = ?, profile_image = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        name !== undefined ? name : user.name,
        phone !== undefined ? phone : user.phone,
        address !== undefined ? address : user.address,
        city !== undefined ? city : user.city,
        vehicle !== undefined ? vehicle : user.vehicle,
        profileImage !== undefined ? profileImage : user.profile_image,
        id
      );

      const updated = db.prepare('SELECT id, name, email, phone, vehicle_type, vehicle_number, profile_image, address, city, vehicle FROM users WHERE id = ?').get(id);
      return res.json({
        success: true,
        message: 'Profile updated successfully.',
        user: { ...updated, role: 'user', profileImage: updated.profile_image }
      });
    } else if (role === 'mechanic') {
      const mechanic = db.prepare('SELECT * FROM mechanics WHERE id = ?').get(id);
      if (!mechanic) return res.status(404).json({ success: false, message: 'Mechanic not found.' });

      db.prepare(`
        UPDATE mechanics 
        SET name = ?, phone = ?, address = ?, city = ?, profile_image = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        name !== undefined ? name : mechanic.name,
        phone !== undefined ? phone : mechanic.phone,
        address !== undefined ? address : mechanic.address,
        city !== undefined ? city : mechanic.city,
        profileImage !== undefined ? profileImage : mechanic.profile_image,
        id
      );

      const updated = db.prepare('SELECT id, name, email, phone, specialization, status, rating, profile_image, address, city FROM mechanics WHERE id = ?').get(id);
      return res.json({
        success: true,
        message: 'Profile updated successfully.',
        mechanic: { ...updated, role: 'mechanic', profileImage: updated.profile_image }
      });
    } else {
      return res.status(403).json({ success: false, message: 'Admins cannot update their profiles via this route.' });
    }
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ success: false, message: 'Failed to update profile.', error: err.message });
  }
});

// POST /api/auth/profile/image - Upload profile image file using Multer
router.post('/profile/image', verifyToken, uploadProfileImage.single('profileImage'), async (req, res) => {
  const { db } = req;
  const { id, role } = req.user;

  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Please upload an image file.', error: 'Bad Request' });
  }

  const imageUrl = `/uploads/profile/${req.file.filename}`;

  try {
    if (role === 'user') {
      db.prepare('UPDATE users SET profile_image = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(imageUrl, id);
    } else if (role === 'mechanic') {
      db.prepare('UPDATE mechanics SET profile_image = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(imageUrl, id);
    } else {
      return res.status(403).json({ success: false, message: 'Profile uploads not supported for admins.' });
    }

    res.json({
      success: true,
      message: 'Profile image uploaded successfully.',
      imageUrl
    });
  } catch (err) {
    console.error('Profile image upload db error:', err);
    res.status(500).json({ success: false, message: 'Failed to save profile image reference.', error: err.message });
  }
});

// PUT /api/auth/change-password - Change user password
router.put('/change-password', verifyToken, changePasswordValidator, validate, async (req, res) => {
  const { db } = req;
  const { id, role } = req.user;
  const { oldPassword, newPassword } = req.body;

  try {
    let passwordHash;
    let tableName;

    if (role === 'admin' || role === 'super_admin') {
      const admin = db.prepare('SELECT password_hash FROM admins WHERE id = ?').get(id);
      if (!admin) return res.status(404).json({ success: false, message: 'Admin not found.' });
      passwordHash = admin.password_hash;
      tableName = 'admins';
    } else if (role === 'mechanic') {
      const mechanic = db.prepare('SELECT password_hash FROM mechanics WHERE id = ?').get(id);
      if (!mechanic) return res.status(404).json({ success: false, message: 'Mechanic not found.' });
      passwordHash = mechanic.password_hash;
      tableName = 'mechanics';
    } else {
      const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(id);
      if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
      passwordHash = user.password_hash;
      tableName = 'users';
    }

    const validPassword = await bcrypt.compare(oldPassword, passwordHash);
    if (!validPassword) {
      return res.status(400).json({ success: false, message: 'Incorrect current password.' });
    }

    const newHashedPassword = await bcrypt.hash(newPassword, 12);
    db.prepare(`UPDATE ${tableName} SET password_hash = ? WHERE id = ?`).run(newHashedPassword, id);

    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ success: false, message: 'Failed to change password.', error: err.message });
  }
});

// POST /api/auth/forgot-password - Generate Reset Password Link
router.post('/forgot-password', forgotPasswordValidator, validate, async (req, res) => {
  const { db } = req;
  const { email } = req.body;

  try {
    // 1. Search in users or mechanics
    let account = db.prepare('SELECT id, email, role FROM users WHERE email = ?').get(email);
    let type = 'user';

    if (!account) {
      account = db.prepare('SELECT id, email, role FROM mechanics WHERE email = ?').get(email);
      type = 'mechanic';
    }

    if (!account) {
      // For security, don't reveal if account exists. Simply return success but do nothing.
      return res.json({ success: true, message: 'If that email is registered, we have sent a reset password link.' });
    }

    // 2. Generate random reset token (expiring in 1 hour)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 3600000).toISOString(); // 1 hour

    if (type === 'user') {
      db.prepare('UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?').run(resetToken, expiry, account.id);
    } else {
      db.prepare('UPDATE mechanics SET reset_token = ?, reset_token_expiry = ? WHERE id = ?').run(resetToken, expiry, account.id);
    }

    // 3. Log the reset password link (simulate email service)
    const resetLink = `http://localhost:3000/reset-password?token=${resetToken}`;
    console.log('\n=======================================');
    console.log(`[EMAIL SIMULATOR] Reset password for ${email}`);
    console.log(`Reset link: ${resetLink}`);
    console.log('=======================================\n');

    res.json({
      success: true,
      message: 'If that email is registered, we have sent a reset password link.'
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ success: false, message: 'Failed to generate reset link.', error: err.message });
  }
});

// POST /api/auth/reset-password - Reset password using Token
router.post('/reset-password', resetPasswordValidator, validate, async (req, res) => {
  const { db } = req;
  const { token, newPassword } = req.body;

  try {
    const now = new Date().toISOString();

    // Search in users or mechanics
    let account = db.prepare('SELECT id, role FROM users WHERE reset_token = ? AND reset_token_expiry > ?').get(token, now);
    let type = 'user';

    if (!account) {
      account = db.prepare('SELECT id, role FROM mechanics WHERE reset_token = ? AND reset_token_expiry > ?').get(token, now);
      type = 'mechanic';
    }

    if (!account) {
      return res.status(400).json({ success: false, message: 'Invalid or expired password reset token.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    if (type === 'user') {
      db.prepare('UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?').run(hashedPassword, account.id);
    } else {
      db.prepare('UPDATE mechanics SET password_hash = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?').run(hashedPassword, account.id);
    }

    res.json({ success: true, message: 'Password reset successfully. You can now login.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ success: false, message: 'Failed to reset password.', error: err.message });
  }
});

export default router;
