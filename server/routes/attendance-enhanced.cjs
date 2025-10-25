const express = require('express');
const router = express.Router();
const knex = require('knex');
const bcrypt = require('bcryptjs');

// Database configuration
const db = knex({
  client: 'sqlite3',
  connection: {
    filename: './database.sqlite'
  },
  useNullAsDefault: true
});

// Get attendance records with role-based filtering
router.get('/records', async (req, res) => {
  try {
    const { role, userId, dateRange = 'today', employeeId, status, roleFilter, search } = req.query;
    
    console.log('🔍 Attendance records request received:', {
      role, userId, dateRange, employeeId, status, roleFilter, search
    });
    
    let query = db('attendance_logs')
      .join('employees', 'attendance_logs.employee_id', 'employees.id')
      .select(
        'attendance_logs.*',
        'employees.name as employee_name',
        'employees.email as employee_email',
        'employees.role as employee_role'
      )
      .orderBy('attendance_logs.created_at', 'desc');

    // Role-based filtering
    if (role === 'Manager') {
      // Managers can see all employees except Admin, Director, Sales
      query = query.whereNotIn('employees.role', ['Admin', 'Director', 'Sales']);
    } else if (role === 'Employee') {
      // Employees can only see their own records
      query = query.where('attendance_logs.employee_id', userId);
    }
    // Admin and Director can see all records (no additional filtering)

    // Date range filtering
    if (dateRange === 'today') {
      const today = new Date().toISOString().split('T')[0];
      query = query.whereRaw("strftime('%Y-%m-%d', attendance_logs.clock_in_time) = ?", [today]);
    } else if (dateRange === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      query = query.where('attendance_logs.clock_in_time', '>=', weekAgo.toISOString());
    } else if (dateRange === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      query = query.where('attendance_logs.clock_in_time', '>=', monthAgo.toISOString());
    }

    // Additional filters
    if (employeeId) {
      query = query.where('attendance_logs.employee_id', employeeId);
    }
    if (status) {
      query = query.where('attendance_logs.status', status);
    }
    if (search) {
      query = query.where(function() {
        this.whereRaw('LOWER(employees.name) LIKE ?', [`%${search.toLowerCase()}%`])
          .orWhereRaw('LOWER(employees.email) LIKE ?', [`%${search.toLowerCase()}%`])
          .orWhereRaw('LOWER(employees.role) LIKE ?', [`%${search.toLowerCase()}%`]);
      });
    }

    const records = await query;
    
    console.log('📊 Records found:', records.length);
    console.log('📊 Sample record:', records[0] || 'No records found');

    // Calculate statistics
    const stats = await calculateAttendanceStats(role, userId, dateRange);

    res.json({
      success: true,
      records: records,
      stats: stats
    });

  } catch (error) {
    console.error('Error fetching attendance records:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance records',
      error: error.message
    });
  }
});

// Get employees with role-based filtering
router.get('/employees', async (req, res) => {
  try {
    const { role, userId } = req.query;
    
    let query = db('employees')
      .where('deletion_status', 'Active')
      .select('id', 'name', 'email', 'role', 'department', 'position', 'status')
      .orderBy('name');

    // Role-based filtering
    if (role === 'Manager') {
      // Managers can see all employees except Admin, Director, Sales
      query = query.whereNotIn('role', ['Admin', 'Director', 'Sales']);
    } else if (role === 'Employee') {
      // Employees can only see their own record
      query = query.where('id', userId);
    }
    // Admin and Director can see all employees (no additional filtering)

    const employees = await query;

    res.json({
      success: true,
      employees: employees
    });

  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employees',
      error: error.message
    });
  }
});

// Get detailed attendance analytics
router.get('/analytics', async (req, res) => {
  try {
    const { role, userId, dateRange = 'month' } = req.query;
    
    // Get attendance trends over time
    const trends = await getAttendanceTrends(role, userId, dateRange);
    
    // Get device usage statistics
    const deviceStats = await getDeviceUsageStats(role, userId, dateRange);
    
    // Get location statistics
    const locationStats = await getLocationStats(role, userId, dateRange);
    
    // Get break statistics
    const breakStats = await getBreakStats(role, userId, dateRange);

    res.json({
      success: true,
      analytics: {
        trends: trends,
        deviceStats: deviceStats,
        locationStats: locationStats,
        breakStats: breakStats
      }
    });

  } catch (error) {
    console.error('Error fetching attendance analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance analytics',
      error: error.message
    });
  }
});

// Get employee-specific attendance chart data
router.get('/employee-chart/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { dateRange = 'month' } = req.query;
    
    // Verify employee exists and user has permission to view
    const employee = await db('employees').where('id', employeeId).first();
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Get attendance data for chart
    const chartData = await getEmployeeChartData(employeeId, dateRange);

    res.json({
      success: true,
      employee: employee,
      chartData: chartData
    });

  } catch (error) {
    console.error('Error fetching employee chart data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employee chart data',
      error: error.message
    });
  }
});

// Export attendance data
router.get('/export', async (req, res) => {
  try {
    const { role, userId, format = 'csv', dateRange = 'month' } = req.query;
    
    // Get attendance records
    const { records } = await getAttendanceRecords(role, userId, dateRange);
    
    if (format === 'csv') {
      // Generate CSV
      const csvData = generateCSV(records);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=attendance-records.csv');
      res.send(csvData);
    } else if (format === 'json') {
      res.json({
        success: true,
        data: records
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid format. Supported formats: csv, json'
      });
    }

  } catch (error) {
    console.error('Error exporting attendance data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export attendance data',
      error: error.message
    });
  }
});

// Helper function to calculate attendance statistics
async function calculateAttendanceStats(role, userId, dateRange) {
  try {
    let query = db('attendance_logs')
      .join('employees', 'attendance_logs.employee_id', 'employees.id')
      .where('employees.deletion_status', 'Active');

    // Role-based filtering
    if (role === 'Manager') {
      query = query.whereNotIn('employees.role', ['Admin', 'Director', 'Sales']);
    } else if (role === 'Employee') {
      query = query.where('attendance_logs.employee_id', userId);
    }

    // Date range filtering
    if (dateRange === 'today') {
      const today = new Date().toISOString().split('T')[0];
      query = query.whereRaw("strftime('%Y-%m-%d', attendance_logs.clock_in_time) = ?", [today]);
    } else if (dateRange === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      query = query.where('attendance_logs.clock_in_time', '>=', weekAgo.toISOString());
    } else if (dateRange === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      query = query.where('attendance_logs.clock_in_time', '>=', monthAgo.toISOString());
    }

    // Get total employees
    const totalEmployees = await db('employees')
      .where('deletion_status', 'Active')
      .count('id as count')
      .first();

    // Get today's records
    const today = new Date().toISOString().split('T')[0];
    const todayRecords = await query.clone()
      .whereRaw("strftime('%Y-%m-%d', attendance_logs.clock_in_time) = ?", [today]);

    // Calculate statistics
    const presentToday = todayRecords.filter(r => r.status === 'present').length;
    const absentToday = todayRecords.filter(r => r.status === 'absent').length;
    const lateToday = todayRecords.filter(r => r.status === 'late').length;
    const onBreakToday = todayRecords.filter(r => r.status === 'on_break').length;

    // Calculate average hours worked
    const avgHoursResult = await query.clone()
      .whereNotNull('hours_worked')
      .avg('hours_worked as avg_hours')
      .first();

    // Calculate overtime hours
    const overtimeResult = await query.clone()
      .where('hours_worked', '>', 8)
      .sum(db.raw('(hours_worked - 8)'))
      .first();

    // Calculate break statistics
    const breakStats = await query.clone()
      .whereNotNull('total_break_time')
      .select(
        db.raw('COUNT(*) as total_breaks'),
        db.raw('AVG(total_break_time) as avg_break_time')
      )
      .first();

    return {
      totalEmployees: totalEmployees.count || 0,
      presentToday: presentToday,
      absentToday: absentToday,
      lateToday: lateToday,
      onBreakToday: onBreakToday,
      averageHours: parseFloat(avgHoursResult?.avg_hours || 0),
      overtimeHours: parseFloat(overtimeResult?.['sum((hours_worked - 8))'] || 0),
      totalBreaks: breakStats?.total_breaks || 0,
      averageBreakTime: parseFloat(breakStats?.avg_break_time || 0)
    };

  } catch (error) {
    console.error('Error calculating attendance stats:', error);
    return {
      totalEmployees: 0,
      presentToday: 0,
      absentToday: 0,
      lateToday: 0,
      onBreakToday: 0,
      averageHours: 0,
      overtimeHours: 0,
      totalBreaks: 0,
      averageBreakTime: 0
    };
  }
}

// Helper function to get attendance trends
async function getAttendanceTrends(role, userId, dateRange) {
  try {
    let query = db('attendance_logs')
      .join('employees', 'attendance_logs.employee_id', 'employees.id')
      .where('employees.deletion_status', 'Active');

    // Role-based filtering
    if (role === 'Manager') {
      query = query.whereNotIn('employees.role', ['Admin', 'Director', 'Sales']);
    } else if (role === 'Employee') {
      query = query.where('attendance_logs.employee_id', userId);
    }

    // Date range filtering
    if (dateRange === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      query = query.where('attendance_logs.clock_in_time', '>=', weekAgo.toISOString());
    } else if (dateRange === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      query = query.where('attendance_logs.clock_in_time', '>=', monthAgo.toISOString());
    }

    const records = await query.select(
      db.raw("strftime('%Y-%m-%d', attendance_logs.clock_in_time) as date"),
      'attendance_logs.status'
    );

    // Group by date and status
    const trends = {};
    records.forEach(record => {
      if (!trends[record.date]) {
        trends[record.date] = { date: record.date, present: 0, absent: 0, late: 0 };
      }
      trends[record.date][record.status] = (trends[record.date][record.status] || 0) + 1;
    });

    return Object.values(trends).sort((a, b) => new Date(a.date) - new Date(b.date));

  } catch (error) {
    console.error('Error getting attendance trends:', error);
    return [];
  }
}

// Helper function to get device usage statistics
async function getDeviceUsageStats(role, userId, dateRange) {
  try {
    let query = db('attendance_logs')
      .join('employees', 'attendance_logs.employee_id', 'employees.id')
      .where('employees.deletion_status', 'Active')
      .whereNotNull('device_info');

    // Role-based filtering
    if (role === 'Manager') {
      query = query.whereNotIn('employees.role', ['Admin', 'Director', 'Sales']);
    } else if (role === 'Employee') {
      query = query.where('attendance_logs.employee_id', userId);
    }

    const records = await query.select('device_info');

    const deviceStats = {
      desktop: 0,
      mobile: 0,
      tablet: 0,
      other: 0
    };

    records.forEach(record => {
      try {
        const deviceInfo = JSON.parse(record.device_info);
        const userAgent = deviceInfo.userAgent || '';
        
        if (userAgent.includes('Mobile')) {
          deviceStats.mobile++;
        } else if (userAgent.includes('Tablet')) {
          deviceStats.tablet++;
        } else if (userAgent.includes('Windows') || userAgent.includes('Macintosh') || userAgent.includes('Linux')) {
          deviceStats.desktop++;
        } else {
          deviceStats.other++;
        }
      } catch (error) {
        deviceStats.other++;
      }
    });

    const total = Object.values(deviceStats).reduce((sum, count) => sum + count, 0);
    
    return {
      desktop: total > 0 ? Math.round((deviceStats.desktop / total) * 100) : 0,
      mobile: total > 0 ? Math.round((deviceStats.mobile / total) * 100) : 0,
      tablet: total > 0 ? Math.round((deviceStats.tablet / total) * 100) : 0,
      other: total > 0 ? Math.round((deviceStats.other / total) * 100) : 0
    };

  } catch (error) {
    console.error('Error getting device usage stats:', error);
    return { desktop: 0, mobile: 0, tablet: 0, other: 0 };
  }
}

// Helper function to get location statistics
async function getLocationStats(role, userId, dateRange) {
  try {
    let query = db('attendance_logs')
      .join('employees', 'attendance_logs.employee_id', 'employees.id')
      .where('employees.deletion_status', 'Active')
      .whereNotNull('clock_in_location');

    // Role-based filtering
    if (role === 'Manager') {
      query = query.whereNotIn('employees.role', ['Admin', 'Director', 'Sales']);
    } else if (role === 'Employee') {
      query = query.where('attendance_logs.employee_id', userId);
    }

    const records = await query.select('clock_in_location');

    const locationStats = {};
    
    records.forEach(record => {
      try {
        const location = JSON.parse(record.clock_in_location);
        const locationKey = location.address || 'Unknown Location';
        locationStats[locationKey] = (locationStats[locationKey] || 0) + 1;
      } catch (error) {
        locationStats['Unknown Location'] = (locationStats['Unknown Location'] || 0) + 1;
      }
    });

    return locationStats;

  } catch (error) {
    console.error('Error getting location stats:', error);
    return {};
  }
}

// Helper function to get break statistics
async function getBreakStats(role, userId, dateRange) {
  try {
    let query = db('attendance_logs')
      .join('employees', 'attendance_logs.employee_id', 'employees.id')
      .where('employees.deletion_status', 'Active')
      .whereNotNull('total_break_time');

    // Role-based filtering
    if (role === 'Manager') {
      query = query.whereNotIn('employees.role', ['Admin', 'Director', 'Sales']);
    } else if (role === 'Employee') {
      query = query.where('attendance_logs.employee_id', userId);
    }

    const breakStats = await query.select(
      db.raw('COUNT(*) as total_breaks'),
      db.raw('AVG(total_break_time) as avg_break_time'),
      db.raw('MAX(total_break_time) as max_break_time'),
      db.raw('MIN(total_break_time) as min_break_time')
    ).first();

    return {
      totalBreaks: breakStats?.total_breaks || 0,
      averageBreakTime: parseFloat(breakStats?.avg_break_time || 0),
      maxBreakTime: parseFloat(breakStats?.max_break_time || 0),
      minBreakTime: parseFloat(breakStats?.min_break_time || 0)
    };

  } catch (error) {
    console.error('Error getting break stats:', error);
    return {
      totalBreaks: 0,
      averageBreakTime: 0,
      maxBreakTime: 0,
      minBreakTime: 0
    };
  }
}

// Helper function to get employee chart data
async function getEmployeeChartData(employeeId, dateRange) {
  try {
    let query = db('attendance_logs')
      .where('employee_id', employeeId);

    // Date range filtering
    if (dateRange === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      query = query.where('clock_in_time', '>=', weekAgo.toISOString());
    } else if (dateRange === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      query = query.where('clock_in_time', '>=', monthAgo.toISOString());
    }

    const records = await query.select(
      db.raw("strftime('%Y-%m-%d', clock_in_time) as date"),
      'status',
      'hours_worked',
      'total_break_time'
    ).orderBy('clock_in_time');

    // Group by date
    const chartData = {};
    records.forEach(record => {
      if (!chartData[record.date]) {
        chartData[record.date] = {
          date: record.date,
          present: 0,
          absent: 0,
          late: 0,
          hoursWorked: 0,
          breakTime: 0
        };
      }
      chartData[record.date][record.status] = (chartData[record.date][record.status] || 0) + 1;
      chartData[record.date].hoursWorked += parseFloat(record.hours_worked || 0);
      chartData[record.date].breakTime += parseFloat(record.total_break_time || 0);
    });

    return Object.values(chartData).sort((a, b) => new Date(a.date) - new Date(b.date));

  } catch (error) {
    console.error('Error getting employee chart data:', error);
    return [];
  }
}

// Helper function to generate CSV
function generateCSV(records) {
  const headers = [
    'Employee Name',
    'Employee Email',
    'Employee Role',
    'Date',
    'Clock In Time',
    'Clock Out Time',
    'Hours Worked',
    'Break Time',
    'Status',
    'Location',
    'Device Info'
  ];

  const csvRows = [headers.join(',')];

  records.forEach(record => {
    const row = [
      record.employee_name,
      record.employee_email,
      record.employee_role,
      record.date,
      record.clock_in_time,
      record.clock_out_time || '',
      record.hours_worked || '',
      record.total_break_time || '',
      record.status,
      record.clock_in_location ? JSON.parse(record.clock_in_location).address : '',
      record.device_info || ''
    ];
    csvRows.push(row.map(field => `"${field}"`).join(','));
  });

  return csvRows.join('\n');
}

// Start break endpoint
router.post('/start-break', async (req, res) => {
  try {
    console.log('🔍 Start break request received:', req.body);
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
      .whereRaw("strftime('%Y-%m-%d', clock_in_time) = ?", [today])
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
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to start break',
      error: error.message
    });
  }
});

// End break endpoint
router.post('/end-break', async (req, res) => {
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
      .whereRaw("strftime('%Y-%m-%d', clock_in_time) = ?", [today])
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
    const breakDuration = Math.round((breakEndTime - breakStartTime) / 1000); // in seconds

    // Update attendance log to end break
    await db('attendance_logs')
      .where('id', attendanceLog.id)
      .update({
        on_break: false,
        break_end_time: breakEndTime.toISOString(),
        break_end_location: location ? JSON.stringify(location) : null,
        total_break_time: (attendanceLog.total_break_time || 0) + breakDuration,
        notes: `${attendanceLog.notes || ''} | Break ended at ${location?.address || 'Unknown location'}`
      });

    // Log system activity
    await db('system_activity').insert({
      employee_id: employeeId,
      activity_type: 'break_end',
      description: `Employee ended break at ${new Date().toLocaleString()}`,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Break ended successfully',
      breakDuration: breakDuration
    });
  } catch (error) {
    console.error('Error ending break:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to end break'
    });
  }
});

module.exports = router;
