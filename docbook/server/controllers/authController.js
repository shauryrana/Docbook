const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'medislot_super_secret_jwt_key_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Helper to generate JWT token
const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

/**
 * Register a new patient
 * POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email address format.' });
    }

    // Check if user already exists
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email is already registered.' });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert patient
    const insertQuery = `
      INSERT INTO users (name, email, password_hash, role)
      VALUES ($1, $2, $3, 'patient')
      RETURNING id, name, email, role, created_at;
    `;
    const result = await db.query(insertQuery, [name.trim(), email.toLowerCase().trim(), passwordHash]);
    const newUser = result.rows[0];

    const token = generateToken({
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
    });

    return res.status(201).json({
      message: 'Registration successful.',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Log in an existing user (patient, doctor, admin)
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    // Look up user
    const userQuery = 'SELECT * FROM users WHERE email = $1';
    const result = await db.query(userQuery, [email.toLowerCase().trim()]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = result.rows[0];

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // If role is doctor, retrieve doctor table id
    let doctorId = null;
    if (user.role === 'doctor') {
      const docQuery = 'SELECT id FROM doctors WHERE user_id = $1';
      const docRes = await db.query(docQuery, [user.id]);
      if (docRes.rows.length > 0) {
        doctorId = docRes.rows[0].id;
      }
    }

    const tokenPayload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      doctor_id: doctorId,
    };

    const token = generateToken(tokenPayload);

    return res.status(200).json({
      message: 'Login successful.',
      token,
      user: tokenPayload,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get current authenticated user profile
 * GET /api/auth/me
 */
const getMe = async (req, res, next) => {
  try {
    const userQuery = 'SELECT id, name, email, role, created_at FROM users WHERE id = $1';
    const result = await db.query(userQuery, [req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const user = result.rows[0];
    let doctorId = req.user.doctor_id || null;

    if (user.role === 'doctor' && !doctorId) {
      const docRes = await db.query('SELECT id FROM doctors WHERE user_id = $1', [user.id]);
      if (docRes.rows.length > 0) doctorId = docRes.rows[0].id;
    }

    res.json({
      user: {
        ...user,
        doctor_id: doctorId,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
  getMe,
};
