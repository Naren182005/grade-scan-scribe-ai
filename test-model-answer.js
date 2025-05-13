// Test script for model answer generation
const fetch = require('node-fetch');

// Sample question to test
const TEST_QUESTION = "What are the key principles of object-oriented programming? Explain with examples.";

// API endpoint
const API_ENDPOINT = 'http://localhost:3000/api/huggingface';

// Function to test model answer generation
async function testModelAnswerGeneration() {
  console.log('===========================================');
  console.log('Testing Model Answer Generation');
  console.log('===========================================');
  console.log('Question:', TEST_QUESTION);
  console.log('===========================================');
  
  try {
    // Prepare the API request
    const enhancedPrompt = `Question: ${TEST_QUESTION}

Write a detailed model answer for this exam question. Include key concepts, explanations, and examples.`;

    console.log('Sending request to HuggingFace API through server proxy...');
    
    // Use the server proxy endpoint to make the request
    const response = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
        inputs: enhancedPrompt,
        parameters: {
          max_length: 800,
          temperature: 0.1,
          top_p: 0.95,
          do_sample: true,
          return_full_text: false
        }
      })
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
    
    // Extract the generated text
    let modelAnswer = "";
    
    if (Array.isArray(result) && result.length > 0) {
      modelAnswer = result[0].generated_text || "";
    } else if (result.generated_text) {
      modelAnswer = result.generated_text;
    } else if (typeof result === 'object' && result !== null) {
      console.log('Available fields:', Object.keys(result));
      
      // Try to extract from possible fields
      const possibleTextFields = ['output', 'text', 'answer', 'content', 'response', 'answers', 'prediction'];
      for (const field of possibleTextFields) {
        if (result[field]) {
          if (typeof result[field] === 'string') {
            modelAnswer = result[field];
            break;
          }
        }
      }
      
      // If still no text found, use the whole response
      if (!modelAnswer) {
        modelAnswer = JSON.stringify(result);
      }
    }
    
    // Clean up the model answer
    modelAnswer = modelAnswer.trim();
    
    console.log('===========================================');
    console.log('Generated Model Answer:');
    console.log('===========================================');
    console.log(modelAnswer);
    console.log('===========================================');
    
    // Check if a valid answer was generated
    if (modelAnswer && modelAnswer.length > 0) {
      console.log('✅ Successfully generated model answer!');
    } else {
      console.log('❌ Failed to extract model answer from API response');
    }
  } catch (error) {
    console.error('Error generating model answer:', error);
  }
}

// Make sure the server is running before executing this script
console.log('Make sure the server is running on http://localhost:3000 before running this test');
testModelAnswerGeneration();
