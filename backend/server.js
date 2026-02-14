require('dotenv').config();
const app = require('./src/app');
const http = require('http');
const { Server } = require("socket.io");
const { connectDB } = require('./src/config/db');
const { connectRedis } = require('./src/config/redis');

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all for dev, restrict in prod
    methods: ["GET", "POST"]
  }
});

// Store io instance in app for use in routes
app.set('io', io);

async function startServer() {
  try {
    await connectDB();
    await connectRedis();

    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });

    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start Trading Loop
const tradingLoop = require('./src/services/mainLoop');
// tradingLoop.start(); // Commented out to prevent auto-start during dev without DB

startServer();
