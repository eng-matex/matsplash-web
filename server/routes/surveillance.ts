import * as express from 'express';
import { db } from '../database';
import { ApiResponse, Camera, CameraCredentials } from '../../src/types';
import * as net from 'net';
import * as dgram from 'dgram';

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

// Recording management endpoints
interface RecordingSession {
  id: string;
  camera_id: number;
  start_time: string;
  end_time?: string;
  status: 'recording' | 'stopped' | 'paused';
  recording_type: 'manual' | 'motion' | 'continuous' | 'scheduled';
  file_path?: string;
  duration?: number;
  file_size?: number;
  motion_events?: number;
}

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
      } as ApiResponse);
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
      } as ApiResponse);
    }

    const sessionId = `rec_${id}_${Date.now()}`;
    const recordingSession: RecordingSession = {
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
      user_id: req.body.userId || 1,
      user_email: req.body.userEmail || 'system',
      action: 'RECORDING_STARTED',
      details: `Started ${recording_type} recording for camera ${camera.name}`,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      created_at: new Date().toISOString()
    });

    res.json({
      success: true,
      data: recordingSession,
      message: 'Recording started successfully'
    } as ApiResponse<RecordingSession>);

  } catch (error) {
    console.error('Error starting recording:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start recording'
    } as ApiResponse);
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
      } as ApiResponse);
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
      } as ApiResponse);
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
      user_id: req.body.userId || 1,
      user_email: req.body.userEmail || 'system',
      action: 'RECORDING_STOPPED',
      details: `Stopped recording for camera ${camera.name} (${duration}s)`,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      created_at: new Date().toISOString()
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
    } as ApiResponse<RecordingSession>);

  } catch (error) {
    console.error('Error stopping recording:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to stop recording'
    } as ApiResponse);
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
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));

    res.json({
      success: true,
      data: recordings
    } as ApiResponse<RecordingSession[]>);

  } catch (error) {
    console.error('Error fetching recordings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recordings'
    } as ApiResponse);
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
    } as ApiResponse);

  } catch (error) {
    console.error('Error fetching recording status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recording status'
    } as ApiResponse);
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
      } as ApiResponse);
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
      const recordingSession: RecordingSession = {
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
      user_id: req.body.userId || 1,
      user_email: req.body.userEmail || 'system',
      action: '247_RECORDING_CONFIGURED',
      details: `${enabled ? 'Enabled' : 'Disabled'} 24/7 recording for camera ${camera.name}`,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      created_at: new Date().toISOString()
    });

    res.json({
      success: true,
      message: `24/7 recording ${enabled ? 'enabled' : 'disabled'} successfully`
    } as ApiResponse);

  } catch (error) {
    console.error('Error configuring 24/7 recording:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to configure 24/7 recording'
    } as ApiResponse);
  }
});

// Network scanning functionality
interface NetworkDevice {
  ip: string;
  port: number;
  status: 'online' | 'offline';
  responseTime?: number;
  deviceType?: string;
  manufacturer?: string;
  model?: string;
}

// Scan network for devices
router.post('/scan-network', async (req, res) => {
  try {
    const { networkRange = '192.168.1.1-254', ports = [80, 8080, 554, 1935] } = req.body;
    
    console.log(`🔍 Scanning network range: ${networkRange} on ports: ${ports.join(', ')}`);
    
    const devices = await scanNetworkRange(networkRange, ports);
    
    // Log system activity
    await db('system_activity').insert({
      user_id: req.body.userId || 1,
      user_email: req.body.userEmail || 'system',
      action: 'NETWORK_SCAN',
      details: `Scanned network range ${networkRange} - found ${devices.length} devices`,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      created_at: new Date().toISOString()
    });

    res.json({
      success: true,
      data: devices,
      message: `Found ${devices.length} devices on the network`
    } as ApiResponse<NetworkDevice[]>);

  } catch (error) {
    console.error('Error scanning network:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to scan network'
    } as ApiResponse);
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
      } as ApiResponse);
    }

    console.log(`🔍 Testing camera connection: ${ip_address}:${port}`);
    
    const result = await testCameraConnection(ip_address, port, username, password, timeout);
    
    res.json({
      success: true,
      data: result,
      message: result.status === 'online' ? 'Camera is reachable' : 'Camera is not reachable'
    } as ApiResponse<NetworkDevice>);

  } catch (error) {
    console.error('Error testing camera:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test camera connection'
    } as ApiResponse);
  }
});

// Helper function to scan network range
async function scanNetworkRange(networkRange: string, ports: number[]): Promise<NetworkDevice[]> {
  const devices: NetworkDevice[] = [];
  const [startIp, endIp] = parseNetworkRange(networkRange);
  
  if (!startIp || !endIp) {
    throw new Error('Invalid network range format. Use format like "192.168.1.1-254"');
  }

  const ipList = generateIpList(startIp, endIp);
  
  // Scan in batches to avoid overwhelming the network
  const batchSize = 20;
  for (let i = 0; i < ipList.length; i += batchSize) {
    const batch = ipList.slice(i, i + batchSize);
    const batchPromises = batch.map(ip => scanIpForPorts(ip, ports));
    const batchResults = await Promise.allSettled(batchPromises);
    
    batchResults.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.length > 0) {
        devices.push(...result.value);
      }
    });
    
    // Small delay between batches
    if (i + batchSize < ipList.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return devices;
}

// Helper function to parse network range
function parseNetworkRange(networkRange: string): [string, string] | [null, null] {
  const parts = networkRange.split('-');
  if (parts.length !== 2) return [null, null];
  
  const [startPart, endPart] = parts;
  const startIpParts = startPart.split('.');
  const endIpParts = endPart.split('.');
  
  if (startIpParts.length !== 4 || endIpParts.length !== 4) return [null, null];
  
  // Handle cases like "192.168.1.1-254"
  if (endIpParts.length === 1) {
    const baseIp = startIpParts.slice(0, 3).join('.');
    return [`${baseIp}.${startIpParts[3]}`, `${baseIp}.${endIpParts[0]}`];
  }
  
  return [startPart, endPart];
}

// Helper function to generate IP list
function generateIpList(startIp: string, endIp: string): string[] {
  const ips: string[] = [];
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

// Helper function to scan IP for specific ports
async function scanIpForPorts(ip: string, ports: number[]): Promise<NetworkDevice[]> {
  const devices: NetworkDevice[] = [];
  
  for (const port of ports) {
    try {
      const result = await testPort(ip, port);
      if (result.status === 'online') {
        devices.push({
          ip,
          port,
          status: 'online',
          responseTime: result.responseTime,
          deviceType: detectDeviceType(port),
          manufacturer: detectManufacturer(ip, port),
          model: detectModel(ip, port)
        });
      }
    } catch (error) {
      // Port is closed or unreachable
    }
  }
  
  return devices;
}

// Helper function to test port connectivity
function testPort(ip: string, port: number, timeout: number = 3000): Promise<{ status: 'online' | 'offline', responseTime?: number }> {
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

// Helper function to test camera connection
async function testCameraConnection(ip: string, port: number, username?: string, password?: string, timeout: number = 5000): Promise<NetworkDevice> {
  const startTime = Date.now();
  
  try {
    // Test basic connectivity
    const portTest = await testPort(ip, port, timeout);
    
    if (portTest.status === 'offline') {
      return {
        ip,
        port,
        status: 'offline'
      };
    }
    
    // Test HTTP connection (common for IP cameras)
    const httpTest = await testHttpConnection(ip, port, username, password, timeout);
    
    return {
      ip,
      port,
      status: 'online',
      responseTime: Date.now() - startTime,
      deviceType: 'camera',
      manufacturer: httpTest.manufacturer,
      model: httpTest.model
    };
    
  } catch (error) {
    return {
      ip,
      port,
      status: 'offline'
    };
  }
}

// Helper function to test HTTP connection
function testHttpConnection(ip: string, port: number, username?: string, password?: string, timeout: number = 5000): Promise<{ manufacturer?: string, model?: string }> {
  return new Promise((resolve) => {
    const http = require('http');
    const url = `http://${ip}:${port}`;
    
    const options = {
      timeout,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    };
    
    if (username && password) {
      const auth = Buffer.from(`${username}:${password}`).toString('base64');
      options.headers['Authorization'] = `Basic ${auth}`;
    }
    
    const req = http.get(url, options, (res: any) => {
      let data = '';
      res.on('data', (chunk: any) => data += chunk);
      res.on('end', () => {
        const manufacturer = detectManufacturerFromResponse(data);
        const model = detectModelFromResponse(data);
        resolve({ manufacturer, model });
      });
    });
    
    req.on('error', () => resolve({}));
    req.on('timeout', () => {
      req.destroy();
      resolve({});
    });
  });
}

// Helper function to detect device type based on port
function detectDeviceType(port: number): string {
  switch (port) {
    case 80:
    case 8080:
      return 'web_camera';
    case 554:
      return 'rtsp_camera';
    case 1935:
      return 'rtmp_camera';
    default:
      return 'unknown';
  }
}

// Helper function to detect manufacturer
function detectManufacturer(ip: string, port: number): string {
  // This is a simplified detection - in reality, you'd need to make HTTP requests
  // and parse response headers or HTML content
  return 'Unknown';
}

// Helper function to detect model
function detectModel(ip: string, port: number): string {
  // This is a simplified detection - in reality, you'd need to make HTTP requests
  // and parse response headers or HTML content
  return 'Unknown';
}

// Helper function to detect manufacturer from HTTP response
function detectManufacturerFromResponse(response: string): string {
  const lowerResponse = response.toLowerCase();
  
  if (lowerResponse.includes('hikvision')) return 'Hikvision';
  if (lowerResponse.includes('dahua')) return 'Dahua';
  if (lowerResponse.includes('axis')) return 'Axis';
  if (lowerResponse.includes('foscam')) return 'Foscam';
  if (lowerResponse.includes('d-link')) return 'D-Link';
  if (lowerResponse.includes('tp-link')) return 'TP-Link';
  if (lowerResponse.includes('netgear')) return 'Netgear';
  
  return 'Unknown';
}

// Helper function to detect model from HTTP response
function detectModelFromResponse(response: string): string {
  // Look for common model patterns in HTML/HTTP responses
  const modelMatch = response.match(/model[:\s]+([a-zA-Z0-9\-_]+)/i);
  if (modelMatch) return modelMatch[1];
  
  return 'Unknown';
}

export default router;