import http from 'http'; 
 
const server = http.createServer((req, res) =
  console.log(`Request received: ${req.method} ${req.url}`); 
  res.setHeader('Access-Control-Allow-Origin', '*'); 
  res.writeHead(200, { 'Content-Type': 'application/json' }); 
  res.end(JSON.stringify({ message: 'Server is working!' })); 
}); 
 
const PORT = 3000; 
server.listen(PORT, () =
  console.log(`Server running at http://localhost:${PORT}/`); 
}); 
