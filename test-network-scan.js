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

async function testNetworkScan() {
  console.log('Testing network scan...');
  
  const testIps = ['192.168.1.1', '192.168.1.2', '192.168.1.100'];
  const ports = [80, 8080];
  
  for (const ip of testIps) {
    for (const port of ports) {
      try {
        console.log(`Testing ${ip}:${port}...`);
        const result = await testPort(ip, port, 2000);
        console.log(`Result: ${result.status} (${result.responseTime || 'N/A'}ms)`);
      } catch (error) {
        console.log(`Error: ${error.message}`);
      }
    }
  }
}

testNetworkScan().catch(console.error);
