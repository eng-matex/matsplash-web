import * as express from 'express';
import { db } from '../database';
import { ApiResponse, AttendanceLog } from '../../src/types';

const router = express.Router();

// Get attendance logs
router.get('/logs', async (req, res) => {
  try {
    const { employee_id, date_from, date_to, limit = 100 } = req.query;
    
    let query = db('attendance_logs')
      .leftJoin('employees', 'attendance_logs.employee_id', 'employees.id')
      .select(
        'attendance_logs.*',
        'employees.name as employee_name'
      )
      .orderBy('attendance_logs.created_at', 'desc')
      .limit(parseInt(limit as string));

    if (employee_id) {
      query = query.where('attendance_logs.employee_id', employee_id);
    }

    if (date_from) {
      query = query.where('attendance_logs.date', '>=', date_from);
    }

    if (date_to) {
      query = query.where('attendance_logs.date', '<=', date_to);
    }

    const logs = await query;

    res.json({
      success: true,
      data: logs
    } as ApiResponse<AttendanceLog[]>);

  } catch (error) {
    console.error('Error fetching attendance logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance logs'
    } as ApiResponse);
  }
});

// Get attendance log by ID
router.get('/logs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const log = await db('attendance_logs')
      .leftJoin('employees', 'attendance_logs.employee_id', 'employees.id')
      .select(
        'attendance_logs.*',
        'employees.name as employee_name'
      )
      .where('attendance_logs.id', id)
      .first();

    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'Attendance log not found'
      } as ApiResponse);
    }

    res.json({
      success: true,
      data: log
    } as ApiResponse<AttendanceLog>);

  } catch (error) {
    console.error('Error fetching attendance log:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance log'
    } as ApiResponse);
  }
});

// Clock in
router.post('/clock-in', async (req, res) => {
  try {
    const clockInData = req.body;

    // Validate required fields
    if (!clockInData.employee_id || !clockInData.employee_email || !clockInData.clock_in_time) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID, email, and clock in time are required'
      } as ApiResponse);
    }

    // Check if employee already clocked in today
    const existingLog = await db('attendance_logs')
      .where('employee_id', clockInData.employee_id)
      .andWhere('date', clockInData.date)
      .andWhereNull('clock_out_time')
      .first();

    if (existingLog) {
      return res.status(400).json({
        success: false,
        message: 'Employee has already clocked in today'
      } as ApiResponse);
    }

    const newLog = {
      employee_id: clockInData.employee_id,
      employee_email: clockInData.employee_email,
      clock_in_time: clockInData.clock_in_time,
      date: clockInData.date,
      status: clockInData.status || 'present',
      notes: clockInData.notes,
      created_at: new Date().toISOString()
    };

    const [logId] = await db('attendance_logs').insert(newLog);

    // Log system activity
    await db('system_activity').insert({
      user_id: clockInData.employee_id,
      user_email: clockInData.employee_email,
      action: 'CLOCK_IN',
      details: `Clocked in at ${clockInData.clock_in_time}`,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      created_at: new Date().toISOString()
    });

    // Get the created log with joins
    const createdLog = await db('attendance_logs')
      .leftJoin('employees', 'attendance_logs.employee_id', 'employees.id')
      .select(
        'attendance_logs.*',
        'employees.name as employee_name'
      )
      .where('attendance_logs.id', logId)
      .first();

    res.status(201).json({
      success: true,
      data: createdLog,
      message: 'Clock in recorded successfully'
    } as ApiResponse<AttendanceLog>);

  } catch (error) {
    console.error('Error recording clock in:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record clock in'
    } as ApiResponse);
  }
});

// Clock out
router.patch('/:id/clock-out', async (req, res) => {
  try {
    const { id } = req.params;
    const { clock_out_time, notes } = req.body;

    if (!clock_out_time) {
      return res.status(400).json({
        success: false,
        message: 'Clock out time is required'
      } as ApiResponse);
    }

    // Get the attendance log
    const log = await db('attendance_logs').where('id', id).first();
    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'Attendance log not found'
      } as ApiResponse);
    }

    if (log.clock_out_time) {
      return res.status(400).json({
        success: false,
        message: 'Employee has already clocked out'
      } as ApiResponse);
    }

    // Calculate total hours
    const clockInTime = new Date(log.clock_in_time);
    const clockOutTime = new Date(clock_out_time);
    const totalHours = (clockOutTime.getTime() - clockInTime.getTime()) / (1000 * 60 * 60);

    const updateData = {
      clock_out_time,
      total_hours: totalHours,
      notes: notes || log.notes,
      updated_at: new Date().toISOString()
    };

    await db('attendance_logs').where('id', id).update(updateData);

    // Log system activity
    await db('system_activity').insert({
      user_id: log.employee_id,
      user_email: log.employee_email,
      action: 'CLOCK_OUT',
      details: `Clocked out at ${clock_out_time}. Total hours: ${totalHours.toFixed(1)}`,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      created_at: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Clock out recorded successfully'
    } as ApiResponse);

  } catch (error) {
    console.error('Error recording clock out:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record clock out'
    } as ApiResponse);
  }
});

// Update attendance log
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated directly
    delete updateData.id;
    delete updateData.created_at;

    updateData.updated_at = new Date().toISOString();

    await db('attendance_logs').where('id', id).update(updateData);

    // Log system activity
    if (updateData.userId) {
      await db('system_activity').insert({
        user_id: updateData.userId,
        user_email: req.body.userEmail || 'unknown',
        action: 'ATTENDANCE_UPDATED',
        details: `Updated attendance log ${id}`,
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
        created_at: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: 'Attendance log updated successfully'
    } as ApiResponse);

  } catch (error) {
    console.error('Error updating attendance log:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update attendance log'
    } as ApiResponse);
  }
});

// Delete attendance log
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    await db('attendance_logs').where('id', id).del();

    // Log system activity
    if (userId) {
      await db('system_activity').insert({
        user_id: userId,
        user_email: req.body.userEmail || 'unknown',
        action: 'ATTENDANCE_DELETED',
        details: `Deleted attendance log ${id}`,
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
        created_at: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: 'Attendance log deleted successfully'
    } as ApiResponse);

  } catch (error) {
    console.error('Error deleting attendance log:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete attendance log'
    } as ApiResponse);
  }
});

export default router;