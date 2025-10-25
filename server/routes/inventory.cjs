const express = require('express');
const router = express.Router();

module.exports = (db) => {

  // Get inventory stats
  router.get('/stats', async (req, res) => {
    try {
      console.log('📊 Inventory stats request received');

      // Check if inventory_logs table exists and has data
      const tableExists = await db.schema.hasTable('inventory_logs');
      if (!tableExists) {
        return res.json({
          success: true,
          data: {
            totalInventory: 0,
            inventoryByType: [],
            recentActivity: [],
            message: 'Inventory system ready - no data yet'
          }
        });
      }

      // Check if table has any data
      const count = await db('inventory_logs').count('* as count').first();
      if (count.count === 0) {
        return res.json({
          success: true,
          data: {
            totalInventory: 0,
            inventoryByType: [],
            recentActivity: [],
            message: 'No inventory data available'
          }
        });
      }

      // Try to get inventory data
      try {
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
      } catch (dbError) {
        // If there's a column issue, return basic stats
        console.log('Database schema issue, returning basic stats:', dbError.message);
        res.json({
          success: true,
          data: {
            totalInventory: 0,
            inventoryByType: [],
            recentActivity: [],
            message: 'Inventory system ready'
          }
        });
      }

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

  // Add water to inventory
  router.post('/add-water', async (req, res) => {
    try {
      const { quantity, reason, employee_id } = req.body;

      if (!quantity || quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Valid quantity is required'
        });
      }

      // Add to inventory logs
      await db('inventory_logs').insert({
        product_name: 'Sachet Water',
        quantity_change: quantity,
        current_stock: quantity, // This will be calculated properly in a real system
        operation_type: 'in',
        reason: reason || 'Water added to inventory',
        employee_id: employee_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      res.json({
        success: true,
        message: 'Water added to inventory successfully'
      });

    } catch (error) {
      console.error('Error adding water to inventory:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add water to inventory'
      });
    }
  });

  // Fix existing inventory data - migrate old schema to new schema
  router.post('/fix-data', async (req, res) => {
    try {
      console.log('🔧 Starting inventory data migration...');
      
      // Get all records with null product_name
      const recordsToFix = await db('inventory_logs')
        .whereNull('product_name')
        .select('*');

      console.log(`Found ${recordsToFix.length} records to migrate`);

      for (const record of recordsToFix) {
        // Calculate quantity_change from bags_added and bags_removed
        const quantityChange = (record.bags_added || 0) - (record.bags_removed || 0);
        
        // Update the record with proper values
        await db('inventory_logs')
          .where('id', record.id)
          .update({
            product_name: 'Sachet Water',
            quantity_change: quantityChange,
            operation_type: record.operation_type || 'STOCK_ADJUSTMENT',
            reason: record.notes || record.reason || 'Data migration',
            employee_id: record.performed_by || record.employee_id
          });
      }

      console.log('✅ Inventory data migration completed');
      res.json({
        success: true,
        message: `Successfully migrated ${recordsToFix.length} inventory records`
      });

    } catch (error) {
      console.error('Error fixing inventory data:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fix inventory data',
        error: error.message
      });
    }
  });

  return router;
};
