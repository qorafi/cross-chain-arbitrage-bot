/**
 * @file Logging utility that outputs to console and emits to a socket for the UI.
 */

function emitLog(socket, type, message) {
  if (socket && socket.emit) {
    socket.emit('log', { type, message });
  }
}

const logger = {
  info: (message, socket = null) => {
    console.log(`[${new Date().toISOString()}] INFO: ${message}`);
    emitLog(socket, 'info', message);
  },
  warn: (message, socket = null) => {
    console.warn(`[${new Date().toISOString()}] WARN: ${message}`);
    emitLog(socket, 'warn', message);
  },
  error: (message, error, socket = null) => {
    console.error(`[${new Date().toISOString()}] ERROR: ${message}`, error || '');
    emitLog(socket, 'error', message);
  },
  opportunity: (message, socket = null) => {
    const formattedMessage = `[${new Date().toISOString()}] OPPORTUNITY: ${message}`;
    console.log(`\x1b[32m${formattedMessage}\x1b[0m`);
    emitLog(socket, 'opportunity', message);
  }
};

module.exports = logger;
