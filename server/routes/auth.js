const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const knex = require('knex');

const router = express.Router();

// Database configuration
const db = knex({
  client: 'sqlite3',
  connection: {
    filename: './database.sqlite'
  },
  useNullAsDefault: true
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { emailOrPhone, pin } = req.body;

    if (!emailOrPhone || !pin) {
      return res.status(400).json({
        success: false,
        message: 'Email/Phone and PIN are required'
      });
    }

    // Find employee by email or phone
    const employee = await db('employees')
      .where(function() {
        this.where('email', emailOrPhone)
            .orWhere('phone', emailOrPhone);
      })
      .first();

    if (!employee) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if employee is active
    if (employee.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Account is inactive'
      });
    }

    // Verify PIN
    const isValidPin = await bcrypt.compare(pin, employee.pin_hash);
    if (!isValidPin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    await db('employees')
      .where('id', employee.id)
      .update({ last_login: new Date().toISOString() });

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: employee.id, 
        email: employee.email, 
        role: employee.role 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // Return user data (without sensitive information)
    const userData = {
      id: employee.id,
      name: employee.name,
      email: employee.email,
      phone: employee.phone,
      role: employee.role,
      department: employee.department,
      status: employee.status,
      first_login: employee.first_login,
      last_login: new Date().toISOString()
    };

    res.json({
      success: true,
      message: 'Login successful',
      user: userData,
      token: token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Verify token endpoint
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Get fresh user data
    const employee = await db('employees')
      .where('id', decoded.id)
      .first();

    if (!employee || employee.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    const userData = {
      id: employee.id,
      name: employee.name,
      email: employee.email,
      phone: employee.phone,
      role: employee.role,
      department: employee.department,
      status: employee.status,
      first_login: employee.first_login,
      last_login: employee.last_login
    };

    res.json({
      success: true,
      user: userData
    });

  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
});

// Logout endpoint
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logout successful'
  });
});

module.exports = router;
