// Manual test script for the answer evaluation endpoint
// Run this with: node test-answer-evaluation-manual.js

import fetch from 'node-fetch';

// Test data
const modelAnswer = '1A 2B 3C 4D';
const studentAnswer = '1A 2B 3C 4D';

// Function to test the answer evaluation endpoint
async function testAnswerEvaluation() {
  try {
    console.log('Testing answer evaluation endpoint...');
    console.log(`Model answer: ${modelAnswer}`);
    console.log(`Student answer: ${studentAnswer}`);
    
    // First check if the server is running
    try {
      const connectivityResponse = await fetch('http://localhost:3001/api/connectivity');
      if (!connectivityResponse.ok) {
        console.error('Error: Server is not running or connectivity endpoint is not available');
        return;
      }
      console.log('Server is running and connectivity endpoint is available');
    } catch (error) {
      console.error('Error checking server connectivity:', error.message);
      return;
    }
    
    // Now test the evaluate-answer endpoint
    try {
      const response = await fetch('http://localhost:3001/api/evaluate-answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          modelAnswer,
          studentAnswer
        })
      });
      
      if (!response.ok) {
        console.error(`Error: Failed to call evaluate-answer endpoint`);
        console.error(`Status: ${response.status} ${response.statusText}`);
        const errorText = await response.text();
        console.error(`Error response: ${errorText}`);
        return;
      }
      
      const result = await response.json();
      console.log('Response from evaluate-answer endpoint:');
      console.log(JSON.stringify(result, null, 2));
      
      console.log('\nTest completed successfully!');
    } catch (error) {
      console.error('Error calling evaluate-answer endpoint:', error.message);
    }
  } catch (error) {
    console.error('Error in test script:', error.message);
  }
}

// Run the test
testAnswerEvaluation();
