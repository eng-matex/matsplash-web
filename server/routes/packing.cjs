const express = require('express');
const router = express.Router();

module.exports = (db) => {
  // Get packing tasks
  router.get('/tasks', async (req, res) => {
    try {
      const tasks = await db('packing_logs')
        .select('*')
        .orderBy('created_at', 'desc');

      res.json({
        success: true,
        data: tasks
      });

    } catch (error) {
      console.error('Error fetching packing tasks:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch packing tasks'
      });
    }
  });

  // Get packing logs
  router.get('/logs', async (req, res) => {
    try {
      const logs = await db('packing_logs')
        .select('*')
        .orderBy('created_at', 'desc');

      res.json({
        success: true,
        data: logs
      });

    } catch (error) {
      console.error('Error fetching packing logs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch packing logs'
      });
    }
  });

  // Get personal logs for a packer
  router.get('/my-logs', async (req, res) => {
    try {
      const { packer_id } = req.query;
      
      if (!packer_id) {
        return res.status(400).json({
          success: false,
          message: 'Packer ID is required'
        });
      }

      const logs = await db('packing_logs')
        .where('packer_id', packer_id)
        .select('*')
        .orderBy('created_at', 'desc');

      res.json({
        success: true,
        data: logs
      });

    } catch (error) {
      console.error('Error fetching personal logs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch personal logs'
      });
    }
  });

  // Create new packing log
  router.post('/logs', async (req, res) => {
    try {
      const logData = req.body;

      const [logId] = await db('packing_logs').insert({
        ...logData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      res.status(201).json({
        success: true,
        message: 'Packing log created successfully',
        data: { id: logId }
      });

    } catch (error) {
      console.error('Error creating packing log:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create packing log'
      });
    }
  });

  return router;
};
