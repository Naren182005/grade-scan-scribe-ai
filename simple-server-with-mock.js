// Simple Express server with built-in mock Hugging Face API
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());

// Mock responses for different question types
const mockResponses = {
  mcq: {
    'A': 'Questions containing options labeled A, B, C, D',
    'B': 'Questions about science or biology',
    'C': 'Questions about history or geography',
    'D': 'Questions about math or physics'
  },
  general: {
    'photosynthesis': 'Process by plants, sunlight, carbon dioxide, water, oxygen, glucose',
    'mitochondria': 'Powerhouse of cell, ATP production, cellular respiration, energy',
    'world war 2': '1939-1945, Hitler, Nazi Germany, Allied Powers, Axis Powers, Holocaust',
    'gravity': 'Force of attraction, mass, Newton, acceleration, 9.8 m/s²',
    'democracy': 'Government by people, voting, elections, representation, freedom'
  }
};

// Helper function to determine if a question is MCQ
function isMCQ(question) {
  // Check for common MCQ patterns
  const mcqPatterns = [
    /\b[A-D]\)\s/i,                  // A) option
    /\b[A-D]\.\s/i,                  // A. option
    /\bOption\s+[A-D]\b/i,           // Option A
    /\bChoice\s+[A-D]\b/i,           // Choice A
    /\([A-D]\)/i,                    // (A)
    /\b[a-d]\)\s/i,                  // a) option
    /\b[a-d]\.\s/i,                  // a. option
    /\bOption\s+[a-d]\b/i,           // Option a
    /\bChoice\s+[a-d]\b/i,           // Choice a
    /\([a-d]\)/i,                    // (a)
    /multiple\s+choice/i,            // "multiple choice" in the question
    /choose\s+the\s+(correct|right|best)/i, // "choose the correct/right/best"
    /select\s+the\s+(correct|right|best)/i  // "select the correct/right/best"
  ];
  
  return mcqPatterns.some(pattern => pattern.test(question));
}

// Helper function to generate a mock response
function generateMockResponse(question) {
  // Check if it's an MCQ
  if (isMCQ(question)) {
    // For MCQs, return a single letter (A, B, C, or D)
    const options = ['A', 'B', 'C', 'D'];
    const randomIndex = Math.floor(Math.random() * options.length);
    return options[randomIndex];
  } else {
    // For general questions, find a matching keyword or return a generic response
    const keywords = Object.keys(mockResponses.general);
    const matchingKeyword = keywords.find(keyword => 
      question.toLowerCase().includes(keyword.toLowerCase())
    );
    
    if (matchingKeyword) {
      return mockResponses.general[matchingKeyword];
    } else {
      // Generic response with keywords
      return 'Key concept, important definition, relevant facts, essential information, primary elements';
    }
  }
}

// Mock Hugging Face API endpoint
app.post('/api/huggingface', (req, res) => {
  try {
    const { inputs } = req.body;
    
    console.log(`Mock Hugging Face API request received`);
    console.log(`Input: ${inputs.substring(0, 100)}...`);
    
    // Generate a mock response
    const generatedText = generateMockResponse(inputs);
    
    // Format the response like Hugging Face API
    const response = [{
      generated_text: generatedText
    }];
    
    console.log(`Generated response: ${generatedText}`);
    
    // Add a small delay to simulate API latency
    setTimeout(() => {
      res.json(response);
    }, 500);
  } catch (error) {
    console.error('Error in mock Hugging Face API:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// OCR API endpoint
app.post('/api/ocr', (req, res) => {
  try {
    console.log('OCR API request received');
    
    // Mock OCR response
    const mockOcrResponse = {
      success: true,
      text: 'This is a mock OCR response. It simulates text extracted from an image.',
      confidence: 95
    };
    
    res.json(mockOcrResponse);
  } catch (error) {
    console.error('Error in OCR API endpoint:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Connectivity check endpoint
app.get('/api/connectivity', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Evaluate answer endpoint
app.post('/api/evaluate-answer', (req, res) => {
  try {
    const { studentAnswer, modelAnswer } = req.body;
    
    console.log('Evaluate answer request received');
    console.log(`Student answer: ${studentAnswer.substring(0, 50)}...`);
    console.log(`Model answer: ${modelAnswer.substring(0, 50)}...`);
    
    // Simple evaluation logic
    const score = Math.floor(Math.random() * 101); // Random score between 0 and 100
    
    let performance;
    if (score >= 90) {
      performance = 'Excellent';
    } else if (score >= 70) {
      performance = 'Good';
    } else if (score >= 50) {
      performance = 'Average';
    } else {
      performance = 'Poor';
    }
    
    const response = {
      score,
      performance,
      feedback: 'This is a mock evaluation response.'
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error in evaluate answer endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Simple server with mock Hugging Face API is running',
    endpoints: {
      '/api/huggingface': 'POST - Mock Hugging Face API',
      '/api/ocr': 'POST - Mock OCR API',
      '/api/connectivity': 'GET - Connectivity check',
      '/api/evaluate-answer': 'POST - Evaluate answer'
    }
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Test the server at http://localhost:${PORT}/`);
});
