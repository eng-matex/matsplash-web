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

  return router;
};
