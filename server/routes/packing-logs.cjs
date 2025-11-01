const express = require('express');
const router = express.Router();

module.exports = (db) => {

  // GET all packing logs with filters
  router.get('/', async (req, res) => {
    try {
      const { packer_id, status, start_date, end_date } = req.query;

      let query = db('packer_work_logs as pwl')
        .leftJoin('employees as packer', 'pwl.packer_id', 'packer.id')
        .leftJoin('employees as storekeeper', 'pwl.storekeeper_id', 'storekeeper.id')
        .leftJoin('employees as manager', 'pwl.manager_id', 'manager.id')
        .select(
          'pwl.*',
          'packer.name as packer_name',
          'packer.first_name as packer_first_name',
          'packer.last_name as packer_last_name',
          'storekeeper.name as storekeeper_name',
          'storekeeper.first_name as storekeeper_first_name',
          'storekeeper.last_name as storekeeper_last_name',
          'manager.name as manager_name',
          'manager.first_name as manager_first_name',
          'manager.last_name as manager_last_name'
        )
        .orderBy('pwl.created_at', 'desc');

      if (packer_id) {
        query = query.where('pwl.packer_id', packer_id);
      }

      if (status) {
        query = query.where('pwl.status', status);
      }

      if (start_date && end_date) {
        query = query.whereBetween('pwl.packing_date', [start_date, end_date]);
      }

      const logs = await query;

      console.log('Fetched packing logs:', JSON.stringify(logs.map(l => ({
        id: l.id,
        packer_id: l.packer_id,
        packer_name: l.packer_name,
        packer_first_name: l.packer_first_name,
        packer_last_name: l.packer_last_name,
        status: l.status
      })), null, 2));

      res.json({ success: true, data: logs });
    } catch (error) {
      console.error('Error fetching packing logs:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch packing logs' });
    }
  });

  // POST - Storekeeper creates a new packing log entry
  router.post('/', async (req, res) => {
    try {
      const { packer_id, bags_packed, packing_date, notes } = req.body;
      const storekeeper_id = req.user?.id;

      if (!packer_id || !bags_packed || !packing_date) {
        return res.status(400).json({
          success: false,
          message: 'Packer ID, bags packed, and packing date are required'
        });
      }

      // Validate packing date
      if (new Date(packing_date) > new Date()) {
        return res.status(400).json({
          success: false,
          message: 'Packing date cannot be in the future'
        });
      }

      const [logId] = await db('packer_work_logs').insert({
        packer_id,
        storekeeper_id,
        bags_packed,
        packing_date,
        notes: notes || null,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      // Log system activity
      await db('system_activity').insert({
        employee_id: storekeeper_id,
        activity_type: 'packing_log_created',
        description: `Created packing log: ${bags_packed} bags for packer ${packer_id}`,
        timestamp: new Date().toISOString()
      });

      res.json({
        success: true,
        message: 'Packing log created successfully',
        data: { id: logId }
      });
    } catch (error) {
      console.error('Error creating packing log:', error);
      res.status(500).json({ success: false, message: 'Failed to create packing log' });
    }
  });

  // PUT - Update packing log (Only if status is pending or rejected)
  router.put('/:logId', async (req, res) => {
    try {
      const { logId } = req.params;
      const { bags_packed, packing_date, notes } = req.body;

      // Check if log exists and is editable
      const existingLog = await db('packer_work_logs').where('id', logId).first();
      if (!existingLog) {
        return res.status(404).json({ success: false, message: 'Packing log not found' });
      }

      if (existingLog.status === 'approved') {
        return res.status(400).json({
          success: false,
          message: 'Cannot edit packing log that has been approved'
        });
      }

      // Validate storekeeper is the one who created it (or admin/director)
      // Allow storekeepers to edit rejected logs even if storekeeper_id is null (for backward compatibility)
      const isCreator = existingLog.storekeeper_id === req.user?.id;
      const userRole = req.user?.role?.toLowerCase();
      const isAdminOrDirector = userRole === 'admin' || userRole === 'director';
      const isStorekeeperEditingRejected = userRole === 'storekeeper' && existingLog.status === 'rejected';
      
      console.log('Edit authorization check:', {
        userId: req.user?.id,
        userRole: req.user?.role,
        logStorekeeperId: existingLog.storekeeper_id,
        logStatus: existingLog.status,
        isCreator,
        isAdminOrDirector,
        isStorekeeperEditingRejected
      });
      
      if (!isCreator && !isAdminOrDirector && !isStorekeeperEditingRejected) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to edit this packing log'
        });
      }

      const updateData = {
        updated_at: new Date().toISOString()
      };

      if (bags_packed) updateData.bags_packed = bags_packed;
      if (packing_date) updateData.packing_date = packing_date;
      if (notes !== undefined) updateData.notes = notes;

      // If updating a rejected log, reset status to pending and clear rejection comment
      if (existingLog.status === 'rejected') {
        updateData.status = 'pending';
        updateData.modification_comment = null;
      }

      await db('packer_work_logs')
        .where('id', logId)
        .update(updateData);

      res.json({
        success: true,
        message: 'Packing log updated successfully'
      });
    } catch (error) {
      console.error('Error updating packing log:', error);
      res.status(500).json({ success: false, message: 'Failed to update packing log' });
    }
  });

  // PUT - Manager approves or rejects a packing log
  router.put('/:logId/review', async (req, res) => {
    try {
      const { logId } = req.params;
      const { action, comment } = req.body;
      const manager_id = req.user?.id;

      if (!action || !['approve', 'reject'].includes(action)) {
        return res.status(400).json({
          success: false,
          message: 'Action must be either "approve" or "reject"'
        });
      }

      const log = await db('packer_work_logs').where('id', logId).first();
      if (!log) {
        return res.status(404).json({ success: false, message: 'Packing log not found' });
      }

      if (log.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'This packing log has already been reviewed'
        });
      }

      const status = action === 'approve' ? 'approved' : 'rejected';
      const updateData = {
        status,
        manager_id,
        modification_comment: action === 'reject' ? (comment || null) : null,
        updated_at: new Date().toISOString()
      };

      await db('packer_work_logs')
        .where('id', logId)
        .update(updateData);

      // If approved, add to inventory
      if (action === 'approve') {
        // Get current stock
        const stockAgg = await db('inventory_logs')
          .where('product_name', 'Sachet Water')
          .sum('quantity_change as total')
          .first();
        const previousStock = stockAgg.total || 0;
        const newStock = previousStock + log.bags_packed;

        // Get packer name for context
        const packer = await db('employees').where('id', log.packer_id).select('first_name', 'last_name', 'name').first();
        const packerName = packer?.first_name && packer?.last_name 
          ? `${packer.first_name} ${packer.last_name}` 
          : packer?.name || 'Unknown';

        await db('inventory_logs').insert({
          product_name: 'Sachet Water',
          quantity_change: log.bags_packed,
          current_stock: newStock,
          operation_type: 'in',
          reason: `Approved packing: ${log.bags_packed} bags from ${packerName}`,
          employee_id: manager_id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }

      // Log system activity
      await db('system_activity').insert({
        employee_id: manager_id,
        activity_type: `packing_log_${action}d`,
        description: `${action === 'approve' ? 'Approved' : 'Rejected'} packing log: ${log.bags_packed} bags`,
        timestamp: new Date().toISOString()
      });

      res.json({
        success: true,
        message: `Packing log ${action}d successfully`
      });
    } catch (error) {
      console.error('Error reviewing packing log:', error);
      res.status(500).json({ success: false, message: 'Failed to review packing log' });
    }
  });

  // DELETE - Delete packing log (Only if pending and created by user)
  router.delete('/:logId', async (req, res) => {
    try {
      const { logId } = req.params;

      const log = await db('packer_work_logs').where('id', logId).first();
      if (!log) {
        return res.status(404).json({ success: false, message: 'Packing log not found' });
      }

      if (log.status === 'approved') {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete packing log that has been approved'
        });
      }

      // Only the storekeeper who created it or admin/director can delete
      // Allow storekeepers to delete pending/rejected logs even if storekeeper_id is null
      const isCreator = log.storekeeper_id === req.user?.id;
      const userRole = req.user?.role?.toLowerCase();
      const isAdminOrDirector = userRole === 'admin' || userRole === 'director';
      const isStorekeeperDeleting = userRole === 'storekeeper' && log.status !== 'approved';
      
      if (!isCreator && !isAdminOrDirector && !isStorekeeperDeleting) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to delete this packing log'
        });
      }

      await db('packer_work_logs').where('id', logId).delete();

      res.json({
        success: true,
        message: 'Packing log deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting packing log:', error);
      res.status(500).json({ success: false, message: 'Failed to delete packing log' });
    }
  });

  // GET - Get packing log statistics
  router.get('/stats', async (req, res) => {
    try {
      const [total, pending, approved, rejected] = await Promise.all([
        db('packer_work_logs').count('* as count').first(),
        db('packer_work_logs').where('status', 'pending').count('* as count').first(),
        db('packer_work_logs').where('status', 'approved').count('* as count').first(),
        db('packer_work_logs').where('status', 'rejected').count('* as count').first()
      ]);

      const [totalBags] = await db('packer_work_logs')
        .where('status', 'approved')
        .sum('bags_packed as total')
        .first();

      res.json({
        success: true,
        data: {
          total: parseInt(total.count),
          pending: parseInt(pending.count),
          approved: parseInt(approved.count),
          rejected: parseInt(rejected.count),
          totalBagsApproved: parseInt(totalBags.total) || 0
        }
      });
    } catch (error) {
      console.error('Error fetching packing log stats:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch packing log stats' });
    }
  });

  return router;
};

