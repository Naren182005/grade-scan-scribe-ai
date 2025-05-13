// Test script for the Groq API endpoint with an MCQ question
import fetch from 'node-fetch';

// Function to test the Groq API endpoint with an MCQ question
async function testMCQEndpoint() {
  try {
    console.log('Testing Groq API endpoint with MCQ question...');
    
    // Prepare the request with an MCQ question
    const requestBody = {
      prompt: `What is the capital of France?
A) Berlin
B) London
C) Paris
D) Rome`
    };
    
    // Make the request
    console.log('Sending request to http://localhost:3000/api/groq...');
    const response = await fetch('http://localhost:3000/api/groq', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    // Check if the request was successful
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API error: ${response.status} ${response.statusText}`);
      console.error('Error response:', errorText);
      return;
    }
    
    // Parse the response
    const data = await response.json();
    
    // Display the result
    console.log('\nAPI Response:');
    console.log('Status:', response.status);
    console.log('Content:', data.choices[0].message.content);
    console.log('\nAPI call successful!');
  } catch (error) {
    console.error('Error testing MCQ endpoint:', error.message);
  }
}

// Run the test
testMCQEndpoint();
