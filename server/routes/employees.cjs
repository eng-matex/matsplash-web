const express = require('express');
const bcrypt = require('bcryptjs');
const { db } = require('../database');

const router = express.Router();

// Get all employees
router.get('/', async (req, res) => {
  try {
    const { role, status, limit = 100 } = req.query;
    
    let query = db('employees')
      .where('deletion_status', 'Active')
      .select('id', 'name', 'email', 'phone', 'role', 'status', 'created_at', 'last_login', 'salary', 'commission_rate', 'has_commission', 'department', 'address', 'emergency_contact', 'emergency_phone', 'notes')
      .orderBy('name')
      .limit(parseInt(limit));

    if (role) {
      query = query.where('role', role);
    }

    if (status) {
      query = query.where('status', status);
    }

    const employees = await query;

    const formattedEmployees = employees.map((emp) => ({
      id: emp.id,
      name: emp.name,
      email: emp.email,
      phone: emp.phone,
      role: emp.role,
      department: emp.department,
      status: emp.status,
      salary: emp.salary || 0,
      commission_rate: emp.commission_rate || 0,
      has_commission: emp.has_commission || false,
      address: emp.address,
      emergency_contact: emp.emergency_contact,
      emergency_phone: emp.emergency_phone,
      notes: emp.notes,
      is_active: emp.status === 'active',
      created_at: emp.created_at,
      last_login: emp.last_login
    }));

    res.json({
      success: true,
      data: formattedEmployees
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
      .andWhere('deletion_status', 'Active')
      .select('id', 'name', 'email', 'phone', 'role', 'status', 'created_at', 'last_login', 'salary', 'commission_rate', 'has_commission', 'department', 'address', 'emergency_contact', 'emergency_phone', 'notes')
      .first();

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    const formattedEmployee = {
      id: employee.id,
      name: employee.name,
      email: employee.email,
      phone: employee.phone,
      role: employee.role,
      department: employee.department,
      status: employee.status,
      salary: employee.salary || 0,
      commission_rate: employee.commission_rate || 0,
      has_commission: employee.has_commission || false,
      address: employee.address,
      emergency_contact: employee.emergency_contact,
      emergency_phone: employee.emergency_phone,
      notes: employee.notes,
      is_active: employee.status === 'active',
      created_at: employee.created_at,
      last_login: employee.last_login
    };

    res.json({
      success: true,
      data: formattedEmployee
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
router.post('/', async (req, res) => {
  try {
    const employeeData = req.body;

    // Validate required fields
    if (!employeeData.name || !employeeData.email || !employeeData.role) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and role are required'
      });
    }

    // Check if email already exists
    const existingEmployee = await db('employees')
      .where('email', employeeData.email)
      .first();

    if (existingEmployee) {
      return res.status(400).json({
        success: false,
        message: 'Employee with this email already exists'
      });
    }

    // Hash default PIN
    const saltRounds = 10;
    const defaultPin = '1111';
    const pinHash = await bcrypt.hash(defaultPin, saltRounds);

    const newEmployee = {
      name: employeeData.name,
      email: employeeData.email,
      phone: employeeData.phone || '',
      role: employeeData.role,
      department: employeeData.department || 'General',
      position: employeeData.position || employeeData.role,
      salary: employeeData.salary || 0,
      commission_rate: employeeData.commission_rate || 0,
      has_commission: employeeData.has_commission || false,
      address: employeeData.address || '',
      emergency_contact: employeeData.emergency_contact || '',
      emergency_phone: employeeData.emergency_phone || '',
      notes: employeeData.notes || '',
      status: employeeData.status || 'active',
      pin_hash: pinHash,
      is_active: true,
      deletion_status: 'Active',
      is_archived: false,
      first_login: true,
      created_by: employeeData.created_by || 1,
      hire_date: employeeData.hire_date || new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const [employeeId] = await db('employees').insert(newEmployee);

    // Log system activity
    try {
      await db('system_activity').insert({
        user_id: employeeData.created_by || 1,
        user_email: 'system',
        action: 'EMPLOYEE_CREATED',
        details: `Created employee ${employeeData.name} (${employeeData.email}) with role ${employeeData.role}`,
        ip_address: req.ip || '127.0.0.1',
        user_agent: req.get('User-Agent') || 'Unknown',
        activity_type: 'EMPLOYEE_MANAGEMENT',
        created_at: new Date().toISOString()
      });
    } catch (logError) {
      console.error('Error logging system activity:', logError);
      // Don't fail the employee creation if logging fails
    }

    // Get the created employee
    const createdEmployee = await db('employees')
      .where('id', employeeId)
      .select('id', 'name', 'email', 'phone', 'role', 'status', 'created_at', 'last_login', 'salary', 'commission_rate', 'has_commission', 'department', 'address', 'emergency_contact', 'emergency_phone', 'notes')
      .first();

    const formattedEmployee = {
      id: createdEmployee.id,
      name: createdEmployee.name,
      email: createdEmployee.email,
      phone: createdEmployee.phone,
      role: createdEmployee.role,
      department: createdEmployee.department,
      status: createdEmployee.status,
      salary: createdEmployee.salary || 0,
      commission_rate: createdEmployee.commission_rate || 0,
      has_commission: createdEmployee.has_commission || false,
      address: createdEmployee.address,
      emergency_contact: createdEmployee.emergency_contact,
      emergency_phone: createdEmployee.emergency_phone,
      notes: createdEmployee.notes,
      is_active: createdEmployee.status === 'active',
      created_at: createdEmployee.created_at,
      last_login: createdEmployee.last_login
    };

    res.status(201).json({
      success: true,
      data: formattedEmployee,
      message: 'Employee created successfully'
    });

  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create employee: ' + error.message
    });
  }
});

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

    // Log system activity
    try {
      if (updateData.userId) {
        await db('system_activity').insert({
          user_id: updateData.userId,
          user_email: req.body.userEmail || 'unknown',
          action: 'EMPLOYEE_UPDATED',
          details: `Updated employee ${id}`,
          ip_address: req.ip || '127.0.0.1',
          user_agent: req.get('User-Agent') || 'Unknown',
          activity_type: 'EMPLOYEE_MANAGEMENT',
          created_at: new Date().toISOString()
        });
      }
    } catch (logError) {
      console.error('Error logging system activity:', logError);
    }

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
    const { userId } = req.body;

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

    // Log system activity
    try {
      if (userId) {
        await db('system_activity').insert({
          user_id: userId,
          user_email: req.body.userEmail || 'unknown',
          action: 'EMPLOYEE_DELETED',
          details: `Deleted employee ${employee.name} (${employee.email})`,
          ip_address: req.ip || '127.0.0.1',
          user_agent: req.get('User-Agent') || 'Unknown',
          activity_type: 'EMPLOYEE_MANAGEMENT',
          created_at: new Date().toISOString()
        });
      }
    } catch (logError) {
      console.error('Error logging system activity:', logError);
    }

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
    const { userId } = req.body;

    // Hash default PIN
    const saltRounds = 10;
    const defaultPin = '1111';
    const pinHash = await bcrypt.hash(defaultPin, saltRounds);

    await db('employees')
      .where('id', id)
      .update({
        pin_hash: pinHash,
        first_login: true,
        updated_at: new Date().toISOString()
      });

    // Log system activity
    try {
      if (userId) {
        await db('system_activity').insert({
          user_id: userId,
          user_email: req.body.userEmail || 'unknown',
          action: 'EMPLOYEE_PIN_RESET',
          details: `Reset PIN for employee ${id}`,
          ip_address: req.ip || '127.0.0.1',
          user_agent: req.get('User-Agent') || 'Unknown',
          activity_type: 'EMPLOYEE_MANAGEMENT',
          created_at: new Date().toISOString()
        });
      }
    } catch (logError) {
      console.error('Error logging system activity:', logError);
    }

    res.json({
      success: true,
      message: 'Employee PIN reset successfully'
    });

  } catch (error) {
    console.error('Error resetting employee PIN:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset employee PIN'
    });
  }
});

module.exports = router;
