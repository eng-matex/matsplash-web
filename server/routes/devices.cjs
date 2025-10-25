const express = require('express');
const router = express.Router();

module.exports = (db) => {
  // Get all devices
  router.get('/', async (req, res) => {
    try {
      const devices = await db('devices')
        .select('*')
        .orderBy('created_at', 'desc');

      res.json({
        success: true,
        data: devices
      });

    } catch (error) {
      console.error('Error fetching devices:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch devices'
      });
    }
  });

  // Get device by ID
  router.get('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      const device = await db('devices')
        .where('id', id)
        .first();

      if (!device) {
        return res.status(404).json({
          success: false,
          message: 'Device not found'
        });
      }

      res.json({
        success: true,
        data: device
      });

    } catch (error) {
      console.error('Error fetching device:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch device'
      });
    }
  });

  // Create new device
  router.post('/', async (req, res) => {
    try {
      const deviceData = req.body;

      const [deviceId] = await db('devices').insert({
        ...deviceData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      res.status(201).json({
        success: true,
        message: 'Device created successfully',
        data: { id: deviceId }
      });

    } catch (error) {
      console.error('Error creating device:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create device'
      });
    }
  });

  // Update device
  router.put('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      await db('devices')
        .where('id', id)
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        });

      res.json({
        success: true,
        message: 'Device updated successfully'
      });

    } catch (error) {
      console.error('Error updating device:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update device'
      });
    }
  });

  // Delete device
  router.delete('/:id', async (req, res) => {
    try {
      const { id } = req.params;

      await db('devices')
        .where('id', id)
        .del();

      res.json({
        success: true,
        message: 'Device deleted successfully'
      });

    } catch (error) {
      console.error('Error deleting device:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete device'
      });
    }
  });

  // Get device MAC addresses
  router.get('/:id/mac-addresses', async (req, res) => {
    try {
      const { id } = req.params;
      
      const macAddresses = await db('device_mac_addresses')
        .where('device_id', id)
        .select('*');

      res.json({
        success: true,
        data: macAddresses
      });

    } catch (error) {
      console.error('Error fetching device MAC addresses:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch device MAC addresses'
      });
    }
  });

  // Update device MAC addresses
  router.put('/:id/mac-addresses', async (req, res) => {
    try {
      const { id } = req.params;
      const { macAddresses } = req.body;

      // Delete existing MAC addresses
      await db('device_mac_addresses')
        .where('device_id', id)
        .del();

      // Insert new MAC addresses
      if (macAddresses && macAddresses.length > 0) {
        const macData = macAddresses.map(mac => ({
          device_id: id,
          mac_address: mac,
          created_at: new Date().toISOString()
        }));

        await db('device_mac_addresses').insert(macData);
      }

      res.json({
        success: true,
        message: 'Device MAC addresses updated successfully'
      });

    } catch (error) {
      console.error('Error updating device MAC addresses:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update device MAC addresses'
      });
    }
  });

  return router;
};
