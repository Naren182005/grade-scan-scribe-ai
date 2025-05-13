// Test script for connectivity endpoint
const fetch = require('node-fetch');

// API endpoint
const API_ENDPOINT = 'http://localhost:3000/api/connectivity';

// Function to test connectivity endpoint
async function testConnectivityEndpoint() {
  console.log('===========================================');
  console.log('Testing Connectivity Endpoint');
  console.log('===========================================');
  
  try {
    console.log('Sending request to connectivity endpoint...');
    
    // Use the server proxy endpoint to make the request
    const response = await fetch(API_ENDPOINT, {
      method: "GET"
    });

    // Check if the request was successful
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error:', errorText);
      console.error('Status:', response.status, response.statusText);
      return;
    }

    // Parse the response
    const result = await response.json();
    console.log('API response received');
    console.log('Result:', result);
    
    // Check if the server is connected
    if (result.connected === true) {
      console.log('✅ Server reports internet connectivity is available');
    } else {
      console.log('❌ Server reports no internet connectivity');
    }
  } catch (error) {
    console.error('Error testing connectivity endpoint:', error);
  }
}

// Make sure the server is running before executing this script
console.log('Make sure the server is running on http://localhost:3000 before running this test');
testConnectivityEndpoint();
