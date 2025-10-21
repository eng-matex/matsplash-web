const fetch = require('node-fetch');

async function testAPIs() {
  console.log('🔍 Testing APIs...\n');

  // Test health endpoint
  try {
    const healthResponse = await fetch('http://localhost:3002/api/health');
    const healthData = await healthResponse.json();
    console.log('✅ Health endpoint:', healthData.status);
  } catch (error) {
    console.log('❌ Health endpoint error:', error.message);
  }

  // Test surveillance cameras endpoint
  try {
    const camerasResponse = await fetch('http://localhost:3002/api/surveillance/cameras');
    const camerasData = await camerasResponse.json();
    console.log('✅ Cameras endpoint:', camerasData.success ? 'Working' : 'Failed');
    console.log('   Cameras found:', camerasData.data?.length || 0);
  } catch (error) {
    console.log('❌ Cameras endpoint error:', error.message);
  }

  // Test surveillance storage endpoint
  try {
    const storageResponse = await fetch('http://localhost:3002/api/surveillance/storage');
    const storageData = await storageResponse.json();
    console.log('✅ Storage endpoint:', storageData.success ? 'Working' : 'Failed');
    console.log('   Storage used:', storageData.storageUsedGB + 'GB');
  } catch (error) {
    console.log('❌ Storage endpoint error:', error.message);
  }

  // Test surveillance system-status endpoint
  try {
    const systemResponse = await fetch('http://localhost:3002/api/surveillance/system-status');
    const systemData = await systemResponse.json();
    console.log('✅ System status endpoint:', systemData.success ? 'Working' : 'Failed');
    console.log('   Uptime:', systemData.uptimeHours + ' hours');
  } catch (error) {
    console.log('❌ System status endpoint error:', error.message);
  }

  // Test surveillance recordings endpoint
  try {
    const recordingsResponse = await fetch('http://localhost:3002/api/surveillance/recordings');
    const recordingsData = await recordingsResponse.json();
    console.log('✅ Recordings endpoint:', recordingsData.success ? 'Working' : 'Failed');
    console.log('   Recordings found:', recordingsData.recordings?.length || 0);
  } catch (error) {
    console.log('❌ Recordings endpoint error:', error.message);
  }

  // Test network scanner endpoint
  try {
    const networkResponse = await fetch('http://localhost:3002/api/network/scan-network', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        startIP: '192.168.1.1',
        endIP: '192.168.1.10',
        subnet: '192.168.1.0/24'
      })
    });
    const networkData = await networkResponse.json();
    console.log('✅ Network scanner endpoint:', networkData.success ? 'Working' : 'Failed');
    console.log('   Devices found:', networkData.devices?.length || 0);
  } catch (error) {
    console.log('❌ Network scanner endpoint error:', error.message);
  }

  console.log('\n🔍 API testing complete!');
}

testAPIs();
