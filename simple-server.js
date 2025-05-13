/**
 * Simple, robust server implementation for Grade Scan Scribe AI
 * Supports both HuggingFace and OpenAI APIs
 */

const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const FormData = require('form-data');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// API keys
const HUGGINGFACE_API_TOKEN = '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';
const OPENAI_API_KEY = 'sk-YqGaQMHESOKnmUP0SZtvqKBmAk1fMWhwu3sRJiZepJqRIuw0';
const OCR_API_KEY = 'K89937523388957';

// Server configuration
const app = express();
const PORT = 3000;

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(cors());

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

/**
 * Check internet connectivity
 * @returns {Promise<boolean>} True if connected, false otherwise
 */
async function checkInternetConnectivity() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch('https://www.google.com', {
      method: 'HEAD',
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.error("Internet connectivity check failed:", error.message);
    return false;
  }
}

// API routes

/**
 * Connectivity check endpoint
 */
app.get('/api/connectivity', async (req, res) => {
  try {
    const isConnected = await checkInternetConnectivity();
    res.json({ connected: isConnected });
  } catch (error) {
    console.error('Error in connectivity check endpoint:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * HuggingFace API endpoint
 */
app.post('/api/huggingface', async (req, res) => {
  try {
    console.log('HuggingFace API request received');

    // Validate request
    if (!req.body.inputs) {
      console.error('No inputs provided in request body');
      return res.status(400).json({ success: false, error: 'No inputs provided' });
    }

    // Check internet connectivity
    const isConnected = await checkInternetConnectivity();
    if (!isConnected) {
      console.error('No internet connection detected');
      return res.status(503).json({
        success: false,
        error: 'No internet connection. Please check your network and try again.'
      });
    }

    console.log('Using HuggingFace API token:', HUGGINGFACE_API_TOKEN.substring(0, 10) + '...');

    const model = req.body.model || 'mistralai/Mixtral-8x7B-Instruct-v0.1';
    console.log('Using model:', model);

    const parameters = req.body.parameters || {
      max_length: 800,
      temperature: 0.3,
      top_p: 0.9,
      do_sample: true,
      return_full_text: false
    };

    // Create a controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      // Send request to HuggingFace API
      console.log(`Sending request to HuggingFace API for model: ${model}`);
      const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HUGGINGFACE_API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: req.body.inputs,
          parameters: parameters
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

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
      console.log('Response received successfully');

      // Return response
      console.log('Sending response back to client');
      res.json(data);
    } catch (fetchError) {
      clearTimeout(timeoutId);

      console.error('Fetch error:', fetchError.message);

      // Handle timeout or network errors
      if (fetchError.name === 'AbortError') {
        return res.status(504).json({
          success: false,
          error: 'Request timed out',
          details: 'The request to the HuggingFace API took too long to complete.'
        });
      }

      // Handle other fetch errors
      return res.status(500).json({
        success: false,
        error: fetchError.message,
        details: 'Error connecting to HuggingFace API. Please check your internet connection.'
      });
    }
  } catch (error) {
    console.error('Error in HuggingFace API endpoint:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * OpenAI API endpoint
 */
app.post('/api/openai', async (req, res) => {
  try {
    console.log('OpenAI API request received');

    // Validate request
    if (!req.body.prompt) {
      console.error('No prompt provided in request body');
      return res.status(400).json({ success: false, error: 'No prompt provided' });
    }

    // Check internet connectivity
    const isConnected = await checkInternetConnectivity();
    if (!isConnected) {
      console.error('No internet connection detected');
      return res.status(503).json({
        success: false,
        error: 'No internet connection. Please check your network and try again.'
      });
    }

    console.log('Using OpenAI API key:', OPENAI_API_KEY.substring(0, 10) + '...');

    const model = req.body.model || 'gpt-3.5-turbo';
    console.log('Using model:', model);

    // Prepare the request body
    const requestBody = {
      model: model,
      messages: [
        { role: "system", content: "You are a helpful assistant that generates detailed model answers for exam questions." },
        { role: "user", content: req.body.prompt }
      ],
      temperature: req.body.temperature || 0.3,
      max_tokens: req.body.max_tokens || 800,
      top_p: req.body.top_p || 0.9
    };

    // Create a controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Check for errors
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `OpenAI API error: ${response.status} ${response.statusText}`;
        let errorDetails = '';

        console.error(`OpenAI API error: Status ${response.status} ${response.statusText}`);
        console.error('Error response:', errorText);

        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error?.message || errorMessage;
          errorDetails = errorJson.error?.type || '';
        } catch (e) {
          // If error text is not JSON, use it directly
          errorMessage = errorText || errorMessage;
        }

        return res.status(response.status).json({
          success: false,
          error: errorMessage,
          details: errorDetails
        });
      }

      // Get response data
      console.log('OpenAI API response received, parsing JSON...');
      const data = await response.json();
      console.log('Response received successfully');

      // Return response
      console.log('Sending response back to client');
      res.json(data);
    } catch (fetchError) {
      clearTimeout(timeoutId);

      console.error('Fetch error:', fetchError.message);

      // Handle timeout or network errors
      if (fetchError.name === 'AbortError') {
        return res.status(504).json({
          success: false,
          error: 'Request timed out',
          details: 'The request to the OpenAI API took too long to complete.'
        });
      }

      // Handle other fetch errors
      return res.status(500).json({
        success: false,
        error: fetchError.message,
        details: 'Error connecting to OpenAI API. Please check your internet connection.'
      });
    }
  } catch (error) {
    console.error('Error in OpenAI API endpoint:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * OCR API endpoint
 */
app.post('/api/ocr', upload.single('file'), async (req, res) => {
  try {
    console.log('OCR API request received');

    // Validate request
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No image file provided' });
    }

    // Check internet connectivity
    const isConnected = await checkInternetConnectivity();
    if (!isConnected) {
      console.error('No internet connection detected');
      return res.status(503).json({
        success: false,
        error: 'No internet connection. Please check your network and try again.'
      });
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

    // Create a controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      // Send request to OCR API
      console.log('Sending request to OCR API');
      const response = await fetch('https://api.ocr.space/parse/image', {
        method: 'POST',
        body: formData,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Check for errors
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`OCR API error: Status ${response.status} ${response.statusText}`);
        console.error('Error response:', errorText);

        return res.status(response.status).json({
          success: false,
          error: `OCR API error: ${response.status} ${response.statusText}`
        });
      }

      // Get response data
      console.log('OCR API response received, parsing JSON...');
      const data = await response.json();
      console.log('Response received successfully');

      // Return response
      console.log('Sending response back to client');
      res.json(data);
    } catch (fetchError) {
      clearTimeout(timeoutId);

      console.error('Fetch error:', fetchError.message);

      // Handle timeout or network errors
      if (fetchError.name === 'AbortError') {
        return res.status(504).json({
          success: false,
          error: 'Request timed out',
          details: 'The request to the OCR API took too long to complete.'
        });
      }

      // Handle other fetch errors
      return res.status(500).json({
        success: false,
        error: fetchError.message,
        details: 'Error connecting to OCR API. Please check your internet connection.'
      });
    }
  } catch (error) {
    console.error('Error in OCR API endpoint:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log('===========================================');
  console.log(`Server running on port ${PORT}`);
  console.log('===========================================');
  console.log(`HuggingFace API token: ${HUGGINGFACE_API_TOKEN.substring(0, 10)}...`);
  console.log(`OpenAI API key: ${OPENAI_API_KEY.substring(0, 10)}...`);
  console.log(`OCR API key: ${OCR_API_KEY}`);
  console.log('===========================================');
  console.log('Server endpoints:');
  console.log('- GET  /api/connectivity - Check internet connectivity');
  console.log('- POST /api/huggingface  - Generate text with HuggingFace');
  console.log('- POST /api/openai       - Generate text with OpenAI');
  console.log('- POST /api/ocr          - Perform OCR on images');
  console.log('===========================================');
});
