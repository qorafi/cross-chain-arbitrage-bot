/**
 * @file Core logic for identifying and acting on arbitrage opportunities.
 */
const { ethers } = require('ethers');
const logger = require('../utils/logger');
const { getPrice, UNISWAP_V2_ROUTER_ABI } = require('../services/dex');
const { walletA, walletB } = require('../services/blockchain');
const config = require('../../config/default.json');

// Initialize DEX router contracts
const routerA = new ethers.Contract(config.chainA.dexRouterAddress, UNISWAP_V2_ROUTER_ABI, walletA);
const routerB = new ethers.Contract(config.chainB.dexRouterAddress, UNISWAP_V2_ROUTER_ABI, walletB);

/**
 * Checks for arbitrage opportunities and executes a trade if one is found.
 */
async function checkArbitrage() {
  logger.info('Checking for arbitrage opportunities...');

  const { tokenToTradeAddress, tradeAmountUSD, profitThresholdPercentage } = config.tradeSettings;
  // NOTE: This assumes USDC has 6 decimals. This should be handled dynamically in a real bot.
  const amountInUSDC = ethers.utils.parseUnits(tradeAmountUSD.toString(), 6); 

  // --- Get prices from both chains ---
  // Price on Chain A: How much WETH can we get for our USDC?
  const amountOutA = await getPrice(routerA, amountInUSDC, config.chainA.usdcAddress, tokenToTradeAddress);
  // Price on Chain B: How much WETH can we get for our USDC?
  const amountOutB = await getPrice(routerB, amountInUSDC, config.chainB.usdcAddress, tokenToTradeAddress);

  if (!amountOutA || !amountOutB) {
    logger.warn('Could not retrieve prices from one or both DEXs. Skipping this check.');
    return;
  }
  
  logger.info(`Chain A: ${tradeAmountUSD} USDC => ${ethers.utils.formatEther(amountOutA)} WETH`);
  logger.info(`Chain B: ${tradeAmountUSD} USDC => ${ethers.utils.formatEther(amountOutB)} WETH`);

  // --- Profitability Calculation ---
  // This is a simplified calculation. A real bot needs to estimate gas and bridge fees accurately.
  const estimatedFeesUSD = 75.0; // Highly variable placeholder for gas and bridge fees

  let potentialProfit = 0;
  let tradeDescription = '';

  // Compare the amounts of WETH we can get on each chain
  if (amountOutA.gt(amountOutB)) {
    // More WETH on Chain A, means WETH is cheaper on Chain A.
    // Opportunity: Buy on A, sell on B.
    // To calculate profit, we need to see how much USDC we get back on Chain B for the WETH we bought on A.
    const revenueOnB = await getPrice(routerB, amountOutA, tokenToTradeAddress, config.chainB.usdcAddress);
    if (revenueOnB) {
      potentialProfit = parseFloat(ethers.utils.formatUnits(revenueOnB, 6)) - tradeAmountUSD;
      tradeDescription = `Buy WETH on ${config.chainA.name}, Sell on ${config.chainB.name}`;
    }
  } else if (amountOutB.gt(amountOutA)) {
    // More WETH on Chain B, means WETH is cheaper on Chain B.
    // Opportunity: Buy on B, sell on A.
    const revenueOnA = await getPrice(routerA, amountOutB, tokenToTradeAddress, config.chainA.usdcAddress);
    if (revenueOnA) {
      potentialProfit = parseFloat(ethers.utils.formatUnits(revenueOnA, 6)) - tradeAmountUSD;
      tradeDescription = `Buy WETH on ${config.chainB.name}, Sell on ${config.chainA.name}`;
    }
  }

  const netProfit = potentialProfit - estimatedFeesUSD;
  const profitPercentage = (netProfit / tradeAmountUSD) * 100;

  if (netProfit > 0) {
    logger.info(`Potential Profit Found: $${netProfit.toFixed(2)} (${profitPercentage.toFixed(2)}%) | ${tradeDescription}`);

    if (profitPercentage > profitThresholdPercentage) {
      logger.opportunity(`PROFITABLE OPPORTUNITY DETECTED! Threshold: >${profitThresholdPercentage}%. Found: ${profitPercentage.toFixed(2)}%`);
      // --- EXECUTE TRADE ---
      // In a real application, you would call a function here to execute the buy, bridge, and sell transactions.
      // executeTrade(tradeDetails);
    }
  } else {
    logger.info('No profitable opportunity found this cycle.');
  }
}

module.exports = {
  checkArbitrage
};
