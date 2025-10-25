const express = require('express');
const router = express.Router();

module.exports = (db) => {
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

      const [id] = await db('employees').insert({
        name,
        email,
        phone: phone || null,
        role,
        pin_hash,
        status,
        can_access_remotely,
        salary_type,
        fixed_salary,
        commission_rate,
        deletion_status: 'Active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      res.json({ success: true, message: 'Employee created', data: { id } });
    } catch (error) {
      console.error('Error creating employee:', error);
      res.status(500).json({ success: false, message: 'Failed to create employee' });
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

  return router;
};
