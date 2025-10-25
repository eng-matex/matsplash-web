const express = require('express');
const router = express.Router();

module.exports = (db) => {

  // Get inventory stats
  router.get('/stats', async (req, res) => {
    try {
      console.log('📊 Inventory stats request received');
      
      // Return basic stats for now
      res.json({
        success: true,
        data: {
          totalInventory: 0,
          recentActivity: [],
          inventoryByType: [],
          message: 'Inventory system ready'
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
