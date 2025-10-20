const express = require('express');
const bcrypt = require('bcryptjs');

module.exports = (db) => {
  const router = express.Router();

// Get all employees
router.get('/', async (req, res) => {
  try {
    const { role, status, limit = 100, userRole } = req.query;
    
    let query = db('employees')
      .where('deletion_status', 'Active')
      .select('id', 'name', 'email', 'phone', 'role', 'status', 'created_at', 'last_login', 'salary', 'commission_rate', 'has_commission', 'commission_type', 'department', 'address', 'emergency_contact', 'emergency_phone', 'notes')
      .orderBy('name')
      .limit(parseInt(limit));

    // Role-based filtering - Manager cannot see Admin/Director
    if (userRole === 'Manager') {
      query = query.whereNotIn('role', ['Admin', 'Director']);
    }

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
      commission_type: emp.commission_type || 'none',
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
      .select('id', 'name', 'email', 'phone', 'role', 'status', 'created_at', 'last_login', 'salary', 'commission_rate', 'has_commission', 'commission_type', 'department', 'address', 'emergency_contact', 'emergency_phone', 'notes')
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
      commission_type: employee.commission_type || 'none',
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
      commission_type: employeeData.commission_type || 'none',
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
      .select('id', 'name', 'email', 'phone', 'role', 'status', 'created_at', 'last_login', 'salary', 'commission_rate', 'has_commission', 'commission_type', 'department', 'address', 'emergency_contact', 'emergency_phone', 'notes')
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
      commission_type: createdEmployee.commission_type || 'none',
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
    delete updateData.userId;
    delete updateData.userEmail;

    updateData.updated_at = new Date().toISOString();

    await db('employees').where('id', id).update(updateData);

    // Log system activity
    try {
      if (req.body.userId) {
        await db('system_activity').insert({
          user_id: req.body.userId,
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

// Admin override login - Admin/Director can login as any employee
router.post('/:id/admin-login', async (req, res) => {
  try {
    const { id } = req.params;
    const { adminUserId, adminUserRole } = req.body;

    // Check if admin user has permission
    if (!['Admin', 'Director'].includes(adminUserRole)) {
      return res.status(403).json({
        success: false,
        message: 'Only Admin and Director can perform admin login'
      });
    }

    // Get the target employee
    const targetEmployee = await db('employees')
      .where('id', id)
      .andWhere('deletion_status', 'Active')
      .first();

    if (!targetEmployee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Check if admin is trying to login as Admin/Director (restrictions)
    if (adminUserRole === 'Manager' && ['Admin', 'Director'].includes(targetEmployee.role)) {
      return res.status(403).json({
        success: false,
        message: 'Manager cannot login as Admin or Director'
      });
    }

    // Generate JWT token for the target employee
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { 
        userId: targetEmployee.id, 
        email: targetEmployee.email, 
        role: targetEmployee.role,
        isAdminOverride: true,
        adminUserId: adminUserId
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // Update last login
    await db('employees')
      .where('id', id)
      .update({
        last_login: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    // Log system activity
    try {
      await db('system_activity').insert({
        user_id: adminUserId,
        user_email: req.body.adminUserEmail || 'unknown',
        action: 'ADMIN_LOGIN_AS_EMPLOYEE',
        details: `Admin login as employee ${targetEmployee.name} (${targetEmployee.email})`,
        ip_address: req.ip || '127.0.0.1',
        user_agent: req.get('User-Agent') || 'Unknown',
        activity_type: 'ADMIN_OVERRIDE',
        created_at: new Date().toISOString()
      });
    } catch (logError) {
      console.error('Error logging system activity:', logError);
    }

    res.json({
      success: true,
      token: token,
      user: {
        id: targetEmployee.id,
        name: targetEmployee.name,
        email: targetEmployee.email,
        role: targetEmployee.role,
        isAdminOverride: true
      },
      message: `Successfully logged in as ${targetEmployee.name}`
    });

  } catch (error) {
    console.error('Error in admin login:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to perform admin login'
    });
  }
});

// Admin logout - End admin override session
router.post('/admin-logout', async (req, res) => {
  try {
    const { adminUserId, adminUserEmail } = req.body;

    // Log system activity
    try {
      await db('system_activity').insert({
        user_id: adminUserId,
        user_email: adminUserEmail || 'unknown',
        action: 'ADMIN_LOGOUT_OVERRIDE',
        details: 'Admin ended override session',
        ip_address: req.ip || '127.0.0.1',
        user_agent: req.get('User-Agent') || 'Unknown',
        activity_type: 'ADMIN_OVERRIDE',
        created_at: new Date().toISOString()
      });
    } catch (logError) {
      console.error('Error logging system activity:', logError);
    }

    res.json({
      success: true,
      message: 'Admin override session ended'
    });

  } catch (error) {
    console.error('Error in admin logout:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to perform admin logout'
    });
  }
});

  return router;
};
