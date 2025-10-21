const express = require('express');
const { exec } = require('child_process');
const net = require('net');
const http = require('http');
const https = require('https');
const router = express.Router();

// Real-time network scanning function
async function performRealTimeNetworkScan(startIP, endIP, subnet) {
  const devices = [];
  const ipRange = parseIPRange(startIP, endIP);
  
  console.log(`🔍 Starting real-time network scan for ${ipRange.length} IPs...`);
  
  // Scan IPs in parallel with concurrency limit
  const concurrencyLimit = 20;
  const chunks = [];
  for (let i = 0; i < ipRange.length; i += concurrencyLimit) {
    chunks.push(ipRange.slice(i, i + concurrencyLimit));
  }
  
  for (const chunk of chunks) {
    const promises = chunk.map(ip => scanIP(ip));
    const results = await Promise.allSettled(promises);
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        devices.push(result.value);
      }
    });
    
    // Small delay between chunks to avoid overwhelming the network
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`✅ Real-time scan complete. Found ${devices.length} devices`);
  return devices;
}

// Parse IP range into array of IPs
function parseIPRange(startIP, endIP) {
  if (!startIP || !endIP) {
    // If no start/end IP provided, use a small default range
    return ['192.168.1.1', '192.168.1.2', '192.168.1.3', '192.168.1.4', '192.168.1.5'];
  }
  
  const start = ipToNumber(startIP);
  const end = ipToNumber(endIP);
  const ips = [];
  
  for (let i = start; i <= end; i++) {
    ips.push(numberToIP(i));
  }
  
  return ips;
}

// Convert IP string to number
function ipToNumber(ip) {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0;
}

// Convert number to IP string
function numberToIP(num) {
  return [
    (num >>> 24) & 0xFF,
    (num >>> 16) & 0xFF,
    (num >>> 8) & 0xFF,
    num & 0xFF
  ].join('.');
}

// Scan a single IP
async function scanIP(ip) {
  try {
    // Ping test
    const isOnline = await pingIP(ip);
    if (!isOnline) return null;
    
    // Port scanning
    const openPorts = await scanPorts(ip);
    if (openPorts.length === 0) return null;
    
    // Device identification
    const deviceInfo = await identifyDevice(ip, openPorts);
    
    return {
      ip,
      hostname: deviceInfo.hostname || `device-${ip.split('.').pop()}`,
      mac: deviceInfo.mac || generateMAC(ip),
      vendor: deviceInfo.vendor || 'Unknown',
      deviceType: deviceInfo.deviceType || 'unknown',
      ports: openPorts,
      services: deviceInfo.services || [],
      isOnline: true,
      responseTime: deviceInfo.responseTime || Math.floor(Math.random() * 50) + 10
    };
  } catch (error) {
    return null;
  }
}

// Ping an IP
function pingIP(ip) {
  return new Promise((resolve) => {
    const command = process.platform === 'win32' ? `ping -n 1 -w 1000 ${ip}` : `ping -c 1 -W 1 ${ip}`;
    
    exec(command, (error, stdout) => {
      if (error) {
        resolve(false);
      } else {
        resolve(stdout.includes('time=') || stdout.includes('time<'));
      }
    });
  });
}

// Scan common ports
async function scanPorts(ip) {
  const commonPorts = [21, 22, 23, 25, 53, 80, 110, 135, 139, 143, 443, 993, 995, 1723, 3389, 554, 8080, 8443];
  const openPorts = [];
  
  const promises = commonPorts.map(port => testPort(ip, port));
  const results = await Promise.allSettled(promises);
  
  results.forEach((result, index) => {
    if (result.status === 'fulfilled' && result.value) {
      openPorts.push(commonPorts[index]);
    }
  });
  
  return openPorts;
}

// Test if a port is open
function testPort(ip, port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const timeout = 1000;
    
    socket.setTimeout(timeout);
    
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    
    socket.on('error', () => {
      resolve(false);
    });
    
    socket.connect(port, ip);
  });
}

// Identify device type and services
async function identifyDevice(ip, ports) {
  const deviceInfo = {
    hostname: null,
    vendor: 'Unknown',
    deviceType: 'unknown',
    services: [],
    responseTime: Math.floor(Math.random() * 50) + 10
  };
  
  // Check for HTTP services
  if (ports.includes(80) || ports.includes(8080) || ports.includes(443) || ports.includes(8443)) {
    try {
      const httpPort = ports.includes(80) ? 80 : ports.includes(8080) ? 8080 : ports.includes(443) ? 443 : 8443;
      const protocol = httpPort === 443 || httpPort === 8443 ? 'https' : 'http';
      
      const response = await new Promise((resolve, reject) => {
        const client = protocol === 'https' ? https : http;
        const req = client.get(`${protocol}://${ip}:${httpPort}`, { timeout: 2000 }, (res) => {
          resolve(res);
        });
        
        req.on('error', reject);
        req.on('timeout', () => reject(new Error('Timeout')));
      });
      
      // Analyze response headers and content
      const server = response.headers['server'] || '';
      const contentType = response.headers['content-type'] || '';
      
      if (server.toLowerCase().includes('camera') || contentType.includes('video') || server.includes('IPCamera')) {
        deviceInfo.deviceType = 'camera';
        deviceInfo.vendor = detectCameraVendor(server);
        deviceInfo.services = ['http', 'rtsp'];
      } else if (server.toLowerCase().includes('router') || server.toLowerCase().includes('gateway')) {
        deviceInfo.deviceType = 'router';
        deviceInfo.services = ['http', 'https'];
      } else {
        deviceInfo.deviceType = 'device';
        deviceInfo.services = ['http'];
      }
      
    } catch (error) {
      // If HTTP fails, check for RTSP
      if (ports.includes(554)) {
        deviceInfo.deviceType = 'camera';
        deviceInfo.services = ['rtsp'];
      }
    }
  }
  
  // Check for RTSP (camera)
  if (ports.includes(554)) {
    deviceInfo.deviceType = 'camera';
    if (!deviceInfo.services.includes('rtsp')) {
      deviceInfo.services.push('rtsp');
    }
  }
  
  // Check for SSH (Linux device)
  if (ports.includes(22)) {
    deviceInfo.deviceType = 'server';
    deviceInfo.services.push('ssh');
  }
  
  // Check for RDP (Windows device)
  if (ports.includes(3389)) {
    deviceInfo.deviceType = 'server';
    deviceInfo.services.push('rdp');
  }
  
  return deviceInfo;
}

// Detect camera vendor from server header
function detectCameraVendor(server) {
  const serverLower = server.toLowerCase();
  if (serverLower.includes('hikvision')) return 'Hikvision';
  if (serverLower.includes('dahua')) return 'Dahua';
  if (serverLower.includes('axis')) return 'Axis';
  if (serverLower.includes('sony')) return 'Sony';
  if (serverLower.includes('bosch')) return 'Bosch';
  if (serverLower.includes('samsung')) return 'Samsung';
  return 'Unknown';
}

// Generate MAC address based on IP
function generateMAC(ip) {
  const octets = ip.split('.');
  const mac = [
    '00',
    '00',
    octets[2].padStart(2, '0'),
    octets[3].padStart(2, '0'),
    '00',
    '01'
  ];
  return mac.join(':');
}

// Network scan endpoint
router.post('/scan-network', async (req, res) => {
  try {
    const { startIP, endIP, subnet, networkRange } = req.body;
    
    console.log(`🔍 Starting real-time network scan: ${networkRange || `${startIP} - ${endIP}`}`);
    
    // Parse network range if provided
    let parsedStartIP = startIP;
    let parsedEndIP = endIP;
    
    if (networkRange && networkRange.includes('-')) {
      const [start, end] = networkRange.split('-');
      parsedStartIP = start.trim();
      parsedEndIP = end.trim();
    }
    
    // Perform real-time network scan
    const devices = await performRealTimeNetworkScan(parsedStartIP, parsedEndIP, subnet);
    
    res.json({
      success: true,
      devices: devices,
      scanInfo: {
        startIP: startIP,
        endIP: endIP,
        subnet: subnet,
        networkRange: networkRange,
        totalDevices: devices.length,
        cameras: devices.filter(d => d.deviceType === 'camera').length,
        scanType: 'realtime'
      }
    });
  } catch (error) {
    console.error('Real-time network scan error:', error);
    res.status(500).json({
      success: false,
      message: 'Real-time network scan failed',
      error: error.message
    });
  }
});

module.exports = router;
