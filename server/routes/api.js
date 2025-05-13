const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const FormData = require('form-data');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

/**
 * Removes <think>...</think> tags and their content from the model's response
 * @param {string} text The text to process
 * @returns {string} The cleaned text without thinking tags
 */
function removeThinkingTags(text) {
  if (!text) return text;

  // Remove <think>...</think> tags and their content
  let cleanedText = text.replace(/<think>[\s\S]*?<\/think>/g, '');

  // Also handle cases where the closing tag might be malformed or missing
  cleanedText = cleanedText.replace(/<think>[\s\S]*/g, '');

  // Remove any leading/trailing whitespace that might be left after tag removal
  cleanedText = cleanedText.trim();

  // If the text was completely wrapped in think tags and is now empty, return the original
  // but with a warning message
  if (cleanedText === '' && text.includes('<think>')) {
    console.warn('Model response contained only thinking tags, returning a default message');
    return 'Unable to generate a direct answer. Please try again.';
  }

  return cleanedText;
}

// Check if OCR API key is set
if (!process.env.OCR_API_KEY) {
  console.error('ERROR: Missing OCR_API_KEY environment variable. Please check your .env file.');
  console.error('OCR_API_KEY:', process.env.OCR_API_KEY ? 'Set ✓' : 'Not set ✗');

  // Set default value for development if not set
  console.log('Setting default OCR_API_KEY for development');
  process.env.OCR_API_KEY = 'K89937523388957';
}

/**
 * OCR API endpoint
 * Proxies requests to OCR.space API
 */
router.post('/ocr', upload.single('file'), async (req, res, next) => {
  try {
    // Validate request
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No image file provided' });
    }

    // Create form data for OCR API
    const formData = new FormData();
    formData.append('apikey', process.env.OCR_API_KEY);
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
    next(error);
  }
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
    console.error("Internet connectivity check failed:", error);
    return false;
  }
}

/**
 * Groq API endpoint
 * Proxies requests to Groq API with improved error handling
 */
router.post('/groq', async (req, res, next) => {
  try {
    console.log('Groq API request received:', JSON.stringify(req.body).substring(0, 200) + '...');

    // Validate request
    if (!req.body.prompt) {
      console.error('No prompt provided in request body');
      return res.status(400).json({ success: false, error: 'No prompt provided' });
    }

    // Check internet connectivity first
    const isConnected = await checkInternetConnectivity();
    if (!isConnected) {
      console.error('No internet connection detected');
      return res.status(503).json({
        success: false,
        error: 'No internet connection. Please check your network and try again.'
      });
    }

    // Check if API key is available
    if (!process.env.GROQ_API_KEY) {
      console.error('GROQ_API_KEY is not set in environment variables');
      return res.status(500).json({ success: false, error: 'API key not configured' });
    }

    console.log('Using Groq API key:', process.env.GROQ_API_KEY.substring(0, 10) + '...');

    const model = req.body.model || 'llama3-70b-8192';
    console.log('Using model:', model);

    // Prepare the request body with a unified prompt
    let requestBody = {
      model: model,
      messages: [
        { role: "system", content: "You are an intelligent AI exam assistant. Answer the question directly and concisely. If it's a multiple-choice question, provide only the letter of the correct option without explanation. For other questions, provide a brief, direct answer. DO NOT include any thinking, reasoning, or explanations in your response. DO NOT use <think> tags or any similar format. Provide ONLY the direct answer." },
        { role: "user", content: req.body.prompt }
      ],
      temperature: 0.1, // Low temperature for more deterministic answers
      max_tokens: 100, // Limit tokens for concise answers
      top_p: 0.95
    };

    // Log the request for debugging
    console.log('Request body:', JSON.stringify({
      model: requestBody.model,
      messages: [
        { role: "system", content: "You are an intelligent AI exam assistant." },
        { role: "user", content: `Question: ${req.body.prompt.substring(0, 100)}...` }
      ]
    }));

    // Create a controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Check for errors
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Groq API error: ${response.status} ${response.statusText}`;
        let errorDetails = '';

        console.error(`Groq API error: Status ${response.status} ${response.statusText}`);
        console.error('Error response:', errorText);

        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error?.message || errorMessage;
          errorDetails = errorJson.error?.type || '';
        } catch (e) {
          // If error text is not JSON, use it directly
          errorMessage = errorText || errorMessage;
        }

        // Provide more specific error messages based on status code
        if (response.status === 401) {
          errorDetails = 'API authorization error. Please check your Groq API key.';
        } else if (response.status === 429) {
          errorDetails = 'Rate limit exceeded. Too many requests to the API.';
        } else if (response.status >= 500) {
          errorDetails = 'Groq server error. Please try again later.';
        }

        return res.status(response.status).json({
          success: false,
          error: errorMessage,
          details: errorDetails,
          model: model
        });
      }

      // Get response data
      console.log('Groq API response received, parsing JSON...');
      const data = await response.json();
      console.log('Response data:', JSON.stringify(data).substring(0, 200) + '...');

      // Process the response to remove any thinking tags
      if (data.choices && data.choices.length > 0 && data.choices[0].message) {
        const originalContent = data.choices[0].message.content;
        data.choices[0].message.content = removeThinkingTags(originalContent);

        if (data.choices[0].message.content !== originalContent) {
          console.log('Removed thinking tags from Groq API response');
        }
      }

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
          details: 'The request to the Groq API took too long to complete.',
          model: model
        });
      }

      // Handle other fetch errors
      return res.status(500).json({
        success: false,
        error: fetchError.message,
        details: 'Error connecting to Groq API. Please check your internet connection.',
        model: model
      });
    }
  } catch (error) {
    console.error('Error in Groq API endpoint:', error.message);
    console.error('Error stack:', error.stack);
    next(error);
  }
});

/**
 * Compatibility endpoint for OpenAI (redirects to Groq)
 */
router.post('/openai', async (req, res, next) => {
  try {
    console.log('OpenAI compatibility request received (redirecting to Groq)');

    // Convert OpenAI request format to Groq format if needed
    const groqRequest = {
      ...req.body,
      // Add any necessary transformations here
    };

    // Forward to Groq endpoint
    req.body = groqRequest;
    return router.handle(req, res, next, '/groq');
  } catch (error) {
    console.error('Error in OpenAI compatibility endpoint:', error.message);
    next(error);
  }
});

/**
 * Compatibility endpoint for HuggingFace (redirects to Groq)
 */
router.post('/huggingface', async (req, res, next) => {
  try {
    console.log('HuggingFace compatibility request received (redirecting to Groq)');

    // Convert HuggingFace request format to Groq format
    const prompt = req.body.inputs || '';
    const groqRequest = {
      prompt: prompt,
      model: 'llama3-70b-8192', // Default model
      temperature: 0.3,
      max_tokens: 800
    };

    // Forward to Groq endpoint
    req.body = groqRequest;
    return router.handle(req, res, next, '/groq');
  } catch (error) {
    console.error('Error in HuggingFace compatibility endpoint:', error.message);
    next(error);
  }
});



/**
 * Together API endpoint
 * Proxies requests to Together API with improved error handling
 */
router.post('/together', async (req, res, next) => {
  try {
    console.log('Together API request received:', JSON.stringify(req.body).substring(0, 200) + '...');

    // Validate request
    if (!req.body.prompt && !req.body.messages) {
      console.error('No prompt or messages provided in request body');
      return res.status(400).json({ success: false, error: 'No prompt or messages provided' });
    }

    // Check internet connectivity first
    const isConnected = await checkInternetConnectivity();
    if (!isConnected) {
      console.error('No internet connection detected');
      return res.status(503).json({
        success: false,
        error: 'No internet connection. Please check your network and try again.'
      });
    }

    // Check if API key is available
    if (!process.env.TOGETHER_API_KEY) {
      console.error('TOGETHER_API_KEY is not set in environment variables');
      return res.status(500).json({ success: false, error: 'API key not configured' });
    }

    console.log('Using Together API key:', process.env.TOGETHER_API_KEY.substring(0, 10) + '...');

    const model = req.body.model || 'Qwen/Qwen3-235B-A22B-fp8-tput';
    console.log('Using model:', model);

    // Determine which API endpoint to use
    let useInferenceEndpoint = req.body.endpoint === 'inference';
    let apiEndpoint = 'https://api.together.xyz/v1/chat/completions';
    let requestBody;

    if (useInferenceEndpoint) {
      console.log('Using inference endpoint');
      apiEndpoint = 'https://api.together.xyz/inference';

      // For inference endpoint, use the prompt directly
      requestBody = {
        model: model,
        prompt: req.body.prompt,
        max_tokens: req.body.max_tokens || 100,
        temperature: req.body.temperature !== undefined ? req.body.temperature : 0.1
      };
    } else if (req.body.messages) {
      console.log('Using provided messages');

      requestBody = {
        model: model,
        messages: req.body.messages,
        temperature: req.body.temperature || 0.1, // Low temperature for more deterministic answers
        max_tokens: req.body.max_tokens || 100, // Reasonable token limit for concise answers
        top_p: req.body.top_p || 0.95, // Higher top_p for better quality
        frequency_penalty: 0.5, // Reduce repetition
        presence_penalty: 0.5, // Encourage diversity
        timeout: 10 // 10 second timeout for faster responses
      };
    } else {
      // Use a unified prompt for all question types
      const questionText = req.body.prompt;

      // Prepare the request body with optimized parameters for faster responses
      requestBody = {
        model: model,
        messages: [
          { role: "system", content: "You are an intelligent AI exam assistant. Answer the question directly and concisely. If it's a multiple-choice question, provide only the letter of the correct option without explanation. For other questions, provide a brief, direct answer. DO NOT include any thinking, reasoning, or explanations in your response. DO NOT use <think> tags or any similar format. Provide ONLY the direct answer." },
          { role: "user", content: questionText }
        ],
        temperature: req.body.temperature || 0.1, // Low temperature for more deterministic answers
        max_tokens: req.body.max_tokens || 100, // Reasonable token limit for concise answers
        top_p: req.body.top_p || 0.95, // Higher top_p for better quality
        frequency_penalty: 0.5, // Reduce repetition
        presence_penalty: 0.5, // Encourage diversity
        timeout: 10 // 10 second timeout for faster responses
      };
    }

    // Log the request for debugging
    console.log('Request body:', JSON.stringify({
      model: requestBody.model,
      endpoint: apiEndpoint,
      // Only log a simplified version of the request
      request_type: useInferenceEndpoint ? 'inference' : 'chat',
      content_preview: req.body.prompt ? req.body.prompt.substring(0, 100) + '...' :
                      (req.body.messages ? 'Using provided messages' : 'No content')
    }));

    // Create a controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.TOGETHER_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Check for errors
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Together API error: ${response.status} ${response.statusText}`;
        let errorDetails = '';

        console.error(`Together API error: Status ${response.status} ${response.statusText}`);
        console.error('Error response:', errorText);

        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error?.message || errorMessage;
          errorDetails = errorJson.error?.type || '';
        } catch (e) {
          // If error text is not JSON, use it directly
          errorMessage = errorText || errorMessage;
        }

        // Provide more specific error messages based on status code
        if (response.status === 401) {
          errorDetails = 'API authorization error. Please check your Together API key.';
        } else if (response.status === 429) {
          errorDetails = 'Rate limit exceeded. Too many requests to the API.';
        } else if (response.status >= 500) {
          errorDetails = 'Together server error. Please try again later.';
        }

        return res.status(response.status).json({
          success: false,
          error: errorMessage,
          details: errorDetails,
          model: model
        });
      }

      // Get response data
      console.log('Together API response received, parsing JSON...');
      const data = await response.json();
      console.log('Response data:', JSON.stringify(data).substring(0, 200) + '...');

      // If using inference endpoint, transform the response to match the expected format
      if (useInferenceEndpoint && data.output) {
        // Process the response to remove any thinking tags
        const originalText = data.output.text;
        data.output.text = removeThinkingTags(originalText);

        if (data.output.text !== originalText) {
          console.log('Removed thinking tags from Together API inference response');
        }

        // Transform inference endpoint response to match chat completions format
        const transformedData = {
          output: data.output,
          // Also include a choices array for backward compatibility
          choices: [
            {
              message: {
                content: data.output.text
              }
            }
          ]
        };
        console.log('Transformed response for inference endpoint');
        res.json(transformedData);
      } else {
        // Process the response to remove any thinking tags
        if (data.choices && data.choices.length > 0 && data.choices[0].message) {
          const originalContent = data.choices[0].message.content;
          data.choices[0].message.content = removeThinkingTags(originalContent);

          if (data.choices[0].message.content !== originalContent) {
            console.log('Removed thinking tags from Together API chat response');
          }
        }

        // Return response as-is
        console.log('Sending response back to client');
        res.json(data);
      }
    } catch (fetchError) {
      clearTimeout(timeoutId);

      console.error('Fetch error:', fetchError.message);

      // Handle timeout or network errors
      if (fetchError.name === 'AbortError') {
        return res.status(504).json({
          success: false,
          error: 'Request timed out',
          details: 'The request to the Together API took too long to complete.',
          model: model
        });
      }

      // Handle other fetch errors
      return res.status(500).json({
        success: false,
        error: fetchError.message,
        details: 'Error connecting to Together API. Please check your internet connection.',
        model: model
      });
    }
  } catch (error) {
    console.error('Error in Together API endpoint:', error.message);
    console.error('Error stack:', error.stack);
    next(error);
  }
});

/**
 * Connectivity check endpoint
 * Simple endpoint to check if the server is connected to the internet
 */
router.get('/connectivity', async (req, res, next) => {
  try {
    const isConnected = await checkInternetConnectivity();
    res.json({ connected: isConnected });
  } catch (error) {
    console.error('Error in connectivity check endpoint:', error.message);
    next(error);
  }
});

/**
 * Evaluate answer endpoint
 * Compares student answer text with model answer keywords
 * Returns match count and marks awarded
 */
router.post('/evaluate-answer', async (req, res) => {
  try {
    const { questionKeywords, answerText } = req.body;

    if (!questionKeywords || !Array.isArray(questionKeywords)) {
      return res.status(400).json({ error: 'Invalid question keywords' });
    }

    if (!answerText) {
      return res.status(400).json({ error: 'No answer text provided' });
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

    res.json({
      totalMarks,
      obtainedMarks,
      matchCount,
      keywordsMatched: questionKeywords.filter(k =>
        answerKeywords.includes(k.toLowerCase())
      )
    });
  } catch (error) {
    console.error('Error in evaluate-answer endpoint:', error.message);
    res.status(500).json({ error: 'Failed to evaluate answer' });
  }
});

module.exports = router;
