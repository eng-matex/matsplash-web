const express = require('express');
const router = express.Router();

module.exports = (db) => {
  
  // ====== CUSTOMER MANAGEMENT ======
  
  // Get all customers
  router.get('/customers', async (req, res) => {
    try {
      const { search } = req.query;
      
      let query = db('driver_customers')
        .select(
          'driver_customers.*',
          'driver.name as last_driver_name'
        )
        .leftJoin('employees as driver', 'driver_customers.last_driver_id', 'driver.id')
        .orderBy('driver_customers.created_at', 'desc');

      if (search) {
        query = query.where(function() {
          this.where('driver_customers.name', 'like', `%${search}%`)
            .orWhere('driver_customers.phone', 'like', `%${search}%`)
            .orWhere('driver_customers.address', 'like', `%${search}%`);
        });
      }

      const customers = await query;

      res.json({
        success: true,
        data: customers
      });
    } catch (error) {
      console.error('Error fetching customers:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch customers'
      });
    }
  });

  // Create or update customer
  router.post('/customers', async (req, res) => {
    try {
      const { name, phone, address } = req.body;

      if (!name || !phone) {
        return res.status(400).json({
          success: false,
          message: 'Name and phone are required'
        });
      }

      // Check if customer exists
      const existing = await db('driver_customers')
        .where('phone', phone)
        .first();

      let customer;
      if (existing) {
        // Update existing customer
        await db('driver_customers')
          .where('id', existing.id)
          .update({
            name,
            address: address || existing.address,
            updated_at: new Date().toISOString()
          });
        customer = await db('driver_customers').where('id', existing.id).first();
      } else {
        // Create new customer
        const [customerId] = await db('driver_customers').insert({
          name,
          phone,
          address: address || null,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        customer = await db('driver_customers').where('id', customerId).first();
      }

      res.json({
        success: true,
        data: customer,
        message: existing ? 'Customer updated successfully' : 'Customer created successfully'
      });
    } catch (error) {
      console.error('Error saving customer:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to save customer'
      });
    }
  });

  // ====== DRIVER DISPATCH CREATION ======
  
  // Create driver dispatch order
  router.post('/create', async (req, res) => {
    try {
      const { driver_id, assistant_id, customer_orders, notes } = req.body;
      const receptionist_id = req.user?.id;

      if (!driver_id) {
        return res.status(400).json({
          success: false,
          message: 'Driver is required'
        });
      }

      if (!customer_orders || !Array.isArray(customer_orders) || customer_orders.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'At least one customer order is required'
        });
      }

      // Check if driver has outstanding balance
      const outstandingBalance = await db('driver_settlements')
        .where('driver_id', driver_id)
        .whereNot('status', 'completed')
        .sum('balance_due as total')
        .first();

      if (outstandingBalance?.total && outstandingBalance.total > 30000) {
        return res.status(400).json({
          success: false,
          message: `Driver has outstanding balance of ₦${outstandingBalance.total.toLocaleString()}. Cannot dispatch until settled.`,
          balance_due: outstandingBalance.total
        });
      }

      // Calculate total bags
      let totalBags = 0;
      let expectedRevenue = 0;

      customer_orders.forEach(order => {
        const bags = parseInt(order.bags) || 0;
        const price = bags >= 50 ? 250 : 270;
        totalBags += bags;
        expectedRevenue += bags * price;
      });

      // Create order
      const orderNumber = `DRV-${Date.now()}`;
      const [orderId] = await db('orders').insert({
        order_number: orderNumber,
        customer_name: 'Driver Dispatch - Multiple Customers',
        order_type: 'driver_dispatch',
        status: 'pending_pickup',
        total_amount: expectedRevenue,
        items: JSON.stringify([{ name: 'Sachet Water', quantity: totalBags, unit: 'bags' }]),
        delivery_address: 'Multiple destinations',
        assigned_driver_id: driver_id,
        assigned_assistant_id: assistant_id || null,
        created_by: receptionist_id,
        notes: notes || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      // Create settlement record
      await db('driver_settlements').insert({
        order_id: orderId,
        driver_id,
        assistant_id: assistant_id || null,
        bags_dispatched: totalBags,
        bags_sold: 0,
        bags_returned: 0,
        bags_at_250: 0,
        bags_at_270: 0,
        expected_amount: expectedRevenue,
        amount_collected: 0,
        balance_due: expectedRevenue,
        status: 'pending_settlement',
        receptionist_id,
        notes: notes || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      // Get full order with relationships
      const order = await db('orders')
        .select(
          'orders.*',
          'driver.name as driver_name',
          'assistant.name as assistant_name'
        )
        .leftJoin('employees as driver', 'orders.assigned_driver_id', 'driver.id')
        .leftJoin('employees as assistant', 'orders.assigned_assistant_id', 'assistant.id')
        .where('orders.id', orderId)
        .first();

      res.json({
        success: true,
        data: order,
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

  // Get all driver dispatches
  router.get('/', async (req, res) => {
    try {
      const { status, driver_id, start_date, end_date } = req.query;
      
      let query = db('orders')
        .select(
          'orders.*',
          'driver.name as driver_name',
          'assistant.name as assistant_name',
          'settlement.status as settlement_status',
          'settlement.balance_due'
        )
        .leftJoin('employees as driver', 'orders.assigned_driver_id', 'driver.id')
        .leftJoin('employees as assistant', 'orders.assigned_assistant_id', 'assistant.id')
        .leftJoin('driver_settlements as settlement', 'orders.id', 'settlement.order_id')
        .where('orders.order_type', 'driver_dispatch')
        .orderBy('orders.created_at', 'desc');

      if (status) {
        query = query.where('orders.status', status);
      }

      if (driver_id) {
        query = query.where('orders.assigned_driver_id', driver_id);
      }

      if (start_date) {
        query = query.where('orders.created_at', '>=', start_date);
      }

      if (end_date) {
        query = query.where('orders.created_at', '<=', end_date);
      }

      const dispatches = await query;

      res.json({
        success: true,
        data: dispatches
      });
    } catch (error) {
      console.error('Error fetching driver dispatches:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch driver dispatches'
      });
    }
  });

  // Get driver dispatch by ID
  router.get('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      const dispatch = await db('orders')
        .select(
          'orders.*',
          'driver.name as driver_name',
          'driver.phone as driver_phone',
          'assistant.name as assistant_name',
          'assistant.phone as assistant_phone',
          'settlement.*'
        )
        .leftJoin('employees as driver', 'orders.assigned_driver_id', 'driver.id')
        .leftJoin('employees as assistant', 'orders.assigned_assistant_id', 'assistant.id')
        .leftJoin('driver_settlements as settlement', 'orders.id', 'settlement.order_id')
        .where('orders.id', id)
        .where('orders.order_type', 'driver_dispatch')
        .first();

      if (!dispatch) {
        return res.status(404).json({
          success: false,
          message: 'Dispatch not found'
        });
      }

      res.json({
        success: true,
        data: dispatch
      });
    } catch (error) {
      console.error('Error fetching dispatch:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch dispatch'
      });
    }
  });

  // ====== SETTLEMENT PROCESSING ======
  
  // Process driver settlement
  router.post('/:id/settle', async (req, res) => {
    try {
      const { id } = req.params;
      const { bags_sold, bags_returned, bags_at_250, amount_paid, notes } = req.body;
      const receptionist_id = req.user?.id;

      const dispatch = await db('orders')
        .where('id', id)
        .where('order_type', 'driver_dispatch')
        .first();

      if (!dispatch) {
        return res.status(404).json({
          success: false,
          message: 'Dispatch not found'
        });
      }

      if (dispatch.status === 'settled') {
        return res.status(400).json({
          success: false,
          message: 'This dispatch is already settled'
        });
      }

      const bagsAt270 = bags_sold - bags_at_250;
      const expectedAmount = (bags_at_250 * 250) + (bagsAt270 * 270);
      const balanceDue = expectedAmount - amount_paid;
      const status = balanceDue <= 0 ? 'completed' : 'partial';

      // Update settlement
      await db('driver_settlements')
        .where('order_id', id)
        .update({
          bags_sold,
          bags_returned,
          bags_at_250,
          bags_at_270: bagsAt270,
          expected_amount: expectedAmount,
          amount_collected: amount_paid,
          balance_due: balanceDue,
          status,
          settled_at: new Date().toISOString(),
          notes: notes || null,
          updated_at: new Date().toISOString()
        });

      // Update order status
      await db('orders')
        .where('id', id)
        .update({
          status: status === 'completed' ? 'settled' : 'settlement_pending',
          updated_at: new Date().toISOString()
        });

      // Create commission record if fully settled
      if (status === 'completed') {
        await db('driver_commissions').insert({
          driver_id: dispatch.assigned_driver_id,
          assistant_id: dispatch.assigned_assistant_id,
          order_id: id,
          bags_sold,
          bags_returned,
          total_revenue: expectedAmount,
          commission_amount: 0, // Will be calculated by manager
          delivery_date: new Date().toISOString().split('T')[0],
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }

      const updatedSettlement = await db('driver_settlements')
        .where('order_id', id)
        .first();

      res.json({
        success: true,
        data: updatedSettlement,
        message: status === 'completed' ? 'Settlement completed successfully' : 'Partial settlement recorded'
      });
    } catch (error) {
      console.error('Error processing settlement:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process settlement'
      });
    }
  });

  // ====== RETURNS PROCESSING ======
  
  // Process returns
  router.post('/:id/process-return', async (req, res) => {
    try {
      const { id } = req.params;
      const { bags_returned, notes } = req.body;
      const receptionist_id = req.user?.id;

      const dispatch = await db('orders')
        .where('id', id)
        .where('order_type', 'driver_dispatch')
        .first();

      if (!dispatch) {
        return res.status(404).json({
          success: false,
          message: 'Dispatch not found'
        });
      }

      // Create return order for storekeeper review
      const returnOrderNumber = `RET-${Date.now()}`;
      const [returnOrderId] = await db('orders').insert({
        order_number: returnOrderNumber,
        customer_name: 'Return Processing',
        order_type: 'driver_return',
        status: 'pending_review',
        total_amount: 0,
        items: JSON.stringify([{ name: 'Sachet Water', quantity: bags_returned, unit: 'bags' }]),
        delivery_address: 'Return to warehouse',
        assigned_driver_id: dispatch.assigned_driver_id,
        created_by: receptionist_id,
        notes: notes || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      // Update original dispatch return count
      await db('driver_settlements')
        .where('order_id', id)
        .increment('bags_returned', bags_returned)
        .update({ updated_at: new Date().toISOString() });

      res.json({
        success: true,
        data: { return_order_id: returnOrderId },
        message: 'Return submitted for storekeeper review'
      });
    } catch (error) {
      console.error('Error processing return:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process return'
      });
    }
  });

  // ====== COMMISSION MANAGEMENT ======
  
  // Get commission records
  router.get('/commissions/pending', async (req, res) => {
    try {
      const commissions = await db('driver_commissions')
        .select(
          'driver_commissions.*',
          'driver.name as driver_name',
          'driver.first_name as driver_first_name',
          'driver.last_name as driver_last_name',
          'assistant.name as assistant_name',
          'assistant.first_name as assistant_first_name',
          'assistant.last_name as assistant_last_name',
          'order.order_number'
        )
        .leftJoin('employees as driver', 'driver_commissions.driver_id', 'driver.id')
        .leftJoin('employees as assistant', 'driver_commissions.assistant_id', 'assistant.id')
        .leftJoin('orders as order', 'driver_commissions.order_id', 'order.id')
        .where('driver_commissions.status', 'pending')
        .orderBy('driver_commissions.created_at', 'desc');

      res.json({
        success: true,
        data: commissions
      });
    } catch (error) {
      console.error('Error fetching commissions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch commissions'
      });
    }
  });

  // Approve/reject commission
  router.put('/commissions/:id/review', async (req, res) => {
    try {
      const { id } = req.params;
      const { action, commission_amount, comment } = req.body;
      const manager_id = req.user?.id;

      const commission = await db('driver_commissions').where('id', id).first();

      if (!commission) {
        return res.status(404).json({
          success: false,
          message: 'Commission not found'
        });
      }

      if (commission.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'This commission has already been reviewed'
        });
      }

      await db('driver_commissions')
        .where('id', id)
        .update({
          status: action === 'approve' ? 'approved' : 'rejected',
          commission_amount: action === 'approve' ? (commission_amount || 0) : 0,
          approved_by: manager_id,
          approved_at: new Date().toISOString(),
          manager_comment: comment || null,
          updated_at: new Date().toISOString()
        });

      res.json({
        success: true,
        message: `Commission ${action === 'approve' ? 'approved' : 'rejected'} successfully`
      });
    } catch (error) {
      console.error('Error reviewing commission:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to review commission'
      });
    }
  });

  return router;
};
