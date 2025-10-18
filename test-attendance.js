const axios = require('axios');

async function testAttendance() {
  try {
    // Test clock-in
    console.log('Testing clock-in...');
    const clockInResponse = await axios.post('http://localhost:3001/api/attendance/clock-in', {
      employeeId: 3,
      pin: '1111',
      location: {
        lat: 6.5244,
        lng: 3.3792,
        address: 'Test Location'
      },
      deviceInfo: {
        isFactoryDevice: true
      }
    });
    console.log('Clock-in response:', clockInResponse.data);

    // Test status
    console.log('\nTesting status...');
    const statusResponse = await axios.get('http://localhost:3001/api/attendance/status/3');
    console.log('Status response:', statusResponse.data);

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testAttendance();
