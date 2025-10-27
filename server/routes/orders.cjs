const express = require('express');
const router = express.Router();

module.exports = (db) => {

  // Get all orders
  router.get('/', async (req, res) => {
    try {
      const { status, order_type, limit = 100 } = req.query;
      
      let query = db('orders')
        .select('*')
        .orderBy('created_at', 'desc')
        .limit(parseInt(limit));

      if (status) {
        query = query.where('status', status);
      }

      if (order_type) {
        query = query.where('order_type', order_type);
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
        .where('id', id)
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

  return router;
};
