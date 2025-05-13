// Simple test server
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());

// Log environment variables
console.log('Environment variables loaded:');
console.log('OCR_API_KEY:', process.env.OCR_API_KEY ? 'Set ✓' : 'Not set ✗');
console.log('HUGGINGFACE_API_TOKEN:', process.env.HUGGINGFACE_API_TOKEN ? 'Set ✓' : 'Not set ✗');
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'Set ✓' : 'Not set ✗');

// Simple connectivity endpoint
app.get('/api/connectivity', (req, res) => {
  console.log('Connectivity check requested');
  res.json({ connected: true });
});

// Simple OpenAI endpoint
app.post('/api/openai', (req, res) => {
  console.log('OpenAI request received');
  res.json({
    choices: [
      {
        message: {
          content: "This is a mock response from the OpenAI API. In a real scenario, this would be a detailed model answer generated based on your question."
        }
      }
    ]
  });
});

// Simple HuggingFace endpoint
app.post('/api/huggingface', (req, res) => {
  console.log('HuggingFace request received');
  res.json([
    {
      generated_text: "This is a mock response from the HuggingFace API. In a real scenario, this would be a detailed model answer generated based on your question."
    }
  ]);
});

// Simple OCR endpoint
app.post('/api/ocr', (req, res) => {
  console.log('OCR request received');
  res.json({
    ParsedResults: [
      {
        ParsedText: "This is a mock OCR result. In a real scenario, this would be the text extracted from your image."
      }
    ]
  });
});

// Start the server
app.listen(PORT, () => {
  console.log('===========================================');
  console.log(`Test server running on port ${PORT}`);
  console.log('===========================================');
  console.log('Server endpoints:');
  console.log('- GET  /api/connectivity - Always returns connected: true');
  console.log('- POST /api/huggingface  - Returns mock generated text');
  console.log('- POST /api/openai       - Returns mock generated text');
  console.log('- POST /api/ocr          - Returns mock OCR results');
  console.log('===========================================');
});
