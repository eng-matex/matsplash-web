// Test script for CCTV system functionality
import axios from 'axios';

const BASE_URL = 'http://localhost:3001/api/surveillance';

async function testCCTVSystem() {
  console.log('🎥 Testing CCTV System Functionality\n');

  try {
    // 1. Test network scanning
    console.log('1. Testing Network Scanning...');
    const scanResponse = await axios.post(`${BASE_URL}/scan-network`, {
      networkRange: '192.168.1.1-254',
      ports: [80, 8080, 554, 1935]
    });
    
    if (scanResponse.data.success) {
      console.log(`✅ Found ${scanResponse.data.data.length} devices on network`);
      scanResponse.data.data.forEach(device => {
        console.log(`   📹 ${device.ip}:${device.port} - ${device.deviceType} (${device.status})`);
      });
    } else {
      console.log('❌ Network scan failed');
    }

    // 2. Test camera connection (if devices found)
    if (scanResponse.data.success && scanResponse.data.data.length > 0) {
      const firstDevice = scanResponse.data.data[0];
      console.log(`\n2. Testing Camera Connection: ${firstDevice.ip}:${firstDevice.port}`);
      
      const testResponse = await axios.post(`${BASE_URL}/test-camera`, {
        ip_address: firstDevice.ip,
        port: firstDevice.port,
        timeout: 5000
      });
      
      if (testResponse.data.success) {
        console.log(`✅ Camera test successful - ${testResponse.data.data.status}`);
        console.log(`   Response time: ${testResponse.data.data.responseTime}ms`);
        console.log(`   Device type: ${testResponse.data.data.deviceType}`);
        console.log(`   Manufacturer: ${testResponse.data.data.manufacturer}`);
      } else {
        console.log('❌ Camera test failed');
      }
    }

    // 3. Test GCP connection
    console.log('\n3. Testing GCP Cloud Storage Connection...');
    try {
      const gcpResponse = await axios.get(`${BASE_URL}/gcp/test-connection`);
      if (gcpResponse.data.success) {
        console.log('✅ GCP connection successful');
      } else {
        console.log('⚠️ GCP connection failed (expected if not configured)');
        console.log(`   Error: ${gcpResponse.data.error}`);
      }
    } catch (error) {
      console.log('⚠️ GCP connection test failed (expected if not configured)');
    }

    // 4. Test motion detection stats
    console.log('\n4. Testing Motion Detection System...');
    try {
      const motionResponse = await axios.get(`${BASE_URL}/motion-detection/stats`);
      if (motionResponse.data.success) {
        console.log('✅ Motion detection system active');
        console.log(`   Total events: ${motionResponse.data.data.totalEvents}`);
        console.log(`   Today's events: ${motionResponse.data.data.todayEvents}`);
        console.log(`   Active detections: ${motionResponse.data.data.activeDetections}`);
        console.log(`   Average confidence: ${motionResponse.data.data.avgConfidence.toFixed(2)}`);
      }
    } catch (error) {
      console.log('⚠️ Motion detection test failed');
    }

    // 5. Test recording functionality
    console.log('\n5. Testing Recording System...');
    try {
      // Get cameras first
      const camerasResponse = await axios.get(`${BASE_URL}/cameras`);
      if (camerasResponse.data.success && camerasResponse.data.data.length > 0) {
        const camera = camerasResponse.data.data[0];
        console.log(`   Testing with camera: ${camera.name}`);
        
        // Test recording status
        const statusResponse = await axios.get(`${BASE_URL}/cameras/${camera.id}/recording-status`);
        if (statusResponse.data.success) {
          console.log(`   Recording status: ${statusResponse.data.data.is_recording ? 'Active' : 'Inactive'}`);
        }
      } else {
        console.log('   No cameras found - add a camera first to test recording');
      }
    } catch (error) {
      console.log('⚠️ Recording test failed');
    }

    console.log('\n🎉 CCTV System Test Complete!');
    console.log('\nNext Steps:');
    console.log('1. Add your POE camera using the network scan results');
    console.log('2. Configure camera credentials and settings');
    console.log('3. Test manual recording start/stop');
    console.log('4. Enable 24/7 recording if desired');
    console.log('5. Configure motion detection settings');
    console.log('6. Set up GCP credentials for cloud storage');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Response:', error.response.data);
    }
  }
}

// Run the test
testCCTVSystem();
