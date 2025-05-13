// Simple script to test HuggingFace API connectivity with the updated API key
import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// API token from environment or hardcoded for testing
const API_TOKEN = process.env.HUGGING_FACE_API_KEY || ''; // API key removed for security

// Test models - we'll try multiple models to see which ones work
const TEST_MODELS = [
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
    const responseTime = endTime - startTime;

    if (response.ok) {
      const result = await response.json();
      console.log(`✅ Success! Response time: ${responseTime}ms`);
      console.log('Generated text:');

      let generatedText = '';
      if (Array.isArray(result) && result.length > 0) {
        generatedText = result[0]?.generated_text || '';
      } else if (typeof result === 'object' && result.generated_text) {
        generatedText = result.generated_text;
      } else if (typeof result === 'string') {
        generatedText = result;
      }

      console.log(generatedText);
      return true;
    } else {
      const errorText = await response.text();
      console.log(`❌ Error (${response.status} ${response.statusText}): ${errorText}`);

      if (response.status === 401) {
        console.log('   API authorization error: Please check your HuggingFace API token');
      } else if (response.status === 403) {
        console.log('   Access denied: You may not have access to this model');
      } else if (response.status === 429) {
        console.log('   Rate limit exceeded: Too many requests');
      } else if (response.status >= 500) {
        console.log('   Server error: The HuggingFace API is experiencing issues');
      }

      return false;
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      console.log('   Connection error: Unable to reach the HuggingFace API');
    } else if (error.type === 'request-timeout') {
      console.log('   Timeout error: The request took too long to complete');
    }
    return false;
  }
}

// Main function to test all models
async function runTests() {
  console.log('===========================================');
  console.log('HuggingFace API Test');
  console.log('===========================================');

  // First check internet connectivity
  console.log('Testing internet connectivity...');
  try {
    const connectivityCheck = await fetch('https://www.google.com', { timeout: 5000 });
    if (connectivityCheck.ok) {
      console.log('✅ Internet connection is working\n');
    } else {
      console.log('❌ Internet connection check failed\n');
    }
  } catch (error) {
    console.log('❌ Internet connection error:', error.message);
    console.log('Please check your internet connection and try again.\n');
    return;
  }

  console.log('Testing API token validity...\n');

  let successCount = 0;

  // Test each model
  for (const model of TEST_MODELS) {
    const success = await testModel(model);
    if (success) successCount++;
  }

  console.log('\n===========================================');
  if (successCount > 0) {
    console.log(`✅ ${successCount} of ${TEST_MODELS.length} models worked successfully`);
    console.log('Your HuggingFace API setup is working!');
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
