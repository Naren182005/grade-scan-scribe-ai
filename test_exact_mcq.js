// Test script for the exact MCQ comparison implementation
import { processJsonInput } from './exact_mcq_comparison.js';

// Test cases
const TEST_CASES = [
  {
    name: 'Basic Test - All Correct',
    input: {
      model_answers: "1A 2B 3C 4D",
      student_answers: "1 a 2 b 3 c 4 d"
    },
    expected: {
      score: 4,
      total: 4
    }
  },
  {
    name: 'Adjacent Format',
    input: {
      model_answers: "1A2B3C4D",
      student_answers: "1a2b3c4d"
    },
    expected: {
      score: 4,
      total: 4
    }
  },
  {
    name: 'Mixed Format',
    input: {
      model_answers: "1A 2B 3C 4D",
      student_answers: "1a2b3c4d"
    },
    expected: {
      score: 4,
      total: 4
    }
  },
  {
    name: 'Partial Correct',
    input: {
      model_answers: "1A 2B 3C 4D 5A",
      student_answers: "1a 2b 3d 4c 5a"
    },
    expected: {
      score: 3,
      total: 5
    }
  },
  {
    name: 'Missing Answers',
    input: {
      model_answers: "1A 2B 3C 4D 5A",
      student_answers: "1a 3c 5a"
    },
    expected: {
      score: 3,
      total: 5
    }
  }
];

// Run all test cases
function runTests() {
  console.log('===========================================');
  console.log('Testing Exact MCQ Comparison Implementation');
  console.log('===========================================');
  
  let passedTests = 0;
  
  for (const testCase of TEST_CASES) {
    console.log(`\nTest Case: ${testCase.name}`);
    console.log('-------------------------------------------');
    
    try {
      // Process the JSON input
      const result = processJsonInput(testCase.input);
      
      // Check if the result matches the expected output
      const isScoreCorrect = result.score === testCase.expected.score;
      const isTotalCorrect = result.total === testCase.expected.total;
      const passed = isScoreCorrect && isTotalCorrect;
      
      if (passed) {
        console.log(`✅ Test passed! Score: ${result.score}/${result.total}`);
        passedTests++;
      } else {
        console.log(`❌ Test failed!`);
        console.log(`Expected: Score: ${testCase.expected.score}/${testCase.expected.total}`);
        console.log(`Actual: Score: ${result.score}/${result.total}`);
      }
    } catch (error) {
      console.error(`❌ Test failed with error: ${error.message}`);
    }
  }
  
  // Display summary
  console.log('\n===========================================');
  console.log(`Test Summary: ${passedTests}/${TEST_CASES.length} tests passed`);
  console.log('===========================================');
  
  return passedTests === TEST_CASES.length;
}

// Run the tests
runTests();
