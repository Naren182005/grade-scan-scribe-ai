// Express server for Grade Scan Scribe AI using ES modules with Model API
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import { config } from 'dotenv';

// Load environment variables from .env file
config();

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

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;

// API keys from environment variables
const MODEL_API_KEY = ''; // Removed for security
const OCR_API_KEY = process.env.OCR_API_KEY || 'K89937523388957';
const GEMINI_API_KEY = ''; // Removed for security

// Log environment variables (without showing full values)
console.log('Environment variables loaded:');
console.log('MODEL_API_KEY:', MODEL_API_KEY ? 'Set ✓' : 'Not set ✗');
console.log('OCR_API_KEY:', OCR_API_KEY ? 'Set ✓' : 'Not set ✗');
console.log('GEMINI_API_KEY:', GEMINI_API_KEY ? 'Set ✓' : 'Not set ✗');

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(cors());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// API routes

// Connectivity check endpoint
app.get('/api/connectivity', (req, res) => {
  res.json({ connected: true });
});

// OCR API endpoint
app.post('/api/ocr', async (req, res) => {
  try {
    console.log('OCR request received');

    // Extract the image data and parameters from the request
    const imageData = req.body.image;
    const isQuestionPaper = req.body.isQuestionPaper === true;

    console.log(`Processing ${isQuestionPaper ? 'question paper' : 'answer sheet'} image`);

    if (!imageData) {
      console.error('No image data provided');
      return res.status(400).json({ error: 'No image data provided' });
    }

    // Check if API key is available
    if (!OCR_API_KEY) {
      console.error('OCR_API_KEY is not set');
      return res.status(500).json({ error: 'OCR API key not configured' });
    }

    console.log('Using OCR API key:', OCR_API_KEY);
    console.log('Processing image for OCR...');

    // Preprocess the image data to improve OCR results
    // 1. Remove the data URL prefix
    const base64Image = imageData.replace(/^data:image\/[a-z]+;base64,/, '');

    // Prepare the form data for the OCR API with optimized parameters
    const formData = new URLSearchParams();
    formData.append('apikey', OCR_API_KEY);
    formData.append('base64Image', base64Image);
    formData.append('language', 'eng');
    formData.append('isOverlayRequired', 'false');
    formData.append('detectOrientation', 'true');
    formData.append('scale', 'true');
    formData.append('OCREngine', '2'); // Use OCR Engine 2 for better accuracy

    // Add parameters specific to the type of document
    if (isQuestionPaper) {
      // For question papers, use table detection and structured output
      formData.append('isTable', 'true');
      formData.append('detectTables', 'true');
    } else {
      // For answer sheets, optimize for handwriting
      formData.append('isTable', 'false');
      formData.append('ocrMode', 'textbox'); // Better for handwritten text
    }

    // Create a controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      // Make the request to the OCR API
      console.log('Sending request to OCR API...');
      const response = await fetch('https://api.ocr.space/parse/image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData.toString(),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Check if the request was successful
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`OCR API error: ${response.status} ${response.statusText}`);
        console.error('Error response:', errorText);
        return res.status(response.status).json({ error: `OCR API error: ${response.status} ${response.statusText}` });
      }

      // Get response data
      console.log('OCR API response received, parsing JSON...');
      const data = await response.json();
      console.log('OCR processing completed successfully');

      // Send the OCR API response
      res.json(data);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error('Fetch error:', fetchError.message);
      return res.status(500).json({ error: fetchError.message });
    }
  } catch (error) {
    console.error('Error processing OCR request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Model API endpoint
app.post('/api/model', async (req, res) => {
  try {
    console.log('Model API request received');

    // Check if API key is available
    if (!MODEL_API_KEY) {
      console.error('MODEL_API_KEY is not set');
      return res.status(500).json({
        error: 'API key not configured',
        choices: [{ message: { content: 'Error: Model API key not configured' } }]
      });
    }

    console.log('Using Model API key:', MODEL_API_KEY ? 'Set ✓' : 'Not set ✗');

    // Check if this is a batch request (array of prompts)
    const isBatchRequest = Array.isArray(req.body.prompts);

    if (isBatchRequest) {
      console.log(`Processing batch request with ${req.body.prompts.length} questions...`);

      // Get the model from the request or use default
      const model = req.body.model || 'gpt-3.5-turbo';
      console.log('Using model:', model);

      // Process each prompt in the batch
      const prompts = req.body.prompts;
      const batchResults = [];

      // Process prompts in sequence to avoid rate limiting
      for (let i = 0; i < prompts.length; i++) {
        const prompt = prompts[i];
        console.log(`Processing question ${i+1}/${prompts.length}: ${prompt.substring(0, 50)}...`);

        // Prepare the request body
        const messages = [
          { role: "system", content: "You are an intelligent AI exam assistant. Answer the question directly and concisely. If it's a multiple-choice question, provide only the letter of the correct option without explanation. For other questions, provide a brief, direct answer. DO NOT include any thinking, reasoning, or explanations in your response. Provide ONLY the direct answer." },
          { role: "user", content: prompt }
        ];

        const requestBody = {
          model: model,
          messages: messages,
          temperature: req.body.temperature || 0.3,
          max_tokens: req.body.max_tokens || 150
        };

        // Create a controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        try {
          // Make the request to the API
          console.log(`Sending request to Model API for question ${i+1}...`);
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${MODEL_API_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody),
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          // Check if the request was successful
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`Model API error for question ${i+1}: ${response.status} ${response.statusText}`);
            console.error('Error response:', errorText);

            // Add error result to batch results
            batchResults.push({
              error: `Error processing question ${i+1}: ${response.status} ${response.statusText}`,
              choices: [{ message: { content: `Error: Failed to generate answer for question ${i+1}` } }]
            });

            // Continue with the next prompt
            continue;
          }

          // Get response data
          console.log(`Model API response received for question ${i+1}, parsing JSON...`);
          const data = await response.json();

          // Process the response to remove any thinking tags
          if (data.choices && data.choices.length > 0 && data.choices[0].message) {
            const originalContent = data.choices[0].message.content;
            data.choices[0].message.content = removeThinkingTags(originalContent);

            if (data.choices[0].message.content !== originalContent) {
              console.log(`Removed thinking tags from Model API response for question ${i+1}`);
            }
          }

          // Log a sample of the response
          if (data.choices && data.choices.length > 0) {
            const content = data.choices[0].message?.content || '';
            console.log(`Generated content sample for question ${i+1}:`, content.substring(0, 100) + '...');
          }

          // Add result to batch results
          batchResults.push(data);

          // Add a small delay to avoid rate limiting
          if (i < prompts.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        } catch (fetchError) {
          clearTimeout(timeoutId);

          console.error(`Fetch error for question ${i+1}:`, fetchError.message);

          // Add error result to batch results
          if (fetchError.name === 'AbortError') {
            batchResults.push({
              error: 'Request timed out',
              choices: [{ message: { content: `Error: The request for question ${i+1} took too long to complete.` } }]
            });
          } else {
            batchResults.push({
              error: fetchError.message,
              choices: [{ message: { content: `Error: ${fetchError.message}` } }]
            });
          }
        }
      }

      // Send the batch results
      console.log(`Sending batch results for ${batchResults.length} questions`);
      res.json({ results: batchResults });
    } else {
      // Handle single prompt request
      const prompt = req.body.prompt || 'Unknown question';
      console.log('Prompt:', prompt.substring(0, 50) + '...');

      // Use a unified approach for all question types
      console.log('Processing single question...');

      // Get the model from the request or use default
      const model = req.body.model || 'gpt-3.5-turbo';
      console.log('Using model:', model);

      // Prepare the request body
      const messages = [
        { role: "system", content: "You are an intelligent AI exam assistant. Answer the question directly and concisely. If it's a multiple-choice question, provide only the letter of the correct option without explanation. For other questions, provide a brief, direct answer. DO NOT include any thinking, reasoning, or explanations in your response. Provide ONLY the direct answer." },
        { role: "user", content: prompt }
      ];

      const requestBody = {
        model: model,
        messages: messages,
        temperature: req.body.temperature || 0.3,
        max_tokens: req.body.max_tokens || 150
      };

      // Create a controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      try {
        // Make the request to the API
        console.log('Sending request to Model API...');
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${MODEL_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        // Check if the request was successful
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Model API error: ${response.status} ${response.statusText}`);
          console.error('Error response:', errorText);
          return res.status(response.status).json({
            error: `Model API error: ${response.status} ${response.statusText}`,
            choices: [{ message: { content: `Error: Failed to generate answer` } }]
          });
        }

        // Get response data
        console.log('Model API response received, parsing JSON...');
        const data = await response.json();

        // Process the response to remove any thinking tags
        if (data.choices && data.choices.length > 0 && data.choices[0].message) {
          const originalContent = data.choices[0].message.content;
          data.choices[0].message.content = removeThinkingTags(originalContent);

          if (data.choices[0].message.content !== originalContent) {
            console.log('Removed thinking tags from Model API response');
          }
        }

        // Log a sample of the response
        if (data.choices && data.choices.length > 0) {
          const content = data.choices[0].message?.content || '';
          console.log('Generated content sample:', content.substring(0, 100) + '...');
        }

        // Send the response
        res.json(data);
      } catch (fetchError) {
        clearTimeout(timeoutId);

        console.error('Fetch error:', fetchError.message);

        // Handle timeout or network errors
        if (fetchError.name === 'AbortError') {
          return res.status(504).json({
            error: 'Request timed out',
            choices: [{ message: { content: 'Error: The request took too long to complete.' } }]
          });
        }

        // Handle other fetch errors
        return res.status(500).json({
          error: fetchError.message,
          choices: [{ message: { content: `Error: ${fetchError.message}` } }]
        });
      }
    }
  } catch (error) {
    console.error('Error processing Model API request:', error);
    res.status(500).json({
      error: 'Internal server error',
      choices: [{ message: { content: `Error: ${error.message}` } }]
    });
  }
});

// Answer evaluation endpoint
app.post('/api/evaluate-answer', async (req, res) => {
  try {
    console.log('Answer evaluation request received');

    // Extract the model answer and student answer from the request
    const { modelAnswer, studentAnswer } = req.body;

    // Log the request body for debugging
    console.log('Request body:', req.body);

    // Validate the request
    if (!modelAnswer) {
      console.error('No model answer provided');
      return res.status(400).json({ error: 'No model answer provided' });
    }

    if (!studentAnswer) {
      console.error('No student answer provided');
      return res.status(400).json({ error: 'No student answer provided' });
    }

    // Implement answer evaluation logic here
    // This is a simplified implementation for demonstration purposes

    // Send the evaluation result
    res.json({
      totalMarks: 10,
      obtainedMarks: 8,
      matchCount: 8,
      keywordsMatched: ['keyword1', 'keyword2', 'keyword3'],
      percentage: 80,
      result: 'good',
      answerType: 'open-ended'
    });
  } catch (error) {
    console.error('Error evaluating answer:', error);
    res.status(500).json({ error: 'Failed to evaluate answer' });
  }
});

// Gemini API endpoint
app.post('/api/gemini', async (req, res) => {
  try {
    console.log('Gemini API request received');

    // Check if API key is available
    if (!GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY is not set');
      return res.status(500).json({
        error: 'API key not configured',
        text: 'Error: Gemini API key not configured'
      });
    }

    console.log('Using Gemini API key:', GEMINI_API_KEY ? 'Set ✓' : 'Not set ✗');

    // Check if this is a batch request (array of prompts)
    const isBatchRequest = Array.isArray(req.body.prompts);

    if (isBatchRequest) {
      console.log(`Processing batch request with ${req.body.prompts.length} questions...`);

      // Get the model from the request or use default
      const model = req.body.model || 'gemini-1.5-pro';
      console.log('Using model:', model);

      // Process each prompt in the batch
      const prompts = req.body.prompts;
      const batchResults = [];

      // Process prompts in sequence to avoid rate limiting
      for (let i = 0; i < prompts.length; i++) {
        const prompt = prompts[i];
        console.log(`Processing question ${i+1}/${prompts.length}: ${prompt.substring(0, 50)}...`);

        // Prepare the request body
        const systemPrompt = req.body.systemPrompt || "You are an intelligent AI exam assistant. Answer the question directly and concisely. If it's a multiple-choice question, provide ONLY the letter of the correct option (A, B, C, or D) without any explanation, workings, or additional text. Just the single letter of the correct answer. For other questions, provide a brief, direct answer. DO NOT include any thinking, reasoning, or explanations in your response. Provide ONLY the direct answer.";

        const requestBody = {
          contents: [
            {
              role: "user",
              parts: [
                { text: prompt }
              ]
            }
          ],
          systemInstruction: {
            parts: [
              { text: systemPrompt }
            ]
          },
          generationConfig: {
            temperature: req.body.temperature || 0.3,
            maxOutputTokens: req.body.maxOutputTokens || 150,
            topP: req.body.topP || 0.95
          }
        };

        // Create a controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        try {
          // Make the request to the Gemini API
          console.log(`Sending request to Gemini API for question ${i+1}...`);
          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody),
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          // Check if the request was successful
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`Gemini API error for question ${i+1}: ${response.status} ${response.statusText}`);
            console.error('Error response:', errorText);

            // Add error result to batch results
            batchResults.push({
              error: `Error processing question ${i+1}: ${response.status} ${response.statusText}`,
              text: `Error: Failed to generate answer for question ${i+1}`
            });

            // Continue with the next prompt
            continue;
          }

          // Get response data
          console.log(`Gemini API response received for question ${i+1}, parsing JSON...`);
          const data = await response.json();

          // Extract the generated text from the response
          let generatedText = '';
          if (data.candidates && data.candidates.length > 0 &&
              data.candidates[0].content && data.candidates[0].content.parts &&
              data.candidates[0].content.parts.length > 0) {
            generatedText = data.candidates[0].content.parts[0].text || '';
          }

          // Process the response to remove any thinking tags
          generatedText = removeThinkingTags(generatedText);

          // Log a sample of the response
          console.log(`Generated content sample for question ${i+1}:`, generatedText.substring(0, 100) + '...');

          // Add result to batch results with the extracted text
          batchResults.push({
            ...data,
            text: generatedText
          });

          // Add a small delay to avoid rate limiting
          if (i < prompts.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        } catch (fetchError) {
          clearTimeout(timeoutId);

          console.error(`Fetch error for question ${i+1}:`, fetchError.message);

          // Add error result to batch results
          if (fetchError.name === 'AbortError') {
            batchResults.push({
              error: 'Request timed out',
              text: `Error: The request for question ${i+1} took too long to complete.`
            });
          } else {
            batchResults.push({
              error: fetchError.message,
              text: `Error: ${fetchError.message}`
            });
          }
        }
      }

      // Send the batch results
      console.log(`Sending batch results for ${batchResults.length} questions`);
      res.json({ results: batchResults });
    } else {
      // Handle single prompt request
      const prompt = req.body.prompt || 'Unknown question';
      console.log('Prompt:', prompt.substring(0, 50) + '...');

      // Use a unified approach for all question types
      console.log('Processing single question...');

      // Get the model from the request or use default
      const model = req.body.model || 'gemini-1.5-pro';
      console.log('Using model:', model);

      // Prepare the request body
      const systemPrompt = req.body.systemPrompt || "You are an intelligent AI exam assistant. Answer the question directly and concisely. If it's a multiple-choice question, provide ONLY the letter of the correct option (A, B, C, or D) without any explanation, workings, or additional text. Just the single letter of the correct answer. For other questions, provide a brief, direct answer. DO NOT include any thinking, reasoning, or explanations in your response. Provide ONLY the direct answer.";

      const requestBody = {
        contents: [
          {
            role: "user",
            parts: [
              { text: prompt }
            ]
          }
        ],
        systemInstruction: {
          parts: [
            { text: systemPrompt }
          ]
        },
        generationConfig: {
          temperature: req.body.temperature || 0.3,
          maxOutputTokens: req.body.maxOutputTokens || 150,
          topP: req.body.topP || 0.95
        }
      };

      // Create a controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      try {
        // Make the request to the Gemini API
        console.log('Sending request to Gemini API...');
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        // Check if the request was successful
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Gemini API error: ${response.status} ${response.statusText}`);
          console.error('Error response:', errorText);
          return res.status(response.status).json({
            error: `Gemini API error: ${response.status} ${response.statusText}`,
            text: `Error: Failed to generate answer`
          });
        }

        // Get response data
        console.log('Gemini API response received, parsing JSON...');
        const data = await response.json();

        // Extract the generated text from the response
        let generatedText = '';
        if (data.candidates && data.candidates.length > 0 &&
            data.candidates[0].content && data.candidates[0].content.parts &&
            data.candidates[0].content.parts.length > 0) {
          generatedText = data.candidates[0].content.parts[0].text || '';
        }

        // Process the response to remove any thinking tags
        generatedText = removeThinkingTags(generatedText);

        // Log a sample of the response
        console.log('Generated content sample:', generatedText.substring(0, 100) + '...');

        // Send the response with the extracted text
        res.json({
          ...data,
          text: generatedText
        });
      } catch (fetchError) {
        clearTimeout(timeoutId);

        console.error('Fetch error:', fetchError.message);

        // Handle timeout or network errors
        if (fetchError.name === 'AbortError') {
          return res.status(504).json({
            error: 'Request timed out',
            text: 'Error: The request took too long to complete.'
          });
        }

        // Handle other fetch errors
        return res.status(500).json({
          error: fetchError.message,
          text: `Error: ${fetchError.message}`
        });
      }
    }
  } catch (error) {
    console.error('Error processing Gemini API request:', error);
    res.status(500).json({
      error: 'Internal server error',
      text: `Error: ${error.message}`
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log('===========================================');
  console.log(`Express server running at http://localhost:${PORT}/`);
  console.log('===========================================');
  console.log('Available endpoints:');
  console.log('- GET  /api/connectivity');
  console.log('- POST /api/model');
  console.log('- POST /api/gemini');
  console.log('- POST /api/ocr');
  console.log('- POST /api/evaluate-answer');
  console.log('===========================================');
  console.log('Using Gemini API for AI answer generation');
  console.log('===========================================');
});
