/**
 * Test script to verify OpenAI API connection
 * 
 * This script tests the OpenAI API connection using the API key from the .env file.
 * It makes a simple request to the OpenAI API and logs the response.
 */

// Load environment variables from .env file
require('dotenv').config();

// Import fetch for making HTTP requests
const fetch = require('node-fetch');

// Get the API key from environment variables
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Check if the API key is available
if (!OPENAI_API_KEY) {
  console.error('Error: OPENAI_API_KEY is not set in the .env file');
  process.exit(1);
}

console.log('OpenAI API Key found:', OPENAI_API_KEY.substring(0, 10) + '...');

// Simple test prompt
const testPrompt = 'What is the capital of France?';

// Function to test the OpenAI API connection
async function testOpenAIConnection() {
  console.log('Testing OpenAI API connection...');
  console.log('Sending request with prompt:', testPrompt);

  try {
    // Make a request to the OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: testPrompt }
        ],
        temperature: 0.7,
        max_tokens: 100
      })
    });

    // Check if the request was successful
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error:', response.status, response.statusText);
      console.error('Error details:', errorText);
      return false;
    }

    // Parse the response
    const data = await response.json();
    
    // Log the response
    console.log('Response received successfully!');
    console.log('Model used:', data.model);
    
    if (data.choices && data.choices.length > 0) {
      console.log('Generated text:', data.choices[0].message.content);
    }
    
    return true;
  } catch (error) {
    console.error('Error testing OpenAI connection:', error.message);
    return false;
  }
}

// Run the test
testOpenAIConnection()
  .then(success => {
    if (success) {
      console.log('OpenAI API connection test successful!');
    } else {
      console.error('OpenAI API connection test failed.');
    }
  })
  .catch(error => {
    console.error('Unexpected error during test:', error);
  });
