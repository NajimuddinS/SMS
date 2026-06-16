import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db';
import { AuthRequest } from '../middleware/auth';
import { logActivity } from '../middleware/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_dev_only_123456';

// Helper for JWT generation
const generateToken = (id: string, email: string): string => {
  return jwt.sign({ id, email }, JWT_SECRET, { expiresIn: '7d' });
};

/**
 * POST /auth/signup
 * Register a new administrative user.
 */
export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ success: false, error: 'Name, email, and password are required.' });
      return;
    }

    // Email format validation
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ success: false, error: 'Please enter a valid email address.' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ success: false, error: 'Password must be at least 6 characters long.' });
      return;
    }

    // Check if user exists
    const userCheck = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (userCheck.rows.length > 0) {
      res.status(400).json({ success: false, error: 'User with this email already exists.' });
      return;
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert user
    const insertQuery = `
      INSERT INTO users (name, email, password)
      VALUES ($1, $2, $3)
      RETURNING id, name, email
    `;
    const result = await pool.query(insertQuery, [name, email.toLowerCase(), hashedPassword]);
    const user = result.rows[0];

    // Generate JWT
    const token = generateToken(user.id, user.email);

    // Log this activity
    await logActivity(
      req,
      'USER_SIGNUP',
      `User ${user.name} (${user.email}) registered successfully`
    );

    res.status(201).json({
      success: true,
      token,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * POST /auth/login
 * Log in an existing user.
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, error: 'Email and password are required.' });
      return;
    }

    // Find user
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    if (result.rows.length === 0) {
      res.status(401).json({ success: false, error: 'Invalid credentials.' });
      return;
    }

    const user = result.rows[0];

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ success: false, error: 'Invalid credentials.' });
      return;
    }

    // Generate JWT
    const token = generateToken(user.id, user.email);

    // Log this activity
    await logActivity(
      req,
      'USER_LOGIN',
      `User ${user.name} (${user.email}) logged in successfully`
    );

    res.status(200).json({
      success: true,
      token,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /auth/me
 * Retrieve profile details of authenticated user.
 */
export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Not authenticated.' });
      return;
    }

    const result = await pool.query('SELECT id, name, email, created_at FROM users WHERE id = $1', [userId]);
    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: 'User not found.' });
      return;
    }

    const user = result.rows[0];
    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.created_at,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
