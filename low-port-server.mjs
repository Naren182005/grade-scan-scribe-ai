// HTTP server that uses a low port number
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

// Start server on port 3000
const PORT = 3000;

try {
  server.listen(PORT, () => {
    console.log(`HTTP server running at http://localhost:${PORT}/`);
    console.log('Server will respond to any request with a simple JSON message');
    console.log('Press Ctrl+C to stop the server');
  });
} catch (error) {
  console.error('Error starting server:', error);
}
