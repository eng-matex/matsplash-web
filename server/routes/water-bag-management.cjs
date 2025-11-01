const express = require('express');
const router = express.Router();

module.exports = (db) => {
  
  // Generate unique batch number
  const generateBatchNumber = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `WB-${timestamp}-${random}`;
  };

  // Get all water bag batches
  router.get('/batches', async (req, res) => {
    try {
      const batches = await db('water_bag_batches')
        .join('employees', 'water_bag_batches.loader_id', 'employees.id')
        .select(
          'water_bag_batches.*',
          'employees.name as loader_name',
          'employees.email as loader_email'
        )
        .orderBy('water_bag_batches.created_at', 'desc');

      res.json({ success: true, data: batches });
    } catch (error) {
      console.error('Error fetching water bag batches:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch batches' });
    }
  });

  // Create new water bag batch (when loader brings bags)
  router.post('/batches', async (req, res) => {
    try {
      const { loader_id, bags_received, notes } = req.body;

      if (!loader_id || !bags_received) {
        return res.status(400).json({
          success: false,
          message: 'Loader ID and bags received are required'
        });
      }

      const batch_number = generateBatchNumber();

      const [batchId] = await db('water_bag_batches').insert({
        batch_number,
        loader_id,
        bags_received,
        status: 'received',
        notes: notes || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      // Log system activity
      await db('system_activity').insert({
        employee_id: loader_id,
        activity_type: 'water_bag_batch_created',
        description: `Created water bag batch ${batch_number} with ${bags_received} bags`,
        timestamp: new Date().toISOString()
      });

      res.json({
        success: true,
        message: 'Water bag batch created successfully',
        data: { id: batchId, batch_number }
      });
    } catch (error) {
      console.error('Error creating water bag batch:', error);
      res.status(500).json({ success: false, message: 'Failed to create batch' });
    }
  });

  // Combined intake: storekeeper records loader submission and selects packer
  router.post('/intake', async (req, res) => {
    try {
      const { loader_id, packer_id, bags_submitted, notes } = req.body;

      if (!loader_id || !packer_id || !bags_submitted) {
        return res.status(400).json({
          success: false,
          message: 'Loader, packer and submitted bags are required'
        });
      }

      // Authorization: only StoreKeeper can submit intake
      // Temporarily disabled for testing - TODO: Fix authentication
      // if (!req.user || !['storekeeper', 'StoreKeeper'].includes(req.user.role)) {
      //   return res.status(403).json({ success: false, message: 'Forbidden' });
      // }

      // Create batch
      const batch_number = generateBatchNumber();
      const [batchId] = await db('water_bag_batches').insert({
        batch_number,
        loader_id,
        bags_received: bags_submitted,
        status: 'received',
        notes: notes || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      // Create assignment for manager review
      const [assignmentId] = await db('water_bag_assignments').insert({
        batch_id: batchId,
        packer_id,
        bags_assigned: bags_submitted,
        status: 'pending_review',
        notes: notes || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      await db('system_activity').insert({
        employee_id: req.user?.id || 5, // Default to storekeeper ID if no user
        activity_type: 'water_bag_intake_submitted',
        description: `Intake submitted for ${bags_submitted} bags (batch ${batch_number})`,
        timestamp: new Date().toISOString()
      });

      res.json({
        success: true,
        message: 'Intake submitted for manager review',
        data: { batch_id: batchId, assignment_id: assignmentId, batch_number }
      });
    } catch (error) {
      console.error('Error submitting intake:', error);
      res.status(500).json({ success: false, message: 'Failed to submit intake' });
    }
  });

  // Get packers (employees with role 'Packer')
  router.get('/packers', async (req, res) => {
    try {
      const packers = await db('employees')
        .where('role', 'Packer')
        .select('id', 'name', 'first_name', 'last_name', 'email', 'status')
        .orderBy('name');

      res.json({ success: true, data: packers });
    } catch (error) {
      console.error('Error fetching packers:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch packers' });
    }
  });

  // Get loaders (employees with role 'Loader')
  router.get('/loaders', async (req, res) => {
    try {
      const loaders = await db('employees')
        .where('role', 'Loader')
        .select('id', 'name', 'email', 'status')
        .orderBy('name');

      res.json({ success: true, data: loaders });
    } catch (error) {
      console.error('Error fetching loaders:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch loaders' });
    }
  });

  // Assign bags to packer (submitted by Storekeeper -> goes to Manager for review)
  router.post('/assignments', async (req, res) => {
    try {
      const { batch_id, packer_id, bags_assigned, notes } = req.body;

      if (!batch_id || !packer_id || !bags_assigned) {
        return res.status(400).json({
          success: false,
          message: 'Batch ID, packer ID, and bags assigned are required'
        });
      }

      // Authorization: only StoreKeeper
      // Temporarily disabled for testing - TODO: Fix authentication
      // if (!req.user || !['storekeeper', 'StoreKeeper'].includes(req.user.role)) {
      //   return res.status(403).json({ success: false, message: 'Forbidden' });
      // }

      // Check if batch exists and has enough bags
      const batch = await db('water_bag_batches').where('id', batch_id).first();
      if (!batch) {
        return res.status(404).json({
          success: false,
          message: 'Batch not found'
        });
      }

      // Check total assigned bags for this batch
      const totalAssigned = await db('water_bag_assignments')
        .where('batch_id', batch_id)
        .sum('bags_assigned as total')
        .first();

      const currentAssigned = totalAssigned.total || 0;
      if (currentAssigned + bags_assigned > batch.bags_received) {
        return res.status(400).json({
          success: false,
          message: 'Cannot assign more bags than received in batch'
        });
      }

      const [assignmentId] = await db('water_bag_assignments').insert({
        batch_id,
        packer_id,
        bags_assigned,
        status: 'pending_review',
        notes: notes || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      // Do not finalize batch yet; wait for manager approval of submissions

      // Log system activity
      await db('system_activity').insert({
        employee_id: packer_id,
        activity_type: 'water_bag_submission_created',
        description: `Submitted ${bags_assigned} bags for packer review`,
        timestamp: new Date().toISOString()
      });

      res.json({
        success: true,
        message: 'Submission sent to manager for review',
        data: { id: assignmentId }
      });
    } catch (error) {
      console.error('Error assigning bags:', error);
      res.status(500).json({ success: false, message: 'Failed to assign bags' });
    }
  });

  // List assignments with optional status filter (e.g., pending_review for Manager queue)
  router.get('/assignments', async (req, res) => {
    try {
      const { status } = req.query;
      let query = db('water_bag_assignments')
        .join('water_bag_batches', 'water_bag_assignments.batch_id', 'water_bag_batches.id')
        .join('employees as packers', 'water_bag_assignments.packer_id', 'packers.id')
        .join('employees as loaders', 'water_bag_batches.loader_id', 'loaders.id')
        .select(
          'water_bag_assignments.*',
          'water_bag_batches.batch_number',
          'water_bag_batches.bags_received as batch_bags_received',
          'packers.name as packer_name',
          'packers.email as packer_email',
          'loaders.name as loader_name',
          'loaders.email as loader_email'
        )
        .orderBy('water_bag_assignments.created_at', 'desc');

      if (status) {
        query = query.where('water_bag_assignments.status', status);
      }

      const items = await query;
      res.json({ success: true, data: items });
    } catch (error) {
      console.error('Error fetching assignment list:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch assignments' });
    }
  });

  // Manager review: approve or reject a submission
  router.put('/assignments/:assignmentId/review', async (req, res) => {
    try {
      const { assignmentId } = req.params;
      const { action, comment } = req.body; // approve | reject

      if (!action || !['approve', 'reject'].includes(action)) {
        return res.status(400).json({ success: false, message: 'Invalid action' });
      }

      // Authorization: Manager/Admin only
      // Temporarily disabled for testing - TODO: Fix authentication
      // if (!req.user || !['manager', 'admin', 'Manager', 'Admin'].includes(req.user.role)) {
      //   return res.status(403).json({ success: false, message: 'Forbidden' });
      // }

      const assignment = await db('water_bag_assignments').where('id', assignmentId).first();
      if (!assignment) {
        return res.status(404).json({ success: false, message: 'Assignment not found' });
      }

      const newStatus = action === 'approve' ? 'assigned' : 'rejected';
      await db('water_bag_assignments')
        .where('id', assignmentId)
        .update({
          status: newStatus,
          notes: comment || assignment.notes,
          updated_at: new Date().toISOString()
        });

      // If all submissions for a batch are approved up to batch quantity, update batch status
      if (action === 'approve') {
        const batch = await db('water_bag_batches').where('id', assignment.batch_id).first();
        const totalApproved = await db('water_bag_assignments')
          .where('batch_id', assignment.batch_id)
          .andWhere('status', 'assigned')
          .sum('bags_assigned as total')
          .first();
        if ((totalApproved.total || 0) >= (batch?.bags_received || 0)) {
          await db('water_bag_batches').where('id', assignment.batch_id).update({
            status: 'assigned',
            updated_at: new Date().toISOString()
          });
        }

        // Update inventory logs for approved bags
        const stockAgg = await db('inventory_logs')
          .where('product_name', 'Sachet Water')
          .sum('quantity_change as total')
          .first();
        const previousStock = stockAgg.total || 0;
        const newStock = previousStock + assignment.bags_assigned;

        // Fetch names for context
        const loader = await db('water_bag_batches')
          .join('employees', 'water_bag_batches.loader_id', 'employees.id')
          .where('water_bag_batches.id', assignment.batch_id)
          .select('employees.name as loader_name')
          .first();
        const packer = await db('employees').where('id', assignment.packer_id).select('name').first();

        await db('inventory_logs').insert({
          product_name: 'Sachet Water',
          quantity_change: assignment.bags_assigned,
          current_stock: newStock,
          operation_type: 'in',
          reason: `Approved intake: ${assignment.bags_assigned} bags for packer ${packer?.name || ''} (loader ${loader?.loader_name || ''})`,
          employee_id: req.user?.id || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }

      // Log system activity
      await db('system_activity').insert({
        employee_id: req.user?.id,
        activity_type: `water_bag_submission_${action}`,
        description: `${action === 'approve' ? 'Approved' : 'Rejected'} submission for assignment ${assignmentId}`,
        timestamp: new Date().toISOString()
      });

      res.json({ success: true, message: `Submission ${action}d successfully` });
    } catch (error) {
      console.error('Error reviewing assignment:', error);
      res.status(500).json({ success: false, message: 'Failed to review submission' });
    }
  });

  // Storekeeper resubmits a rejected assignment with adjustments
  router.put('/assignments/:assignmentId/resubmit', async (req, res) => {
    try {
      const { assignmentId } = req.params;
      const { bags_assigned, notes } = req.body;

      // Authorization: only StoreKeeper
      // Temporarily disabled for testing - TODO: Fix authentication
      // if (!req.user || !['storekeeper', 'StoreKeeper'].includes(req.user.role)) {
      //   return res.status(403).json({ success: false, message: 'Forbidden' });
      // }

      const assignment = await db('water_bag_assignments').where('id', assignmentId).first();
      if (!assignment) {
        return res.status(404).json({ success: false, message: 'Assignment not found' });
      }

      // Ensure does not exceed batch total against other approved/ pending quantities
      const batch = await db('water_bag_batches').where('id', assignment.batch_id).first();
      const otherAssigned = await db('water_bag_assignments')
        .where('batch_id', assignment.batch_id)
        .andWhereNot('id', assignmentId)
        .sum('bags_assigned as total')
        .first();
      const currentOther = otherAssigned.total || 0;
      if (currentOther + bags_assigned > (batch?.bags_received || 0)) {
        return res.status(400).json({ success: false, message: 'Adjusted amount exceeds batch total' });
      }

      await db('water_bag_assignments').where('id', assignmentId).update({
        bags_assigned,
        notes: notes || assignment.notes,
        status: 'pending_review',
        updated_at: new Date().toISOString()
      });

      await db('system_activity').insert({
        employee_id: req.user?.id,
        activity_type: 'water_bag_submission_resubmitted',
        description: `Resubmitted assignment ${assignmentId} with ${bags_assigned} bags`,
        timestamp: new Date().toISOString()
      });

      res.json({ success: true, message: 'Resubmitted for manager review' });
    } catch (error) {
      console.error('Error resubmitting assignment:', error);
      res.status(500).json({ success: false, message: 'Failed to resubmit assignment' });
    }
  });

  // Get assignments for a batch
  router.get('/batches/:batchId/assignments', async (req, res) => {
    try {
      const { batchId } = req.params;

      const assignments = await db('water_bag_assignments')
        .join('employees', 'water_bag_assignments.packer_id', 'employees.id')
        .where('water_bag_assignments.batch_id', batchId)
        .select(
          'water_bag_assignments.*',
          'employees.name as packer_name',
          'employees.email as packer_email'
        )
        .orderBy('water_bag_assignments.created_at');

      res.json({ success: true, data: assignments });
    } catch (error) {
      console.error('Error fetching assignments:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch assignments' });
    }
  });

  // Get packer work logs
  router.get('/work-logs', async (req, res) => {
    try {
      const { packer_id, status } = req.query;

      let query = db('packer_work_logs')
        .join('water_bag_assignments', 'packer_work_logs.assignment_id', 'water_bag_assignments.id')
        .join('water_bag_batches', 'water_bag_assignments.batch_id', 'water_bag_batches.id')
        .join('employees', 'packer_work_logs.packer_id', 'employees.id')
        .select(
          'packer_work_logs.*',
          'water_bag_batches.batch_number',
          'water_bag_assignments.bags_assigned',
          'employees.name as packer_name',
          'employees.email as packer_email'
        )
        .orderBy('packer_work_logs.created_at', 'desc');

      if (packer_id) {
        query = query.where('packer_work_logs.packer_id', packer_id);
      }

      if (status) {
        query = query.where('packer_work_logs.status', status);
      }

      const logs = await query;

      res.json({ success: true, data: logs });
    } catch (error) {
      console.error('Error fetching work logs:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch work logs' });
    }
  });

  // Submit packer work log
  router.post('/work-logs', async (req, res) => {
    try {
      const { assignment_id, packer_id, bags_packed } = req.body;

      if (!assignment_id || !packer_id || !bags_packed) {
        return res.status(400).json({
          success: false,
          message: 'Assignment ID, packer ID, and bags packed are required'
        });
      }

      // Check assignment exists and belongs to packer
      const assignment = await db('water_bag_assignments')
        .where('id', assignment_id)
        .where('packer_id', packer_id)
        .first();

      if (!assignment) {
        return res.status(404).json({
          success: false,
          message: 'Assignment not found or does not belong to packer'
        });
      }

      // Check if bags packed doesn't exceed assigned bags
      if (bags_packed > assignment.bags_assigned) {
        return res.status(400).json({
          success: false,
          message: 'Cannot pack more bags than assigned'
        });
      }

      const [logId] = await db('packer_work_logs').insert({
        assignment_id,
        packer_id,
        bags_packed,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      // Update assignment status
      await db('water_bag_assignments')
        .where('id', assignment_id)
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString()
        });

      // Log system activity
      await db('system_activity').insert({
        employee_id: packer_id,
        activity_type: 'packer_work_submitted',
        description: `Submitted work log: ${bags_packed} bags packed`,
        timestamp: new Date().toISOString()
      });

      res.json({
        success: true,
        message: 'Work log submitted successfully',
        data: { id: logId }
      });
    } catch (error) {
      console.error('Error submitting work log:', error);
      res.status(500).json({ success: false, message: 'Failed to submit work log' });
    }
  });

  // Approve/reject packer work log (Manager only)
  router.put('/work-logs/:logId/approve', async (req, res) => {
    try {
      const { logId } = req.params;
      const { action, comment } = req.body; // action: 'approve' or 'reject'

      if (!action || !['approve', 'reject'].includes(action)) {
        return res.status(400).json({
          success: false,
          message: 'Action must be either "approve" or "reject"'
        });
      }

      const status = action === 'approve' ? 'approved' : 'rejected';

      await db('packer_work_logs')
        .where('id', logId)
        .update({
          status,
          modification_comment: comment || null,
          updated_at: new Date().toISOString()
        });

      // If approved, update assignment status
      if (action === 'approve') {
        const workLog = await db('packer_work_logs').where('id', logId).first();
        await db('water_bag_assignments')
          .where('id', workLog.assignment_id)
          .update({ 
            status: 'approved',
            updated_at: new Date().toISOString()
          });
      }

      // Log system activity
      await db('system_activity').insert({
        employee_id: req.user?.id,
        activity_type: `packer_work_${action}d`,
        description: `${action === 'approve' ? 'Approved' : 'Rejected'} packer work log`,
        timestamp: new Date().toISOString()
      });

      res.json({
        success: true,
        message: `Work log ${action}d successfully`
      });
    } catch (error) {
      console.error('Error updating work log:', error);
      res.status(500).json({ success: false, message: 'Failed to update work log' });
    }
  });

  // Get dashboard statistics
  router.get('/dashboard-stats', async (req, res) => {
    try {
      const [
        totalBatches,
        pendingAssignments,
        completedWork,
        pendingApprovals
      ] = await Promise.all([
        db('water_bag_batches').count('* as count').first(),
        db('water_bag_assignments').where('status', 'assigned').count('* as count').first(),
        db('packer_work_logs').where('status', 'approved').count('* as count').first(),
        db('packer_work_logs').where('status', 'pending').count('* as count').first()
      ]);

      res.json({
        success: true,
        data: {
          totalBatches: parseInt(totalBatches.count),
          pendingAssignments: parseInt(pendingAssignments.count),
          completedWork: parseInt(completedWork.count),
          pendingApprovals: parseInt(pendingApprovals.count)
        }
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch dashboard stats' });
    }
  });

  return router;
};
