const fetch = require('node-fetch');

async function testCameraAPI() {
  try {
    console.log('Testing camera creation API...');
    
    const response = await fetch('http://localhost:3001/api/surveillance/cameras', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test Camera',
        ip_address: '192.168.1.100',
        port: 80,
        username: 'admin',
        password: 'password',
        location: 'Test Location'
      })
    });
    
    const result = await response.json();
    console.log('Response status:', response.status);
    console.log('Response body:', result);
    
  } catch (error) {
    console.error('Error testing camera API:', error);
  }
}

testCameraAPI();
