/**
 * @file A simple logging utility for consistent, timestamped console output.
 */

const logger = {
  info: (message) => {
    console.log(`[${new Date().toISOString()}] INFO: ${message}`);
  },
  warn: (message) => {
    console.warn(`[${new Date().toISOString()}] WARN: ${message}`);
  },
  error: (message, error) => {
    console.error(`[${new Date().toISOString()}] ERROR: ${message}`, error || '');
  },
  opportunity: (message) => {
    // Special color for highlighting opportunities
    console.log(`\x1b[32m[${new Date().toISOString()}] OPPORTUNITY: ${message}\x1b[0m`);
  }
};

module.exports = logger;
