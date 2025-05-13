// Direct server implementation with hardcoded API token
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const FormData = require('form-data');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// Hardcode the API token
const API_TOKEN = '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';
const OCR_API_KEY = 'K89937523388957';

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(cors());

// API routes
app.post('/api/huggingface', async (req, res) => {
  try {
    console.log('HuggingFace API request received:', JSON.stringify(req.body).substring(0, 200) + '...');

    // Validate request
    if (!req.body.inputs) {
      console.error('No inputs provided in request body');
      return res.status(400).json({ success: false, error: 'No inputs provided' });
    }

    console.log('Using HuggingFace API token:', API_TOKEN.substring(0, 10) + '...');

    const model = req.body.model || 'mistralai/Mixtral-8x7B-Instruct-v0.1';
    console.log('Using model:', model);

    const parameters = req.body.parameters || {
      max_length: 800,
      temperature: 0.3,
      top_p: 0.9,
      do_sample: true,
      return_full_text: false
    };

    // Log the full request for debugging
    console.log('Request body:', JSON.stringify({
      inputs: req.body.inputs.substring(0, 100) + '...',
      parameters: parameters
    }));

    // Send request to HuggingFace API
    console.log(`Sending request to HuggingFace API for model: ${model}`);
    const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: req.body.inputs,
        parameters: parameters
      })
    });

    // Check for errors
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `HuggingFace API error: ${response.status} ${response.statusText}`;

      console.error(`HuggingFace API error: Status ${response.status} ${response.statusText}`);
      console.error('Error response:', errorText);

      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error || errorMessage;
      } catch (e) {
        // If error text is not JSON, use it directly
        errorMessage = errorText || errorMessage;
      }

      return res.status(response.status).json({ success: false, error: errorMessage });
    }

    // Get response data
    console.log('HuggingFace API response received, parsing JSON...');
    const data = await response.json();
    console.log('Response data:', JSON.stringify(data).substring(0, 200) + '...');

    // Return response
    console.log('Sending response back to client');
    res.json(data);
  } catch (error) {
    console.error('Error in HuggingFace API endpoint:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ success: false, error: error.message });
  }
});

// OCR API endpoint
app.post('/api/ocr', upload.single('file'), async (req, res) => {
  try {
    // Validate request
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No image file provided' });
    }

    // Create form data for OCR API
    const formData = new FormData();
    formData.append('apikey', OCR_API_KEY);
    formData.append('language', req.body.language || 'eng');
    formData.append('isOverlayRequired', req.body.isOverlayRequired || 'false');
    formData.append('detectOrientation', req.body.detectOrientation || 'true');
    formData.append('scale', req.body.scale || 'true');
    formData.append('OCREngine', req.body.OCREngine || '2');
    formData.append('isTable', req.body.isTable || 'false');
    formData.append('file', req.file.buffer, {
      filename: 'image.png',
      contentType: req.file.mimetype
    });

    // Send request to OCR API
    const response = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      body: formData
    });

    // Get response data
    const data = await response.json();

    // Return response
    res.json(data);
  } catch (error) {
    console.error('Error in OCR API endpoint:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Using HuggingFace API token: ${API_TOKEN.substring(0, 10)}...`);
  console.log(`Using OCR API key: ${OCR_API_KEY}`);
});
