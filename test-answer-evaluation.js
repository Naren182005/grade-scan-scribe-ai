// Test script for the answer evaluation endpoint
import fetch from 'node-fetch';

// Sample test cases
const TEST_CASES = [
  {
    name: 'MCQ Answer - Correct',
    modelAnswer: 'C',
    studentAnswer: 'C',
    expected: {
      totalMarks: 1,
      obtainedMarks: 1,
      matchCount: 1,
      isCorrect: true,
      answerType: 'mcq'
    }
  },
  {
    name: 'MCQ Answer - Incorrect',
    modelAnswer: 'A',
    studentAnswer: 'B',
    expected: {
      totalMarks: 1,
      obtainedMarks: 0,
      matchCount: 0,
      isCorrect: false,
      answerType: 'mcq'
    }
  },
  {
    name: 'MCQ Answer - Case Insensitive',
    modelAnswer: 'D',
    studentAnswer: 'd',
    expected: {
      totalMarks: 1,
      obtainedMarks: 1,
      matchCount: 1,
      isCorrect: true,
      answerType: 'mcq'
    }
  },
  {
    name: 'Open-ended Answer - Comma-separated Keywords',
    modelAnswer: 'database, management, system',
    studentAnswer: 'A Database Management System stores data securely.',
    expected: {
      totalMarks: 3,
      obtainedMarks: 3,
      matchCount: 3,
      result: 'good',
      answerType: 'open-ended'
    }
  },
  {
    name: 'Open-ended Answer - Partial Match',
    modelAnswer: 'photosynthesis, chlorophyll, carbon dioxide, oxygen, sunlight',
    studentAnswer: 'Plants use sunlight and chlorophyll for energy.',
    expected: {
      totalMarks: 5,
      obtainedMarks: 2,
      matchCount: 2,
      result: 'average',
      answerType: 'open-ended'
    }
  },
  {
    name: 'Open-ended Answer - No Match',
    modelAnswer: 'mitochondria, powerhouse, cell, energy, ATP',
    studentAnswer: 'The nucleus contains DNA.',
    expected: {
      totalMarks: 5,
      obtainedMarks: 0,
      matchCount: 0,
      result: 'poor',
      answerType: 'open-ended'
    }
  }
];

// Function to test the answer evaluation endpoint
async function testAnswerEvaluation() {
  try {
    console.log('Testing answer evaluation endpoint...');
    
    // Step 1: Check if the server is running
    console.log('\nStep 1: Checking if the server is running...');
    try {
      const connectivityResponse = await fetch('http://localhost:3000/api/connectivity');
      if (!connectivityResponse.ok) {
        console.error('Error: Server is not running');
        console.error('Please start the server using node express-server.mjs or node simple-test-server.mjs');
        return;
      }
      console.log('Server is running');
    } catch (error) {
      console.error('Error: Server is not running');
      console.error('Please start the server using node express-server.mjs or node simple-test-server.mjs');
      return;
    }
    
    // Step 2: Run test cases
    console.log('\nStep 2: Running test cases...');
    
    let passedTests = 0;
    let failedTests = 0;
    
    for (const testCase of TEST_CASES) {
      console.log(`\nRunning test case: ${testCase.name}`);
      console.log(`Model answer: ${testCase.modelAnswer}`);
      console.log(`Student answer: ${testCase.studentAnswer}`);
      
      try {
        const response = await fetch('http://localhost:3000/api/evaluate-answer', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            modelAnswer: testCase.modelAnswer,
            studentAnswer: testCase.studentAnswer
          })
        });
        
        if (!response.ok) {
          console.error(`Error: Failed to call evaluate-answer endpoint`);
          console.error(`Status: ${response.status} ${response.statusText}`);
          const errorText = await response.text();
          console.error(`Error response: ${errorText}`);
          failedTests++;
          continue;
        }
        
        const result = await response.json();
        console.log('Response:', JSON.stringify(result, null, 2));
        
        // Verify the result matches the expected output
        let testPassed = true;
        for (const key of Object.keys(testCase.expected)) {
          if (result[key] !== testCase.expected[key]) {
            console.error(`❌ Test failed: Expected ${key} to be ${testCase.expected[key]}, but got ${result[key]}`);
            testPassed = false;
          }
        }
        
        if (testPassed) {
          console.log('✅ Test passed');
          passedTests++;
        } else {
          console.log('❌ Test failed');
          failedTests++;
        }
      } catch (error) {
        console.error(`Error running test case: ${error.message}`);
        failedTests++;
      }
    }
    
    // Step 3: Print summary
    console.log('\nStep 3: Test summary');
    console.log(`Passed tests: ${passedTests}`);
    console.log(`Failed tests: ${failedTests}`);
    console.log(`Total tests: ${TEST_CASES.length}`);
    
    if (failedTests === 0) {
      console.log('\n✅ All tests passed! The answer evaluation endpoint is working correctly.');
    } else {
      console.log('\n❌ Some tests failed. Please check the error messages above.');
    }
  } catch (error) {
    console.error('Error testing answer evaluation:', error.message);
  }
}

// Run the test
testAnswerEvaluation();
