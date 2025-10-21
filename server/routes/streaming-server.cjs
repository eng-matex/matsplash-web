const express = require('express');
const { spawn } = require('child_process');
const path = require('path');

const router = express.Router();

// Store active streams
const activeStreams = new Map();

// Function to start RTSP to MJPEG conversion
function startRTSPStream(cameraId, rtspUrl, res) {
  console.log(`🎥 Starting RTSP stream for camera ${cameraId}: ${rtspUrl}`);
  
  // Set headers for MJPEG stream
  res.setHeader('Content-Type', 'multipart/x-mixed-replace; boundary=--myboundary');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
         // Check if ffmpeg is available
         const { spawn } = require('child_process');
         const { exec } = require('child_process');
         
         // Test if ffmpeg is available
         exec('ffmpeg -version', (error, stdout, stderr) => {
           if (error) {
             console.log('❌ FFmpeg not found. Please install FFmpeg and add it to your PATH.');
             console.log('📋 Installation instructions:');
             console.log('   1. Download from: https://github.com/BtbN/FFmpeg-Builds/releases');
             console.log('   2. Extract to C:\\ffmpeg\\');
             console.log('   3. Add C:\\ffmpeg\\bin to your PATH');
             console.log('   4. Restart your command prompt');
             
             if (!res.destroyed) {
               res.status(500).json({
                 success: false,
                 message: 'FFmpeg not installed. Please install FFmpeg to enable RTSP streaming.'
               });
             }
             return;
           }
         });
         
         // Use ffmpeg to convert RTSP to MJPEG
         const ffmpeg = spawn('ffmpeg', [
           '-i', rtspUrl,
           '-f', 'mjpeg',
           '-q:v', '5', // Quality (1-31, lower is better)
           '-r', '15',  // Frame rate
           '-s', '1280x720', // Resolution
           '-'
         ], {
           stdio: ['ignore', 'pipe', 'pipe']
         });
  
  let isStreaming = true;
  
  // Handle ffmpeg output
  ffmpeg.stdout.on('data', (chunk) => {
    if (isStreaming && !res.destroyed) {
      try {
        res.write(`--myboundary\r\nContent-Type: image/jpeg\r\nContent-Length: ${chunk.length}\r\n\r\n`);
        res.write(chunk);
        res.write('\r\n');
      } catch (error) {
        console.log(`Stream error for camera ${cameraId}:`, error.message);
        isStreaming = false;
      }
    }
  });
  
         // Handle ffmpeg errors
         ffmpeg.stderr.on('data', (data) => {
           console.log(`FFmpeg error for camera ${cameraId}:`, data.toString());
         });
         
         // Handle ffmpeg spawn errors
         ffmpeg.on('error', (error) => {
           console.log(`❌ FFmpeg spawn error for camera ${cameraId}:`, error.message);
           if (error.code === 'ENOENT') {
             console.log('📋 FFmpeg not found in PATH. Please install FFmpeg:');
             console.log('   1. Download from: https://github.com/BtbN/FFmpeg-Builds/releases');
             console.log('   2. Extract to C:\\ffmpeg\\');
             console.log('   3. Add C:\\ffmpeg\\bin to your PATH');
             console.log('   4. Restart your command prompt');
           }
           isStreaming = false;
           if (!res.destroyed) {
             res.status(500).json({
               success: false,
               message: 'FFmpeg not available. Please install FFmpeg to enable RTSP streaming.'
             });
           }
         });
         
         // Handle process exit
         ffmpeg.on('exit', (code) => {
           console.log(`FFmpeg process exited for camera ${cameraId} with code ${code}`);
           isStreaming = false;
           if (!res.destroyed) {
             res.end();
           }
         });
  
  // Handle client disconnect
  res.on('close', () => {
    console.log(`Client disconnected from camera ${cameraId}`);
    isStreaming = false;
    ffmpeg.kill('SIGTERM');
    activeStreams.delete(cameraId);
  });
  
  // Store the stream
  activeStreams.set(cameraId, { ffmpeg, res });
  
  return ffmpeg;
}

// Function to start HTTP/MJPEG stream
function startHTTPStream(cameraId, httpUrl, res) {
  console.log(`🌐 Starting HTTP stream for camera ${cameraId}: ${httpUrl}`);
  
  // For HTTP streams, we can directly proxy or use the URL
  res.setHeader('Content-Type', 'multipart/x-mixed-replace; boundary=--myboundary');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  // For HTTP streams, we can use a simple proxy
  const http = require('http');
  const https = require('https');
  const url = require('url');
  
  const parsedUrl = new URL(httpUrl);
  const client = parsedUrl.protocol === 'https:' ? https : http;
  
  const options = {
    hostname: parsedUrl.hostname,
    port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
    path: parsedUrl.pathname + parsedUrl.search,
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; CameraStream/1.0)'
    }
  };
  
  const proxyReq = client.request(options, (proxyRes) => {
    proxyRes.on('data', (chunk) => {
      if (!res.destroyed) {
        res.write(chunk);
      }
    });
    
    proxyRes.on('end', () => {
      if (!res.destroyed) {
        res.end();
      }
    });
  });
  
  proxyReq.on('error', (error) => {
    console.log(`HTTP stream error for camera ${cameraId}:`, error.message);
    if (!res.destroyed) {
      res.status(500).end('Stream error');
    }
  });
  
  proxyReq.end();
  
  // Handle client disconnect
  res.on('close', () => {
    console.log(`Client disconnected from HTTP camera ${cameraId}`);
    proxyReq.destroy();
    activeStreams.delete(cameraId);
  });
  
  activeStreams.set(cameraId, { proxyReq, res });
}

// Stream endpoint
router.get('/stream/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get camera details from database
    const knex = require('knex');
    const db = knex({
      client: 'sqlite3',
      connection: {
        filename: './database.sqlite'
      },
      useNullAsDefault: true
    });
    
    const camera = await db('cameras').where('id', id).first();
    
    // Close the database connection
    await db.destroy();
    
    if (!camera) {
      return res.status(404).json({
        success: false,
        message: 'Camera not found'
      });
    }
    
    console.log(`📹 Streaming camera ${id}: ${camera.name} (${camera.ip_address}:${camera.port})`);
    
    // Check if stream is already active
    if (activeStreams.has(id)) {
      console.log(`Stream already active for camera ${id}`);
      return res.status(409).json({
        success: false,
        message: 'Stream already active'
      });
    }
    
           // Determine stream type and start appropriate stream
           if (camera.port === 554 || camera.port === 8554 || camera.stream_url?.startsWith('rtsp://')) {
             // RTSP stream - use the stream_url if it's RTSP, otherwise construct it
             let rtspUrl = camera.stream_url;
             if (!rtspUrl || !rtspUrl.startsWith('rtsp://')) {
               // Construct RTSP URL for CIVS cameras
               rtspUrl = `rtsp://${camera.username ? camera.username + ':' + camera.password + '@' : ''}${camera.ip_address}:554/livestream2`;
             }
             
             // Check if FFmpeg is available before starting RTSP stream
             const { exec } = require('child_process');
             exec('ffmpeg -version', (error, stdout, stderr) => {
               if (error) {
                 console.log('❌ FFmpeg not available, falling back to HTTP stream');
                 console.log('📋 To enable RTSP streaming, please:');
                 console.log('   1. Run: install-ffmpeg-complete.bat');
                 console.log('   2. Restart your command prompt');
                 console.log('   3. Restart the server');
                 // Fallback to HTTP stream
                 let httpUrl = `http://${camera.ip_address}:80/video.mjpg`;
                 startHTTPStream(id, httpUrl, res);
               } else {
                 console.log('✅ FFmpeg available, starting RTSP stream');
                 startRTSPStream(id, rtspUrl, res);
               }
             });
           } else {
      // HTTP stream - try multiple common paths for port 80 cameras
      let httpUrl = camera.stream_url;
      
      if (!httpUrl) {
        // Try multiple common stream paths for port 80 cameras
        const commonPaths = [
          '/video.mjpg',
          '/video.mjpeg', 
          '/mjpg/video.mjpg',
          '/cgi-bin/mjpg/video.cgi',
          '/axis-cgi/mjpg/video.cgi',
          '/videostream.cgi',
          '/snapshot.cgi',
          '/stream',
          '/live',
          '/video'
        ];
        
        // Use the first path as default, but the frontend will try multiple paths
        httpUrl = `http://${camera.ip_address}:${camera.port}${commonPaths[0]}`;
      }
      
      startHTTPStream(id, httpUrl, res);
    }
    
  } catch (error) {
    console.error('Streaming error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start stream'
    });
  }
});

// Stop stream endpoint
router.post('/stream/:id/stop', (req, res) => {
  const { id } = req.params;
  
  if (activeStreams.has(id)) {
    const stream = activeStreams.get(id);
    
    if (stream.ffmpeg) {
      stream.ffmpeg.kill('SIGTERM');
    }
    if (stream.proxyReq) {
      stream.proxyReq.destroy();
    }
    if (stream.res && !stream.res.destroyed) {
      stream.res.end();
    }
    
    activeStreams.delete(id);
    console.log(`🛑 Stopped stream for camera ${id}`);
    
    res.json({
      success: true,
      message: 'Stream stopped'
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'Stream not found'
    });
  }
});

// Get active streams
router.get('/streams/active', (req, res) => {
  const streams = Array.from(activeStreams.keys()).map(id => ({
    cameraId: id,
    active: true
  }));
  
  res.json({
    success: true,
    data: streams
  });
});

module.exports = router;
