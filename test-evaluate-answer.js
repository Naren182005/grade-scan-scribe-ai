// Test script for the evaluate-answer endpoint
import fetch from 'node-fetch';

// Sample data to test
const TEST_DATA = [
  {
    questionKeywords: ["database", "management", "system"],
    answerText: "A Database Management System stores data securely."
  },
  {
    questionKeywords: ["algorithm", "complexity", "analysis"],
    answerText: "Algorithm complexity refers to the efficiency of an algorithm."
  },
  {
    questionKeywords: ["photosynthesis", "plants", "chlorophyll"],
    answerText: "Plants use sunlight to create energy."
  }
];

// API endpoint
const API_ENDPOINT = 'http://localhost:3000/api/evaluate-answer';

// Function to test the evaluate-answer endpoint
async function testEvaluateAnswer() {
  console.log('===========================================');
  console.log('Testing Evaluate Answer Endpoint');
  console.log('===========================================');

  for (let i = 0; i < TEST_DATA.length; i++) {
    const testCase = TEST_DATA[i];
    console.log(`\nTest Case ${i + 1}:`);
    console.log('Question Keywords:', testCase.questionKeywords.join(', '));
    console.log('Answer Text:', testCase.answerText);

    try {
      // Prepare the API request
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testCase)
      });

      // Check if the request was successful
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API error: ${response.status} ${response.statusText}`);
        console.error('Error response:', errorText);
        continue;
      }

      // Parse the response
      const result = await response.json();

      // Display the result
      console.log('\nResult:');
      console.log('Total Marks:', result.totalMarks);
      console.log('Obtained Marks:', result.obtainedMarks);
      console.log('Match Count:', result.matchCount);
      console.log('Keywords Matched:', result.keywordsMatched.join(', ') || 'None');
      console.log('===========================================');
    } catch (error) {
      console.error('Error testing evaluate-answer endpoint:', error.message);
    }
  }
}

// Run the test
testEvaluateAnswer();
