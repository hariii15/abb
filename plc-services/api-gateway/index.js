const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { Server } = require('socket.io');
const http = require('http');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

const PORT = 4000;

// Routing requests to respective services
const routes = {
  '/api/plc': 'http://localhost:4010',
  '/api/sensor': 'http://localhost:4020',
  '/api/motor': 'http://localhost:4030',
  '/api/conveyor': 'http://localhost:4040',
  '/api/robot': 'http://localhost:4050',
  '/api/alarm': 'http://localhost:4060',
  '/api/energy': 'http://localhost:4070',
  '/api/notification': 'http://localhost:4080',
};

// Setup proxies
for (const [route, target] of Object.entries(routes)) {
  app.use(route, createProxyMiddleware({ target, changeOrigin: true, pathRewrite: { [`^${route}`]: '' } }));
}

app.get('/api/services', (req, res) => {
  res.json({ message: 'API Gateway is running', services: Object.keys(routes) });
});

io.on('connection', (socket) => {
  console.log('Client connected to websocket:', socket.id);
  
  // Forward events from dashboard to internal services
  socket.on('command', (data) => {
    console.log('Command received:', data);
    // You could forward this to the PLC controller via HTTP or WS
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});
