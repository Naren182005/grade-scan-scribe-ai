// Test script for the new HuggingFace API token
const fetch = require('node-fetch');

// API token
const API_TOKEN = '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';

// Test models to try
const TEST_MODELS = [
  'google/gemma-7b-it',
  'google/gemma-2b-it',
  'mistralai/Mistral-7B-Instruct-v0.2',
  'meta-llama/Llama-2-7b-chat-hf',
  'tiiuae/falcon-7b-instruct',
  'microsoft/phi-2',
  'gpt2'
];

// Test prompt
const TEST_PROMPT = 'Write a model answer for this question: What is photosynthesis?';

// Function to test a model
async function testModel(model) {
  console.log(`\nTesting model: ${model}`);
  console.log('-'.repeat(50));
  
  try {
    console.log(`Sending request to HuggingFace API for model: ${model}`);
    
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
      timeout: 30000
    });
    
    const endTime = Date.now();
    const responseTime = (endTime - startTime) / 1000;
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Error (${response.status} ${response.statusText}): ${errorText}`);
      
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
    
    // Extract the generated text
    let generatedText = '';
    if (Array.isArray(data) && data.length > 0) {
      generatedText = data[0].generated_text || '';
    } else if (data.generated_text) {
      generatedText = data.generated_text;
    }
    
    if (generatedText) {
      console.log('\nGenerated text (truncated):');
      console.log(generatedText.substring(0, 200) + '...');
    }
    
    return true;
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    return false;
  }
}

// Main function
async function main() {
  console.log('='.repeat(50));
  console.log('HuggingFace API Token Test');
  console.log('='.repeat(50));
  console.log(`Using API token: ${API_TOKEN.substring(0, 10)}...`);
  
  let successCount = 0;
  
  for (const model of TEST_MODELS) {
    const success = await testModel(model);
    if (success) {
      successCount++;
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`Test completed: ${successCount} out of ${TEST_MODELS.length} models worked`);
  
  if (successCount > 0) {
    console.log('✅ Your API token is working with at least one model!');
    console.log('You can use these working models in your application.');
  } else {
    console.log('❌ Your API token did not work with any of the tested models.');
    console.log('Please check your API token or try different models.');
  }
  console.log('='.repeat(50));
}

// Run the test
main();
