const express = require('express');

module.exports = function(db) {
  const router = express.Router();

// Get cameras
router.get('/cameras', async (req, res) => {
  try {
    const { status, limit = 100 } = req.query;
    
    let query = db('cameras')
      .orderBy('created_at', 'desc')
      .limit(parseInt(limit));

    if (status) {
      query = query.where('status', status);
    }

    const cameras = await query;

    res.json({
      success: true,
      data: cameras
    });

  } catch (error) {
    console.error('Error fetching cameras:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cameras'
    });
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
      });
    }

    res.json({
      success: true,
      data: camera
    });

  } catch (error) {
    console.error('Error fetching camera:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch camera'
    });
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
      });
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
      resolution: cameraData.resolution || '1920x1080',
      fps: cameraData.fps || 30,
      night_vision: cameraData.night_vision || false,
      motion_detection: cameraData.motion_detection || true,
      audio_enabled: cameraData.audio_enabled || false,
      recording_enabled: cameraData.recording_enabled || true,
      continuous_recording: cameraData.continuous_recording || false,
      created_at: new Date().toISOString()
    };

    const [cameraId] = await db('cameras').insert(newCamera);

    // Log system activity
    await db('system_activity').insert({
      employee_id: req.body.userId || 1,
      activity_type: 'CAMERA_ADDED',
      description: `Added camera ${cameraData.name} at ${cameraData.ip_address}`,
      timestamp: new Date().toISOString()
    });

    // Get the created camera
    const createdCamera = await db('cameras')
      .where('id', cameraId)
      .first();

    res.status(201).json({
      success: true,
      data: createdCamera,
      message: 'Camera added successfully'
    });

  } catch (error) {
    console.error('Error adding camera:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add camera'
    });
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
        employee_id: updateData.userId,
        activity_type: 'CAMERA_UPDATED',
        description: `Updated camera ${id}`,
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: 'Camera updated successfully'
    });

  } catch (error) {
    console.error('Error updating camera:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update camera'
    });
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
        employee_id: userId,
        activity_type: 'CAMERA_DELETED',
        description: `Deleted camera ${id}`,
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: 'Camera deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting camera:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete camera'
    });
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
      });
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
    });

  } catch (error) {
    console.error('Error updating camera status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update camera status'
    });
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
    });

  } catch (error) {
    console.error('Error fetching camera credentials:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch camera credentials'
    });
  }
});

// Network scanning functionality
const net = require('net');

// Helper function to test port connectivity
function testPort(ip, port, timeout = 3000) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const startTime = Date.now();
    
    socket.setTimeout(timeout);
    
    socket.on('connect', () => {
      const responseTime = Date.now() - startTime;
      socket.destroy();
      resolve({ status: 'online', responseTime });
    });
    
    socket.on('timeout', () => {
      socket.destroy();
      resolve({ status: 'offline' });
    });
    
    socket.on('error', () => {
      socket.destroy();
      resolve({ status: 'offline' });
    });
    
    socket.connect(port, ip);
  });
}

// Helper function to generate IP list
function generateIpList(startIp, endIp) {
  const ips = [];
  const startParts = startIp.split('.').map(Number);
  const endParts = endIp.split('.').map(Number);
  
  for (let a = startParts[0]; a <= endParts[0]; a++) {
    for (let b = startParts[1]; b <= endParts[1]; b++) {
      for (let c = startParts[2]; c <= endParts[2]; c++) {
        for (let d = startParts[3]; d <= endParts[3]; d++) {
          ips.push(`${a}.${b}.${c}.${d}`);
        }
      }
    }
  }
  
  return ips;
}

// Helper function to parse network range
function parseNetworkRange(networkRange) {
  const parts = networkRange.split('-');
  if (parts.length !== 2) return [null, null];
  
  const [startPart, endPart] = parts;
  const startIpParts = startPart.split('.');
  const endIpParts = endPart.split('.');
  
  if (startIpParts.length !== 4) return [null, null];
  
  // Handle cases like "192.168.1.1-254" or "192.168.1.1-10"
  if (endIpParts.length === 1) {
    const baseIp = startIpParts.slice(0, 3).join('.');
    return [`${baseIp}.${startIpParts[3]}`, `${baseIp}.${endIpParts[0]}`];
  }
  
  // Handle cases like "192.168.1.1-192.168.1.254"
  if (endIpParts.length === 4) {
    return [startPart, endPart];
  }
  
  return [null, null];
}

// Scan network for devices
router.post('/scan-network', async (req, res) => {
  try {
    const { networkRange = '192.168.1.1-254', ports = [80, 8080, 554, 1935] } = req.body;
    
    console.log(`🔍 Scanning network range: ${networkRange} on ports: ${ports.join(', ')}`);
    
    // For now, let's do a simple scan of common IPs to test the functionality
    const devices = [];
    
    // Test a focused range of common IPs where cameras are likely to be
    const testIps = [
      '192.168.1.1',   // Router
      '192.168.1.2',   // Common device
      '192.168.1.10',  // Common device
      '192.168.1.20',  // Common device
      '192.168.1.50',  // Common device
      '192.168.1.100', // Common camera IP
      '192.168.1.101', // Common camera IP
      '192.168.1.102', // Common camera IP
      '192.168.1.150', // Common device
      '192.168.1.200', // Common device
      '192.168.1.254'  // Gateway
    ];
    
    for (const ip of testIps) {
      for (const port of ports) {
        try {
          const result = await testPort(ip, port, 1000); // 1 second timeout
          if (result.status === 'online') {
            devices.push({
              ip,
              port,
              status: 'online',
              responseTime: result.responseTime,
              deviceType: port === 554 ? 'rtsp_camera' : port === 1935 ? 'rtmp_camera' : 'web_camera',
              manufacturer: 'Unknown',
              model: 'Unknown'
            });
            console.log(`✅ Found device: ${ip}:${port} (${result.responseTime}ms)`);
          }
        } catch (error) {
          // Port is closed or unreachable
        }
      }
    }
    
    // Log system activity (commented out for debugging)
    // await db('system_activity').insert({
    //   employee_id: req.body.userId || 1,
    //   activity_type: 'NETWORK_SCAN',
    //   description: `Scanned network range ${networkRange} - found ${devices.length} devices`,
    //   timestamp: new Date().toISOString()
    // });

    res.json({
      success: true,
      data: devices,
      message: `Found ${devices.length} devices on the network`
    });

  } catch (error) {
    console.error('Error scanning network:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to scan network'
    });
  }
});

// Test camera connection
router.post('/test-camera', async (req, res) => {
  try {
    const { ip_address, port = 80, username, password, timeout = 5000 } = req.body;
    
    if (!ip_address) {
      return res.status(400).json({
        success: false,
        message: 'IP address is required'
      });
    }

    console.log(`🔍 Testing camera connection: ${ip_address}:${port}`);
    
    // Test basic connectivity first
    const connectivityResult = await testPort(ip_address, port, timeout);
    
    if (connectivityResult.status === 'offline') {
      return res.json({
        success: false,
        data: {
          ip: ip_address,
          port: port,
          status: 'offline',
          error: 'Connection timeout or refused'
        },
        message: 'Camera is not reachable'
      });
    }
    
    // If port is open, try to determine if it's a camera
    let deviceType = 'unknown';
    let manufacturer = 'Unknown';
    let model = 'Unknown';
    let streamUrl = '';
    let authRequired = false;
    let capabilities = [];
    
    // Common camera ports and their typical services
    if (port === 80 || port === 8080) {
      deviceType = 'web_camera';
      streamUrl = `http://${ip_address}:${port}/video.mjpg`;
      capabilities = ['video'];
    } else if (port === 554) {
      deviceType = 'rtsp_camera';
      streamUrl = `rtsp://${ip_address}:${port}/stream1`;
      capabilities = ['video', 'audio'];
    } else if (port === 1935) {
      deviceType = 'rtmp_camera';
      streamUrl = `rtmp://${ip_address}:${port}/live/stream1`;
      capabilities = ['video', 'audio'];
    }
    
    // If username/password provided, assume auth is required
    if (username && password) {
      authRequired = true;
      if (streamUrl.includes('http://')) {
        streamUrl = `http://${username}:${password}@${ip_address}:${port}/video.mjpg`;
      } else if (streamUrl.includes('rtsp://')) {
        streamUrl = `rtsp://${username}:${password}@${ip_address}:${port}/stream1`;
      }
    }
    
    const result = {
      ip: ip_address,
      port: port,
      status: 'online',
      responseTime: connectivityResult.responseTime,
      deviceType: deviceType,
      manufacturer: manufacturer,
      model: model,
      streamUrl: streamUrl,
      authRequired: authRequired,
      capabilities: capabilities
    };
    
    // Log system activity
    await db('system_activity').insert({
      employee_id: req.body.userId || 1,
      activity_type: 'CAMERA_TEST',
      description: `Tested camera connection to ${ip_address}:${port} - ${connectivityResult.status}`,
      timestamp: new Date().toISOString()
    });
    
    res.json({
      success: true,
      data: result,
      message: result.status === 'online' ? 'Camera is reachable' : 'Camera is not reachable'
    });

  } catch (error) {
    console.error('Error testing camera:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test camera connection'
    });
  }
});

// Recording management endpoints
// Start recording
router.post('/cameras/:id/start-recording', async (req, res) => {
  try {
    const { id } = req.params;
    const { recording_type = 'manual', duration } = req.body;
    
    const camera = await db('cameras').where('id', id).first();
    if (!camera) {
      return res.status(404).json({
        success: false,
        message: 'Camera not found'
      });
    }

    // Check if camera is already recording
    const existingRecording = await db('recording_sessions')
      .where('camera_id', id)
      .where('status', 'recording')
      .first();

    if (existingRecording) {
      return res.status(400).json({
        success: false,
        message: 'Camera is already recording'
      });
    }

    const sessionId = `rec_${id}_${Date.now()}`;
    const recordingSession = {
      id: sessionId,
      camera_id: parseInt(id),
      start_time: new Date().toISOString(),
      status: 'recording',
      recording_type,
      file_path: `recordings/${sessionId}.mp4`
    };

    // Store recording session in database
    await db('recording_sessions').insert({
      ...recordingSession,
      created_at: new Date().toISOString()
    });

    // Log system activity
    await db('system_activity').insert({
      employee_id: req.body.userId || 1,
      activity_type: 'RECORDING_STARTED',
      description: `Started ${recording_type} recording for camera ${camera.name}`,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      data: recordingSession,
      message: 'Recording started successfully'
    });

  } catch (error) {
    console.error('Error starting recording:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start recording'
    });
  }
});

// Stop recording
router.post('/cameras/:id/stop-recording', async (req, res) => {
  try {
    const { id } = req.params;
    
    const camera = await db('cameras').where('id', id).first();
    if (!camera) {
      return res.status(404).json({
        success: false,
        message: 'Camera not found'
      });
    }

    // Find active recording session
    const recordingSession = await db('recording_sessions')
      .where('camera_id', id)
      .where('status', 'recording')
      .first();

    if (!recordingSession) {
      return res.status(400).json({
        success: false,
        message: 'No active recording found for this camera'
      });
    }

    const endTime = new Date().toISOString();
    const duration = Math.floor((new Date(endTime).getTime() - new Date(recordingSession.start_time).getTime()) / 1000);

    // Update recording session
    await db('recording_sessions')
      .where('id', recordingSession.id)
      .update({
        status: 'stopped',
        end_time: endTime,
        duration,
        updated_at: new Date().toISOString()
      });

    // Log system activity
    await db('system_activity').insert({
      employee_id: req.body.userId || 1,
      activity_type: 'RECORDING_STOPPED',
      description: `Stopped recording for camera ${camera.name} (${duration}s)`,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      data: {
        ...recordingSession,
        status: 'stopped',
        end_time: endTime,
        duration
      },
      message: 'Recording stopped successfully'
    });

  } catch (error) {
    console.error('Error stopping recording:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to stop recording'
    });
  }
});

// Get recording sessions
router.get('/cameras/:id/recordings', async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    
    const recordings = await db('recording_sessions')
      .where('camera_id', id)
      .orderBy('start_time', 'desc')
      .limit(parseInt(limit))
      .offset(parseInt(offset));

    res.json({
      success: true,
      data: recordings
    });

  } catch (error) {
    console.error('Error fetching recordings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recordings'
    });
  }
});

// Get active recording status
router.get('/cameras/:id/recording-status', async (req, res) => {
  try {
    const { id } = req.params;
    
    const activeRecording = await db('recording_sessions')
      .where('camera_id', id)
      .where('status', 'recording')
      .first();

    res.json({
      success: true,
      data: {
        is_recording: !!activeRecording,
        recording_session: activeRecording
      }
    });

  } catch (error) {
    console.error('Error fetching recording status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recording status'
    });
  }
});

// Configure 24/7 recording
router.post('/cameras/:id/configure-247', async (req, res) => {
  try {
    const { id } = req.params;
    const { enabled, motion_detection = true, audio_enabled = false } = req.body;
    
    const camera = await db('cameras').where('id', id).first();
    if (!camera) {
      return res.status(404).json({
        success: false,
        message: 'Camera not found'
      });
    }

    // Update camera settings
    await db('cameras')
      .where('id', id)
      .update({
        continuous_recording: enabled ? 1 : 0,
        motion_detection: motion_detection ? 1 : 0,
        audio_enabled: audio_enabled ? 1 : 0,
        updated_at: new Date().toISOString()
      });

    // If enabling 24/7 recording, start recording
    if (enabled) {
      const sessionId = `247_${id}_${Date.now()}`;
      const recordingSession = {
        id: sessionId,
        camera_id: parseInt(id),
        start_time: new Date().toISOString(),
        status: 'recording',
        recording_type: 'continuous'
      };

      await db('recording_sessions').insert({
        ...recordingSession,
        created_at: new Date().toISOString()
      });
    }

    // Log system activity
    await db('system_activity').insert({
      employee_id: req.body.userId || 1,
      activity_type: '247_RECORDING_CONFIGURED',
      description: `${enabled ? 'Enabled' : 'Disabled'} 24/7 recording for camera ${camera.name}`,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: `24/7 recording ${enabled ? 'enabled' : 'disabled'} successfully`
    });

  } catch (error) {
    console.error('Error configuring 24/7 recording:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to configure 24/7 recording'
    });
  }
});

// GCP Cloud Storage endpoints (simplified for CommonJS)
// Test GCP connection
router.get('/gcp/test-connection', async (req, res) => {
  try {
    // Mock GCP connection test
    res.json({
      success: false,
      message: 'GCP connection not configured',
      error: 'GCP Storage service not available in CommonJS version'
    });

  } catch (error) {
    console.error('Error testing GCP connection:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test GCP connection'
    });
  }
});

// Motion Detection endpoints (simplified for CommonJS)
// Get motion detection statistics
router.get('/motion-detection/stats', async (req, res) => {
  try {
    const stats = {
      totalEvents: 0,
      todayEvents: 0,
      activeDetections: 0,
      avgConfidence: 0
    };
    
    res.json({
      success: true,
      data: stats,
      message: 'Motion detection statistics retrieved successfully'
    });

  } catch (error) {
    console.error('Error fetching motion stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch motion detection statistics'
    });
  }
});

  return router;
};
