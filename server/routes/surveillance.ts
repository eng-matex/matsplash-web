import * as express from 'express';
import { db } from '../database';
import { ApiResponse, Camera, CameraCredentials } from '../../src/types';

const router = express.Router();

// Get cameras
router.get('/cameras', async (req, res) => {
  try {
    const { status, limit = 100 } = req.query;
    
    let query = db('cameras')
      .orderBy('created_at', 'desc')
      .limit(parseInt(limit as string));

    if (status) {
      query = query.where('status', status);
    }

    const cameras = await query;

    res.json({
      success: true,
      data: cameras
    } as ApiResponse<Camera[]>);

  } catch (error) {
    console.error('Error fetching cameras:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cameras'
    } as ApiResponse);
  }
});

// Get camera by ID
router.get('/cameras/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const camera = await db('cameras')
      .where('id', id)
      .first();

    if (!camera) {
      return res.status(404).json({
        success: false,
        message: 'Camera not found'
      } as ApiResponse);
    }

    res.json({
      success: true,
      data: camera
    } as ApiResponse<Camera>);

  } catch (error) {
    console.error('Error fetching camera:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch camera'
    } as ApiResponse);
  }
});

// Create new camera
router.post('/cameras', async (req, res) => {
  try {
    const cameraData = req.body;

    // Validate required fields
    if (!cameraData.name || !cameraData.ip_address || !cameraData.username || !cameraData.password) {
      return res.status(400).json({
        success: false,
        message: 'Name, IP address, username, and password are required'
      } as ApiResponse);
    }

    const newCamera = {
      name: cameraData.name,
      ip_address: cameraData.ip_address,
      port: cameraData.port || 80,
      username: cameraData.username,
      password: cameraData.password,
      stream_url: cameraData.stream_url || `http://${cameraData.ip_address}:${cameraData.port || 80}/video`,
      status: cameraData.status || 'offline',
      location: cameraData.location,
      model: cameraData.model,
      manufacturer: cameraData.manufacturer,
      created_at: new Date().toISOString()
    };

    const [cameraId] = await db('cameras').insert(newCamera);

    // Log system activity
    await db('system_activity').insert({
      user_id: req.body.userId || 1, // Default to admin if not provided
      user_email: req.body.userEmail || 'system',
      action: 'CAMERA_ADDED',
      details: `Added camera ${cameraData.name} at ${cameraData.ip_address}`,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      created_at: new Date().toISOString()
    });

    // Get the created camera
    const createdCamera = await db('cameras')
      .where('id', cameraId)
      .first();

    res.status(201).json({
      success: true,
      data: createdCamera,
      message: 'Camera added successfully'
    } as ApiResponse<Camera>);

  } catch (error) {
    console.error('Error adding camera:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add camera'
    } as ApiResponse);
  }
});

// Update camera
router.put('/cameras/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated directly
    delete updateData.id;
    delete updateData.created_at;

    updateData.updated_at = new Date().toISOString();

    await db('cameras').where('id', id).update(updateData);

    // Log system activity
    if (updateData.userId) {
      await db('system_activity').insert({
        user_id: updateData.userId,
        user_email: req.body.userEmail || 'unknown',
        action: 'CAMERA_UPDATED',
        details: `Updated camera ${id}`,
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
        created_at: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: 'Camera updated successfully'
    } as ApiResponse);

  } catch (error) {
    console.error('Error updating camera:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update camera'
    } as ApiResponse);
  }
});

// Delete camera
router.delete('/cameras/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    await db('cameras').where('id', id).del();

    // Log system activity
    if (userId) {
      await db('system_activity').insert({
        user_id: userId,
        user_email: req.body.userEmail || 'unknown',
        action: 'CAMERA_DELETED',
        details: `Deleted camera ${id}`,
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
        created_at: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: 'Camera deleted successfully'
    } as ApiResponse);

  } catch (error) {
    console.error('Error deleting camera:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete camera'
    } as ApiResponse);
  }
});

// Update camera status
router.patch('/cameras/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      } as ApiResponse);
    }

    const updateData = {
      status,
      last_seen: status === 'online' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString()
    };

    await db('cameras').where('id', id).update(updateData);

    res.json({
      success: true,
      message: 'Camera status updated successfully'
    } as ApiResponse);

  } catch (error) {
    console.error('Error updating camera status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update camera status'
    } as ApiResponse);
  }
});

// Get camera credentials
router.get('/credentials', async (req, res) => {
  try {
    const credentials = await db('camera_credentials')
      .orderBy('created_at', 'desc');

    res.json({
      success: true,
      data: credentials
    } as ApiResponse<CameraCredentials[]>);

  } catch (error) {
    console.error('Error fetching camera credentials:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch camera credentials'
    } as ApiResponse);
  }
});

export default router;