// Basic server for testing
const http = require('http');

const server = http.createServer((req, res) => {
  console.log(`Request received: ${req.method} ${req.url}`);
  
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }
  
  // Handle different endpoints
  if (req.url === '/api/connectivity' && req.method === 'GET') {
    res.statusCode = 200;
    res.end(JSON.stringify({ connected: true }));
  } 
  else if (req.url === '/api/openai' && req.method === 'POST') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        console.log('OpenAI request:', data);
        
        res.statusCode = 200;
        res.end(JSON.stringify({
          choices: [
            {
              message: {
                content: `This is a model answer for: "${data.prompt || 'Unknown question'}".
                
The answer would typically include key concepts, explanations, and examples.
                
This is a mock response from the basic server.`
              }
            }
          ]
        }));
      } catch (error) {
        console.error('Error parsing request:', error);
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'Invalid request' }));
      }
    });
  }
  else if (req.url === '/api/huggingface' && req.method === 'POST') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        console.log('HuggingFace request:', data);
        
        res.statusCode = 200;
        res.end(JSON.stringify([
          {
            generated_text: `This is a model answer for: "${data.inputs || 'Unknown prompt'}".
            
The answer would typically include key concepts, explanations, and examples.
            
This is a mock response from the basic server.`
          }
        ]));
      } catch (error) {
        console.error('Error parsing request:', error);
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'Invalid request' }));
      }
    });
  }
  else {
    res.statusCode = 404;
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

const PORT = 3000;

server.listen(PORT, () => {
  console.log(`Basic server running at http://localhost:${PORT}/`);
  console.log('Available endpoints:');
  console.log('- GET  /api/connectivity');
  console.log('- POST /api/openai');
  console.log('- POST /api/huggingface');
});
