const express = require('express');
const router = express.Router();

module.exports = (db) => {

  // Get pricing rules
  router.get('/pricing-rules', async (req, res) => {
    try {
      const rules = await db('pricing_rules')
        .where('is_active', true)
        .orderBy('customer_type', 'asc')
        .orderBy('min_quantity', 'asc');

      res.json({
        success: true,
        data: rules
      });
    } catch (error) {
      console.error('Error fetching pricing rules:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch pricing rules'
      });
    }
  });

  // Calculate price based on customer type and quantity
  router.post('/calculate-price', async (req, res) => {
    try {
      const { customer_type, quantity } = req.body;

      const rule = await db('pricing_rules')
        .where('customer_type', customer_type)
        .where('is_active', true)
        .where('min_quantity', '<=', quantity)
        .where(function() {
          this.whereNull('max_quantity').orWhere('max_quantity', '>=', quantity);
        })
        .orderBy('min_quantity', 'desc')
        .first();

      if (!rule) {
        return res.status(400).json({
          success: false,
          message: 'No pricing rule found for this customer type and quantity'
        });
      }

      const totalAmount = quantity * rule.price_per_bag;

      res.json({
        success: true,
        data: {
          price_per_bag: rule.price_per_bag,
          quantity,
          total_amount: totalAmount,
          customer_type
        }
      });
    } catch (error) {
      console.error('Error calculating price:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to calculate price'
      });
    }
  });

  // Get customers
  router.get('/customers', async (req, res) => {
    try {
      const { type } = req.query;

      let query = db('customers').where('is_active', true);

      if (type) {
        query = query.where('type', type);
      }

      const customers = await query.orderBy('name', 'asc');

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

  // Create new customer
  router.post('/customers', async (req, res) => {
    try {
      const { name, type, phone, email, address } = req.body;

      const [customerId] = await db('customers').insert({
        name,
        type,
        phone,
        email,
        address,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      });

      const newCustomer = await db('customers').where('id', customerId).first();

      res.json({
        success: true,
        data: newCustomer,
        message: 'Customer created successfully'
      });
    } catch (error) {
      console.error('Error creating customer:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create customer'
      });
    }
  });

  // Create sales order
  router.post('/orders', async (req, res) => {
    try {
      const { 
        order_type, 
        customer_id, 
        driver_id, 
        driver_assistant_id, 
        bags_quantity, 
        price_per_bag, 
        total_amount, 
        receptionist_id, 
        notes 
      } = req.body;

      const [orderId] = await db('sales_orders').insert({
        order_type,
        customer_id,
        driver_id,
        driver_assistant_id,
        bags_quantity,
        price_per_bag,
        total_amount,
        receptionist_id,
        notes,
        status: 'pending',
        order_date: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      });

      const newOrder = await db('sales_orders')
        .select(
          'sales_orders.*',
          'customer.name as customer_name',
          'driver.name as driver_name',
          'assistant.name as assistant_name',
          'receptionist.name as receptionist_name'
        )
        .leftJoin('customers as customer', 'sales_orders.customer_id', 'customer.id')
        .leftJoin('employees as driver', 'sales_orders.driver_id', 'driver.id')
        .leftJoin('employees as assistant', 'sales_orders.driver_assistant_id', 'assistant.id')
        .leftJoin('employees as receptionist', 'sales_orders.receptionist_id', 'receptionist.id')
        .where('sales_orders.id', orderId)
        .first();

      res.json({
        success: true,
        data: newOrder,
        message: 'Sales order created successfully'
      });
    } catch (error) {
      console.error('Error creating sales order:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create sales order'
      });
    }
  });

  // Get sales orders
  router.get('/orders', async (req, res) => {
    try {
      const { order_type, status, startDate, endDate } = req.query;

      let query = db('sales_orders')
        .select(
          'sales_orders.*',
          'customer.name as customer_name',
          'driver.name as driver_name',
          'assistant.name as assistant_name',
          'receptionist.name as receptionist_name'
        )
        .leftJoin('customers as customer', 'sales_orders.customer_id', 'customer.id')
        .leftJoin('employees as driver', 'sales_orders.driver_id', 'driver.id')
        .leftJoin('employees as assistant', 'sales_orders.driver_assistant_id', 'assistant.id')
        .leftJoin('employees as receptionist', 'sales_orders.receptionist_id', 'receptionist.id');

      if (order_type) {
        query = query.where('sales_orders.order_type', order_type);
      }

      if (status) {
        query = query.where('sales_orders.status', status);
      }

      if (startDate) {
        query = query.where('sales_orders.order_date', '>=', startDate);
      }

      if (endDate) {
        query = query.where('sales_orders.order_date', '<=', endDate);
      }

      const orders = await query.orderBy('sales_orders.order_date', 'desc');

      res.json({
        success: true,
        data: orders
      });
    } catch (error) {
      console.error('Error fetching sales orders:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch sales orders'
      });
    }
  });

  // Update sales order status
  router.put('/orders/:orderId/status', async (req, res) => {
    try {
      const { orderId } = req.params;
      const { status, notes } = req.body;

      const updateData = {
        status,
        updated_at: new Date()
      };

      if (status === 'completed') {
        updateData.completed_at = new Date();
      }

      if (notes) {
        updateData.notes = notes;
      }

      await db('sales_orders')
        .where('id', orderId)
        .update(updateData);

      const updatedOrder = await db('sales_orders')
        .select(
          'sales_orders.*',
          'customer.name as customer_name',
          'driver.name as driver_name',
          'assistant.name as assistant_name',
          'receptionist.name as receptionist_name'
        )
        .leftJoin('customers as customer', 'sales_orders.customer_id', 'customer.id')
        .leftJoin('employees as driver', 'sales_orders.driver_id', 'driver.id')
        .leftJoin('employees as assistant', 'sales_orders.driver_assistant_id', 'assistant.id')
        .leftJoin('employees as receptionist', 'sales_orders.receptionist_id', 'receptionist.id')
        .where('sales_orders.id', orderId)
        .first();

      res.json({
        success: true,
        data: updatedOrder,
        message: 'Sales order status updated successfully'
      });
    } catch (error) {
      console.error('Error updating sales order status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update sales order status'
      });
    }
  });

  // Get sales summary
  router.get('/summary', async (req, res) => {
    try {
      const { startDate, endDate, order_type } = req.query;

      let query = db('sales_orders');

      if (startDate) {
        query = query.where('order_date', '>=', startDate);
      }

      if (endDate) {
        query = query.where('order_date', '<=', endDate);
      }

      if (order_type) {
        query = query.where('order_type', order_type);
      }

      const orders = await query.where('status', 'completed');

      const summary = {
        total_orders: orders.length,
        total_bags: orders.reduce((sum, order) => sum + order.bags_quantity, 0),
        total_revenue: orders.reduce((sum, order) => sum + parseFloat(order.total_amount), 0),
        by_type: {}
      };

      // Group by order type
      orders.forEach(order => {
        if (!summary.by_type[order.order_type]) {
          summary.by_type[order.order_type] = {
            count: 0,
            bags: 0,
            revenue: 0
          };
        }
        summary.by_type[order.order_type].count++;
        summary.by_type[order.order_type].bags += order.bags_quantity;
        summary.by_type[order.order_type].revenue += parseFloat(order.total_amount);
      });

      res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      console.error('Error fetching sales summary:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch sales summary'
      });
    }
  });

  // Get drivers for dispatch
  router.get('/drivers', async (req, res) => {
    try {
      const drivers = await db('employees')
        .whereIn('role', ['Driver', 'Driver Assistant'])
        .where('is_active', true)
        .orderBy('name', 'asc');

      res.json({
        success: true,
        data: drivers
      });
    } catch (error) {
      console.error('Error fetching drivers:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch drivers'
      });
    }
  });

  // Update pricing rule
  router.put('/pricing-rules/:ruleId', async (req, res) => {
    try {
      const { ruleId } = req.params;
      const { price_per_bag, is_active } = req.body;

      await db('pricing_rules')
        .where('id', ruleId)
        .update({
          price_per_bag,
          is_active,
          updated_at: new Date()
        });

      const updatedRule = await db('pricing_rules').where('id', ruleId).first();

      res.json({
        success: true,
        data: updatedRule,
        message: 'Pricing rule updated successfully'
      });
    } catch (error) {
      console.error('Error updating pricing rule:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update pricing rule'
      });
    }
  });

  // Create new pricing rule
  router.post('/pricing-rules', async (req, res) => {
    try {
      const { customer_type, min_quantity, max_quantity, price_per_bag } = req.body;

      const [ruleId] = await db('pricing_rules').insert({
        customer_type,
        min_quantity,
        max_quantity,
        price_per_bag,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      });

      const newRule = await db('pricing_rules').where('id', ruleId).first();

      res.json({
        success: true,
        data: newRule,
        message: 'Pricing rule created successfully'
      });
    } catch (error) {
      console.error('Error creating pricing rule:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create pricing rule'
      });
    }
  });

  // Get driver sales logs
  router.get('/driver-sales', async (req, res) => {
    try {
      const driverSales = await db('driver_sales_logs')
        .leftJoin('employees', 'driver_sales_logs.driver_id', 'employees.id')
        .leftJoin('orders', 'driver_sales_logs.order_id', 'orders.id')
        .select(
          'driver_sales_logs.*',
          'employees.name as driver_name',
          'orders.order_number'
        )
        .orderBy('driver_sales_logs.created_at', 'desc');

      res.json({
        success: true,
        data: driverSales
      });
    } catch (error) {
      console.error('Error fetching driver sales:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch driver sales'
      });
    }
  });

  // Create driver settlement
  router.post('/driver-settlement', async (req, res) => {
    try {
      const { 
        driver_id, 
        order_id, 
        bags_sold, 
        bags_returned, 
        total_sales, 
        money_submitted, 
        notes, 
        receptionist_id 
      } = req.body;

      // Calculate commission (₦30 per bag sold)
      const commission_earned = bags_sold * 30;

      const [settlementId] = await db('driver_sales_logs').insert({
        driver_id,
        order_id,
        bags_sold,
        bags_returned,
        total_sales,
        commission_earned,
        money_submitted,
        notes,
        receptionist_id,
        approval_status: 'Pending Manager Approval',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      // Log system activity
      await db('system_activity').insert({
        user_id: receptionist_id,
        user_email: req.body.userEmail || 'unknown',
        activity_type: 'DRIVER_SETTLEMENT_CREATED',
        description: `Driver settlement created for driver ${driver_id}, order ${order_id}`,
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
        timestamp: new Date().toISOString(),
        created_at: new Date().toISOString()
      });

      const newSettlement = await db('driver_sales_logs')
        .leftJoin('employees', 'driver_sales_logs.driver_id', 'employees.id')
        .leftJoin('orders', 'driver_sales_logs.order_id', 'orders.id')
        .select(
          'driver_sales_logs.*',
          'employees.name as driver_name',
          'orders.order_number'
        )
        .where('driver_sales_logs.id', settlementId)
        .first();

      res.json({
        success: true,
        data: newSettlement,
        message: 'Driver settlement created successfully'
      });
    } catch (error) {
      console.error('Error creating driver settlement:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create driver settlement'
      });
    }
  });

  // Approve commission
  router.put('/commission/:id/approve', async (req, res) => {
    try {
      const { id } = req.params;
      const { approved_by, approval_notes } = req.body;

      if (!approved_by) {
        return res.status(400).json({
          success: false,
          message: 'Approved by is required'
        });
      }

      // Update the driver sales log
      await db('driver_sales_logs')
        .where('id', id)
        .update({
          approval_status: 'Approved',
          approved_by: approved_by,
          approval_notes: approval_notes || 'Approved by Manager',
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      // Log system activity
      await db('system_activity').insert({
        user_id: approved_by,
        user_email: req.body.userEmail || 'unknown',
        activity_type: 'COMMISSION_APPROVED',
        description: `Commission approved for driver sales log ${id}`,
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
        timestamp: new Date().toISOString(),
        created_at: new Date().toISOString()
      });

      res.json({
        success: true,
        message: 'Commission approved successfully'
      });
    } catch (error) {
      console.error('Error approving commission:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to approve commission'
      });
    }
  });

  // Reject commission
  router.put('/commission/:id/reject', async (req, res) => {
    try {
      const { id } = req.params;
      const { rejected_by, rejection_notes } = req.body;

      if (!rejected_by) {
        return res.status(400).json({
          success: false,
          message: 'Rejected by is required'
        });
      }

      // Update the driver sales log
      await db('driver_sales_logs')
        .where('id', id)
        .update({
          approval_status: 'Rejected',
          rejected_by: rejected_by,
          rejection_notes: rejection_notes || 'Rejected by Manager',
          rejected_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      // Log system activity
      await db('system_activity').insert({
        user_id: rejected_by,
        user_email: req.body.userEmail || 'unknown',
        activity_type: 'COMMISSION_REJECTED',
        description: `Commission rejected for driver sales log ${id}`,
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
        timestamp: new Date().toISOString(),
        created_at: new Date().toISOString()
      });

      res.json({
        success: true,
        message: 'Commission rejected successfully'
      });
    } catch (error) {
      console.error('Error rejecting commission:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to reject commission'
      });
    }
  });

  return router;
};
