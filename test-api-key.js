// Simple script to test HuggingFace API connectivity with a specific API key
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// API token to test
const API_TOKEN = ''; // API key removed for security

// Test models - we'll try multiple models to see which ones work
const TEST_MODELS = [
  'google/gemma-7b-it',  // Current model being used
  'google/gemma-2b-it',  // Smaller model that might be more accessible
  'mistralai/Mistral-7B-Instruct-v0.2', // Alternative model
  'meta-llama/Llama-2-7b-chat-hf', // Another popular model
  'google/gemma-1.1-2b-it', // Newer model
  'mistralai/Mixtral-8x7B-Instruct-v0.1' // Another model to try
];

// Simple test prompt
const TEST_PROMPT = 'Write a short answer to this question: What is photosynthesis?';

// Function to check internet connectivity
async function checkInternetConnectivity() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch('https://www.google.com', {
      method: 'HEAD',
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    return false;
  }
}

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
      })
    });

    const endTime = Date.now();
    const responseTime = (endTime - startTime) / 1000;

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Error (${response.status} ${response.statusText})`;

      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = `${errorMessage}: ${errorJson.error}`;
      } catch (e) {
        errorMessage = `${errorMessage}: ${errorText}`;
      }

      console.log(`❌ ${errorMessage}`);
      return false;
    }

    const data = await response.json();
    console.log(`✅ Success! Response time: ${responseTime.toFixed(2)}s`);
    console.log('Response:', JSON.stringify(data).substring(0, 150) + '...');
    return true;
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return false;
  }
}

// Main function
async function main() {
  console.log('===========================================');
  console.log('HuggingFace API Test');
  console.log('===========================================');

  // Check internet connectivity
  console.log('Testing internet connectivity...');
  const isConnected = await checkInternetConnectivity();

  if (!isConnected) {
    console.log('❌ No internet connection detected. Please check your network and try again.');
    return;
  }

  console.log('✅ Internet connection is working\n');

  // Test API token validity
  console.log('Testing API token validity...');

  let successCount = 0;

  for (const model of TEST_MODELS) {
    const success = await testModel(model);
    if (success) successCount++;
  }

  console.log('\n===========================================');
  if (successCount > 0) {
    console.log(`✅ ${successCount}/${TEST_MODELS.length} models worked with your API token`);
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

// Run the main function
main().catch(error => {
  console.error('Unhandled error:', error);
});
