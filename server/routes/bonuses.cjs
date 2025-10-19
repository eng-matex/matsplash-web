const express = require('express');

module.exports = (db) => {
  const router = express.Router();

  // Get all bonuses
  router.get('/', async (req, res) => {
    try {
      const bonuses = await db('bonuses')
        .leftJoin('employees as emp', 'bonuses.employee_id', 'emp.id')
        .leftJoin('employees as approver', 'bonuses.approved_by', 'approver.id')
        .leftJoin('employees as creator', 'bonuses.created_by', 'creator.id')
        .select(
          'bonuses.*',
          'emp.name as employee_name',
          'approver.name as approved_by_name',
          'creator.name as created_by_name'
        )
        .orderBy('bonuses.created_at', 'desc');

      res.json({
        success: true,
        data: bonuses
      });
    } catch (error) {
      console.error('Error fetching bonuses:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch bonuses'
      });
    }
  });

  // Create new bonus
  router.post('/', async (req, res) => {
    try {
      const bonusData = req.body;

      // Validate required fields
      if (!bonusData.employee_id || !bonusData.amount || !bonusData.reason) {
        return res.status(400).json({
          success: false,
          message: 'Employee, amount, and reason are required'
        });
      }

      const newBonus = {
        employee_id: bonusData.employee_id,
        amount: bonusData.amount,
        reason: bonusData.reason,
        bonus_date: bonusData.bonus_date || new Date().toISOString().split('T')[0],
        status: 'pending',
        created_by: bonusData.created_by || 1, // Default to admin if not provided
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const [bonusId] = await db('bonuses').insert(newBonus);

      // Log system activity
      try {
        await db('system_activity').insert({
          user_id: bonusData.created_by || 1,
          user_email: req.body.userEmail || 'system',
          action: 'BONUS_CREATED',
          details: `Created bonus of ₦${bonusData.amount} for employee ${bonusData.employee_id}`,
          ip_address: req.ip,
          user_agent: req.get('User-Agent'),
          created_at: new Date().toISOString()
        });
      } catch (logError) {
        console.error('Error logging system activity:', logError);
        // Don't fail the bonus creation if logging fails
      }

      // Get the created bonus with employee name
      const createdBonus = await db('bonuses')
        .leftJoin('employees as emp', 'bonuses.employee_id', 'emp.id')
        .leftJoin('employees as creator', 'bonuses.created_by', 'creator.id')
        .select(
          'bonuses.*',
          'emp.name as employee_name',
          'creator.name as created_by_name'
        )
        .where('bonuses.id', bonusId)
        .first();

      res.status(201).json({
        success: true,
        data: createdBonus,
        message: 'Bonus created successfully'
      });

    } catch (error) {
      console.error('Error creating bonus:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create bonus'
      });
    }
  });

  // Approve bonus
  router.put('/:id/approve', async (req, res) => {
    try {
      const { id } = req.params;
      const { approved_by } = req.body;

      await db('bonuses')
        .where('id', id)
        .update({
          status: 'approved',
          approved_by: approved_by || 1,
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      // Log system activity
      try {
        await db('system_activity').insert({
          user_id: approved_by || 1,
          user_email: req.body.userEmail || 'system',
          action: 'BONUS_APPROVED',
          details: `Approved bonus ${id}`,
          ip_address: req.ip,
          user_agent: req.get('User-Agent'),
          created_at: new Date().toISOString()
        });
      } catch (logError) {
        console.error('Error logging system activity:', logError);
        // Don't fail the approval if logging fails
      }

      res.json({
        success: true,
        message: 'Bonus approved successfully'
      });

    } catch (error) {
      console.error('Error approving bonus:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to approve bonus'
      });
    }
  });

  // Reject bonus
  router.put('/:id/reject', async (req, res) => {
    try {
      const { id } = req.params;
      const { rejected_by } = req.body;

      await db('bonuses')
        .where('id', id)
        .update({
          status: 'rejected',
          approved_by: rejected_by || 1,
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      // Log system activity
      try {
        await db('system_activity').insert({
          user_id: rejected_by || 1,
          user_email: req.body.userEmail || 'system',
          action: 'BONUS_REJECTED',
          details: `Rejected bonus ${id}`,
          ip_address: req.ip,
          user_agent: req.get('User-Agent'),
          created_at: new Date().toISOString()
        });
      } catch (logError) {
        console.error('Error logging system activity:', logError);
        // Don't fail the rejection if logging fails
      }

      res.json({
        success: true,
        message: 'Bonus rejected successfully'
      });

    } catch (error) {
      console.error('Error rejecting bonus:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to reject bonus'
      });
    }
  });

  // Update bonus
  router.put('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Remove fields that shouldn't be updated directly
      delete updateData.id;
      delete updateData.created_at;
      delete updateData.created_by;

      updateData.updated_at = new Date().toISOString();

      await db('bonuses').where('id', id).update(updateData);

      // Log system activity
      if (updateData.userId) {
        await db('system_activity').insert({
          user_id: updateData.userId,
          user_email: req.body.userEmail || 'unknown',
          action: 'BONUS_UPDATED',
          details: `Updated bonus ${id}`,
          ip_address: req.ip,
          user_agent: req.get('User-Agent'),
          created_at: new Date().toISOString()
        });
      }

      res.json({
        success: true,
        message: 'Bonus updated successfully'
      });

    } catch (error) {
      console.error('Error updating bonus:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update bonus'
      });
    }
  });

  // Delete bonus
  router.delete('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { userId } = req.body;

      // Check if bonus exists
      const bonus = await db('bonuses').where('id', id).first();
      if (!bonus) {
        return res.status(404).json({
          success: false,
          message: 'Bonus not found'
        });
      }

      // Only allow deletion of pending bonuses
      if (bonus.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Only pending bonuses can be deleted'
        });
      }

      await db('bonuses').where('id', id).del();

      // Log system activity
      if (userId) {
        await db('system_activity').insert({
          user_id: userId,
          user_email: req.body.userEmail || 'unknown',
          action: 'BONUS_DELETED',
          details: `Deleted bonus ${id}`,
          ip_address: req.ip,
          user_agent: req.get('User-Agent'),
          created_at: new Date().toISOString()
        });
      }

      res.json({
        success: true,
        message: 'Bonus deleted successfully'
      });

    } catch (error) {
      console.error('Error deleting bonus:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete bonus'
      });
    }
  });

  return router;
};
