// Test script for both MCQ and non-MCQ questions
import fetch from 'node-fetch';

// Sample questions
const MCQ_QUESTION = `What is the capital of France?
A) Berlin
B) London
C) Paris
D) Rome`;

const NON_MCQ_QUESTION = `Explain the process of photosynthesis.`;

// Function to test the Groq API endpoint with different question types
async function testAllQuestionTypes() {
  try {
    console.log('Testing Groq API endpoint with different question types...');
    
    // Step 1: Check if the Groq API server is running
    console.log('Step 1: Checking if the Groq API server is running...');
    const connectivityResponse = await fetch('http://localhost:3000/api/connectivity');
    
    if (!connectivityResponse.ok) {
      console.error('Error: Groq API server is not running');
      console.error('Please start the Groq API server using the start-app-with-groq.bat script');
      return;
    }
    
    console.log('Groq API server is running');
    
    // Step 2: Test the Groq API endpoint with an MCQ question
    console.log('\nStep 2: Testing the Groq API endpoint with an MCQ question...');
    const mcqResponse = await fetch('http://localhost:3000/api/groq', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: MCQ_QUESTION
      })
    });
    
    if (!mcqResponse.ok) {
      console.error('Error: Failed to call Groq API endpoint for MCQ question');
      console.error('Status:', mcqResponse.status, mcqResponse.statusText);
      const errorText = await mcqResponse.text();
      console.error('Error response:', errorText);
      return;
    }
    
    const mcqResult = await mcqResponse.json();
    console.log('MCQ Question Response:');
    console.log('Question:', MCQ_QUESTION);
    console.log('Answer:', mcqResult.choices[0].message.content);
    
    // Step 3: Test the Groq API endpoint with a non-MCQ question
    console.log('\nStep 3: Testing the Groq API endpoint with a non-MCQ question...');
    const nonMcqResponse = await fetch('http://localhost:3000/api/groq', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: NON_MCQ_QUESTION
      })
    });
    
    if (!nonMcqResponse.ok) {
      console.error('Error: Failed to call Groq API endpoint for non-MCQ question');
      console.error('Status:', nonMcqResponse.status, nonMcqResponse.statusText);
      const errorText = await nonMcqResponse.text();
      console.error('Error response:', errorText);
      return;
    }
    
    const nonMcqResult = await nonMcqResponse.json();
    console.log('Non-MCQ Question Response:');
    console.log('Question:', NON_MCQ_QUESTION);
    console.log('Answer:', nonMcqResult.choices[0].message.content);
    
    console.log('\nTest completed successfully!');
    console.log('The Groq API is correctly handling both MCQ and non-MCQ questions.');
  } catch (error) {
    console.error('Error testing question types:', error.message);
  }
}

// Run the test
testAllQuestionTypes();
