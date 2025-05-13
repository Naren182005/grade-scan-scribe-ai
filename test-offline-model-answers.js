// Test script for offline model answer generation
// This script simulates the client-side functionality without a server

// Sample questions to test
const TEST_QUESTIONS = [
  "What is photosynthesis and how does it work?",
  "Explain the principles of object-oriented programming with examples.",
  "What is climate change and what are its impacts?",
  "Describe the process of cellular respiration.",
  "What is artificial intelligence and how is it used today?"
];

// Simulate the template service
const templateAnswers = {
  "photosynthesis": "Photosynthesis is the process by which green plants, algae, and some bacteria convert light energy into chemical energy...",
  "object-oriented programming": "Object-Oriented Programming (OOP) is a programming paradigm based on the concept of objects...",
  "climate change": "Climate change refers to long-term shifts in temperatures and weather patterns...",
  "artificial intelligence": "Artificial Intelligence (AI) refers to the simulation of human intelligence in machines..."
};

// Simulate the template matching function
function getTemplateAnswer(questionText) {
  const lowerQuestion = questionText.toLowerCase();
  
  for (const [keyword, template] of Object.entries(templateAnswers)) {
    if (lowerQuestion.includes(keyword.toLowerCase())) {
      console.log(`Found template match for keyword: ${keyword}`);
      return template;
    }
  }
  
  return null;
}

// Simulate the model answer generation function
async function generateModelAnswer(questionText) {
  console.log(`\nGenerating model answer for: "${questionText}"`);
  
  // Simulate server connection failure
  console.log("Simulating server connection failure...");
  
  // Try template matching
  console.log("Trying template matching...");
  const templateAnswer = getTemplateAnswer(questionText);
  
  if (templateAnswer) {
    console.log("✅ Found matching template answer!");
    return templateAnswer;
  }
  
  // Return generic answer if no template match
  console.log("❌ No template match found, returning generic answer");
  return `This is a model answer for the question: "${questionText}".\n\nUnfortunately, we couldn't generate a specific answer at this time.`;
}

// Test the model answer generation for each question
async function runTests() {
  console.log("===========================================");
  console.log("Testing Offline Model Answer Generation");
  console.log("===========================================");
  
  for (const question of TEST_QUESTIONS) {
    try {
      const answer = await generateModelAnswer(question);
      
      console.log("===========================================");
      console.log(`Question: ${question}`);
      console.log("-------------------------------------------");
      console.log(`Answer: ${answer.substring(0, 150)}...`);
      console.log("===========================================");
    } catch (error) {
      console.error(`Error generating answer for "${question}":`, error);
    }
  }
  
  console.log("\nAll tests completed!");
}

// Run the tests
runTests();
