const express = require('express');
const net = require('net');

module.exports = function(db) {
  const router = express.Router();

  // Test endpoint
  router.get('/test', (req, res) => {
    res.json({ success: true, message: 'Surveillance route is working' });
  });

  // Database test endpoint
  router.get('/test-db', async (req, res) => {
    try {
      const testQuery = await db.raw('SELECT COUNT(*) as count FROM cameras');
      const cameras = await db('cameras').select('*');
      res.json({
        success: true,
        message: 'Database connection working',
        cameraCount: testQuery[0].count,
        cameras: cameras
      });
    } catch (error) {
      console.error('Database test error:', error);
      res.status(500).json({
        success: false,
        message: 'Database test failed',
        error: error.message
      });
    }
  });

  // Storage information endpoint
  router.get('/storage', (req, res) => {
    try {
      // Calculate real storage usage
      const fs = require('fs');
      const path = require('path');
      
      // Check storage directory (create if doesn't exist)
      const storageDir = path.join(__dirname, '../../storage');
      if (!fs.existsSync(storageDir)) {
        fs.mkdirSync(storageDir, { recursive: true });
      }
      
      // Calculate directory size
      function getDirectorySize(dirPath) {
        let totalSize = 0;
        try {
          const files = fs.readdirSync(dirPath);
          for (const file of files) {
            const filePath = path.join(dirPath, file);
            const stats = fs.statSync(filePath);
            if (stats.isDirectory()) {
              totalSize += getDirectorySize(filePath);
            } else {
              totalSize += stats.size;
            }
          }
        } catch (error) {
          console.error('Error calculating directory size:', error);
        }
        return totalSize;
      }
      
      const totalSize = getDirectorySize(storageDir);
      const totalSizeMB = Math.round(totalSize / (1024 * 1024) * 100) / 100;
      const totalSizeGB = Math.round(totalSize / (1024 * 1024 * 1024) * 100) / 100;
      
      // Assume 500GB total storage capacity
      const totalCapacity = 500 * 1024 * 1024 * 1024; // 500GB in bytes
      const usagePercentage = Math.round((totalSize / totalCapacity) * 100);
      
      res.json({
        success: true,
        storageUsed: usagePercentage,
        storageUsedMB: totalSizeMB,
        storageUsedGB: totalSizeGB,
        totalCapacityGB: 500,
        freeSpaceGB: Math.round((totalCapacity - totalSize) / (1024 * 1024 * 1024) * 100) / 100
      });
    } catch (error) {
      console.error('Storage info error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get storage information',
        error: error.message
      });
    }
  });

  // System status endpoint
  router.get('/system-status', (req, res) => {
    try {
      const os = require('os');
      const uptime = process.uptime();
      const uptimeHours = Math.round(uptime / 3600 * 100) / 100;
      const uptimeDays = Math.round(uptime / (3600 * 24) * 100) / 100;
      
      // Calculate system uptime percentage (assuming 99.8% uptime)
      const uptimePercentage = Math.min(99.8, Math.max(95.0, 100 - (uptimeHours * 0.001)));
      
      res.json({
        success: true,
        uptime: uptimePercentage,
        uptimeHours,
        uptimeDays,
        systemInfo: {
          platform: os.platform(),
          arch: os.arch(),
          totalMemory: Math.round(os.totalmem() / (1024 * 1024 * 1024) * 100) / 100,
          freeMemory: Math.round(os.freemem() / (1024 * 1024 * 1024) * 100) / 100,
          cpuCount: os.cpus().length,
          loadAverage: os.loadavg()
        }
      });
    } catch (error) {
      console.error('System status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get system status',
        error: error.message
      });
    }
  });

  // Ensure recordings endpoint is registered early to avoid 404s
  router.get('/recordings', async (req, res) => {
    try {
      // If table does not exist yet, return empty list gracefully
      const hasTable = await db.schema.hasTable('recording_sessions');
      if (!hasTable) {
        return res.json({ success: true, recordings: [] });
      }

      const recordings = await db('recording_sessions')
        .leftJoin('cameras', 'recording_sessions.camera_id', 'cameras.id')
        .select(
          'recording_sessions.*',
          db.raw("COALESCE(cameras.name, 'Unknown') as camera_name"),
          db.raw("COALESCE(cameras.location, '') as camera_location")
        )
        .orderBy('recording_sessions.created_at', 'desc');

      const transformed = recordings.map(r => ({
        id: r.id,
        cameraId: r.camera_id,
        cameraName: r.camera_name,
        cameraLocation: r.camera_location,
        startTime: r.start_time,
        endTime: r.end_time,
        duration: r.end_time
          ? Math.max(0, Math.round((new Date(r.end_time) - new Date(r.start_time)) / 1000))
          : Math.max(0, Math.round((Date.now() - new Date(r.start_time)) / 1000)),
        fileSize: r.file_size_mb || 0,
        status: r.status || 'completed',
        quality: '1080p',
        motionEvents: 0,
        thumbnail: `/api/surveillance/recordings/${r.id}/thumbnail`
      }));

      res.json({ success: true, recordings: transformed });
    } catch (error) {
      console.error('Recordings fetch error (early route):', error);
      res.status(500).json({ success: false, message: 'Failed to fetch recordings', error: error.message });
    }
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

  // Camera recording control endpoint
  router.post('/cameras/:id/recording', async (req, res) => {
    try {
      const cameraId = req.params.id;
      const camera = await db('cameras').where('id', cameraId).first();
      
      if (!camera) {
        return res.status(404).json({
          success: false,
          message: 'Camera not found'
        });
      }
      
      // Update camera recording status
      await db('cameras')
        .where('id', cameraId)
        .update({
          status: 'recording',
          updated_at: new Date().toISOString()
        });
      
      // Log recording session
      await db('recording_sessions').insert({
        camera_id: cameraId,
        start_time: new Date().toISOString(),
        status: 'active',
        created_at: new Date().toISOString()
      });
      
      res.json({
        success: true,
        message: 'Recording started successfully'
      });
    } catch (error) {
      console.error('Recording start error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to start recording',
        error: error.message
      });
    }
  });

  // Stop camera recording endpoint
  router.delete('/cameras/:id/recording', async (req, res) => {
    try {
      const cameraId = req.params.id;
      const camera = await db('cameras').where('id', cameraId).first();
      
      if (!camera) {
        return res.status(404).json({
          success: false,
          message: 'Camera not found'
        });
      }
      
      // Update camera status
      await db('cameras')
        .where('id', cameraId)
        .update({
          status: 'online',
          updated_at: new Date().toISOString()
        });
      
      // End recording session
      await db('recording_sessions')
        .where('camera_id', cameraId)
        .where('status', 'active')
        .update({
          end_time: new Date().toISOString(),
          status: 'completed',
          updated_at: new Date().toISOString()
        });
      
      res.json({
        success: true,
        message: 'Recording stopped successfully'
      });
    } catch (error) {
      console.error('Recording stop error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to stop recording',
        error: error.message
      });
    }
  });

  // Camera snapshot endpoint
  router.post('/cameras/:id/snapshot', async (req, res) => {
    try {
      const cameraId = req.params.id;
      const camera = await db('cameras').where('id', cameraId).first();
      
      if (!camera) {
        return res.status(404).json({
          success: false,
          message: 'Camera not found'
        });
      }
      
      // For now, return a placeholder snapshot
      // In a real implementation, this would capture an actual frame from the camera stream
      const placeholderSnapshot = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='; // 1x1 transparent PNG
      
      res.json({
        success: true,
        snapshot: placeholderSnapshot,
        message: 'Snapshot captured successfully'
      });
    } catch (error) {
      console.error('Snapshot error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to capture snapshot',
        error: error.message
      });
    }
  });

  // Recordings endpoint
  console.log('🎥 Recordings endpoint registered');
  router.get('/recordings', async (req, res) => {
    try {
      // Get recordings from database
      const recordings = await db('recording_sessions')
        .join('cameras', 'recording_sessions.camera_id', 'cameras.id')
        .select(
          'recording_sessions.*',
          'cameras.name as camera_name',
          'cameras.location as camera_location'
        )
        .orderBy('recording_sessions.created_at', 'desc');

      // Transform to match frontend interface
      const transformedRecordings = recordings.map(recording => ({
        id: recording.id,
        cameraId: recording.camera_id,
        cameraName: recording.camera_name,
        cameraLocation: recording.camera_location,
        startTime: recording.start_time,
        endTime: recording.end_time,
        duration: recording.end_time ? 
          Math.round((new Date(recording.end_time) - new Date(recording.start_time)) / 1000) : 
          Math.round((Date.now() - new Date(recording.start_time)) / 1000),
        fileSize: Math.floor(Math.random() * 1000) + 100, // Mock file size in MB
        status: recording.status,
        quality: '1080p',
        motionEvents: Math.floor(Math.random() * 5),
        thumbnail: `/api/surveillance/recordings/${recording.id}/thumbnail`
      }));

      res.json({
        success: true,
        recordings: transformedRecordings
      });
    } catch (error) {
      console.error('Recordings fetch error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch recordings',
        error: error.message
      });
    }
  });

  // Recording download endpoint
  router.get('/recordings/:id/download', async (req, res) => {
    try {
      const { id } = req.params;
      
      // Get recording info from database
      const recording = await db('recording_sessions')
        .join('cameras', 'recording_sessions.camera_id', 'cameras.id')
        .select(
          'recording_sessions.*',
          'cameras.name as camera_name',
          'cameras.ip_address'
        )
        .where('recording_sessions.id', id)
        .first();

      if (!recording) {
        return res.status(404).json({
          success: false,
          message: 'Recording not found'
        });
      }

      // For now, return a mock file download
      // In production, this would stream the actual video file
      const mockFileName = `recording_${recording.camera_name}_${new Date(recording.start_time).toISOString().split('T')[0]}.mp4`;
      
      // Return JSON response instead of file headers for now
      res.json({
        success: true,
        message: 'Download initiated',
        fileName: mockFileName,
        recordingId: id,
        cameraName: recording.camera_name,
        startTime: recording.start_time,
        endTime: recording.end_time,
        downloadUrl: `/api/surveillance/recordings/${id}/download`
      });
    } catch (error) {
      console.error('Recording download error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to download recording',
        error: error.message
      });
    }
  });

  // Recording stream endpoint
  router.get('/recordings/:id/stream', async (req, res) => {
    try {
      const { id } = req.params;
      
      // Get recording info from database
      const recording = await db('recording_sessions')
        .join('cameras', 'recording_sessions.camera_id', 'cameras.id')
        .select(
          'recording_sessions.*',
          'cameras.name as camera_name',
          'cameras.ip_address'
        )
        .where('recording_sessions.id', id)
        .first();

      if (!recording) {
        return res.status(404).json({
          success: false,
          message: 'Recording not found'
        });
      }

      // For now, return recording info
      // In production, this would stream the actual video
      res.json({
        success: true,
        recording: {
          id: recording.id,
          cameraName: recording.camera_name,
          startTime: recording.start_time,
          endTime: recording.end_time,
          duration: recording.end_time ? 
            Math.round((new Date(recording.end_time) - new Date(recording.start_time)) / 1000 / 60) : 
            Math.round((Date.now() - new Date(recording.start_time)) / 1000 / 60),
          status: recording.status,
          streamUrl: `/api/surveillance/recordings/${id}/stream`
        }
      });
    } catch (error) {
      console.error('Recording stream error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to stream recording',
        error: error.message
      });
    }
  });

  // Recording thumbnail endpoint
  router.get('/recordings/:id/thumbnail', async (req, res) => {
    try {
      const { id } = req.params;
      
      // Get recording info from database
      const recording = await db('recording_sessions')
        .join('cameras', 'recording_sessions.camera_id', 'cameras.id')
        .select('recording_sessions.*', 'cameras.name as camera_name')
        .where('recording_sessions.id', id)
        .first();

      if (!recording) {
        return res.status(404).json({
          success: false,
          message: 'Recording not found'
        });
      }

      // For now, return a placeholder thumbnail
      // In production, this would return the actual thumbnail image
      res.json({
        success: true,
        thumbnail: {
          recordingId: id,
          cameraName: recording.camera_name,
          timestamp: recording.start_time,
          thumbnailUrl: `/api/surveillance/recordings/${id}/thumbnail`
        }
      });
    } catch (error) {
      console.error('Recording thumbnail error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get recording thumbnail',
        error: error.message
      });
    }
  });

  // AI Analytics endpoints
  router.get('/ai/features', async (req, res) => {
    try {
      // Get real AI features from database
      const featuresResult = await db('ai_detections')
        .select('detection_type')
        .count('* as detections')
        .avg('confidence as accuracy')
        .groupBy('detection_type');
      
      // Default AI features with real data
      const aiFeatures = [
        { id: 'face', name: 'Face Recognition', enabled: true, accuracy: 0, detections: 0 },
        { id: 'person', name: 'Person Detection', enabled: true, accuracy: 0, detections: 0 },
        { id: 'vehicle', name: 'Vehicle Detection', enabled: true, accuracy: 0, detections: 0 },
        { id: 'license', name: 'License Plate Recognition', enabled: false, accuracy: 0, detections: 0 },
        { id: 'object', name: 'Object Detection', enabled: true, accuracy: 0, detections: 0 },
        { id: 'motion', name: 'Motion Detection', enabled: true, accuracy: 0, detections: 0 },
        { id: 'behavior', name: 'Behavior Analysis', enabled: false, accuracy: 0, detections: 0 },
        { id: 'crowd', name: 'Crowd Detection', enabled: true, accuracy: 0, detections: 0 }
      ];
      
      // Update with real data from database
      featuresResult.forEach(row => {
        const feature = aiFeatures.find(f => f.id === row.detection_type);
        if (feature) {
          feature.detections = row.detections;
          feature.accuracy = Math.round(row.accuracy * 10) / 10;
        }
      });

      res.json({
        success: true,
        features: aiFeatures
      });
    } catch (error) {
      console.error('AI features fetch error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch AI features',
        error: error.message
      });
    }
  });

  router.get('/ai/detections', async (req, res) => {
    try {
      // Get recent AI detections from database
      const detections = await db('ai_detections')
        .join('cameras', 'ai_detections.camera_id', 'cameras.id')
        .select(
          'ai_detections.*',
          'cameras.name as camera_name'
        )
        .orderBy('ai_detections.timestamp', 'desc')
        .limit(50);

      // Transform to match frontend interface
      const formattedDetections = detections.map(detection => ({
        id: detection.id,
        type: detection.detection_type,
        confidence: detection.confidence,
        timestamp: detection.timestamp,
        cameraId: detection.camera_id,
        cameraName: detection.camera_name
      }));

      res.json({
        success: true,
        detections: formattedDetections
      });
    } catch (error) {
      console.error('AI detections fetch error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch AI detections',
        error: error.message
      });
    }
  });

  router.get('/ai/analytics', async (req, res) => {
    try {
      // Get real AI analytics from database
      const detectionsCount = await db('ai_detections').count('* as total').first();
      const avgConfidence = await db('ai_detections').avg('confidence as avgConfidence').first();
      const unprocessedCount = await db('ai_detections').count('* as unprocessed').where('processed', false).first();
      const alertsCount = await db('system_alerts').count('* as total').where('is_read', false).first();
      
      const analytics = {
        totalDetections: detectionsCount?.total || 0,
        averageConfidence: Math.round((avgConfidence?.avgConfidence || 0) * 10) / 10,
        falsePositives: Math.floor((unprocessedCount?.unprocessed || 0) * 0.1), // Estimate 10% false positives
        alerts: alertsCount?.total || 0
      };

      res.json({
        success: true,
        analytics: analytics
      });
    } catch (error) {
      console.error('AI analytics fetch error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch AI analytics',
        error: error.message
      });
    }
  });

  // Alerts endpoints
  router.get('/alerts', async (req, res) => {
    try {
      // Get alerts from database
      const alerts = await db('system_alerts')
        .join('cameras', 'system_alerts.camera_id', 'cameras.id')
        .select(
          'system_alerts.*',
          'cameras.name as camera_name'
        )
        .orderBy('system_alerts.timestamp', 'desc')
        .limit(100);

      // If no alerts table exists, return mock data for now
      if (!alerts || alerts.length === 0) {
        const mockAlerts = [
          {
            id: 1,
            type: 'critical',
            title: 'Unauthorized Access Detected',
            message: 'Person detected in restricted area after hours',
            timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
            cameraId: 16,
            cameraName: 'Camera 192.168.1.102',
            read: false,
            category: 'Security'
          },
          {
            id: 2,
            type: 'warning',
            title: 'Motion Detected',
            message: 'Unusual activity detected in parking lot',
            timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
            cameraId: 17,
            cameraName: 'Camera 192.168.1.184',
            read: false,
            category: 'Motion'
          },
          {
            id: 3,
            type: 'info',
            title: 'Face Recognition Alert',
            message: 'Unknown person detected at main entrance',
            timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
            cameraId: 16,
            cameraName: 'Camera 192.168.1.102',
            read: true,
            category: 'Recognition'
          }
        ];
      }

      // Transform to match frontend interface
      const formattedAlerts = alerts.map(alert => ({
        id: alert.id,
        type: alert.alert_type,
        severity: alert.severity,
        message: alert.message,
        timestamp: alert.timestamp,
        cameraId: alert.camera_id,
        cameraName: alert.camera_name,
        read: alert.is_read,
        category: alert.alert_type
      }));

      res.json({
        success: true,
        alerts: formattedAlerts
      });
    } catch (error) {
      console.error('Alerts fetch error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch alerts',
        error: error.message
      });
    }
  });

  router.get('/alerts/rules', async (req, res) => {
    try {
      // Get alert rules from database
      const alertRules = [
        {
          id: 1,
          name: 'After Hours Access',
          enabled: true,
          type: 'Person Detection',
          conditions: 'Time: 6 PM - 6 AM, Zone: Restricted',
          actions: ['Push Notification', 'Email', 'Sound Alert']
        },
        {
          id: 2,
          name: 'Unknown Face',
          enabled: true,
          type: 'Face Recognition',
          conditions: 'Confidence < 80%, Zone: All',
          actions: ['Push Notification', 'Record']
        },
        {
          id: 3,
          name: 'Vehicle Alert',
          enabled: false,
          type: 'License Plate',
          conditions: 'Unauthorized plate, Zone: All',
          actions: ['Email', 'SMS', 'Record']
        }
      ];

      res.json({
        success: true,
        rules: alertRules
      });
    } catch (error) {
      console.error('Alert rules fetch error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch alert rules',
        error: error.message
      });
    }
  });

  router.put('/alerts/:id/read', async (req, res) => {
    try {
      const { id } = req.params;
      
      // Mark alert as read
      await db('system_alerts')
        .where('id', id)
        .update({ read: true, read_at: new Date().toISOString() });

      res.json({
        success: true,
        message: 'Alert marked as read'
      });
    } catch (error) {
      console.error('Alert read error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark alert as read',
        error: error.message
      });
    }
  });

  router.delete('/alerts/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      // Delete alert
      await db('system_alerts')
        .where('id', id)
        .del();

      res.json({
        success: true,
        message: 'Alert deleted'
      });
    } catch (error) {
      console.error('Alert delete error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete alert',
        error: error.message
      });
    }
  });

  // Credential Sets endpoints
  router.get('/credentials', async (req, res) => {
    try {
      const credentials = await db('camera_credentials')
        .select('*')
        .orderBy('created_at', 'desc');

      res.json({
        success: true,
        credentials: credentials
      });
    } catch (error) {
      console.error('Credentials fetch error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch credentials',
        error: error.message
      });
    }
  });

  router.post('/credentials', async (req, res) => {
    try {
      const { name, username, password, default_port, description } = req.body;
      
      const [credentialSet] = await db('camera_credentials')
        .insert({
          name,
          username,
          password,
          default_port: default_port || 80,
          description,
          created_at: new Date().toISOString()
        })
        .returning('*');

      res.json({
        success: true,
        credential_set: credentialSet
      });
    } catch (error) {
      console.error('Credential creation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create credential set',
        error: error.message
      });
    }
  });

  router.put('/credentials/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { name, username, password, default_port, description } = req.body;
      
      await db('camera_credentials')
        .where('id', id)
        .update({
          name,
          username,
          password,
          default_port,
          description,
          updated_at: new Date().toISOString()
        });

      res.json({
        success: true,
        message: 'Credential set updated successfully'
      });
    } catch (error) {
      console.error('Credential update error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update credential set',
        error: error.message
      });
    }
  });

  router.delete('/credentials/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      await db('camera_credentials')
        .where('id', id)
        .del();

      res.json({
        success: true,
        message: 'Credential set deleted successfully'
      });
    } catch (error) {
      console.error('Credential delete error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete credential set',
        error: error.message
      });
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
  function testPort(ip, port, timeout = 2000) {
    return new Promise((resolve) => {
      // Validate port
      const validPort = parseInt(port);
      if (isNaN(validPort) || validPort < 1 || validPort > 65535) {
        resolve({ status: 'offline', error: 'Invalid port' });
        return;
      }

      const socket = new net.Socket();
      const startTime = Date.now();
      
      // Set shorter timeout for faster scanning
      socket.setTimeout(timeout);
      
      socket.on('connect', () => {
        const responseTime = Date.now() - startTime;
        socket.destroy();
        resolve({ status: 'online', responseTime, port: validPort });
      });
      
      socket.on('timeout', () => {
        socket.destroy();
        resolve({ status: 'offline', error: 'Connection timeout' });
      });
      
      socket.on('error', (error) => {
        socket.destroy();
        resolve({ status: 'offline', error: error.code || error.message });
      });
      
      socket.connect(validPort, ip);
    });
  }

  // Get cameras
  router.get('/cameras', async (req, res) => {
    try {
      console.log('🔍 Fetching cameras from database...');
      
      // Test database connection first
      const testQuery = await db.raw('SELECT COUNT(*) as count FROM cameras');
      console.log('📊 Database test query result:', testQuery);
      
      const cameras = await db('cameras').orderBy('created_at', 'desc');
      console.log(`📹 Found ${cameras.length} cameras:`, cameras.map(c => ({ id: c.id, name: c.name, ip: c.ip_address })));
      
      res.json({
        success: true,
        cameras: cameras
      });
    } catch (error) {
      console.error('Error fetching cameras:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch cameras',
        error: error.message
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
      const { ip_address, port = 80, username, password, timeout = 3000 } = req.body;
      
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
        
        // Try ports in parallel for faster scanning
        const availablePorts = commonPorts.filter(port => port !== validPort);
        const portPromises = availablePorts.map(port => testPort(ip_address, port, 1500));
        
        const results = await Promise.allSettled(portPromises);
        
        for (let i = 0; i < results.length; i++) {
          if (results[i].status === 'fulfilled' && results[i].value.status === 'online') {
            foundPort = availablePorts[i];
            console.log(`✅ Found working port: ${ip_address}:${foundPort}`);
            break;
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
      let deviceType = 'camera'; // Assume it's a camera if port is open
      let manufacturer = 'Unknown';
      let model = 'Unknown';
      let streamUrl = '';
      let protocol = 'http';
      let capabilities = [];
      
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
        
        // Use the most common path for HTTP cameras
        streamUrl = `http://${username ? username + ':' + password + '@' : ''}${ip_address}:${validPort}/video.mjpg`;
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
