const express = require('express');
const router = express.Router();

module.exports = (db) => {
  // Router-level log to verify mount and route matching
  router.use((req, _res, next) => {
    try {
      console.log(`[employees] ${req.method} ${req.originalUrl}`);
    } catch {}
    next();
  });
  const createEmployeeHandler = async (req, res) => {
    try {
      const {
        name,
        email,
        phone,
        role,
        pin,
        status = 'active',
        can_access_remotely = 0,
        salary_type = 'fixed',
        fixed_salary = null,
        commission_rate = null
      } = req.body;

      if (!name || !role || !pin || !email) {
        return res.status(400).json({ success: false, message: 'Name, email, role and PIN are required' });
      }

      const bcrypt = require('bcryptjs');
      const pin_hash = await bcrypt.hash(pin, 10);

      // Normalize/validate inputs
      const normalizedEmail = String(email).trim().toLowerCase();
      const normalizedPhone = phone ? String(phone).trim() : null;
      const normalizedRole = String(role).trim();
      const normalizedStatus = String(status).trim().toLowerCase();
      const salaryValue = fixed_salary == null || fixed_salary === '' ? null : Number(fixed_salary);
      const commissionValue = commission_rate == null || commission_rate === '' ? null : Number(commission_rate);

      // Uniqueness checks to avoid generic 500s
      const existingByEmail = await db('employees').where({ email: normalizedEmail }).first();
      if (existingByEmail) {
        return res.status(409).json({ success: false, message: 'Email already exists' });
      }
      if (normalizedPhone) {
        const existingByPhone = await db('employees').where({ phone: normalizedPhone }).first();
        if (existingByPhone) {
          return res.status(409).json({ success: false, message: 'Phone already exists' });
        }
      }

      const [id] = await db('employees').insert({
        name,
        email: normalizedEmail,
        phone: normalizedPhone,
        role: normalizedRole,
        pin_hash,
        status: normalizedStatus,
        can_access_remotely,
        salary_type,
        fixed_salary: salaryValue,
        commission_rate: commissionValue,
        deletion_status: 'Active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      res.status(201).json({ success: true, message: 'Employee created', data: { id } });
    } catch (error) {
      console.error('Error creating employee:', error);
      // Provide a clearer error surface for client debugging
      res.status(500).json({ success: false, message: 'Failed to create employee', details: error?.message });
    }
  };

  // Get all employees
  router.get('/', async (req, res) => {
    try {
      const { role, status, limit = 100 } = req.query;
      
      let query = db('employees')
        .where('deletion_status', 'Active')
        .select(
          'id',
          'name',
          'email',
          'phone',
          'role',
          'status',
          'created_at',
          'last_login',
          'salary_type',
          'fixed_salary',
          db.raw('COALESCE(fixed_salary, 0) as salary'),
          'commission_rate',
          'can_access_remotely'
        )
        .orderBy('name')
        .limit(parseInt(limit));

      if (role) {
        query = query.where('role', role);
      }

      if (status) {
        query = query.where('status', status);
      }

      const employees = await query;

      res.json({
        success: true,
        data: employees
      });

    } catch (error) {
      console.error('Error fetching employees:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch employees'
      });
    }
  });

  // Get employee by ID
  router.get('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      const employee = await db('employees')
        .where('id', id)
        .where('deletion_status', 'Active')
        .first();

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: 'Employee not found'
        });
      }

      res.json({
        success: true,
        data: employee
      });

    } catch (error) {
      console.error('Error fetching employee:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch employee'
      });
    }
  });

  // Create new employee
  router.post('/', createEmployeeHandler);
  router.post('/create', createEmployeeHandler);

  // Update employee
  router.put('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Remove fields that shouldn't be updated directly
      delete updateData.id;
      delete updateData.pin_hash;
      delete updateData.created_at;

      updateData.updated_at = new Date().toISOString();

      await db('employees').where('id', id).update(updateData);

      res.json({
        success: true,
        message: 'Employee updated successfully'
      });

    } catch (error) {
      console.error('Error updating employee:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update employee'
      });
    }
  });

  // Delete employee (soft delete)
  router.delete('/:id', async (req, res) => {
    try {
      const { id } = req.params;

      // Check if employee exists
      const employee = await db('employees').where('id', id).first();
      if (!employee) {
        return res.status(404).json({
          success: false,
          message: 'Employee not found'
        });
      }

      // Prevent deletion of admin accounts
      if (employee.role === 'Admin') {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete admin accounts'
        });
      }

      // Soft delete by updating deletion_status
      await db('employees')
        .where('id', id)
        .update({
          deletion_status: 'Deleted',
          status: 'inactive',
          updated_at: new Date().toISOString()
        });

      res.json({
        success: true,
        message: 'Employee deleted successfully'
      });

    } catch (error) {
      console.error('Error deleting employee:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete employee'
      });
    }
  });

  // Reset employee PIN
  router.post('/:id/reset-pin', async (req, res) => {
    try {
      const { id } = req.params;
      const { tempPin } = req.body;

      // Validate temporary PIN
      if (!tempPin || tempPin.length < 4 || tempPin.length > 6) {
        return res.status(400).json({
          success: false,
          message: 'Temporary PIN must be 4-6 digits'
        });
      }

      // Hash the custom temporary PIN
      const bcrypt = require('bcryptjs');
      const saltRounds = 10;
      const pinHash = await bcrypt.hash(tempPin, saltRounds);

      await db('employees')
        .where('id', id)
        .update({
          pin_hash: pinHash,
          first_login: true,
          updated_at: new Date().toISOString()
        });

      res.json({
        success: true,
        message: `Employee PIN reset successfully with temporary PIN: ${tempPin}`
      });

    } catch (error) {
      console.error('Error resetting employee PIN:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to reset employee PIN'
      });
    }
  });

  // Admin login as employee
  router.post('/:id/admin-login', async (req, res) => {
    try {
      const { id } = req.params;
      const { adminUserId } = req.body;

      // Get employee details
      const employee = await db('employees')
        .where('id', id)
        .where('deletion_status', 'Active')
        .first();

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: 'Employee not found'
        });
      }

      // Generate temporary admin session token
      const jwt = require('jsonwebtoken');
      const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
      
      const adminToken = jwt.sign(
        { 
          userId: employee.id, 
          email: employee.email, 
          role: employee.role,
          adminUserId: adminUserId,
          isAdminLogin: true
        },
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      res.json({
        success: true,
        message: 'Admin login successful',
        token: adminToken,
        employee: {
          id: employee.id,
          name: employee.name,
          email: employee.email,
          role: employee.role
        }
      });

    } catch (error) {
      console.error('Error with admin login:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to perform admin login'
      });
    }
  });

  // Admin logout
  router.post('/admin-logout', async (req, res) => {
    try {
      // In a real implementation, you might want to blacklist the token
      // For now, we'll just return success
      res.json({
        success: true,
        message: 'Admin logout successful'
      });

    } catch (error) {
      console.error('Error with admin logout:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to perform admin logout'
      });
    }
  });

  return router;
};
