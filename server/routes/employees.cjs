const express = require('express');
const router = express.Router();

module.exports = (db) => {

  // Get all employees
  router.get('/', async (req, res) => {
    try {
      const { role, status, limit = 100 } = req.query;
      
      let query = db('employees')
        .where('deletion_status', 'Active')
        .select('id', 'name', 'email', 'phone', 'role', 'status', 'created_at', 'last_login', 'salary_type', 'fixed_salary', 'commission_rate', 'can_access_remotely')
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

  return router;
};
