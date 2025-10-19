const express = require('express');

const router = express.Router();

// Get all orders
router.get('/', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { order_type, status, limit = 100 } = req.query;
    
    let query = db('orders')
      .leftJoin('employees as creators', 'orders.created_by', 'creators.id')
      .select(
        'orders.*',
        'creators.name as created_by_name'
      )
      .orderBy('orders.created_at', 'desc')
      .limit(parseInt(limit));

    if (order_type) {
      query = query.where('orders.order_type', order_type);
    }

    if (status) {
      query = query.where('orders.status', status);
    }

    const orders = await query;

    // Parse JSON items for each order
    const ordersWithParsedItems = orders.map(order => ({
      ...order,
      items: order.items ? JSON.parse(order.items) : []
    }));

    res.json({
      success: true,
      data: ordersWithParsedItems
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
    const db = req.app.locals.db;
    const { id } = req.params;
    
    const order = await db('orders')
      .leftJoin('employees as creators', 'orders.created_by', 'creators.id')
      .select(
        'orders.*',
        'creators.name as created_by_name'
      )
      .where('orders.id', id)
      .first();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Parse JSON items
    const orderWithParsedItems = {
      ...order,
      items: order.items ? JSON.parse(order.items) : []
    };

    res.json({
      success: true,
      data: orderWithParsedItems
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
    const db = req.app.locals.db;
    const orderData = req.body;

    // Validate required fields
    if (!orderData.customer_name || !orderData.order_type || !orderData.items?.length) {
      return res.status(400).json({
        success: false,
        message: 'Customer name, order type, and items are required'
      });
    }

    // Generate order number
    const orderCount = await db('orders').count('id as count').first();
    const orderNumber = `ORD-${String(parseInt(orderCount?.count || 0) + 1).padStart(6, '0')}`;

    // Calculate total amount based on order type and items
    let totalAmount = 0;
    if (orderData.order_type === 'general_sales') {
      totalAmount = orderData.items.reduce((sum, item) => sum + (item.quantity * (item.unit_price || 300)), 0);
    } else if (orderData.order_type === 'distributor_order') {
      // Dynamic pricing for distributor orders
      const totalQuantity = orderData.items.reduce((sum, item) => sum + item.quantity, 0);
      const pricePerBag = totalQuantity >= 50 ? 200 : 240;
      totalAmount = orderData.items.reduce((sum, item) => sum + (item.quantity * pricePerBag), 0);
    }
    // Store dispatch and driver dispatch have no pricing (totalAmount = 0)

    const newOrder = {
      order_number: orderNumber,
      order_type: orderData.order_type,
      customer_name: orderData.customer_name,
      customer_phone: orderData.customer_phone,
      customer_email: orderData.customer_email,
      total_amount: totalAmount,
      payment_method: orderData.payment_method || 'cash',
      payment_status: orderData.payment_status || 'pending',
      created_by: orderData.created_by || 1, // Default to first employee
      items: JSON.stringify(orderData.items),
      notes: orderData.notes,
      delivery_address: orderData.delivery_address,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const [orderId] = await db('orders').insert(newOrder);

    // Log system activity
    await db('system_activity').insert({
      user_id: orderData.created_by || 1,
      user_email: req.body.userEmail || 'unknown',
      action: 'ORDER_CREATED',
      details: `Created order ${orderNumber} for ${orderData.customer_name}`,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      created_at: new Date().toISOString()
    });

    // Get the created order with joins
    const createdOrder = await db('orders')
      .leftJoin('employees as creators', 'orders.created_by', 'creators.id')
      .select(
        'orders.*',
        'creators.name as created_by_name'
      )
      .where('orders.id', orderId)
      .first();

    // Parse JSON items
    const createdOrderWithParsedItems = {
      ...createdOrder,
      items: createdOrder.items ? JSON.parse(createdOrder.items) : []
    };

    res.status(201).json({
      success: true,
      data: createdOrderWithParsedItems,
      message: 'Order created successfully'
    });

  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order'
    });
  }
});

// Update order
router.put('/:id', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated directly
    delete updateData.id;
    delete updateData.created_at;
    delete updateData.order_number;

    updateData.updated_at = new Date().toISOString();

    await db('orders').where('id', id).update(updateData);

    // Log system activity
    if (updateData.userId) {
      await db('system_activity').insert({
        user_id: updateData.userId,
        user_email: req.body.userEmail || 'unknown',
        action: 'ORDER_UPDATED',
        details: `Updated order ${id}`,
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
        created_at: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: 'Order updated successfully'
    });

  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order'
    });
  }
});

// Confirm pickup authorization
router.put('/:id/confirm-pickup', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;
    const { userId, userEmail } = req.body;

    // Get the order first
    const order = await db('orders').where('id', id).first();
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Update order status to picked_up
    await db('orders').where('id', id).update({
      status: 'picked_up',
      picked_up_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    // Log system activity
    await db('system_activity').insert({
      user_id: userId || 1,
      user_email: userEmail || 'unknown',
      action: 'PICKUP_CONFIRMED',
      details: `StoreKeeper confirmed pickup for order ${order.order_number}`,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      created_at: new Date().toISOString()
    });

    // Get the updated order
    const updatedOrder = await db('orders')
      .leftJoin('employees as creators', 'orders.created_by', 'creators.id')
      .select(
        'orders.*',
        'creators.name as created_by_name'
      )
      .where('orders.id', id)
      .first();

    // Parse JSON items
    const orderWithParsedItems = {
      ...updatedOrder,
      items: updatedOrder.items ? JSON.parse(updatedOrder.items) : []
    };

    res.json({
      success: true,
      data: orderWithParsedItems,
      message: 'Pickup confirmed successfully'
    });

  } catch (error) {
    console.error('Error confirming pickup:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm pickup'
    });
  }
});

// Update order status
router.put('/:id/status', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;
    const { status, notes, userId } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const updateData = {
      status: status,
      updated_at: new Date().toISOString()
    };

    // Add timestamp based on status
    if (status === 'picked_up') {
      updateData.picked_up_at = new Date().toISOString();
    } else if (status === 'delivered') {
      updateData.delivered_at = new Date().toISOString();
    } else if (status === 'settled') {
      updateData.settled_at = new Date().toISOString();
    } else if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }

    if (notes) {
      updateData.notes = notes;
    }

    await db('orders').where('id', id).update(updateData);

    // Log system activity
    if (userId) {
      await db('system_activity').insert({
        user_id: userId,
        user_email: req.body.userEmail || 'unknown',
        action: 'ORDER_STATUS_UPDATED',
        details: `Updated order ${id} status to ${status}`,
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
        created_at: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: 'Order status updated successfully'
    });

  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order status'
    });
  }
});

// Delete order
router.delete('/:id', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;
    const { userId } = req.body;

    await db('orders').where('id', id).del();

    // Log system activity
    if (userId) {
      await db('system_activity').insert({
        user_id: userId,
        user_email: req.body.userEmail || 'unknown',
        action: 'ORDER_DELETED',
        details: `Deleted order ${id}`,
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
        created_at: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: 'Order deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete order'
    });
  }
});

module.exports = (db) => {
  return (req, res, next) => {
    req.app.locals.db = db;
    router(req, res, next);
  };
};
