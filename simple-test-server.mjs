// Very simple Express server for testing
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

// Create Express app
const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(cors());

/**
 * Post-processes OCR text to improve quality
 * @param text The raw OCR text
 * @param isQuestionPaper Whether the text is from a question paper
 * @returns The processed text
 */
function postProcessOCRText(text, isQuestionPaper) {
  if (!text) return text;

  // Preserve original text for debugging
  console.log("Original OCR text:", text);

  // First, fix missing spaces between words (common OCR issue)
  let processedText = text.replace(/([a-z])([A-Z])/g, '$1 $2'); // Add space between lowercase and uppercase letters

  // Then normalize whitespace (but don't remove all spaces)
  processedText = processedText.replace(/\s{2,}/g, ' '); // Replace multiple spaces with a single space

  // Fix common OCR errors
  processedText = processedText
    .replace(/[|]l/g, 'I') // Fix pipe character and lowercase L to uppercase I
    .replace(/[0O]/g, (match) => /[a-z]/i.test(processedText[processedText.indexOf(match) - 1] || '') ? 'o' : match) // Fix 0 to o when in words
    .replace(/[1]/g, (match) => /[a-z]/i.test(processedText[processedText.indexOf(match) - 1] || '') ? 'l' : match) // Fix 1 to l when in words
    .replace(/\b[0O]ne\b/g, 'One')
    .replace(/\b[0O]f\b/g, 'of')
    .replace(/\b[1I]n\b/g, 'In')
    .replace(/\b[1I]s\b/g, 'is')
    .replace(/\b[1I]t\b/g, 'it')
    .replace(/\b[1I]f\b/g, 'if')
    .replace(/\b[5S]o\b/g, 'So')
    .replace(/\b[5S]e\b/g, 'Se')
    .replace(/\b[8B]e\b/g, 'Be')
    .replace(/\b[8B]y\b/g, 'By');

  // Fix punctuation spacing
  processedText = processedText
    .replace(/\s+([.,;:?!])/g, '$1')
    .replace(/([.,;:?!])([a-zA-Z])/g, '$1 $2');

  // Fix paragraph breaks
  processedText = processedText.replace(/([a-z])\s+([A-Z])/g, '$1\n\n$2');

  // Special processing for question papers
  if (isQuestionPaper) {
    // Fix question numbering
    processedText = processedText
      .replace(/(\d+)\s*\.\s*/g, '$1. ') // Ensure proper spacing after question numbers
      .replace(/Q\s*(\d+)/gi, 'Q$1') // Fix spacing in question markers
      .replace(/Q(\d+)/g, 'Q$1. '); // Add period after question numbers

    // Fix MCQ options
    processedText = processedText
      .replace(/([A-D])\s*\)\s*/g, '$1) ') // Fix spacing in MCQ options with parentheses
      .replace(/([A-D])\s*\.\s*/g, '$1. '); // Fix spacing in MCQ options with periods

    // Fix common OCR errors in MCQ options
    processedText = processedText
      .replace(/\b([A-D])\s*[\-—]\s*/g, '$1) ') // Convert dashes to parentheses in options
      .replace(/\b([A-D])l/g, '$1)'); // Fix 'A)' misread as 'Al'
  } else {
    // For answer sheets, preserve line breaks which are important for handwriting
    processedText = processedText.replace(/\n+/g, '\n');
  }

  return processedText;
}

// Simple test endpoint
app.get('/api/test', (req, res) => {
  console.log('Test endpoint requested');
  res.json({ message: 'Server is working!' });
});

// Connectivity endpoint
app.get('/api/connectivity', (req, res) => {
  console.log('Connectivity endpoint requested');
  res.json({ connected: true });
});

// Groq API endpoint
app.post('/api/groq', async (req, res) => {
  try {
    console.log('Groq API request received:', JSON.stringify(req.body).substring(0, 200) + '...');

    // Validate request
    if (!req.body.prompt) {
      console.error('No prompt provided in request body');
      return res.status(400).json({ success: false, error: 'No prompt provided' });
    }

    // Groq API key
    const GROQ_API_KEY = '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';

    // Clean up the question text to fix common OCR issues
    const cleanedQuestionText = req.body.prompt
      .replace(/([a-z])([A-Z])/g, '$1 $2') // Add space between lowercase and uppercase letters
      .replace(/\s*\)\s*/g, ') ') // Normalize spacing around closing parentheses
      .replace(/\s*\.\s*/g, '. '); // Normalize spacing around periods

    console.log("Cleaned question text:", cleanedQuestionText);

    // Check if this is a multiple-choice question
    const isMCQ = isMultipleChoiceQuestion(cleanedQuestionText);
    console.log(`Question type: ${isMCQ ? 'Multiple-choice' : 'Open-ended'}`);

    // Prepare the request body based on question type
    let requestBody;

    if (isMCQ) {
      // For MCQ questions, use a prompt that returns only the letter of the correct answer
      requestBody = {
        model: req.body.model || 'llama3-70b-8192',
        messages: [
          { role: "system", content: "You are an intelligent AI exam evaluator. I will give you a multiple-choice question that may have some formatting issues due to OCR processing. Your task is to understand the question, identify the options, and select the correct option from A, B, C, or D. Return only the letter of the correct option as your final answer without any explanation or additional text." },
          { role: "user", content: `Example:
Question: What is the capital of France?
A) Berlin
B) London
C) Paris
D) Rome

Answer: C

Now, here is the question:
${cleanedQuestionText}` }
        ],
        temperature: 0, // Use 0 temperature for deterministic answers
        max_tokens: 5, // Only need a few tokens for the letter
        top_p: 0.95
      };
    } else {
      // For non-MCQ questions, use a prompt that requests a concise answer
      requestBody = {
        model: req.body.model || 'llama3-70b-8192',
        messages: [
          { role: "system", content: "You are an expert educational assistant. The following question may have some formatting issues due to OCR processing. Please understand the question and provide a concise and accurate answer. Focus on key points and be direct in your response." },
          { role: "user", content: `Question: ${cleanedQuestionText}` }
        ],
        temperature: req.body.temperature || 0.3,
        max_tokens: req.body.max_tokens || 800,
        top_p: req.body.top_p || 0.9
      };
    }

    console.log('Sending request to Groq API...');

    // Make the request to Groq API
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    // Check if the request was successful
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Groq API error: ${response.status} ${response.statusText}`);
      console.error('Error response:', errorText);

      return res.status(response.status).json({
        success: false,
        error: `Groq API error: ${response.status} ${response.statusText}`,
        details: errorText
      });
    }

    // Get response data
    console.log('Groq API response received, parsing JSON...');
    const data = await response.json();
    console.log('Response data:', JSON.stringify(data).substring(0, 200) + '...');

    // Return response
    console.log('Sending response back to client');
    res.json(data);
  } catch (error) {
    console.error('Error in Groq API endpoint:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Function to check if a question is a multiple-choice question
function isMultipleChoiceQuestion(question) {
  if (!question) return false;

  // Preprocess the question to fix common OCR issues
  const preprocessedQuestion = question
    .replace(/([a-z])([A-Z])/g, '$1 $2') // Add space between lowercase and uppercase letters
    .replace(/\s*\)\s*/g, ') ') // Normalize spacing around closing parentheses
    .replace(/\s*\.\s*/g, '. '); // Normalize spacing around periods

  console.log("Checking if MCQ:", preprocessedQuestion.substring(0, 100) + '...');

  // Check for common multiple-choice patterns with more flexible spacing
  const mcqPatterns = [
    /\bA\).*\bB\).*\bC\).*\bD\)/i,  // A) option B) option C) option D) option (flexible spacing)
    /\bA\..*\bB\..*\bC\..*\bD\./i,  // A. option B. option C. option D. option (flexible spacing)
    /\b\(A\).*\b\(B\).*\b\(C\).*\b\(D\)/i,  // (A) option (B) option (C) option (D) option (flexible spacing)
    /\b\[A\].*\b\[B\].*\b\[C\].*\b\[D\]/i,  // [A] option [B] option [C] option [D] option (flexible spacing)
    /\ba\).*\bb\).*\bc\).*\bd\)/i,  // a) option b) option c) option d) option (flexible spacing)
    /\ba\..*\bb\..*\bc\..*\bd\./i,  // a. option b. option c. option d. option (flexible spacing)

    // Also check for options on separate lines
    /\bA\)[^\n]*\n[^\n]*\bB\)[^\n]*\n[^\n]*\bC\)[^\n]*\n[^\n]*\bD\)/i,
    /\bA\.[^\n]*\n[^\n]*\bB\.[^\n]*\n[^\n]*\bC\.[^\n]*\n[^\n]*\bD\./i,

    // Check for options without spaces (common OCR issue)
    /A\).*B\).*C\).*D\)/i,
    /A\..*B\..*C\..*D\./i,
    /a\).*b\).*c\).*d\)/i,
    /a\..*b\..*c\..*d\./i
  ];

  // Check if any of the patterns match
  const isMCQ = mcqPatterns.some(pattern => pattern.test(preprocessedQuestion));

  if (isMCQ) {
    console.log("Detected as MCQ question");
  } else {
    console.log("Not detected as MCQ question");
  }

  return isMCQ;
}

// OCR API endpoint
app.post('/api/ocr', async (req, res) => {
  try {
    console.log('OCR API request received');

    // Validate request
    if (!req.body.image) {
      console.error('No image provided in request body');
      return res.status(400).json({ success: false, error: 'No image provided' });
    }

    // Extract parameters
    const isQuestionPaper = req.body.isQuestionPaper === true;
    console.log(`Processing ${isQuestionPaper ? 'question paper' : 'answer sheet'} image`);

    // OCR API key
    const OCR_API_KEY = 'K89937523388957';

    console.log('Using OCR API key:', OCR_API_KEY);
    console.log('Processing image for OCR...');

    // Prepare the form data for the OCR API with optimized parameters
    const formData = new URLSearchParams();
    formData.append('apikey', OCR_API_KEY);
    formData.append('base64Image', req.body.image.replace(/^data:image\/[a-z]+;base64,/, ''));
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

    // Add additional parameters to improve OCR quality
    formData.append('filetype', 'png');
    formData.append('detectCheckbox', 'true'); // Helpful for MCQ detection
    formData.append('scale', 'true');
    formData.append('pagerange', 'all');

    // Make the request to the OCR API
    console.log('Sending request to OCR API...');
    const response = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    });

    // Check if the request was successful
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OCR API error: ${response.status} ${response.statusText}`);
      console.error('Error response:', errorText);
      return res.status(response.status).json({ success: false, error: `OCR API error: ${response.status} ${response.statusText}` });
    }

    // Get response data
    console.log('OCR API response received, parsing JSON...');
    const data = await response.json();
    console.log('OCR processing completed successfully');

    // Check if the OCR was successful
    if (data.IsErroredOnProcessing === false && data.ParsedResults && data.ParsedResults.length > 0) {
      // Get the extracted text
      let extractedText = data.ParsedResults[0].ParsedText;

      // Log the original extracted text for debugging
      console.log('Original OCR text:', extractedText);

      // Post-process the extracted text to improve quality
      extractedText = postProcessOCRText(extractedText, isQuestionPaper);

      // Update the response with the post-processed text
      data.ParsedResults[0].ParsedText = extractedText;

      // Log the post-processed text
      console.log('Post-processed OCR text:', extractedText);
    } else {
      console.error('OCR API Error:', data.ErrorMessage || 'Unknown error');
    }

    // Send the OCR API response with the post-processed text
    res.json(data);
  } catch (error) {
    console.error('Error in OCR API endpoint:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Answer evaluation endpoint
app.post('/api/evaluate-answer', async (req, res) => {
  try {
    console.log('Answer evaluation request received');

    // Extract the model answer and student answer from the request
    const { modelAnswer, studentAnswer } = req.body;

    // Validate the request
    if (!modelAnswer) {
      console.error('No model answer provided');
      return res.status(400).json({ error: 'No model answer provided' });
    }

    if (!studentAnswer) {
      console.error('No student answer provided');
      return res.status(400).json({ error: 'No student answer provided' });
    }

    console.log('Model answer:', modelAnswer.substring(0, 100) + '...');
    console.log('Student answer:', studentAnswer.substring(0, 100) + '...');

    // Extract keywords from the model answer
    // For MCQ questions, the model answer is just a letter (A, B, C, or D)
    const isMCQ = /^[A-Da-d]$/.test(modelAnswer.trim());

    if (isMCQ) {
      console.log('Processing MCQ answer evaluation');

      // For MCQs, just check if the answers match (case-insensitive)
      const normalizedModelAnswer = modelAnswer.trim().toUpperCase();
      const normalizedStudentAnswer = studentAnswer.trim().toUpperCase();

      // Extract just the first letter if the student wrote more than one character
      const studentAnswerLetter = normalizedStudentAnswer.match(/^[A-D]/)?.[0] || normalizedStudentAnswer;

      const isCorrect = studentAnswerLetter === normalizedModelAnswer;
      const totalMarks = 1;
      const obtainedMarks = isCorrect ? 1 : 0;

      console.log(`MCQ evaluation result: ${isCorrect ? 'Correct' : 'Incorrect'}`);
      console.log(`Model answer: ${normalizedModelAnswer}, Student answer: ${studentAnswerLetter}`);

      return res.json({
        totalMarks,
        obtainedMarks,
        matchCount: obtainedMarks,
        keywordsMatched: isCorrect ? [normalizedModelAnswer] : [],
        isCorrect,
        answerType: 'mcq'
      });
    } else {
      console.log('Processing open-ended answer evaluation');

      // For open-ended questions, extract keywords from the model answer
      // First, check if the model answer is already a comma-separated list of keywords
      let modelKeywords;

      if (modelAnswer.includes(',')) {
        // If the model answer contains commas, assume it's already a list of keywords
        modelKeywords = modelAnswer
          .split(',')
          .map(keyword => keyword.trim().toLowerCase())
          .filter(keyword => keyword.length > 0);
      } else {
        // Otherwise, extract keywords by splitting on spaces and removing common words
        modelKeywords = modelAnswer
          .toLowerCase()
          .replace(/[^\w\s]/g, '') // Remove punctuation
          .split(/\s+/)
          .filter(word =>
            word.length > 2 && // Only words longer than 2 characters
            !['the', 'and', 'for', 'are', 'this', 'that', 'with', 'from', 'have', 'has'].includes(word) // Remove common words
          );
      }

      // Remove duplicates from model keywords
      modelKeywords = [...new Set(modelKeywords)];

      console.log('Extracted model keywords:', modelKeywords);

      // Extract keywords from the student answer
      const studentKeywords = studentAnswer
        .toLowerCase()
        .replace(/[^\w\s]/g, '') // Remove punctuation
        .split(/\s+/)
        .filter(word => word.length > 2); // Only words longer than 2 characters

      console.log('Extracted student keywords:', studentKeywords);

      // Count matching keywords
      let matchCount = 0;
      const keywordsMatched = [];

      modelKeywords.forEach(keyword => {
        if (studentKeywords.includes(keyword)) {
          matchCount++;
          keywordsMatched.push(keyword);
        }
      });

      // Calculate marks
      const totalMarks = modelKeywords.length;
      const obtainedMarks = matchCount;
      const percentage = totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0;

      // Determine the result based on the percentage
      let result;
      if (percentage >= 70) {
        result = 'good';
      } else if (percentage >= 40) {
        result = 'average';
      } else {
        result = 'poor';
      }

      console.log(`Evaluation result: ${matchCount} out of ${totalMarks} keywords matched (${percentage.toFixed(2)}%)`);
      console.log(`Result: ${result}`);

      return res.json({
        totalMarks,
        obtainedMarks,
        matchCount,
        keywordsMatched,
        percentage: parseFloat(percentage.toFixed(2)),
        result,
        answerType: 'open-ended'
      });
    }
  } catch (error) {
    console.error('Error evaluating answer:', error);
    res.status(500).json({ error: 'Failed to evaluate answer' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Simple test server running at http://localhost:${PORT}/`);
  console.log('Available endpoints:');
  console.log('- GET  /api/test - Test endpoint');
  console.log('- GET  /api/connectivity - Connectivity check');
  console.log('- POST /api/groq - Groq API endpoint');
  console.log('- POST /api/ocr - OCR API endpoint');
  console.log('- POST /api/evaluate-answer - Answer evaluation endpoint');
  console.log('Using Groq API key: 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');
  console.log('Using OCR API key: K89937523388957');
});
