const express = require('express');
const router = express.Router();

module.exports = (db) => {
  // Get salary rates for an employee
  router.get('/rates/:employeeId', async (req, res) => {
    try {
      const { employeeId } = req.params;
      
      const rates = await db('salary_rates')
        .where('employee_id', employeeId)
        .where('is_active', true)
        .orderBy('created_at', 'desc');

      res.json({
        success: true,
        data: rates
      });
    } catch (error) {
      console.error('Error fetching salary rates:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch salary rates'
      });
    }
  });

  // Update salary rate for an employee
  router.put('/rates/:employeeId', async (req, res) => {
    try {
      const { employeeId } = req.params;
      const { rate_type, rate_amount } = req.body;

      // Deactivate current rate
      await db('salary_rates')
        .where('employee_id', employeeId)
        .where('rate_type', rate_type)
        .update({ is_active: false, updated_at: new Date() });

      // Create new rate
      const [newRateId] = await db('salary_rates').insert({
        employee_id: employeeId,
        rate_type,
        rate_amount,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      });

      const newRate = await db('salary_rates').where('id', newRateId).first();

      res.json({
        success: true,
        data: newRate,
        message: 'Salary rate updated successfully'
      });
    } catch (error) {
      console.error('Error updating salary rate:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update salary rate'
      });
    }
  });

  // Get packing logs for a packer
  router.get('/packing-logs/:packerId', async (req, res) => {
    try {
      const { packerId } = req.params;
      const { status, startDate, endDate } = req.query;

      let query = db('packing_logs')
        .select(
          'packing_logs.*',
          'packer.name as packer_name',
          'storekeeper.name as storekeeper_name',
          'manager.name as manager_name'
        )
        .leftJoin('employees as packer', 'packing_logs.packer_id', 'packer.id')
        .leftJoin('employees as storekeeper', 'packing_logs.storekeeper_id', 'storekeeper.id')
        .leftJoin('employees as manager', 'packing_logs.manager_id', 'manager.id')
        .where('packing_logs.packer_id', packerId);

      if (status) {
        query = query.where('packing_logs.status', status);
      }

      if (startDate) {
        query = query.where('packing_logs.packing_date', '>=', startDate);
      }

      if (endDate) {
        query = query.where('packing_logs.packing_date', '<=', endDate);
      }

      const logs = await query.orderBy('packing_logs.packing_date', 'desc');

      res.json({
        success: true,
        data: logs
      });
    } catch (error) {
      console.error('Error fetching packing logs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch packing logs'
      });
    }
  });

  // Create new packing log (Storekeeper)
  router.post('/packing-logs', async (req, res) => {
    try {
      const { packer_id, bags_packed, packing_date, storekeeper_id, storekeeper_notes } = req.body;

      const [logId] = await db('packing_logs').insert({
        packer_id,
        bags_packed,
        packing_date,
        storekeeper_id,
        storekeeper_notes,
        status: 'pending',
        created_at: new Date(),
        updated_at: new Date()
      });

      const newLog = await db('packing_logs')
        .select(
          'packing_logs.*',
          'packer.name as packer_name',
          'storekeeper.name as storekeeper_name'
        )
        .leftJoin('employees as packer', 'packing_logs.packer_id', 'packer.id')
        .leftJoin('employees as storekeeper', 'packing_logs.storekeeper_id', 'storekeeper.id')
        .where('packing_logs.id', logId)
        .first();

      res.json({
        success: true,
        data: newLog,
        message: 'Packing log created successfully'
      });
    } catch (error) {
      console.error('Error creating packing log:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create packing log'
      });
    }
  });

  // Confirm packing log (Packer)
  router.put('/packing-logs/:logId/confirm', async (req, res) => {
    try {
      const { logId } = req.params;
      const { packer_notes } = req.body;

      await db('packing_logs')
        .where('id', logId)
        .update({
          status: 'confirmed',
          packer_notes,
          confirmed_at: new Date(),
          updated_at: new Date()
        });

      const updatedLog = await db('packing_logs')
        .select(
          'packing_logs.*',
          'packer.name as packer_name',
          'storekeeper.name as storekeeper_name'
        )
        .leftJoin('employees as packer', 'packing_logs.packer_id', 'packer.id')
        .leftJoin('employees as storekeeper', 'packing_logs.storekeeper_id', 'storekeeper.id')
        .where('packing_logs.id', logId)
        .first();

      res.json({
        success: true,
        data: updatedLog,
        message: 'Packing log confirmed successfully'
      });
    } catch (error) {
      console.error('Error confirming packing log:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to confirm packing log'
      });
    }
  });

  // Dispute packing log (Packer)
  router.put('/packing-logs/:logId/dispute', async (req, res) => {
    try {
      const { logId } = req.params;
      const { disputed_bags, dispute_reason, packer_notes } = req.body;

      await db('packing_logs')
        .where('id', logId)
        .update({
          status: 'disputed',
          disputed_bags,
          dispute_reason,
          packer_notes,
          updated_at: new Date()
        });

      const updatedLog = await db('packing_logs')
        .select(
          'packing_logs.*',
          'packer.name as packer_name',
          'storekeeper.name as storekeeper_name'
        )
        .leftJoin('employees as packer', 'packing_logs.packer_id', 'packer.id')
        .leftJoin('employees as storekeeper', 'packing_logs.storekeeper_id', 'storekeeper.id')
        .where('packing_logs.id', logId)
        .first();

      res.json({
        success: true,
        data: updatedLog,
        message: 'Packing log disputed successfully'
      });
    } catch (error) {
      console.error('Error disputing packing log:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to dispute packing log'
      });
    }
  });

  // Approve packing log (Manager)
  router.put('/packing-logs/:logId/approve', async (req, res) => {
    try {
      const { logId } = req.params;
      const { manager_id, manager_notes, final_bags } = req.body;

      const updateData = {
        status: 'approved',
        manager_id,
        manager_notes,
        approved_at: new Date(),
        updated_at: new Date()
      };

      // If final_bags is provided, update the bags_packed count
      if (final_bags !== undefined) {
        updateData.bags_packed = final_bags;
      }

      await db('packing_logs')
        .where('id', logId)
        .update(updateData);

      const updatedLog = await db('packing_logs')
        .select(
          'packing_logs.*',
          'packer.name as packer_name',
          'storekeeper.name as storekeeper_name',
          'manager.name as manager_name'
        )
        .leftJoin('employees as packer', 'packing_logs.packer_id', 'packer.id')
        .leftJoin('employees as storekeeper', 'packing_logs.storekeeper_id', 'storekeeper.id')
        .leftJoin('employees as manager', 'packing_logs.manager_id', 'manager.id')
        .where('packing_logs.id', logId)
        .first();

      res.json({
        success: true,
        data: updatedLog,
        message: 'Packing log approved successfully'
      });
    } catch (error) {
      console.error('Error approving packing log:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to approve packing log'
      });
    }
  });

  // Get driver sales logs
  router.get('/driver-sales/:driverId', async (req, res) => {
    try {
      const { driverId } = req.params;
      const { status, startDate, endDate } = req.query;

      let query = db('driver_sales_logs')
        .select(
          'driver_sales_logs.*',
          'driver.name as driver_name',
          'assistant.name as assistant_name',
          'receptionist.name as receptionist_name'
        )
        .leftJoin('employees as driver', 'driver_sales_logs.driver_id', 'driver.id')
        .leftJoin('employees as assistant', 'driver_sales_logs.driver_assistant_id', 'assistant.id')
        .leftJoin('employees as receptionist', 'driver_sales_logs.receptionist_id', 'receptionist.id')
        .where('driver_sales_logs.driver_id', driverId);

      if (status) {
        query = query.where('driver_sales_logs.status', status);
      }

      if (startDate) {
        query = query.where('driver_sales_logs.delivery_date', '>=', startDate);
      }

      if (endDate) {
        query = query.where('driver_sales_logs.delivery_date', '<=', endDate);
      }

      const logs = await query.orderBy('driver_sales_logs.delivery_date', 'desc');

      res.json({
        success: true,
        data: logs
      });
    } catch (error) {
      console.error('Error fetching driver sales logs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch driver sales logs'
      });
    }
  });

  // Create driver dispatch (Receptionist)
  router.post('/driver-dispatch', async (req, res) => {
    try {
      const { driver_id, driver_assistant_id, bags_dispatched, receptionist_id, notes } = req.body;

      const [logId] = await db('driver_sales_logs').insert({
        driver_id,
        driver_assistant_id,
        bags_dispatched,
        expected_revenue: bags_dispatched * 250, // Default expected revenue
        delivery_date: new Date().toISOString().split('T')[0],
        receptionist_id,
        driver_notes: notes,
        status: 'dispatched',
        dispatched_at: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      });

      const newLog = await db('driver_sales_logs')
        .select(
          'driver_sales_logs.*',
          'driver.name as driver_name',
          'assistant.name as assistant_name',
          'receptionist.name as receptionist_name'
        )
        .leftJoin('employees as driver', 'driver_sales_logs.driver_id', 'driver.id')
        .leftJoin('employees as assistant', 'driver_sales_logs.driver_assistant_id', 'assistant.id')
        .leftJoin('employees as receptionist', 'driver_sales_logs.receptionist_id', 'receptionist.id')
        .where('driver_sales_logs.id', logId)
        .first();

      res.json({
        success: true,
        data: newLog,
        message: 'Driver dispatch created successfully'
      });
    } catch (error) {
      console.error('Error creating driver dispatch:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create driver dispatch'
      });
    }
  });

  // Account driver sales (Receptionist)
  router.put('/driver-sales/:logId/account', async (req, res) => {
    try {
      const { logId } = req.params;
      const { bags_sold_270, bags_sold_250, bags_returned, total_revenue, receptionist_notes } = req.body;

      const totalBagsSold = bags_sold_270 + bags_sold_250;
      const expectedBagsSold = bags_sold_270 + bags_sold_250 + bags_returned;

      await db('driver_sales_logs')
        .where('id', logId)
        .update({
          bags_sold_270,
          bags_sold_250,
          bags_returned,
          total_revenue,
          status: 'accounted',
          receptionist_notes,
          accounted_at: new Date(),
          updated_at: new Date()
        });

      const updatedLog = await db('driver_sales_logs')
        .select(
          'driver_sales_logs.*',
          'driver.name as driver_name',
          'assistant.name as assistant_name',
          'receptionist.name as receptionist_name'
        )
        .leftJoin('employees as driver', 'driver_sales_logs.driver_id', 'driver.id')
        .leftJoin('employees as assistant', 'driver_sales_logs.driver_assistant_id', 'assistant.id')
        .leftJoin('employees as receptionist', 'driver_sales_logs.receptionist_id', 'receptionist.id')
        .where('driver_sales_logs.id', logId)
        .first();

      res.json({
        success: true,
        data: updatedLog,
        message: 'Driver sales accounted successfully'
      });
    } catch (error) {
      console.error('Error accounting driver sales:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to account driver sales'
      });
    }
  });

  // Get salary summary for an employee
  router.get('/summary/:employeeId', async (req, res) => {
    try {
      const { employeeId } = req.params;
      const { year, month } = req.query;

      const currentYear = year || new Date().getFullYear();
      const currentMonth = month || new Date().getMonth() + 1;

      // Get employee info
      const employee = await db('employees').where('id', employeeId).first();

      // Get salary rate
      const salaryRate = await db('salary_rates')
        .where('employee_id', employeeId)
        .where('is_active', true)
        .first();

      let totalEarnings = 0;
      let totalBags = 0;

      if (employee.role === 'Packer') {
        // Get approved packing logs for the month
        const packingLogs = await db('packing_logs')
          .where('packer_id', employeeId)
          .where('status', 'approved')
          .whereRaw('strftime("%Y", packing_date) = ?', [currentYear])
          .whereRaw('strftime("%m", packing_date) = ?', [currentMonth.toString().padStart(2, '0')]);

        totalBags = packingLogs.reduce((sum, log) => sum + log.bags_packed, 0);
        totalEarnings = totalBags * (salaryRate?.rate_amount || 0);
      } else if (employee.role === 'Driver' || employee.role === 'Driver Assistant') {
        // Get accounted driver sales for the month
        const salesLogs = await db('driver_sales_logs')
          .where('driver_id', employeeId)
          .where('status', 'accounted')
          .whereRaw('strftime("%Y", delivery_date) = ?', [currentYear])
          .whereRaw('strftime("%m", delivery_date) = ?', [currentMonth.toString().padStart(2, '0')]);

        totalBags = salesLogs.reduce((sum, log) => sum + log.bags_sold_270 + log.bags_sold_250, 0);
        totalEarnings = totalBags * (salaryRate?.rate_amount || 0);
      }

      res.json({
        success: true,
        data: {
          employee,
          salaryRate,
          totalBags,
          totalEarnings,
          period: `${currentYear}-${currentMonth.toString().padStart(2, '0')}`
        }
      });
    } catch (error) {
      console.error('Error fetching salary summary:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch salary summary'
      });
    }
  });

  // Get all pending approvals (Manager)
  router.get('/pending-approvals', async (req, res) => {
    try {
      const pendingLogs = await db('packing_logs')
        .select(
          'packing_logs.*',
          'packer.name as packer_name',
          'storekeeper.name as storekeeper_name'
        )
        .leftJoin('employees as packer', 'packing_logs.packer_id', 'packer.id')
        .leftJoin('employees as storekeeper', 'packing_logs.storekeeper_id', 'storekeeper.id')
        .whereIn('packing_logs.status', ['confirmed', 'disputed'])
        .orderBy('packing_logs.created_at', 'desc');

      res.json({
        success: true,
        data: pendingLogs
      });
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch pending approvals'
      });
    }
  });

  return router;
};
