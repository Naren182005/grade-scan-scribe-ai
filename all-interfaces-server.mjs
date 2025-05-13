// HTTP server that listens on all interfaces
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

// Start server on port 8000 and listen on all interfaces (0.0.0.0)
const PORT = 8000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`HTTP server running at http://0.0.0.0:${PORT}/`);
  console.log(`Try accessing: http://localhost:${PORT}/ or http://127.0.0.1:${PORT}/`);
  console.log('Server will respond to any request with a simple JSON message');
  console.log('Press Ctrl+C to stop the server');
});
