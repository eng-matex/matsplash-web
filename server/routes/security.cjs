const express = require('express');
const router = express.Router();

module.exports = (db) => {
  // Get gate activity
  router.get('/gate-activity', async (req, res) => {
    try {
      const activity = await db('gate_logs')
        .select('*')
        .orderBy('entry_time', 'desc')
        .limit(50);

      res.json({
        success: true,
        data: activity
      });

    } catch (error) {
      console.error('Error fetching gate activity:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch gate activity'
      });
    }
  });

  // Get gate logs
  router.get('/gate-logs', async (req, res) => {
    try {
      const logs = await db('gate_logs')
        .select('*')
        .orderBy('entry_time', 'desc');

      res.json({
        success: true,
        data: logs
      });

    } catch (error) {
      console.error('Error fetching gate logs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch gate logs'
      });
    }
  });

  // Get incident reports
  router.get('/incident-reports', async (req, res) => {
    try {
      const reports = await db('incident_reports')
        .select('*')
        .orderBy('created_at', 'desc');

      res.json({
        success: true,
        data: reports
      });

    } catch (error) {
      console.error('Error fetching incident reports:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch incident reports'
      });
    }
  });

  // Create gate log
  router.post('/gate-logs', async (req, res) => {
    try {
      const logData = req.body;

      const [logId] = await db('gate_logs').insert({
        ...logData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      res.status(201).json({
        success: true,
        message: 'Gate log created successfully',
        data: { id: logId }
      });

    } catch (error) {
      console.error('Error creating gate log:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create gate log'
      });
    }
  });

  // Create incident report
  router.post('/incident-reports', async (req, res) => {
    try {
      const reportData = req.body;

      const [reportId] = await db('incident_reports').insert({
        ...reportData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      res.status(201).json({
        success: true,
        message: 'Incident report created successfully',
        data: { id: reportId }
      });

    } catch (error) {
      console.error('Error creating incident report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create incident report'
      });
    }
  });

  return router;
};
