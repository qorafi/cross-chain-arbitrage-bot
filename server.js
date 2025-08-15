/**
 * @file Main entry point for the arbitrage bot server.
 */
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const path = require('path');
const logger = require('./src/utils/logger');
const { checkArbitrage } = require('./src/core/arbitrage');

const PORT = process.env.PORT || 3000;
const POLLING_INTERVAL_MS = 30000; // 30 seconds

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve the static frontend files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
  logger.info('🚀 A user connected to the UI.', socket);

  // Start the arbitrage checking loop for this user
  const arbitrageInterval = setInterval(() => {
    checkArbitrage(socket); // Pass the socket to the core logic
  }, POLLING_INTERVAL_MS);

  // Initial check
  checkArbitrage(socket);

  socket.on('disconnect', () => {
    logger.info('A user disconnected.');
    clearInterval(arbitrageInterval);
  });
});

server.listen(PORT, () => {
  console.log(`\nServer is running.`);
  console.log(`Open http://localhost:${PORT} in your browser to see the UI.\n`);
  logger.info(`Server listening on port ${PORT}`);
});
