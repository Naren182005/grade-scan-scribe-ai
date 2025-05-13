// Test script for multiple-choice questions with Together API
const fetch = require('node-fetch');

// Sample multiple-choice questions to test
const TEST_QUESTIONS = [
  `What is the capital of France?
A) Berlin
B) Madrid
C) Paris
D) Rome`,

  `Which of the following is NOT a primary color?
A) Red
B) Blue
C) Green
D) Yellow`,

  `What is the chemical symbol for gold?
A) Au
B) Ag
C) Fe
D) Cu`
];

// API endpoint
const API_ENDPOINT = 'http://localhost:3000/api/together';

// Function to test multiple-choice question handling
async function testMultipleChoiceQuestions() {
  console.log('===========================================');
  console.log('Testing Multiple-Choice Question Handling');
  console.log('===========================================');
  
  for (const question of TEST_QUESTIONS) {
    console.log('\nQuestion:', question);
    console.log('===========================================');
    
    try {
      // Send the request to the Together API through server proxy
      console.log('Sending request to Together API through server proxy...');
      
      const response = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          prompt: question
        })
      });

      // Check if the request was successful
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error:', errorText);
        console.error('Status:', response.status, response.statusText);
        continue;
      }

      // Parse the response
      const result = await response.json();
      console.log('API response received');
      
      // Extract the generated answer
      let answer = "";
      
      if (result.choices && result.choices.length > 0 && result.choices[0].message) {
        answer = result.choices[0].message.content.trim();
      }
      
      console.log('===========================================');
      console.log('Generated Answer:', answer);
      console.log('===========================================');
      
      // Check if the answer is a single letter (A, B, C, or D)
      const isValidAnswer = /^[A-D]$/.test(answer);
      
      if (isValidAnswer) {
        console.log('✅ Valid multiple-choice answer format!');
      } else {
        console.log('❌ Invalid multiple-choice answer format. Expected a single letter (A, B, C, or D).');
      }
    } catch (error) {
      console.error('Error testing multiple-choice question:', error);
    }
  }
}

// Make sure the server is running before executing this script
console.log('Make sure the server is running on http://localhost:3000 before running this test');
testMultipleChoiceQuestions();
