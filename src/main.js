/**
 * @file Main entry point for the arbitrage bot.
 */
const logger = require('./utils/logger');
const { checkArbitrage } = require('./core/arbitrage');

const POLLING_INTERVAL_MS = 30000; // 30 seconds

async function main() {
  logger.info('🚀 Starting Cross-Chain Arbitrage Bot...');
  
  // Perform an initial check immediately
  await checkArbitrage();

  // Set up a recurring check at the specified interval
  setInterval(async () => {
    try {
      await checkArbitrage();
    } catch (error) {
      logger.error('An unexpected error occurred in the main loop.', error);
    }
  }, POLLING_INTERVAL_MS);
}

main().catch((error) => {
  logger.error('Bot failed to start.', error);
  process.exit(1);
});
