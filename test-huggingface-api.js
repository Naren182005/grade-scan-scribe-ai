// Simple script to test HuggingFace API connectivity
import fetch from 'node-fetch';

// API token from environment or hardcoded for testing
const API_TOKEN = process.env.HUGGINGFACE_API_TOKEN || ''; // API key removed for security

// Test models - we'll try multiple models to see which ones work
const TEST_MODELS = [
  'google/gemma-7b-it',  // Current model being used
  'google/gemma-2b-it',  // Smaller model that might be more accessible
  'mistralai/Mistral-7B-Instruct-v0.2', // Alternative model
  'meta-llama/Llama-2-7b-chat-hf' // Another popular model
];

// Simple test prompt
const TEST_PROMPT = 'Write a short answer to this question: What is photosynthesis?';

// Function to test a specific model
async function testModel(model) {
  console.log(`\nTesting model: ${model}`);
  console.log('----------------------------------------');

  try {
    console.log(`Sending request to HuggingFace API for model: ${model}`);
    console.log(`Using API token: ${API_TOKEN.substring(0, 10)}...`);

    const startTime = Date.now();
    const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: TEST_PROMPT,
        parameters: {
          max_length: 200,
          temperature: 0.1,
          top_p: 0.95,
          do_sample: true,
          return_full_text: false
        }
      }),
      // Set a timeout to avoid hanging
      timeout: 30000
    });

    const endTime = Date.now();
    const responseTime = (endTime - startTime) / 1000;

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Error (${response.status} ${response.statusText}): ${errorText}`);

      // Provide more specific error messages based on status code
      if (response.status === 401 || response.status === 403) {
        console.error('   API authorization error: Please check your HuggingFace API token');
      } else if (response.status === 404) {
        console.error('   Model not found: The specified model could not be found');
      } else if (response.status === 429) {
        console.error('   Rate limit exceeded: Too many requests to the API');
      } else if (response.status >= 500) {
        console.error('   HuggingFace server error: Please try again later');
      }

      return false;
    }

    const data = await response.json();
    console.log(`✅ Success! Response received in ${responseTime.toFixed(2)} seconds`);
    console.log('Response data (truncated):');
    console.log(JSON.stringify(data).substring(0, 200) + '...');

    return true;
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    if (error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
      console.error('   Network error: Please check your internet connection');
    }
    return false;
  }
}

// Function to test internet connectivity
async function testInternetConnectivity() {
  console.log('Testing internet connectivity...');
  try {
    const response = await fetch('https://www.google.com', { timeout: 5000 });
    if (response.ok) {
      console.log('✅ Internet connection is working');
      return true;
    } else {
      console.error('❌ Internet connection test failed');
      return false;
    }
  } catch (error) {
    console.error(`❌ Internet connection error: ${error.message}`);
    return false;
  }
}

// Main function to run all tests
async function runTests() {
  console.log('===========================================');
  console.log('HuggingFace API Test');
  console.log('===========================================');

  // First check internet connectivity
  const hasInternet = await testInternetConnectivity();
  if (!hasInternet) {
    console.error('Cannot proceed with API tests due to internet connectivity issues');
    return;
  }

  console.log('\nTesting API token validity...');

  let anyModelWorked = false;

  // Test each model
  for (const model of TEST_MODELS) {
    const modelWorked = await testModel(model);
    if (modelWorked) {
      anyModelWorked = true;
    }
  }

  console.log('\n===========================================');
  if (anyModelWorked) {
    console.log('✅ At least one model is working with your API token');
    console.log('You should update your code to use a working model');
  } else {
    console.log('❌ None of the tested models worked with your API token');
    console.log('Possible issues:');
    console.log('1. Your API token may be invalid or expired');
    console.log('2. You may not have access to these models');
    console.log('3. There may be rate limiting or server issues');
    console.log('4. Your internet connection may have intermittent issues');
  }
  console.log('===========================================');
}

// Run the tests
runTests();
