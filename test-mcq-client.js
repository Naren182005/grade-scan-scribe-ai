// Test script for multiple-choice questions with Together API (client-side)
import { generateTogetherModelAnswer } from './src/services/togetherService.js';

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

// Function to test multiple-choice question handling
async function testMultipleChoiceQuestions() {
  console.log('===========================================');
  console.log('Testing Multiple-Choice Question Handling (Client-side)');
  console.log('===========================================');
  
  for (const question of TEST_QUESTIONS) {
    console.log('\nQuestion:', question);
    console.log('===========================================');
    
    try {
      // Call the Together API directly
      console.log('Calling Together API directly...');
      
      const answer = await generateTogetherModelAnswer(question);
      
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

// Run the test
testMultipleChoiceQuestions();
