const express = require('express');
const net = require('net');

module.exports = function(db) {
  const router = express.Router();

  // Test endpoint
  router.get('/test', (req, res) => {
    res.json({ success: true, message: 'Surveillance route is working' });
  });

  // Test database endpoint
  router.get('/test-db', async (req, res) => {
    try {
      console.log('Testing database connection...');
      console.log('Database instance:', typeof db);
      const cameras = await db('cameras').select('*');
      console.log('Database test successful, cameras count:', cameras.length);
      res.json({ success: true, message: 'Database connection working', camerasCount: cameras.length });
    } catch (error) {
      console.error('Database test error:', error);
      res.status(500).json({ success: false, message: 'Database connection failed', error: error.message });
    }
  });

  // Fix cameras with unsafe ports
  router.post('/fix-unsafe-ports', async (req, res) => {
    try {
      console.log('🔧 Fixing cameras with unsafe ports...');
      
      // Find cameras with port 554 (RTSP port)
      const camerasWithUnsafePorts = await db('cameras').where('port', 554);
      
      console.log(`Found ${camerasWithUnsafePorts.length} cameras with unsafe ports`);
      
      for (const camera of camerasWithUnsafePorts) {
        // Update to use port 80 for HTTP streaming
        const updatedStreamUrl = `http://${camera.ip_address}:80/video.mjpg`;
        
        await db('cameras')
          .where('id', camera.id)
          .update({
            port: 80,
            stream_url: updatedStreamUrl,
            updated_at: new Date().toISOString()
          });
        
        console.log(`✅ Fixed camera ${camera.name} (ID: ${camera.id}) - Updated to port 80`);
      }
      
      res.json({
        success: true,
        message: `Fixed ${camerasWithUnsafePorts.length} cameras with unsafe ports`,
        fixed_cameras: camerasWithUnsafePorts.length
      });
      
    } catch (error) {
      console.error('❌ Error fixing unsafe ports:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fix unsafe ports'
      });
    }
  });

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

  // Get cameras
  router.get('/cameras', async (req, res) => {
    try {
      const cameras = await db('cameras').orderBy('created_at', 'desc');
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

  // Get camera credentials
  router.get('/credentials', async (req, res) => {
    try {
      const credentials = await db('camera_credentials').orderBy('created_at', 'desc');
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

  // Add camera
  router.post('/cameras', async (req, res) => {
    try {
      console.log('📷 Adding camera - Raw body:', req.body);
      console.log('📷 Adding camera - Body type:', typeof req.body);
      console.log('📷 Adding camera - Body keys:', Object.keys(req.body || {}));
      const cameraData = req.body;
      
      // Validate required fields
      if (!cameraData.name || !cameraData.ip_address) {
        console.log('❌ Validation failed: missing name or ip_address');
        return res.status(400).json({
          success: false,
          message: 'Camera name and IP address are required'
        });
      }

      // Generate appropriate stream URL based on port and camera type
      const port = cameraData.port || 80;
      let streamUrl = cameraData.stream_url;
      
      if (!streamUrl) {
        // Use safe HTTP ports for web streaming
        if (port === 554) {
          // RTSP port - convert to HTTP stream (if camera supports it)
          streamUrl = `http://${cameraData.ip_address}:80/video.mjpg`;
        } else if (port === 8080) {
          // Common alternative HTTP port
          streamUrl = `http://${cameraData.ip_address}:8080/video.mjpg`;
        } else {
          // Default HTTP port - try common stream paths
          const manufacturer = (cameraData.manufacturer || '').toLowerCase();
          if (manufacturer.includes('cisco') || manufacturer.includes('linksys')) {
            streamUrl = `http://${cameraData.ip_address}:${port}/video.mjpg`;
          } else if (manufacturer.includes('hikvision')) {
            streamUrl = `http://${cameraData.ip_address}:${port}/ISAPI/Streaming/channels/101/picture`;
          } else if (manufacturer.includes('dahua')) {
            streamUrl = `http://${cameraData.ip_address}:${port}/cgi-bin/mjpg/video.cgi`;
          } else {
            // Generic fallback
            streamUrl = `http://${cameraData.ip_address}:${port}/video.mjpg`;
          }
        }
      }

      const newCamera = {
        name: cameraData.name,
        ip_address: cameraData.ip_address,
        port: port,
        username: cameraData.username || 'admin',
        password: cameraData.password || 'password',
        stream_url: streamUrl,
        status: 'offline',
        location: cameraData.location || '',
        model: cameraData.model || '',
        manufacturer: cameraData.manufacturer || '',
        resolution: cameraData.resolution || '1920x1080',
        fps: cameraData.fps || 30,
        night_vision: cameraData.night_vision || false,
        motion_detection: cameraData.motion_detection || true,
        audio_enabled: cameraData.audio_enabled || false,
        recording_enabled: cameraData.recording_enabled || true,
        storage_used: 0,
        storage_total: cameraData.storage_total || 100,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('📷 Inserting camera to database:', newCamera);
      const [cameraId] = await db('cameras').insert(newCamera);
      console.log('✅ Camera inserted with ID:', cameraId);
      
      const camera = await db('cameras').where('id', cameraId).first();
      console.log('📷 Retrieved camera:', camera);

      res.json({
        success: true,
        data: camera,
        message: 'Camera added successfully'
      });

    } catch (error) {
      console.error('❌ Error adding camera:', error);
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

      updateData.updated_at = new Date().toISOString();

      await db('cameras').where('id', id).update(updateData);
      const camera = await db('cameras').where('id', id).first();

      if (!camera) {
        return res.status(404).json({
          success: false,
          message: 'Camera not found'
        });
      }

      res.json({
        success: true,
        data: camera,
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

      const camera = await db('cameras').where('id', id).first();
      if (!camera) {
        return res.status(404).json({
          success: false,
          message: 'Camera not found'
        });
      }

      await db('cameras').where('id', id).del();

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

  // Helper function to parse network range
  function parseNetworkRange(range) {
    const ips = [];
    
    if (range.includes('-')) {
      const [start, end] = range.split('-');
      const startParts = start.split('.').map(Number);
      const endParts = end.split('.').map(Number);
      
      // Handle different range formats
      if (endParts.length === 1) {
        // Format: 192.168.1.1-254
        const baseIp = startParts.slice(0, 3).join('.');
        for (let i = startParts[3]; i <= endParts[0]; i++) {
          ips.push(`${baseIp}.${i}`);
        }
      } else {
        // Format: 192.168.1.1-192.168.1.254
        const startIp = startParts[0] * 256 * 256 * 256 + startParts[1] * 256 * 256 + startParts[2] * 256 + startParts[3];
        const endIp = endParts[0] * 256 * 256 * 256 + endParts[1] * 256 * 256 + endParts[2] * 256 + endParts[3];
        
        for (let ip = startIp; ip <= endIp; ip++) {
          const a = Math.floor(ip / (256 * 256 * 256));
          const b = Math.floor((ip % (256 * 256 * 256)) / (256 * 256));
          const c = Math.floor((ip % (256 * 256)) / 256);
          const d = ip % 256;
          ips.push(`${a}.${b}.${c}.${d}`);
        }
      }
    } else {
      // Single IP or CIDR notation (simplified)
      ips.push(range);
    }
    
    return ips;
  }

  // Scan network for devices
  router.post('/scan-network', async (req, res) => {
    try {
      console.log('🔍 Starting network scan...');
      
      const { networkRange = '192.168.1.1-254', ports = [80, 8080, 554, 1935] } = req.body;
      
      // Parse the network range
      const ips = parseNetworkRange(networkRange);
      console.log(`🔍 Scanning ${ips.length} IPs with ports: ${ports.join(', ')}`);
      
      const devices = [];
      const maxConcurrent = 50; // Limit concurrent connections
      
      // Process IPs in batches to avoid overwhelming the network
      for (let i = 0; i < ips.length; i += maxConcurrent) {
        const batch = ips.slice(i, i + maxConcurrent);
        const promises = [];
        
        for (const ip of batch) {
          for (const port of ports) {
            promises.push(
              testPort(ip, port, 2000).then(result => {
                if (result.status === 'online') {
                  console.log(`✅ Found device: ${ip}:${port} (${result.responseTime}ms)`);
                  return {
                    ip,
                    port,
                    status: result.status,
                    responseTime: result.responseTime,
                    deviceType: port === 554 ? 'rtsp_camera' : port === 1935 ? 'rtmp_camera' : 'web_camera',
                    manufacturer: 'Unknown',
                    model: 'Unknown'
                  };
                }
                return null;
              })
            );
          }
        }
        
        const batchResults = await Promise.all(promises);
        devices.push(...batchResults.filter(device => device !== null));
        
        // Small delay between batches to be network-friendly
        if (i + maxConcurrent < ips.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      console.log(`🔍 Scan complete. Found ${devices.length} devices`);
      
      res.json({
        success: true,
        data: devices,
        message: `Found ${devices.length} devices on the network`
      });

    } catch (error) {
      console.error('❌ Network scan error:', error);
      res.status(500).json({
        success: false,
        message: 'Network scan failed: ' + error.message
      });
    }
  });

  return router;
};
