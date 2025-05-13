// Very basic Express server for testing connectivity
const express = require('express');
const cors = require('cors');

// Create Express app
const app = express();
const PORT = 4000; // Using a different port

// Middleware
app.use(express.json());
app.use(cors());

// Simple test endpoint
app.get('/test', (req, res) => {
  console.log('Test endpoint requested');
  res.json({ message: 'Server is working!' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Basic test server running at http://localhost:${PORT}/`);
  console.log('Available endpoints:');
  console.log('- GET /test - Test endpoint');
});
