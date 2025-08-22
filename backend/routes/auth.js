const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { runQuery, getRow } = require('../database/connection');

const router = express.Router();

// JWT secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'hsa-secret-key-change-in-production';

// Generate JWT token
const generateToken = (userId, email) => {
  return jwt.sign(
    { userId, email },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// Verify token middleware
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error: 'Access token required'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      error: 'Invalid or expired token'
    });
  }
};

// User registration
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: 'Password must be at least 6 characters long'
      });
    }

    // Check if user already exists
    const existingUser = await getRow(
      'SELECT id FROM Users WHERE email = ?',
      [email]
    );

    if (existingUser) {
      return res.status(409).json({
        error: 'User with this email already exists'
      });
    }

    // Generate salt and hash password
    const salt = bcrypt.genSaltSync(10);
    const passHash = bcrypt.hashSync(password, salt);

    // Create user
    const userResult = await runQuery(
      'INSERT INTO Users (email, salt, pass_hash) VALUES (?, ?, ?)',
      [email, salt, passHash]
    );

    // Create HSA account for the user
    await runQuery(
      'INSERT INTO Account (user_id, balance) VALUES (?, ?)',
      [userResult.lastID, 0.00]
    );

    // Generate JWT token
    const token = generateToken(userResult.lastID, email);

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: userResult.lastID,
        email
      },
      token
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Internal server error during registration'
    });
  }
});

// User login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required'
      });
    }

    // Find user
    const user = await getRow(
      'SELECT id, email, pass_hash FROM Users WHERE email = ?',
      [email]
    );

    if (!user) {
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }

    // Verify password
    const isValidPassword = bcrypt.compareSync(password, user.pass_hash);
    
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = generateToken(user.id, user.email);

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email
      },
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Internal server error during login'
    });
  }
});

// Get current user profile
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const user = await getRow(
      'SELECT id, email, created FROM Users WHERE id = ?',
      [req.user.userId]
    );

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        created: user.created
      }
    });

  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({
      error: 'Internal server error while fetching profile'
    });
  }
});

module.exports = { router, verifyToken };
