const express = require('express');
const router = express.Router();

module.exports = (db) => {

  // GET /api/factory-locations - Get all factory locations
  router.get('/', async (req, res) => {
    try {
      const { is_active, limit = 100 } = req.query;
      
      let query = db('factory_locations')
        .select('*')
        .orderBy('name')
        .limit(parseInt(limit));

      if (is_active !== undefined) {
        query = query.where('is_active', is_active === 'true');
      }

      const factories = await query;
      
      // Get device count for each factory
      for (const factory of factories) {
        const deviceCount = await db('device_factory_assignments')
          .where('factory_location_id', factory.id)
          .count('* as count')
          .first();
        factory.device_count = deviceCount ? parseInt(deviceCount.count) : 0;
      }

      res.json({ success: true, data: factories, count: factories.length });
    } catch (error) {
      console.error('Error fetching factory locations:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch factory locations' });
    }
  });

  // GET /api/factory-locations/:id - Get specific factory location
  router.get('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      const factory = await db('factory_locations')
        .where('id', id)
        .first();

      if (!factory) {
        return res.status(404).json({ success: false, message: 'Factory location not found' });
      }

      // Get assigned devices
      const assignedDevices = await db('device_factory_assignments')
        .join('authorized_devices', 'device_factory_assignments.device_id', 'authorized_devices.id')
        .where('device_factory_assignments.factory_location_id', id)
        .select('authorized_devices.*');

      factory.assigned_devices = assignedDevices;

      res.json({ success: true, data: factory });
    } catch (error) {
      console.error('Error fetching factory location:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch factory location' });
    }
  });

  // POST /api/factory-locations - Create a new factory location
  router.post('/', async (req, res) => {
    try {
      const {
        name, latitude, longitude, radius_meters, address, is_active,
        userId, userEmail // For logging
      } = req.body;

      if (!name || !latitude || !longitude || !address) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
      }

      if (radius_meters < 50 || radius_meters > 1000) {
        return res.status(400).json({ success: false, message: 'Radius must be between 50 and 1000 meters' });
      }

      const [factoryId] = await db('factory_locations').insert({
        name,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        radius_meters: parseInt(radius_meters),
        address,
        is_active: is_active !== false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      const newFactory = await db('factory_locations').where('id', factoryId).first();

      // Log system activity
      try {
        await db('system_activity').insert({
          user_id: userId,
          user_email: userEmail || 'unknown',
          action: 'FACTORY_LOCATION_CREATED',
          details: `Created new factory location: ${name} (ID: ${factoryId})`,
          ip_address: req.ip || '127.0.0.1',
          user_agent: req.get('User-Agent') || 'Unknown',
          activity_type: 'FACTORY_MANAGEMENT',
          timestamp: new Date().toISOString(),
          created_at: new Date().toISOString()
        });
      } catch (logError) {
        console.error('Error logging system activity:', logError);
      }

      res.status(201).json({ success: true, data: newFactory, message: 'Factory location created successfully' });
    } catch (error) {
      console.error('Error creating factory location:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  // PUT /api/factory-locations/:id - Update a factory location
  router.put('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { userId, userEmail, ...updateData } = req.body;

      if (updateData.radius_meters && (updateData.radius_meters < 50 || updateData.radius_meters > 1000)) {
        return res.status(400).json({ success: false, message: 'Radius must be between 50 and 1000 meters' });
      }

      updateData.updated_at = new Date().toISOString();

      const updatedRows = await db('factory_locations').where('id', id).update(updateData);

      if (updatedRows === 0) {
        return res.status(404).json({ success: false, message: 'Factory location not found' });
      }

      const updatedFactory = await db('factory_locations').where('id', id).first();

      // Log system activity
      try {
        await db('system_activity').insert({
          user_id: userId,
          user_email: userEmail || 'unknown',
          action: 'FACTORY_LOCATION_UPDATED',
          details: `Updated factory location: ${updatedFactory.name} (ID: ${id})`,
          ip_address: req.ip || '127.0.0.1',
          user_agent: req.get('User-Agent') || 'Unknown',
          activity_type: 'FACTORY_MANAGEMENT',
          timestamp: new Date().toISOString(),
          created_at: new Date().toISOString()
        });
      } catch (logError) {
        console.error('Error logging system activity:', logError);
      }

      res.json({ success: true, data: updatedFactory, message: 'Factory location updated successfully' });
    } catch (error) {
      console.error('Error updating factory location:', error);
      res.status(500).json({ success: false, message: 'Failed to update factory location' });
    }
  });

  // DELETE /api/factory-locations/:id - Delete a factory location
  router.delete('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { userId, userEmail } = req.body;

      // Check if factory has assigned devices
      const assignedDevices = await db('device_factory_assignments')
        .where('factory_location_id', id)
        .count('* as count')
        .first();

      if (assignedDevices && parseInt(assignedDevices.count) > 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Cannot delete factory location with assigned devices. Please reassign or remove devices first.' 
        });
      }

      const deletedRows = await db('factory_locations').where('id', id).del();

      if (deletedRows === 0) {
        return res.status(404).json({ success: false, message: 'Factory location not found' });
      }

      // Log system activity
      try {
        await db('system_activity').insert({
          user_id: userId,
          user_email: userEmail || 'unknown',
          action: 'FACTORY_LOCATION_DELETED',
          details: `Deleted factory location with ID: ${id}`,
          ip_address: req.ip || '127.0.0.1',
          user_agent: req.get('User-Agent') || 'Unknown',
          activity_type: 'FACTORY_MANAGEMENT',
          timestamp: new Date().toISOString(),
          created_at: new Date().toISOString()
        });
      } catch (logError) {
        console.error('Error logging system activity:', logError);
      }

      res.json({ success: true, message: 'Factory location deleted successfully' });
    } catch (error) {
      console.error('Error deleting factory location:', error);
      res.status(500).json({ success: false, message: 'Failed to delete factory location' });
    }
  });

  // POST /api/factory-locations/:id/devices - Assign device to factory
  router.post('/:id/devices', async (req, res) => {
    try {
      const { id } = req.params;
      const { device_id, userId, userEmail } = req.body;

      if (!device_id) {
        return res.status(400).json({ success: false, message: 'Device ID is required' });
      }

      // Check if assignment already exists
      const existingAssignment = await db('device_factory_assignments')
        .where('factory_location_id', id)
        .andWhere('device_id', device_id)
        .first();

      if (existingAssignment) {
        return res.status(400).json({ success: false, message: 'Device is already assigned to this factory' });
      }

      await db('device_factory_assignments').insert({
        factory_location_id: id,
        device_id: device_id,
        assigned_at: new Date().toISOString(),
        assigned_by: userId
      });

      // Log system activity
      try {
        await db('system_activity').insert({
          user_id: userId,
          user_email: userEmail || 'unknown',
          action: 'DEVICE_FACTORY_ASSIGNED',
          details: `Assigned device ${device_id} to factory location ${id}`,
          ip_address: req.ip || '127.0.0.1',
          user_agent: req.get('User-Agent') || 'Unknown',
          activity_type: 'FACTORY_MANAGEMENT',
          timestamp: new Date().toISOString(),
          created_at: new Date().toISOString()
        });
      } catch (logError) {
        console.error('Error logging system activity:', logError);
      }

      res.json({ success: true, message: 'Device assigned to factory successfully' });
    } catch (error) {
      console.error('Error assigning device to factory:', error);
      res.status(500).json({ success: false, message: 'Failed to assign device to factory' });
    }
  });

  // DELETE /api/factory-locations/:id/devices/:deviceId - Remove device from factory
  router.delete('/:id/devices/:deviceId', async (req, res) => {
    try {
      const { id, deviceId } = req.params;
      const { userId, userEmail } = req.body;

      const deletedRows = await db('device_factory_assignments')
        .where('factory_location_id', id)
        .andWhere('device_id', deviceId)
        .del();

      if (deletedRows === 0) {
        return res.status(404).json({ success: false, message: 'Device assignment not found' });
      }

      // Log system activity
      try {
        await db('system_activity').insert({
          user_id: userId,
          user_email: userEmail || 'unknown',
          action: 'DEVICE_FACTORY_UNASSIGNED',
          details: `Removed device ${deviceId} from factory location ${id}`,
          ip_address: req.ip || '127.0.0.1',
          user_agent: req.get('User-Agent') || 'Unknown',
          activity_type: 'FACTORY_MANAGEMENT',
          timestamp: new Date().toISOString(),
          created_at: new Date().toISOString()
        });
      } catch (logError) {
        console.error('Error logging system activity:', logError);
      }

      res.json({ success: true, message: 'Device removed from factory successfully' });
    } catch (error) {
      console.error('Error removing device from factory:', error);
      res.status(500).json({ success: false, message: 'Failed to remove device from factory' });
    }
  });

  // GET /api/devices/:deviceId/factory-assignments - Get factory assignments for a device
  router.get('/devices/:deviceId/factory-assignments', async (req, res) => {
    try {
      const { deviceId } = req.params;
      
      const assignments = await db('device_factory_assignments')
        .where('device_id', deviceId)
        .select('factory_location_id', 'assigned_at', 'assigned_by');

      res.json({ success: true, data: assignments });
    } catch (error) {
      console.error('Error fetching device factory assignments:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch device factory assignments' });
    }
  });

  return router;
};
