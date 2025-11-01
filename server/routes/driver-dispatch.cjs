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

  // ====== CUSTOMER CALLS MANAGEMENT ======
  
  // Record customer call (when driver calls receptionist about 50+ bag customer)
  router.post('/:dispatchId/customer-calls', async (req, res) => {
    try {
      const { dispatchId } = req.params;
      const { customer_name, customer_phone, customer_address, bags, driver_id } = req.body;
      const receptionist_id = req.user?.id;

      if (!customer_name || !customer_phone || !bags || bags < 50) {
        return res.status(400).json({
          success: false,
          message: 'Customer name, phone, and bags (50+) are required'
        });
      }

      if (!driver_id) {
        return res.status(400).json({
          success: false,
          message: 'Driver ID is required'
        });
      }

      // Verify dispatch order exists
      const dispatch = await db('orders')
        .where('id', dispatchId)
        .where('order_type', 'driver_dispatch')
        .first();

      if (!dispatch) {
        return res.status(404).json({
          success: false,
          message: 'Dispatch order not found'
        });
      }

      // Check if customer exists
      const existingCustomer = await db('driver_customers')
        .where('phone', customer_phone)
        .first();

      let customer_id = null;
      let originator_driver_id = null;

      if (existingCustomer) {
        customer_id = existingCustomer.id;
        // Use existing originator if available, otherwise set current driver as originator
        originator_driver_id = existingCustomer.originator_driver_id || driver_id;
      } else {
        // Create new customer - first driver to call is the originator
        const [newCustomerId] = await db('driver_customers').insert({
          name: customer_name,
          phone: customer_phone,
          address: customer_address || null,
          originator_driver_id: driver_id,
          last_driver_id: driver_id,
          total_orders: 0,
          total_amount: 0,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        customer_id = newCustomerId;
        originator_driver_id = driver_id;
      }

      // Record the customer call
      const [callId] = await db('driver_customer_calls').insert({
        dispatch_order_id: dispatchId,
        customer_id,
        customer_name,
        customer_phone,
        customer_address: customer_address || null,
        driver_id,
        originator_driver_id,
        bags,
        processed: false,
        receptionist_id,
        called_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      const call = await db('driver_customer_calls')
        .where('id', callId)
        .first();

      res.json({
        success: true,
        data: call,
        message: 'Customer call recorded successfully'
      });
    } catch (error) {
      console.error('Error recording customer call:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to record customer call'
      });
    }
  });

  // Get customer calls for a dispatch
  router.get('/:dispatchId/customer-calls', async (req, res) => {
    try {
      const { dispatchId } = req.params;
      
      const calls = await db('driver_customer_calls')
        .select(
          'driver_customer_calls.*',
          'driver.name as driver_name',
          'originator.name as originator_driver_name'
        )
        .leftJoin('employees as driver', 'driver_customer_calls.driver_id', 'driver.id')
        .leftJoin('employees as originator', 'driver_customer_calls.originator_driver_id', 'originator.id')
        .where('driver_customer_calls.dispatch_order_id', dispatchId)
        .orderBy('driver_customer_calls.called_at', 'desc');

      res.json({
        success: true,
        data: calls
      });
    } catch (error) {
      console.error('Error fetching customer calls:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch customer calls'
      });
    }
  });

  // Get all customer calls (for filtering view)
  router.get('/customer-calls/all', async (req, res) => {
    try {
      const { start_date, end_date, driver_id, originator_driver_id, phone, sort_by } = req.query;
      
      let query = db('driver_customer_calls')
        .select(
          'driver_customer_calls.*',
          'driver.name as driver_name',
          'originator.name as originator_driver_name',
          'dispatch.order_number as dispatch_order_number'
        )
        .leftJoin('employees as driver', 'driver_customer_calls.driver_id', 'driver.id')
        .leftJoin('employees as originator', 'driver_customer_calls.originator_driver_id', 'originator.id')
        .leftJoin('orders as dispatch', 'driver_customer_calls.dispatch_order_id', 'dispatch.id');

      if (start_date) {
        query = query.where('driver_customer_calls.called_at', '>=', start_date);
      }

      if (end_date) {
        query = query.where('driver_customer_calls.called_at', '<=', end_date);
      }

      if (driver_id) {
        query = query.where('driver_customer_calls.driver_id', driver_id);
      }

      if (originator_driver_id) {
        query = query.where('driver_customer_calls.originator_driver_id', originator_driver_id);
      }

      if (phone) {
        query = query.where('driver_customer_calls.customer_phone', 'like', `%${phone}%`);
      }

      // Sort by highest purchaser (total bags per customer) or date
      if (sort_by === 'highest_purchaser') {
        // For highest purchaser, we'll group by customer and calculate totals, then sort
        // This is done in memory after fetching for simplicity
        const calls = await query;
        // Group by customer phone and calculate totals
        const customerTotals = {};
        calls.forEach((call) => {
          if (!customerTotals[call.customer_phone]) {
            customerTotals[call.customer_phone] = 0;
          }
          customerTotals[call.customer_phone] += call.bags;
        });
        // Sort by total bags
        calls.sort((a, b) => {
          const totalA = customerTotals[a.customer_phone] || 0;
          const totalB = customerTotals[b.customer_phone] || 0;
          return totalB - totalA;
        });
        return res.json({
          success: true,
          data: calls
        });
      } else {
        query = query.orderBy('driver_customer_calls.called_at', 'desc');
      }

      if (sort_by !== 'highest_purchaser') {
        const calls = await query;
        res.json({
          success: true,
          data: calls
        });
      }
    } catch (error) {
      console.error('Error fetching all customer calls:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch customer calls'
      });
    }
  });

  // Delete customer call (before settlement)
  router.delete('/customer-calls/:callId', async (req, res) => {
    try {
      const { callId } = req.params;
      
      const call = await db('driver_customer_calls').where('id', callId).first();
      
      if (!call) {
        return res.status(404).json({
          success: false,
          message: 'Customer call not found'
        });
      }

      if (call.processed) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete processed customer call'
        });
      }

      await db('driver_customer_calls').where('id', callId).delete();

      res.json({
        success: true,
        message: 'Customer call deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting customer call:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete customer call'
      });
    }
  });

  // ====== DRIVER DISPATCH CREATION ======
  
  // Create driver dispatch order
  router.post('/create', async (req, res) => {
    try {
      const { driver_id, assistant_id, bags_dispatched, notes } = req.body;
      const receptionist_id = req.user?.id;

      if (!driver_id) {
        return res.status(400).json({
          success: false,
          message: 'Driver is required'
        });
      }

      if (!bags_dispatched || bags_dispatched <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Number of bags dispatched is required'
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

      // Calculate expected revenue (all bags at 270 since no customer info yet)
      const totalBags = parseInt(bags_dispatched);
      const expectedRevenue = totalBags * 270;

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
          'orders.assigned_driver_id',
          'orders.assigned_assistant_id',
          'settlement.status as settlement_status',
          'settlement.balance_due',
          'settlement.amount_collected',
          'settlement.expected_amount',
          'settlement.settled_at'
        )
        .leftJoin('employees as driver', 'orders.assigned_driver_id', 'driver.id')
        .leftJoin('employees as assistant', 'orders.assigned_assistant_id', 'assistant.id')
        .leftJoin('driver_settlements as settlement', 'orders.id', 'settlement.order_id')
        .where('orders.order_type', 'driver_dispatch')
        .orderBy('orders.created_at', 'desc');

      if (status) {
        // Support multiple statuses separated by comma
        const statuses = status.split(',');
        if (statuses.length > 1) {
          query = query.whereIn('orders.status', statuses);
        } else {
          query = query.where('orders.status', status);
        }
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
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch driver dispatches',
        error: error.message
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
      const { bags_sold, bags_returned, amount_paid, notes } = req.body;
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

      // Check if settlement already exists
      const existingSettlement = await db('driver_settlements').where('order_id', id).first();

      // Determine if this is the first actual settlement (no amount_collected yet)
      const isFirstSettlement = !existingSettlement || existingSettlement.amount_collected === 0;

      let bagsAt250 = 0;

      // Only process customer calls if this is the first settlement
      if (isFirstSettlement) {
        // Get stored customer calls (50+ bag customers that driver called about)
        const customerCalls = await db('driver_customer_calls')
          .where('dispatch_order_id', id)
          .where('processed', false);

        // Process stored customer calls and update customer stats
        for (const call of customerCalls) {
          // Update customer stats
          if (call.customer_id) {
            const customer = await db('driver_customers').where('id', call.customer_id).first();
            if (customer) {
              await db('driver_customers')
                .where('id', call.customer_id)
                .update({
                  total_orders: customer.total_orders + 1,
                  total_amount: customer.total_amount + (call.bags * 250),
                  last_order_date: new Date().toISOString(),
                  last_driver_id: dispatch.assigned_driver_id,
                  updated_at: new Date().toISOString()
                });
            }
          }
          bagsAt250 += call.bags;
          
          // Mark call as processed
          await db('driver_customer_calls')
            .where('id', call.id)
            .update({
              processed: true,
              updated_at: new Date().toISOString()
            });
        }
      } else {
        // For partial payments, use existing values
        bagsAt250 = existingSettlement.bags_at_250 || 0;
      }

      // Calculate expected amount:
      // For first settlement: bags at 250 * 250 + (bags_sold - bags at 250) * 270
      // For partial payments: use existing expected_amount
      const expectedAmount = isFirstSettlement
        ? ((bagsAt250 * 250) + ((bags_sold - bagsAt250) * 270))
        : existingSettlement.expected_amount;
      
      // For partial payments, add to existing amount_collected
      const totalCollected = existingSettlement 
        ? existingSettlement.amount_collected + amount_paid 
        : amount_paid;
      
      const balanceDue = expectedAmount - totalCollected;
      const status = balanceDue <= 0 ? 'completed' : 'partial';

      // Validate: amount paid should not exceed expected amount
      if (amount_paid < 0) {
        return res.status(400).json({
          success: false,
          message: 'Amount paid cannot be negative'
        });
      }

      // Validate: total collected should not exceed expected amount (allow for rounding)
      if (totalCollected > expectedAmount + 1) {
        return res.status(400).json({
          success: false,
          message: `Amount paid exceeds expected amount. Total due: ₦${expectedAmount.toLocaleString()}, attempting to collect: ₦${totalCollected.toLocaleString()}`
        });
      }

      // Calculate bags_at_270 for first settlement only
      const bagsAt270 = isFirstSettlement ? (bags_sold - bagsAt250) : (existingSettlement?.bags_at_270 || 0);

      // Update settlement (already created on dispatch)
      await db('driver_settlements')
        .where('order_id', id)
        .update({
          bags_sold: existingSettlement ? existingSettlement.bags_sold : bags_sold,
          bags_returned: existingSettlement ? existingSettlement.bags_returned : bags_returned,
          bags_at_250: existingSettlement ? existingSettlement.bags_at_250 : bagsAt250,
          bags_at_270: bagsAt270,
          expected_amount: expectedAmount,
          amount_collected: totalCollected,
          balance_due: balanceDue,
          status,
          settled_at: new Date().toISOString(),
          notes: notes || existingSettlement?.notes,
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
