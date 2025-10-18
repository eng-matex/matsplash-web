import * as express from 'express';
import { db } from '../database';
import { ApiResponse, InventoryLog } from '../../src/types';

const router = express.Router();

// Get inventory statistics
router.get('/stats', async (req, res) => {
  try {
    // Get current stock from the latest inventory log
    const latestLog = await db('inventory_logs')
      .orderBy('created_at', 'desc')
      .first();

    const currentStock = latestLog ? latestLog.current_stock : 0;

    // Get total movements count
    const totalMovements = await db('inventory_logs').count('id as count').first();

    // Get recent movements (last 10)
    const recentMovements = await db('inventory_logs')
      .orderBy('created_at', 'desc')
      .limit(10);

    const stats = {
      currentStock,
      lowStockThreshold: 100, // This could be configurable
      totalMovements: totalMovements?.count || 0,
      recentMovements
    };

    res.json({
      success: true,
      data: stats
    } as ApiResponse);

  } catch (error) {
    console.error('Error fetching inventory stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inventory stats'
    } as ApiResponse);
  }
});

// Get inventory logs
router.get('/logs', async (req, res) => {
  try {
    const { limit = 100, operation_type, date_from, date_to } = req.query;
    
    let query = db('inventory_logs')
      .leftJoin('employees', 'inventory_logs.performed_by', 'employees.id')
      .leftJoin('orders', 'inventory_logs.order_id', 'orders.id')
      .select(
        'inventory_logs.*',
        'employees.name as performed_by_name',
        'orders.order_number'
      )
      .orderBy('inventory_logs.created_at', 'desc')
      .limit(parseInt(limit as string));

    if (operation_type) {
      query = query.where('inventory_logs.operation_type', operation_type);
    }

    if (date_from) {
      query = query.where('inventory_logs.created_at', '>=', date_from);
    }

    if (date_to) {
      query = query.where('inventory_logs.created_at', '<=', date_to);
    }

    const logs = await query;

    res.json({
      success: true,
      data: logs
    } as ApiResponse<InventoryLog[]>);

  } catch (error) {
    console.error('Error fetching inventory logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inventory logs'
    } as ApiResponse);
  }
});

// Get inventory log by ID
router.get('/logs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const log = await db('inventory_logs')
      .leftJoin('employees', 'inventory_logs.performed_by', 'employees.id')
      .leftJoin('orders', 'inventory_logs.order_id', 'orders.id')
      .select(
        'inventory_logs.*',
        'employees.name as performed_by_name',
        'orders.order_number'
      )
      .where('inventory_logs.id', id)
      .first();

    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'Inventory log not found'
      } as ApiResponse);
    }

    res.json({
      success: true,
      data: log
    } as ApiResponse<InventoryLog>);

  } catch (error) {
    console.error('Error fetching inventory log:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inventory log'
    } as ApiResponse);
  }
});

// Create inventory adjustment
router.post('/adjust', async (req, res) => {
  try {
    const adjustmentData = req.body;

    // Validate required fields
    if (!adjustmentData.operation_type || !adjustmentData.performed_by) {
      return res.status(400).json({
        success: false,
        message: 'Operation type and performed_by are required'
      } as ApiResponse);
    }

    // Get current stock from latest log
    const latestLog = await db('inventory_logs')
      .orderBy('created_at', 'desc')
      .first();

    const previousStock = latestLog ? latestLog.current_stock : 0;
    const newStock = previousStock + (adjustmentData.bags_added || 0) - (adjustmentData.bags_removed || 0);

    const newLog = {
      order_id: adjustmentData.order_id,
      order_number: adjustmentData.order_number,
      bags_added: adjustmentData.bags_added || 0,
      bags_removed: adjustmentData.bags_removed || 0,
      current_stock: newStock,
      operation_type: adjustmentData.operation_type,
      performed_by: adjustmentData.performed_by,
      notes: adjustmentData.notes,
      created_at: new Date().toISOString()
    };

    const [logId] = await db('inventory_logs').insert(newLog);

    // Log system activity
    await db('system_activity').insert({
      user_id: adjustmentData.performed_by,
      user_email: req.body.userEmail || 'unknown',
      action: 'INVENTORY_ADJUSTED',
      details: `Inventory adjusted: ${adjustmentData.bags_added || 0} added, ${adjustmentData.bags_removed || 0} removed. New stock: ${newStock}`,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      created_at: new Date().toISOString()
    });

    // Get the created log with joins
    const createdLog = await db('inventory_logs')
      .leftJoin('employees', 'inventory_logs.performed_by', 'employees.id')
      .leftJoin('orders', 'inventory_logs.order_id', 'orders.id')
      .select(
        'inventory_logs.*',
        'employees.name as performed_by_name',
        'orders.order_number'
      )
      .where('inventory_logs.id', logId)
      .first();

    res.status(201).json({
      success: true,
      data: createdLog,
      message: 'Inventory adjustment recorded successfully'
    } as ApiResponse<InventoryLog>);

  } catch (error) {
    console.error('Error creating inventory adjustment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create inventory adjustment'
    } as ApiResponse);
  }
});

// Update inventory log
router.put('/logs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated directly
    delete updateData.id;
    delete updateData.created_at;

    updateData.updated_at = new Date().toISOString();

    await db('inventory_logs').where('id', id).update(updateData);

    // Log system activity
    if (updateData.userId) {
      await db('system_activity').insert({
        user_id: updateData.userId,
        user_email: req.body.userEmail || 'unknown',
        action: 'INVENTORY_LOG_UPDATED',
        details: `Updated inventory log ${id}`,
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
        created_at: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: 'Inventory log updated successfully'
    } as ApiResponse);

  } catch (error) {
    console.error('Error updating inventory log:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update inventory log'
    } as ApiResponse);
  }
});

// Delete inventory log
router.delete('/logs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    await db('inventory_logs').where('id', id).del();

    // Log system activity
    if (userId) {
      await db('system_activity').insert({
        user_id: userId,
        user_email: req.body.userEmail || 'unknown',
        action: 'INVENTORY_LOG_DELETED',
        details: `Deleted inventory log ${id}`,
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
        created_at: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: 'Inventory log deleted successfully'
    } as ApiResponse);

  } catch (error) {
    console.error('Error deleting inventory log:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete inventory log'
    } as ApiResponse);
  }
});

export default router;
