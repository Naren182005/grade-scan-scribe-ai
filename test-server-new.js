// Simple test script to check if the server is working
import http from 'http';

// Make a request to the connectivity endpoint
const options = {
  hostname: 'localhost',
  port: 3001, // Using the new port
  path: '/api/connectivity',
  method: 'GET'
};

console.log('Testing server connectivity...');
const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`HEADERS: ${JSON.stringify(res.headers)}`);

  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('RESPONSE:', data);
    console.log('Server is running correctly!');
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
  console.error('Server is not running or not accessible.');
});

req.end();
