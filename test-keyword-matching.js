// Test script for keyword matching logic
// This script tests the same logic that's implemented in the server endpoint

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

// Function to evaluate answer using keyword matching
function evaluateAnswer(questionKeywords, answerText) {
  if (!questionKeywords || !Array.isArray(questionKeywords)) {
    return { error: 'Invalid question keywords' };
  }

  if (!answerText) {
    return { error: 'No answer text provided' };
  }

  // Simple keyword extraction from answer (basic split+lowercase)
  const answerKeywords = answerText
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // remove punctuation
    .split(/\s+/);

  // Count matching keywords
  let matchCount = 0;
  questionKeywords.forEach(keyword => {
    if (answerKeywords.includes(keyword.toLowerCase())) {
      matchCount++;
    }
  });

  // Mark calculation (example: 1 mark per matched keyword)
  const totalMarks = questionKeywords.length;
  const obtainedMarks = matchCount;

  return {
    totalMarks,
    obtainedMarks,
    matchCount,
    keywordsMatched: questionKeywords.filter(k =>
      answerKeywords.includes(k.toLowerCase())
    )
  };
}

// Function to test the evaluate answer logic
function testEvaluateAnswer() {
  console.log('===========================================');
  console.log('Testing Keyword Matching Logic');
  console.log('===========================================');
  
  for (let i = 0; i < TEST_DATA.length; i++) {
    const testCase = TEST_DATA[i];
    console.log(`\nTest Case ${i + 1}:`);
    console.log('Question Keywords:', testCase.questionKeywords.join(', '));
    console.log('Answer Text:', testCase.answerText);
    
    try {
      // Evaluate the answer
      const result = evaluateAnswer(testCase.questionKeywords, testCase.answerText);
      
      // Display the result
      console.log('\nResult:');
      console.log('Total Marks:', result.totalMarks);
      console.log('Obtained Marks:', result.obtainedMarks);
      console.log('Match Count:', result.matchCount);
      console.log('Keywords Matched:', result.keywordsMatched.join(', ') || 'None');
      console.log('===========================================');
    } catch (error) {
      console.error('Error testing evaluate answer logic:', error.message);
    }
  }
}

// Run the test
testEvaluateAnswer();
