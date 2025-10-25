const express = require('express');
const router = express.Router();

module.exports = (db) => {

  // Get inventory stats
  router.get('/stats', async (req, res) => {
    try {
      console.log('📊 Inventory stats request received');

      // Aggregate current stock by product
      const totals = await db('inventory_logs')
        .select('product_name')
        .sum({ total: 'quantity_change' })
        .groupBy('product_name');

      // Recent activity
      const recentActivity = await db('inventory_logs')
        .select('id', 'product_name', 'quantity_change', 'current_stock', 'operation_type', 'reason', 'created_at')
        .orderBy('created_at', 'desc')
        .limit(20);

      res.json({
        success: true,
        data: {
          totalInventory: totals.reduce((sum, row) => sum + (row.total || 0), 0),
          inventoryByType: totals,
          recentActivity
        }
      });

    } catch (error) {
      console.error('Error fetching inventory stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch inventory stats',
        error: error.message
      });
    }
  });

  // Get all inventory logs
  router.get('/logs', async (req, res) => {
    try {
      const { limit = 100 } = req.query;
      
      const logs = await db('inventory_logs')
        .select('*')
        .orderBy('created_at', 'desc')
        .limit(parseInt(limit));

      res.json({
        success: true,
        data: logs
      });

    } catch (error) {
      console.error('Error fetching inventory logs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch inventory logs'
      });
    }
  });

  return router;
};
