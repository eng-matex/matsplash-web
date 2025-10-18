import * as express from 'express';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { db } from '../database';
import { User, LoginRequest, LoginResponse, ApiResponse } from '../../src/types';

const router = express.Router();

// JWT Secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'matsplash-secret-key-2024';

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { emailOrPhone, pin }: LoginRequest = req.body;

    if (!emailOrPhone || !pin) {
      return res.status(400).json({
        success: false,
        message: 'Email/Phone and PIN are required'
      } as ApiResponse);
    }

    console.log('Login attempt:', { emailOrPhone, pin: 'PROVIDED' });

    // Find user by email or phone
    const user = await db('employees')
      .where(function() {
        this.where('email', emailOrPhone).orWhere('phone', emailOrPhone);
      })
      .andWhere('status', 'active')
      .andWhere('deletion_status', 'Active')
      .first();

    if (!user) {
      console.log('User not found:', emailOrPhone);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      } as ApiResponse);
    }

    console.log('User found by email:', { id: user.id, name: user.name, email: user.email });

    // Check if it's first login
    if (user.first_login) {
      console.log('Is first login?', user.first_login);
      const userResponse: User = {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isEmployee: user.role !== 'Admin' && user.role !== 'Director',
        isActive: user.status === 'active',
        createdAt: user.created_at,
        first_login: user.first_login
      };

      return res.status(200).json({
        success: true,
        firstLogin: true,
        user: userResponse,
        message: 'First login detected. Please change your PIN.'
      } as LoginResponse);
    }

    // Verify PIN
    console.log('Comparing PIN for user:', user.name);
    const isPinValid = await bcrypt.compare(pin, user.pin_hash);
    console.log('PIN match result:', isPinValid);

    if (!isPinValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid PIN'
      } as ApiResponse);
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Update last login
    await db('employees')
      .where('id', user.id)
      .update({ 
        last_login: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    // Log system activity
    await db('system_activity').insert({
      user_id: user.id,
      user_email: user.email,
      action: 'LOGIN',
      details: `User logged in successfully`,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      created_at: new Date().toISOString()
    });

    console.log('Login successful for:', user.name);

    const userResponse: User = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isEmployee: user.role !== 'Admin' && user.role !== 'Director',
      isActive: user.status === 'active',
      createdAt: user.created_at,
      lastLogin: user.last_login,
      first_login: user.first_login,
      salary_type: user.salary_type,
      fixed_salary: user.fixed_salary,
      commission_rate: user.commission_rate,
      can_access_remotely: user.can_access_remotely
    };

    res.json({
      success: true,
      user: userResponse,
      token,
      message: 'Login successful'
    } as LoginResponse);

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    } as ApiResponse);
  }
});

// Change PIN endpoint (for first login)
router.post('/change-pin', async (req, res) => {
  try {
    const { userId, newPin } = req.body;

    if (!userId || !newPin) {
      return res.status(400).json({
        success: false,
        message: 'User ID and new PIN are required'
      } as ApiResponse);
    }

    // Hash the new PIN
    const saltRounds = 10;
    const pinHash = await bcrypt.hash(newPin, saltRounds);

    // Update user's PIN and set first_login to false
    await db('employees')
      .where('id', userId)
      .update({
        pin_hash: pinHash,
        first_login: false,
        updated_at: new Date().toISOString()
      });

    // Log system activity
    await db('system_activity').insert({
      user_id: userId,
      user_email: req.body.userEmail || 'unknown',
      action: 'PIN_CHANGE',
      details: 'User changed PIN on first login',
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      created_at: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'PIN changed successfully'
    } as ApiResponse);

  } catch (error) {
    console.error('Change PIN error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    } as ApiResponse);
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
      } as ApiResponse);
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Get user from database
    const user = await db('employees')
      .where('id', decoded.userId)
      .andWhere('status', 'active')
      .andWhere('deletion_status', 'Active')
      .first();

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      } as ApiResponse);
    }

    const userResponse: User = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isEmployee: user.role !== 'Admin' && user.role !== 'Director',
      isActive: user.status === 'active',
      createdAt: user.created_at,
      lastLogin: user.last_login,
      first_login: user.first_login,
      salary_type: user.salary_type,
      fixed_salary: user.fixed_salary,
      commission_rate: user.commission_rate,
      can_access_remotely: user.can_access_remotely
    };

    res.json({
      success: true,
      user: userResponse
    } as ApiResponse);

  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    } as ApiResponse);
  }
});

// Logout endpoint
router.post('/logout', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      // Log system activity
      await db('system_activity').insert({
        user_id: decoded.userId,
        user_email: decoded.email,
        action: 'LOGOUT',
        details: 'User logged out',
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
        created_at: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    } as ApiResponse);

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    } as ApiResponse);
  }
});

export default router;
