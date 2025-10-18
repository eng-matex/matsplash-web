import * as express from 'express';
import { db } from '../database';
import { ApiResponse, Order, CreateOrderForm } from '../../src/types';

const router = express.Router();

// Get all orders
router.get('/', async (req, res) => {
  try {
    const { order_type, status, limit = 100 } = req.query;
    
    let query = db('orders')
      .leftJoin('distributors', 'orders.distributor_id', 'distributors.id')
      .leftJoin('employees as drivers', 'orders.driver_id', 'drivers.id')
      .leftJoin('employees as assistants', 'orders.assistant_id', 'assistants.id')
      .leftJoin('employees as requesters', 'orders.requested_by', 'requesters.id')
      .select(
        'orders.*',
        'distributors.name as distributor_name',
        'drivers.name as driver_name',
        'assistants.name as assistant_name',
        'requesters.name as requested_by_name'
      )
      .orderBy('orders.created_at', 'desc')
      .limit(parseInt(limit as string));

    if (order_type) {
      query = query.where('orders.order_type', order_type);
    }

    if (status) {
      query = query.where('orders.status', status);
    }

    const orders = await query;

    res.json({
      success: true,
      data: orders
    } as ApiResponse<Order[]>);

  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders'
    } as ApiResponse);
  }
});

// Get order by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const order = await db('orders')
      .leftJoin('distributors', 'orders.distributor_id', 'distributors.id')
      .leftJoin('employees as drivers', 'orders.driver_id', 'drivers.id')
      .leftJoin('employees as assistants', 'orders.assistant_id', 'assistants.id')
      .leftJoin('employees as requesters', 'orders.requested_by', 'requesters.id')
      .select(
        'orders.*',
        'distributors.name as distributor_name',
        'drivers.name as driver_name',
        'assistants.name as assistant_name',
        'requesters.name as requested_by_name'
      )
      .where('orders.id', id)
      .first();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      } as ApiResponse);
    }

    res.json({
      success: true,
      data: order
    } as ApiResponse<Order>);

  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order'
    } as ApiResponse);
  }
});

// Create new order
router.post('/', async (req, res) => {
  try {
    const orderData: CreateOrderForm & { requested_by: number } = req.body;

    // Validate required fields
    if (!orderData.order_type || !orderData.bags_ordered || !orderData.price_per_bag || !orderData.requested_by) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      } as ApiResponse);
    }

    // Generate order number
    const orderCount = await db('orders').count('id as count').first();
    const orderNumber = `ORD-${String(orderCount?.count || 0).padStart(6, '0')}`;

    // Calculate totals
    const totalBags = orderData.bags_ordered + (orderData.free_bags_included || 0);
    const totalAmount = orderData.bags_ordered * orderData.price_per_bag;

    const newOrder = {
      order_number: orderNumber,
      order_type: orderData.order_type,
      customer_name: orderData.customer_name,
      customer_phone: orderData.customer_phone,
      distributor_id: orderData.distributor_id,
      driver_id: orderData.driver_id,
      assistant_id: orderData.assistant_id,
      requested_by: orderData.requested_by,
      bags_ordered: orderData.bags_ordered,
      free_bags_included: orderData.free_bags_included || 0,
      free_bags_redeemed: 0,
      total_bags: totalBags,
      price_per_bag: orderData.price_per_bag,
      total_amount: totalAmount,
      delivery_method: orderData.delivery_method || 'pickup',
      delivery_address: orderData.delivery_address,
      status: 'pending_pickup',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const [orderId] = await db('orders').insert(newOrder);

    // Log system activity
    await db('system_activity').insert({
      user_id: orderData.requested_by,
      user_email: req.body.userEmail || 'unknown',
      action: 'ORDER_CREATED',
      details: `Created order ${orderNumber} for ${orderData.customer_name || 'customer'}`,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      created_at: new Date().toISOString()
    });

    // Get the created order with joins
    const createdOrder = await db('orders')
      .leftJoin('distributors', 'orders.distributor_id', 'distributors.id')
      .leftJoin('employees as drivers', 'orders.driver_id', 'drivers.id')
      .leftJoin('employees as assistants', 'orders.assistant_id', 'assistants.id')
      .leftJoin('employees as requesters', 'orders.requested_by', 'requesters.id')
      .select(
        'orders.*',
        'distributors.name as distributor_name',
        'drivers.name as driver_name',
        'assistants.name as assistant_name',
        'requesters.name as requested_by_name'
      )
      .where('orders.id', orderId)
      .first();

    res.status(201).json({
      success: true,
      data: createdOrder,
      message: 'Order created successfully'
    } as ApiResponse<Order>);

  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order'
    } as ApiResponse);
  }
});

// Update order status
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, userId } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      } as ApiResponse);
    }

    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };

    // Add timestamp based on status
    switch (status) {
      case 'picked_up':
        updateData.picked_up_at = new Date().toISOString();
        break;
      case 'delivered':
        updateData.delivered_at = new Date().toISOString();
        break;
      case 'settled':
        updateData.settled_at = new Date().toISOString();
        break;
      case 'completed':
        updateData.completed_at = new Date().toISOString();
        break;
    }

    await db('orders').where('id', id).update(updateData);

    // Log system activity
    if (userId) {
      await db('system_activity').insert({
        user_id: userId,
        user_email: req.body.userEmail || 'unknown',
        action: 'ORDER_STATUS_UPDATED',
        details: `Updated order ${id} status to ${status}${notes ? `: ${notes}` : ''}`,
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
        created_at: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: 'Order status updated successfully'
    } as ApiResponse);

  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order status'
    } as ApiResponse);
  }
});

// Update order
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated directly
    delete updateData.id;
    delete updateData.order_number;
    delete updateData.created_at;

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
    } as ApiResponse);

  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order'
    } as ApiResponse);
  }
});

// Delete order
router.delete('/:id', async (req, res) => {
  try {
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
    } as ApiResponse);

  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete order'
    } as ApiResponse);
  }
});

export default router;
