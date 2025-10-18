import * as express from 'express';
import * as bcrypt from 'bcryptjs';
import { db } from '../database';
import { ApiResponse, User, CreateEmployeeForm } from '../../src/types';

const router = express.Router();

// Get all employees
router.get('/', async (req, res) => {
  try {
    const { role, status, limit = 100 } = req.query;
    
    let query = db('employees')
      .where('deletion_status', 'Active')
      .select('id', 'name', 'email', 'phone', 'role', 'status', 'created_at', 'last_login', 'salary_type', 'fixed_salary', 'commission_rate', 'can_access_remotely')
      .orderBy('name')
      .limit(parseInt(limit as string));

    if (role) {
      query = query.where('role', role);
    }

    if (status) {
      query = query.where('status', status);
    }

    const employees = await query;

    const formattedEmployees: User[] = employees.map((emp: any) => ({
      id: emp.id,
      name: emp.name,
      email: emp.email,
      phone: emp.phone,
      role: emp.role,
      isEmployee: emp.role !== 'Admin' && emp.role !== 'Director',
      isActive: emp.status === 'active',
      createdAt: emp.created_at,
      lastLogin: emp.last_login,
      salary_type: emp.salary_type,
      fixed_salary: emp.fixed_salary,
      commission_rate: emp.commission_rate,
      can_access_remotely: emp.can_access_remotely
    }));

    res.json({
      success: true,
      data: formattedEmployees
    } as ApiResponse<User[]>);

  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employees'
    } as ApiResponse);
  }
});

// Get employee by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const employee = await db('employees')
      .where('id', id)
      .andWhere('deletion_status', 'Active')
      .select('id', 'name', 'email', 'phone', 'role', 'status', 'created_at', 'last_login', 'salary_type', 'fixed_salary', 'commission_rate', 'can_access_remotely')
      .first();

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      } as ApiResponse);
    }

    const formattedEmployee: User = {
      id: employee.id,
      name: employee.name,
      email: employee.email,
      phone: employee.phone,
      role: employee.role,
      isEmployee: employee.role !== 'Admin' && employee.role !== 'Director',
      isActive: employee.status === 'active',
      createdAt: employee.created_at,
      lastLogin: employee.last_login,
      salary_type: employee.salary_type,
      fixed_salary: employee.fixed_salary,
      commission_rate: employee.commission_rate,
      can_access_remotely: employee.can_access_remotely
    };

    res.json({
      success: true,
      data: formattedEmployee
    } as ApiResponse<User>);

  } catch (error) {
    console.error('Error fetching employee:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employee'
    } as ApiResponse);
  }
});

// Create new employee
router.post('/', async (req, res) => {
  try {
    const employeeData: CreateEmployeeForm = req.body;

    // Validate required fields
    if (!employeeData.name || !employeeData.email || !employeeData.role) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and role are required'
      } as ApiResponse);
    }

    // Check if email already exists
    const existingEmployee = await db('employees')
      .where('email', employeeData.email)
      .first();

    if (existingEmployee) {
      return res.status(400).json({
        success: false,
        message: 'Employee with this email already exists'
      } as ApiResponse);
    }

    // Hash default PIN
    const saltRounds = 10;
    const defaultPin = '1111';
    const pinHash = await bcrypt.hash(defaultPin, saltRounds);

    const newEmployee = {
      name: employeeData.name,
      email: employeeData.email,
      phone: employeeData.phone,
      role: employeeData.role,
      pin_hash: pinHash,
      status: 'active',
      deletion_status: 'Active',
      is_archived: false,
      first_login: true,
      salary_type: employeeData.salary_type || 'fixed',
      fixed_salary: employeeData.fixed_salary,
      commission_rate: employeeData.commission_rate,
      can_access_remotely: employeeData.can_access_remotely || false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const [employeeId] = await db('employees').insert(newEmployee);

    // Log system activity
    await db('system_activity').insert({
      user_id: req.body.userId || 1, // Default to admin if not provided
      user_email: req.body.userEmail || 'system',
      action: 'EMPLOYEE_CREATED',
      details: `Created employee ${employeeData.name} (${employeeData.email}) with role ${employeeData.role}`,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      created_at: new Date().toISOString()
    });

    // Get the created employee
    const createdEmployee = await db('employees')
      .where('id', employeeId)
      .select('id', 'name', 'email', 'phone', 'role', 'status', 'created_at', 'last_login', 'salary_type', 'fixed_salary', 'commission_rate', 'can_access_remotely')
      .first();

    const formattedEmployee: User = {
      id: createdEmployee.id,
      name: createdEmployee.name,
      email: createdEmployee.email,
      phone: createdEmployee.phone,
      role: createdEmployee.role,
      isEmployee: createdEmployee.role !== 'Admin' && createdEmployee.role !== 'Director',
      isActive: createdEmployee.status === 'active',
      createdAt: createdEmployee.created_at,
      lastLogin: createdEmployee.last_login,
      salary_type: createdEmployee.salary_type,
      fixed_salary: createdEmployee.fixed_salary,
      commission_rate: createdEmployee.commission_rate,
      can_access_remotely: createdEmployee.can_access_remotely
    };

    res.status(201).json({
      success: true,
      data: formattedEmployee,
      message: 'Employee created successfully'
    } as ApiResponse<User>);

  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create employee'
    } as ApiResponse);
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
    if (updateData.userId) {
      await db('system_activity').insert({
        user_id: updateData.userId,
        user_email: req.body.userEmail || 'unknown',
        action: 'EMPLOYEE_UPDATED',
        details: `Updated employee ${id}`,
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
        created_at: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: 'Employee updated successfully'
    } as ApiResponse);

  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update employee'
    } as ApiResponse);
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
      } as ApiResponse);
    }

    // Prevent deletion of admin accounts
    if (employee.role === 'Admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete admin accounts'
      } as ApiResponse);
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
    if (userId) {
      await db('system_activity').insert({
        user_id: userId,
        user_email: req.body.userEmail || 'unknown',
        action: 'EMPLOYEE_DELETED',
        details: `Deleted employee ${employee.name} (${employee.email})`,
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
        created_at: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: 'Employee deleted successfully'
    } as ApiResponse);

  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete employee'
    } as ApiResponse);
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
    if (userId) {
      await db('system_activity').insert({
        user_id: userId,
        user_email: req.body.userEmail || 'unknown',
        action: 'EMPLOYEE_PIN_RESET',
        details: `Reset PIN for employee ${id}`,
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
        created_at: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: 'Employee PIN reset successfully'
    } as ApiResponse);

  } catch (error) {
    console.error('Error resetting employee PIN:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset employee PIN'
    } as ApiResponse);
  }
});

export default router;
