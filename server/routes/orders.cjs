const express = require('express');
const router = express.Router();

module.exports = (db) => {

  // Get all orders
  router.get('/', async (req, res) => {
    try {
      const { status, order_type, limit = 100 } = req.query;
      
      let query = db('orders')
        .select(
          'orders.*',
          'driver.name as assigned_driver_name',
          'assistant.name as assigned_assistant_name'
        )
        .leftJoin('employees as driver', 'orders.assigned_driver_id', 'driver.id')
        .leftJoin('employees as assistant', 'orders.assigned_assistant_id', 'assistant.id')
        .orderBy('orders.created_at', 'desc')
        .limit(parseInt(limit));

      if (status) {
        query = query.where('orders.status', status);
      }

      if (order_type) {
        query = query.where('orders.order_type', order_type);
      }

      const orders = await query;

      res.json({
        success: true,
        data: orders
      });

    } catch (error) {
      console.error('Error fetching orders:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch orders'
      });
    }
  });

  // Get order by ID
  router.get('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      const order = await db('orders')
        .select(
          'orders.*',
          'driver.name as assigned_driver_name',
          'assistant.name as assigned_assistant_name'
        )
        .leftJoin('employees as driver', 'orders.assigned_driver_id', 'driver.id')
        .leftJoin('employees as assistant', 'orders.assigned_assistant_id', 'assistant.id')
        .where('orders.id', id)
        .first();

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      res.json({
        success: true,
        data: order
      });

    } catch (error) {
      console.error('Error fetching order:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch order'
      });
    }
  });

  // Create new order
  router.post('/', async (req, res) => {
    try {
      const { 
        customer_name, 
        customer_phone, 
        customer_email, 
        order_type, 
        items, 
        total_amount, 
        payment_method, 
        notes, 
        delivery_address 
      } = req.body;

      if (!customer_name || !order_type || !items || !Array.isArray(items)) {
        return res.status(400).json({
          success: false,
          message: 'Customer name, order type, and items are required'
        });
      }

      // Generate order number
      const orderCount = await db('orders').count('* as count').first();
      const orderNumber = `ORD-${String(orderCount.count + 1).padStart(6, '0')}`;

      const [orderId] = await db('orders').insert({
        order_number: orderNumber,
        customer_name,
        customer_phone: customer_phone || null,
        customer_email: customer_email || null,
        order_type,
        items: JSON.stringify(items),
        total_amount: total_amount || 0,
        payment_method: payment_method || 'cash',
        payment_status: 'pending',
        status: 'pending',
        notes: notes || null,
        delivery_address: delivery_address || null,
        created_by: req.user?.id || 1, // Default to admin if no user
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      res.status(201).json({
        success: true,
        message: 'Order created successfully',
        data: { id: orderId, order_number: orderNumber }
      });

    } catch (error) {
      console.error('Error creating order:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create order'
      });
    }
  });

  // Confirm pickup (Storekeeper confirms order pickup and deducts from inventory)
  router.put('/:id/confirm-pickup', async (req, res) => {
    try {
      const { id } = req.params;
      const { userId, userEmail } = req.body;

      // Get order details
      const order = await db('orders').where('id', id).first();
      
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      if (order.status !== 'pending' && order.status !== 'pending_pickup') {
        return res.status(400).json({
          success: false,
          message: 'Order is not pending pickup'
        });
      }

      // Parse items JSON
      const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
      
      // Calculate total quantity of Sachet Water (support both 'name' and 'product_name' fields)
      const sachetWaterItem = items.find(item => (item.product_name || item.name) === 'Sachet Water');
      const totalQuantity = sachetWaterItem ? sachetWaterItem.quantity : 0;

      if (totalQuantity === 0) {
        return res.status(400).json({
          success: false,
          message: 'No Sachet Water items in this order'
        });
      }

      // Get current stock
      const stockAgg = await db('inventory_logs')
        .where('product_name', 'Sachet Water')
        .sum('quantity_change as total')
        .first();
      const currentStock = stockAgg.total || 0;

      // Check if enough stock is available
      if (currentStock < totalQuantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock. Current: ${currentStock}, Required: ${totalQuantity}`
        });
      }

      // Calculate new stock after deduction
      const newStock = currentStock - totalQuantity;

      // Update order status (set to out_for_delivery for driver dispatch)
      const newStatus = order.order_type === 'driver_dispatch' ? 'out_for_delivery' : 'picked_up';
      
      await db('orders')
        .where('id', id)
        .update({
          status: newStatus,
          picked_up_at: new Date().toISOString(),
          storekeeper_authorized: true,
          authorization_time: new Date().toISOString(),
          authorization_by: userId || req.user?.id,
          updated_at: new Date().toISOString()
        });

      // Deduct from inventory logs
      await db('inventory_logs').insert({
        product_name: 'Sachet Water',
        quantity_change: -totalQuantity, // Negative for deduction
        current_stock: newStock,
        operation_type: 'out',
        reason: `Order pickup: ${totalQuantity} bags for order ${order.order_number} - ${order.customer_name}`,
        employee_id: userId || req.user?.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      // Log system activity
      if (userId) {
        await db('system_activity').insert({
          user_id: userId,
          user_email: userEmail || 'unknown',
          action: 'ORDER_PICKUP_CONFIRMED',
          details: `Confirmed pickup for order ${order.order_number}: ${totalQuantity} bags`,
          ip_address: req.ip,
          user_agent: req.get('User-Agent'),
          created_at: new Date().toISOString()
        });
      }

      res.json({
        success: true,
        message: 'Pickup confirmed successfully',
        data: {
          order_id: id,
          quantity_picked: totalQuantity,
          new_stock: newStock
        }
      });

    } catch (error) {
      console.error('Error confirming pickup:', error);
      console.error('Error stack:', error.stack);
      console.error('Error message:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to confirm pickup',
        error: error.message
      });
    }
  });

  // Process returns (Storekeeper confirms return and adds back to inventory)
  router.put('/:id/process-return', async (req, res) => {
    try {
      const { id } = req.params;
      const { quantity_returned, notes, userId, userEmail } = req.body;

      if (!quantity_returned || quantity_returned <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Valid quantity returned is required'
        });
      }

      // Get order details
      const order = await db('orders').where('id', id).first();
      
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      // Get current stock
      const stockAgg = await db('inventory_logs')
        .where('product_name', 'Sachet Water')
        .sum('quantity_change as total')
        .first();
      const currentStock = stockAgg.total || 0;

      // Calculate new stock after return
      const newStock = currentStock + quantity_returned;

      // Add back to inventory logs
      await db('inventory_logs').insert({
        product_name: 'Sachet Water',
        quantity_change: quantity_returned, // Positive for return
        current_stock: newStock,
        operation_type: 'in',
        reason: `Return processed: ${quantity_returned} bags from order ${order.order_number} - ${order.customer_name}${notes ? ` - ${notes}` : ''}`,
        employee_id: userId || req.user?.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      // Log system activity
      if (userId) {
        await db('system_activity').insert({
          user_id: userId,
          user_email: userEmail || 'unknown',
          action: 'ORDER_RETURN_PROCESSED',
          details: `Processed return for order ${order.order_number}: ${quantity_returned} bags`,
          ip_address: req.ip,
          user_agent: req.get('User-Agent'),
          created_at: new Date().toISOString()
        });
      }

      res.json({
        success: true,
        message: 'Return processed successfully',
        data: {
          order_id: id,
          quantity_returned: quantity_returned,
          new_stock: newStock
        }
      });

    } catch (error) {
      console.error('Error processing return:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process return'
      });
    }
  });

  return router;
};
