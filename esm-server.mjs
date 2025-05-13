// Minimal HTTP server using ES modules
import http from 'http';

// Create HTTP server
const server = http.createServer((req, res) => {
  console.log(`Request received: ${req.method} ${req.url}`);
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  // Simple response for all requests
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ 
    message: 'Server is working!',
    method: req.method,
    url: req.url,
    time: new Date().toISOString()
  }));
});

// Start server on port 8000
const PORT = 8000;
server.listen(PORT, () => {
  console.log(`Minimal HTTP server running at http://localhost:${PORT}/`);
  console.log('Server will respond to any request with a simple JSON message');
  console.log('Press Ctrl+C to stop the server');
});
