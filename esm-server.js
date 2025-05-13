// Simple server for Grade Scan Scribe AI using ES modules
import http from 'http';

// Create a server
const server = http.createServer((req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  
  // Set content type to JSON
  res.setHeader('Content-Type', 'application/json');
  
  // Log the request
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  
  // Handle different endpoints
  if (req.url === '/api/openai' && req.method === 'POST') {
    // Read the request body
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        // Parse the request body
        const data = JSON.parse(body);
        console.log('OpenAI request prompt:', data.prompt?.substring(0, 50) + '...');
        
        // Mock OpenAI response
        const mockResponse = {
          choices: [
            {
              message: {
                content: `This is a model answer for: "${data.prompt?.substring(0, 50) || 'Unknown question'}...".

The answer would typically include key concepts, explanations, and examples related to the question.

This is a mock response from the server.`
              }
            }
          ]
        };
        
        res.writeHead(200);
        res.end(JSON.stringify(mockResponse));
      } catch (error) {
        console.error('Error processing request:', error);
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Invalid request' }));
      }
    });
  } 
  else if (req.url === '/api/huggingface' && req.method === 'POST') {
    // Read the request body
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        // Parse the request body
        const data = JSON.parse(body);
        console.log('HuggingFace request inputs:', data.inputs?.substring(0, 50) + '...');
        
        // Mock HuggingFace response
        const mockResponse = [
          {
            generated_text: `This is a model answer for: "${data.inputs?.substring(0, 50) || 'Unknown prompt'}...".

The answer would typically include key concepts, explanations, and examples related to the question.

This is a mock response from the server.`
          }
        ];
        
        res.writeHead(200);
        res.end(JSON.stringify(mockResponse));
      } catch (error) {
        console.error('Error processing request:', error);
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Invalid request' }));
      }
    });
  }
  else if (req.url === '/api/connectivity' && req.method === 'GET') {
    // Mock connectivity response
    res.writeHead(200);
    res.end(JSON.stringify({ connected: true }));
  }
  else {
    // Not found
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found', path: req.url }));
  }
});

// Start the server
const PORT = 3000;
server.listen(PORT, () => {
  console.log('===========================================');
  console.log(`Server running at http://localhost:${PORT}/`);
  console.log('===========================================');
  console.log('Available endpoints:');
  console.log('- GET  /api/connectivity');
  console.log('- POST /api/openai');
  console.log('- POST /api/huggingface');
  console.log('===========================================');
});
