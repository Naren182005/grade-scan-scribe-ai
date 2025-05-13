// Simple HTTP server without Express
const http = require('http');

// Create HTTP server
const server = http.createServer((req, res) => {
  console.log(`Request received: ${req.method} ${req.url}`);
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // Handle GET request to /test
  if (req.method === 'GET' && req.url === '/test') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Server is working!' }));
    return;
  }
  
  // Handle POST request to /groq
  if (req.method === 'POST' && req.url === '/groq') {
    let body = '';
    
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        console.log('Received data:', data);
        
        // Simple mock response
        const response = {
          choices: [
            {
              message: {
                content: data.prompt.includes('capital of France') ? 'C' : 'This is a mock answer for: ' + data.prompt
              }
            }
          ]
        };
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response));
      } catch (error) {
        console.error('Error processing request:', error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid request' }));
      }
    });
    
    return;
  }
  
  // Handle all other requests
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

// Start server
const PORT = 5000;
server.listen(PORT, () => {
  console.log(`Simple HTTP server running at http://localhost:${PORT}/`);
  console.log('Available endpoints:');
  console.log('- GET /test - Test endpoint');
  console.log('- POST /groq - Mock Groq API endpoint');
});
