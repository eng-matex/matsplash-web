import express from 'express';
import knex from 'knex';
import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';

const router = express.Router();

// Database configuration
const db = knex({
  client: 'sqlite3',
  connection: {
    filename: './database.sqlite'
  },
  useNullAsDefault: true
});

// Get all attendance logs
router.get('/', async (req: Request, res: Response) => {
  try {
    const { employee_id, start_date, end_date, status } = req.query;

    let query = db('attendance_logs')
      .select(
        'attendance_logs.*',
        'employees.name as employee_name',
        'employees.email as employee_email',
        'employees.role as employee_role'
      )
      .leftJoin('employees', 'attendance_logs.employee_id', 'employees.id');

    if (employee_id) {
      query = query.where('attendance_logs.employee_id', employee_id);
    }

    if (start_date) {
      query = query.where('attendance_logs.clock_in_time', '>=', start_date);
    }

    if (end_date) {
      query = query.where('attendance_logs.clock_in_time', '<=', end_date);
    }

    if (status) {
      query = query.where('attendance_logs.status', status);
    }

    const attendanceLogs = await query.orderBy('attendance_logs.clock_in_time', 'desc');

    res.json({
      success: true,
      data: attendanceLogs
    });
  } catch (error) {
    console.error('Error fetching attendance logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance logs'
    });
  }
});

// Get single attendance log
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const attendanceLog = await db('attendance_logs')
      .select(
        'attendance_logs.*',
        'employees.name as employee_name',
        'employees.email as employee_email',
        'employees.role as employee_role'
      )
      .leftJoin('employees', 'attendance_logs.employee_id', 'employees.id')
      .where('attendance_logs.id', id)
      .first();

    if (!attendanceLog) {
      return res.status(404).json({
        success: false,
        message: 'Attendance log not found'
      });
    }

    res.json({
      success: true,
      data: attendanceLog
    });
  } catch (error) {
    console.error('Error fetching attendance log:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance log'
    });
  }
});

// Get clock-in status for employee
router.get('/status/:employeeId', async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.params;

    // Find today's attendance record
    const today = new Date().toISOString().split('T')[0];
    const attendanceLog = await db('attendance_logs')
      .where('employee_id', employeeId)
      .whereRaw('DATE(clock_in_time) = ?', [today])
      .whereNull('clock_out_time')
      .first();

    const isClockedIn = !!attendanceLog;
    const clockInTime = attendanceLog?.clock_in_time || null;
    const onBreak = attendanceLog?.on_break || false;
    const breakStartTime = attendanceLog?.break_start_time || null;
    const totalBreakTime = attendanceLog?.total_break_time || 0;

    res.json({
      success: true,
      data: {
        clockedIn: isClockedIn,
        clockInTime,
        onBreak,
        breakStartTime,
        totalBreakTime,
        currentStatus: isClockedIn ? (onBreak ? 'on_break' : 'working') : 'not_clocked_in'
      }
    });
  } catch (error) {
    console.error('Error fetching clock-in status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch clock-in status'
    });
  }
});

// Clock in employee
router.post('/clock-in', async (req: Request, res: Response) => {
  try {
    const { employeeId, pin, location, deviceInfo } = req.body;

    if (!employeeId || !pin) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID and PIN are required'
      });
    }

    // Verify employee exists and PIN is correct
    const employee = await db('employees')
      .where({ id: employeeId, status: 'active' })
      .first();

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found or inactive'
      });
    }

    // Verify PIN
    const isPinValid = await bcrypt.compare(pin, employee.pin_hash);
    if (!isPinValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid PIN'
      });
    }

    // Check if already clocked in today
    const today = new Date().toISOString().split('T')[0];
    const existingLog = await db('attendance_logs')
      .where('employee_id', employeeId)
      .whereRaw('DATE(clock_in_time) = ?', [today])
      .whereNull('clock_out_time')
      .first();

    if (existingLog) {
      return res.status(400).json({
        success: false,
        message: 'Employee is already clocked in today'
      });
    }

    // Create attendance log
    const attendanceLog = await db('attendance_logs').insert({
      employee_id: employeeId,
      clock_in_time: new Date().toISOString(),
      clock_in_location: location ? JSON.stringify(location) : null,
      device_info: deviceInfo ? JSON.stringify(deviceInfo) : null,
      status: 'present',
      notes: `Clocked in at ${location?.address || 'Unknown location'}`
    }).returning('*');

    // Log system activity
    await db('system_activity').insert({
      employee_id: employeeId,
      activity_type: 'clock_in',
      description: `Employee clocked in at ${new Date().toLocaleString()}`,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Clocked in successfully',
      data: attendanceLog[0]
    });
  } catch (error) {
    console.error('Error clocking in employee:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clock in employee'
    });
  }
});

// Clock out employee
router.post('/clock-out', async (req: Request, res: Response) => {
  try {
    const { employeeId, location, deviceInfo } = req.body;

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID is required'
      });
    }

    // Find today's clock-in record
    const today = new Date().toISOString().split('T')[0];
    const attendanceLog = await db('attendance_logs')
      .where('employee_id', employeeId)
      .whereRaw('DATE(clock_in_time) = ?', [today])
      .whereNull('clock_out_time')
      .first();

    if (!attendanceLog) {
      return res.status(400).json({
        success: false,
        message: 'No active clock-in record found for today'
      });
    }

    // Calculate hours worked
    const clockInTime = new Date(attendanceLog.clock_in_time);
    const clockOutTime = new Date();
    const hoursWorked = (clockOutTime.getTime() - clockInTime.getTime()) / (1000 * 60 * 60);

    // Update attendance log
    await db('attendance_logs')
      .where('id', attendanceLog.id)
      .update({
        clock_out_time: clockOutTime.toISOString(),
        clock_out_location: location ? JSON.stringify(location) : null,
        hours_worked: hoursWorked,
        notes: `${attendanceLog.notes || ''} | Clocked out at ${location?.address || 'Unknown location'}`
      });

    // Log system activity
    await db('system_activity').insert({
      employee_id: employeeId,
      activity_type: 'clock_out',
      description: `Employee clocked out at ${new Date().toLocaleString()}`,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Clocked out successfully'
    });
  } catch (error) {
    console.error('Error clocking out employee:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clock out employee'
    });
  }
});

// Start break
router.post('/start-break', async (req: Request, res: Response) => {
  try {
    const { employeeId, location, deviceInfo } = req.body;

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID is required'
      });
    }

    // Find today's active attendance record
    const today = new Date().toISOString().split('T')[0];
    const attendanceLog = await db('attendance_logs')
      .where('employee_id', employeeId)
      .whereRaw('DATE(clock_in_time) = ?', [today])
      .whereNull('clock_out_time')
      .first();

    if (!attendanceLog) {
      return res.status(400).json({
        success: false,
        message: 'No active clock-in record found for today'
      });
    }

    if (attendanceLog.on_break) {
      return res.status(400).json({
        success: false,
        message: 'Employee is already on break'
      });
    }

    // Update attendance log to start break
    await db('attendance_logs')
      .where('id', attendanceLog.id)
      .update({
        on_break: true,
        break_start_time: new Date().toISOString(),
        break_start_location: location ? JSON.stringify(location) : null,
        notes: `${attendanceLog.notes || ''} | Break started at ${location?.address || 'Unknown location'}`
      });

    // Log system activity
    await db('system_activity').insert({
      employee_id: employeeId,
      activity_type: 'break_start',
      description: `Employee started break at ${new Date().toLocaleString()}`,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Break started successfully'
    });
  } catch (error) {
    console.error('Error starting break:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start break'
    });
  }
});

// End break
router.post('/end-break', async (req: Request, res: Response) => {
  try {
    const { employeeId, location, deviceInfo } = req.body;

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID is required'
      });
    }

    // Find today's active attendance record
    const today = new Date().toISOString().split('T')[0];
    const attendanceLog = await db('attendance_logs')
      .where('employee_id', employeeId)
      .whereRaw('DATE(clock_in_time) = ?', [today])
      .whereNull('clock_out_time')
      .first();

    if (!attendanceLog) {
      return res.status(400).json({
        success: false,
        message: 'No active clock-in record found for today'
      });
    }

    if (!attendanceLog.on_break) {
      return res.status(400).json({
        success: false,
        message: 'Employee is not currently on break'
      });
    }

    // Calculate break duration
    const breakStartTime = new Date(attendanceLog.break_start_time);
    const breakEndTime = new Date();
    const breakDuration = Math.round((breakEndTime.getTime() - breakStartTime.getTime()) / (1000 * 60)); // in minutes
    const totalBreakTime = (attendanceLog.total_break_time || 0) + breakDuration;

    // Update attendance log to end break
    await db('attendance_logs')
      .where('id', attendanceLog.id)
      .update({
        on_break: false,
        break_end_time: breakEndTime.toISOString(),
        break_end_location: location ? JSON.stringify(location) : null,
        total_break_time: totalBreakTime,
        notes: `${attendanceLog.notes || ''} | Break ended at ${location?.address || 'Unknown location'} (${breakDuration} min)`
      });

    // Log system activity
    await db('system_activity').insert({
      employee_id: employeeId,
      activity_type: 'break_end',
      description: `Employee ended break at ${new Date().toLocaleString()} (${breakDuration} minutes)`,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Break ended successfully',
      data: { breakDuration, totalBreakTime }
    });
  } catch (error) {
    console.error('Error ending break:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to end break'
    });
  }
});

// Admin clock in employee
router.post('/admin/clock-in', async (req: Request, res: Response) => {
  try {
    const { employeeEmail, adminEmail } = req.body;

    if (!employeeEmail || !adminEmail) {
      return res.status(400).json({
        success: false,
        message: 'Employee email and admin email are required'
      });
    }

    // Get employee and admin details
    const employee = await db('employees')
      .where({ email: employeeEmail, status: 'active' })
      .first();

    const admin = await db('employees')
      .where({ email: adminEmail })
      .first();

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found or inactive'
      });
    }

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Check if already clocked in today
    const today = new Date().toISOString().split('T')[0];
    const existingLog = await db('attendance_logs')
      .where('employee_id', employee.id)
      .whereRaw('DATE(clock_in_time) = ?', [today])
      .whereNull('clock_out_time')
      .first();

    if (existingLog) {
      return res.status(400).json({
        success: false,
        message: 'Employee is already clocked in today'
      });
    }

    // Create attendance log
    const attendanceLog = await db('attendance_logs').insert({
      employee_id: employee.id,
      clock_in_time: new Date().toISOString(),
      status: 'present',
      admin_action: true,
      notes: `Admin clock-in by ${admin.name} (${admin.email})`
    }).returning('*');

    // Log system activity
    await db('system_activity').insert({
      employee_id: employee.id,
      activity_type: 'admin_clock_in',
      description: `Employee clocked in by admin ${admin.name} at ${new Date().toLocaleString()}`,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Employee clocked in successfully by admin',
      data: attendanceLog[0]
    });
  } catch (error) {
    console.error('Error in admin clock-in:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clock in employee'
    });
  }
});

// Admin clock out employee
router.post('/admin/clock-out', async (req: Request, res: Response) => {
  try {
    const { employeeEmail, adminEmail } = req.body;

    if (!employeeEmail || !adminEmail) {
      return res.status(400).json({
        success: false,
        message: 'Employee email and admin email are required'
      });
    }

    // Get employee and admin details
    const employee = await db('employees')
      .where({ email: employeeEmail, status: 'active' })
      .first();

    const admin = await db('employees')
      .where({ email: adminEmail })
      .first();

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found or inactive'
      });
    }

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Find today's clock-in record
    const today = new Date().toISOString().split('T')[0];
    const attendanceLog = await db('attendance_logs')
      .where('employee_id', employee.id)
      .whereRaw('DATE(clock_in_time) = ?', [today])
      .whereNull('clock_out_time')
      .first();

    if (!attendanceLog) {
      return res.status(400).json({
        success: false,
        message: 'No active clock-in record found for today'
      });
    }

    // Calculate hours worked
    const clockInTime = new Date(attendanceLog.clock_in_time);
    const clockOutTime = new Date();
    const hoursWorked = (clockOutTime.getTime() - clockInTime.getTime()) / (1000 * 60 * 60);

    // Update attendance log
    await db('attendance_logs')
      .where('id', attendanceLog.id)
      .update({
        clock_out_time: clockOutTime.toISOString(),
        hours_worked: hoursWorked,
        admin_action: true,
        notes: `${attendanceLog.notes || ''} | Admin clock-out by ${admin.name} (${admin.email})`
      });

    // Log system activity
    await db('system_activity').insert({
      employee_id: employee.id,
      activity_type: 'admin_clock_out',
      description: `Employee clocked out by admin ${admin.name} at ${new Date().toLocaleString()}`,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Employee clocked out successfully by admin'
    });
  } catch (error) {
    console.error('Error in admin clock-out:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clock out employee'
    });
  }
});

// Get recent admin clock actions
router.get('/admin/recent-actions', async (req: Request, res: Response) => {
  try {
    const recentActions = await db('attendance_logs')
      .select(
        'attendance_logs.*',
        'employees.name as employee_name',
        'employees.email as employee_email',
        'employees.role as employee_role'
      )
      .leftJoin('employees', 'attendance_logs.employee_id', 'employees.id')
      .where('attendance_logs.admin_action', true)
      .orderBy('attendance_logs.clock_in_time', 'desc')
      .limit(50);

    res.json({
      success: true,
      data: recentActions
    });
  } catch (error) {
    console.error('Error fetching recent admin actions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent admin actions'
    });
  }
});

// Update attendance log
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updatedLog = await db('attendance_logs')
      .where('id', id)
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .returning('*');

    if (updatedLog.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Attendance log not found'
      });
    }

    res.json({
      success: true,
      message: 'Attendance log updated successfully',
      data: updatedLog[0]
    });
  } catch (error) {
    console.error('Error updating attendance log:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update attendance log'
    });
  }
});

// Delete attendance log
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const deletedCount = await db('attendance_logs').where('id', id).del();

    if (deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Attendance log not found'
      });
    }

    res.json({
      success: true,
      message: 'Attendance log deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting attendance log:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete attendance log'
    });
  }
});

export default router;
