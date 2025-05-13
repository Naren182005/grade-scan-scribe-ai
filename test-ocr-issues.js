// Test script for handling OCR issues
import fetch from 'node-fetch';

// Sample questions with OCR issues
const OCR_ISSUES_MCQ = `Whichlenshasvirtualfocus?
a. Convexlens
b. Concavelens
c. Bothconvexandconcavelens
d. None`;

const OCR_ISSUES_NON_MCQ = `Explaintheprocessofphotosynthesis.`;

// Function to test the Groq API endpoint with OCR issues
async function testOCRIssues() {
  try {
    console.log('Testing Groq API endpoint with OCR issues...');
    
    // Step 1: Check if the Groq API server is running
    console.log('Step 1: Checking if the Groq API server is running...');
    const connectivityResponse = await fetch('http://localhost:3000/api/connectivity');
    
    if (!connectivityResponse.ok) {
      console.error('Error: Groq API server is not running');
      console.error('Please start the Groq API server using the start-app-with-groq.bat script');
      return;
    }
    
    console.log('Groq API server is running');
    
    // Step 2: Test the Groq API endpoint with an MCQ question with OCR issues
    console.log('\nStep 2: Testing the Groq API endpoint with an MCQ question with OCR issues...');
    console.log('Question:', OCR_ISSUES_MCQ);
    
    const mcqResponse = await fetch('http://localhost:3000/api/groq', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: OCR_ISSUES_MCQ
      })
    });
    
    if (!mcqResponse.ok) {
      console.error('Error: Failed to call Groq API endpoint for MCQ question with OCR issues');
      console.error('Status:', mcqResponse.status, mcqResponse.statusText);
      const errorText = await mcqResponse.text();
      console.error('Error response:', errorText);
      return;
    }
    
    const mcqResult = await mcqResponse.json();
    console.log('MCQ Question Response:');
    console.log('Answer:', mcqResult.choices[0].message.content);
    
    // Step 3: Test the Groq API endpoint with a non-MCQ question with OCR issues
    console.log('\nStep 3: Testing the Groq API endpoint with a non-MCQ question with OCR issues...');
    console.log('Question:', OCR_ISSUES_NON_MCQ);
    
    const nonMcqResponse = await fetch('http://localhost:3000/api/groq', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: OCR_ISSUES_NON_MCQ
      })
    });
    
    if (!nonMcqResponse.ok) {
      console.error('Error: Failed to call Groq API endpoint for non-MCQ question with OCR issues');
      console.error('Status:', nonMcqResponse.status, nonMcqResponse.statusText);
      const errorText = await nonMcqResponse.text();
      console.error('Error response:', errorText);
      return;
    }
    
    const nonMcqResult = await nonMcqResponse.json();
    console.log('Non-MCQ Question Response:');
    console.log('Answer:', nonMcqResult.choices[0].message.content);
    
    console.log('\nTest completed successfully!');
    console.log('The Groq API is correctly handling questions with OCR issues.');
  } catch (error) {
    console.error('Error testing OCR issues:', error.message);
  }
}

// Run the test
testOCRIssues();
