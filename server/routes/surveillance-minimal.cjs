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
      // Validate port
      const validPort = parseInt(port);
      if (isNaN(validPort) || validPort < 1 || validPort > 65535) {
        console.log(`❌ Invalid port: ${port}`);
        resolve({ status: 'offline', error: 'Invalid port' });
        return;
      }

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
      
      socket.on('error', (error) => {
        socket.destroy();
        resolve({ status: 'offline', error: error.message });
      });
      
      socket.connect(validPort, ip);
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
          } else if (manufacturer.includes('civs') || manufacturer.includes('ipc')) {
            // CIVS IPC cameras - use RTSP protocol
            streamUrl = `rtsp://${cameraData.ip_address}:554/livestream2`;
          } else {
            // Generic fallback - try multiple common paths
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

      // Handle null or invalid ports
      const validPort = port && port !== null && port !== 'null' ? parseInt(port) : 80;
      
      console.log(`🔍 Testing camera connection: ${ip_address}:${validPort}`);
      
      // Test basic connectivity first
      const connectivityResult = await testPort(ip_address, validPort, timeout);
      
      if (connectivityResult.status === 'offline') {
        // Try common camera ports if the default fails
        const commonPorts = [80, 8080, 554, 8554, 1935, 443, 8000, 8001, 8002];
        let foundPort = null;
        
        for (const testPort of commonPorts) {
          if (testPort !== validPort) {
            console.log(`🔍 Trying alternative port: ${ip_address}:${testPort}`);
            const altResult = await testPort(ip_address, testPort, 2000);
            if (altResult.status === 'online') {
              foundPort = testPort;
              break;
            }
          }
        }
        
        if (!foundPort) {
          return res.json({
            success: false,
            data: {
              ip: ip_address,
              port: validPort,
              status: 'offline',
              error: 'Connection timeout or refused on all common ports'
            },
            message: 'Camera is not reachable on any common port'
          });
        }
        
        // Update the port to the working one
        validPort = foundPort;
      }
      
      // If port is open, try to determine if it's a camera
      let deviceType = 'unknown';
      let manufacturer = 'Unknown';
      let model = 'Unknown';
      let streamUrl = '';
      let protocol = 'http';
      
      // Determine protocol and generate stream URL
      if (validPort === 554 || validPort === 8554) {
        protocol = 'rtsp';
        // RTSP stream URLs for different camera types
        const rtspPaths = [
          '/stream1',
          '/stream2', 
          '/live/stream1',
          '/cam/realmonitor?channel=1&subtype=0',
          '/h264/ch1/main/av_stream',
          '/h264/ch1/sub/av_stream'
        ];
        streamUrl = `rtsp://${username ? username + ':' + password + '@' : ''}${ip_address}:${validPort}${rtspPaths[0]}`;
      } else if (validPort === 1935) {
        protocol = 'rtmp';
        streamUrl = `rtmp://${ip_address}:${validPort}/live/stream1`;
      } else {
        protocol = 'http';
        // Try common HTTP stream paths
        const httpPaths = [
          '/video',
          '/stream',
          '/live',
          '/cam/realmonitor?channel=1&subtype=0',
          '/axis-cgi/mjpg/video.cgi',
          '/cgi-bin/mjpg/video.cgi',
          '/mjpg/video.mjpg',
          '/video.mjpg',
          '/streaming/channels/101',
          '/onvif/device_service',
          '/videostream.cgi',
          '/snapshot.cgi',
          '/video.cgi',
          '/mjpeg.cgi',
          '/live.cgi'
        ];
        
        // For now, use the first common path
        streamUrl = `http://${username ? username + ':' + password + '@' : ''}${ip_address}:${validPort}${httpPaths[0]}`;
      }
      
      // Try to detect camera manufacturer based on common patterns
      try {
        const http = require('http');
        const https = require('https');
        const client = validPort === 443 ? https : http;
        
        const options = {
          hostname: ip_address,
          port: validPort,
          path: '/',
          method: 'GET',
          timeout: 3000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; CameraDetector/1.0)'
          }
        };
        
        if (username && password) {
          const auth = Buffer.from(`${username}:${password}`).toString('base64');
          options.headers['Authorization'] = `Basic ${auth}`;
        }
        
        const response = await new Promise((resolve, reject) => {
          const req = client.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, data }));
          });
          req.on('error', reject);
          req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
          });
          req.end();
        });
        
        // Analyze response to detect camera type
        const serverHeader = response.headers.server || '';
        const data = response.data || '';
        
        if (serverHeader.includes('Hikvision') || data.includes('Hikvision')) {
          manufacturer = 'Hikvision';
          model = 'DS Series';
          deviceType = 'ip_camera';
        } else if (serverHeader.includes('Dahua') || data.includes('Dahua')) {
          manufacturer = 'Dahua';
          model = 'IPC Series';
          deviceType = 'ip_camera';
        } else if (serverHeader.includes('Axis') || data.includes('Axis')) {
          manufacturer = 'Axis';
          model = 'M Series';
          deviceType = 'ip_camera';
             } else if (data.includes('CIVS') || data.includes('IPC')) {
               manufacturer = 'CIVS';
               model = 'IPC Series';
               deviceType = 'ip_camera';
               // CIVS cameras use RTSP protocol
               protocol = 'rtsp';
               streamUrl = `rtsp://${username ? username + ':' + password + '@' : ''}${ip_address}:554/livestream2`;
             } else if (response.statusCode === 200) {
          deviceType = 'ip_camera';
          manufacturer = 'Generic IP Camera';
        }
        
      } catch (error) {
        console.log(`🔍 Could not detect camera details: ${error.message}`);
        // Still consider it a camera if port is open
        deviceType = 'ip_camera';
      }
      
      // Return successful test result
      res.json({
        success: true,
        data: {
          ip: ip_address,
          port: validPort,
          status: 'online',
          responseTime: connectivityResult.responseTime,
          deviceType,
          manufacturer,
          model,
          protocol,
          streamUrl,
          authRequired: !!(username && password),
          capabilities: [
            'video_stream',
            'motion_detection',
            'night_vision',
            'ptz_control'
          ]
        },
        message: `Camera detected: ${manufacturer} ${model} on ${protocol}://${ip_address}:${validPort}`
      });

    } catch (error) {
      console.error('Error testing camera:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to test camera connection'
      });
    }
  });

  // Stream camera feed
  router.get('/stream/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      // Get camera details
      const camera = await db('cameras').where('id', id).first();
      if (!camera) {
        return res.status(404).json({
          success: false,
          message: 'Camera not found'
        });
      }
      
      // Set headers for streaming
      res.setHeader('Content-Type', 'multipart/x-mixed-replace; boundary=--myboundary');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      
      // For now, return a placeholder stream
      // In production, you would connect to the actual camera stream
      const placeholderStream = `
--myboundary
Content-Type: image/jpeg
Content-Length: 0

--myboundary
Content-Type: image/jpeg
Content-Length: 0

--myboundary--
      `;
      
      res.write(placeholderStream);
      
      // Keep connection alive
      const keepAlive = setInterval(() => {
        res.write('--myboundary\nContent-Type: image/jpeg\nContent-Length: 0\n\n');
      }, 1000);
      
      req.on('close', () => {
        clearInterval(keepAlive);
      });
      
    } catch (error) {
      console.error('Error streaming camera:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to stream camera'
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
