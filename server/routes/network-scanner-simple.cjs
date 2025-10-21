const express = require('express');
const router = express.Router();

// Network scanning endpoint
router.post('/scan-network', async (req, res) => {
  try {
    const { startIP, endIP, subnet, networkRange } = req.body;
    
    console.log(`🔍 Network scan request received: ${JSON.stringify(req.body)}`);
    
    // Return test devices for now
    const devices = [
      {
        ip: '192.168.1.1',
        hostname: 'router',
        mac: '00:00:00:00:00:01',
        vendor: 'Unknown',
        deviceType: 'router',
        ports: [80, 443],
        services: ['http', 'https'],
        isOnline: true,
        responseTime: 10
      },
      {
        ip: '192.168.1.102',
        hostname: 'camera-102',
        mac: '00:00:00:00:00:02',
        vendor: 'Unknown',
        deviceType: 'camera',
        ports: [80, 554],
        services: ['http', 'rtsp'],
        isOnline: true,
        responseTime: 15
      },
      {
        ip: '192.168.1.184',
        hostname: 'camera-184',
        mac: '00:00:00:00:00:03',
        vendor: 'Unknown',
        deviceType: 'camera',
        ports: [80, 554],
        services: ['http', 'rtsp'],
        isOnline: true,
        responseTime: 12
      }
    ];
    
    console.log(`🔍 Returning ${devices.length} test devices`);
    
    res.json({
      success: true,
      devices: devices,
      scanInfo: {
        startIP: startIP || '192.168.1.1',
        endIP: endIP || '192.168.1.254',
        subnet: subnet || '255.255.255.0',
        networkRange: networkRange || '192.168.1.0/24',
        totalDevices: devices.length,
        cameras: devices.filter(d => d.deviceType === 'camera').length
      }
    });
  } catch (error) {
    console.error('Network scan error:', error);
    res.status(500).json({
      success: false,
      message: 'Network scan failed',
      error: error.message
    });
  }
});

module.exports = router;

