const express = require('express');
const router = express.Router();

module.exports = (db) => {
  // Get dashboard stats
  router.get('/stats', async (req, res) => {
    try {
      console.log('📊 Dashboard stats request received');

      // Get basic counts
      const employeeCount = await db('employees').where('deletion_status', 'Active').count('* as count').first();
      const orderCount = await db('orders').count('* as count').first();
      const attendanceCount = await db('attendance_logs').where('status', 'present').count('* as count').first();

      // Get recent activity
      const recentOrders = await db('orders')
        .select('id', 'customer_name', 'order_type', 'status', 'created_at')
        .orderBy('created_at', 'desc')
        .limit(5);

      const recentAttendance = await db('attendance_logs')
        .select('id', 'employee_id', 'status', 'clock_in_time', 'created_at')
        .orderBy('created_at', 'desc')
        .limit(5);

      res.json({
        success: true,
        data: {
          totalEmployees: employeeCount.count,
          totalOrders: orderCount.count,
          presentToday: attendanceCount.count,
          recentOrders,
          recentAttendance,
          message: 'Dashboard data loaded successfully'
        }
      });

    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch dashboard stats',
        error: error.message
      });
    }
  });

  return router;
};
