/**
 * @file Core logic for identifying and acting on arbitrage opportunities.
 */
const { ethers } = require('ethers');
const logger = require('../utils/logger');
const { getPrice, UNISWAP_V2_ROUTER_ABI } = require('../services/dex');
const { walletA, walletB } = require('../services/blockchain');
const { executeTrade } = require('./transactions'); // Import executeTrade
const config = require('../../config/default.json');

// State to prevent multiple simultaneous trades
let isExecutingTrade = false;

// Initialize DEX router contracts
const routerA = new ethers.Contract(config.chainA.dexRouterAddress, UNISWAP_V2_ROUTER_ABI, walletA);
const routerB = new ethers.Contract(config.chainB.dexRouterAddress, UNISWAP_V2_ROUTER_ABI, walletB);

/**
 * Checks for arbitrage opportunities and executes a trade if one is found.
 */
async function checkArbitrage() {
  if (isExecutingTrade) {
    logger.info('Currently executing a trade, skipping check.');
    return;
  }
  logger.info('Checking for arbitrage opportunities...');

  const { tokenToTradeAddress, tradeAmountUSD, profitThresholdPercentage } = config.tradeSettings;
  const amountInUSDC = ethers.utils.parseUnits(tradeAmountUSD.toString(), 6);

  const amountOutA = await getPrice(routerA, amountInUSDC, config.chainA.usdcAddress, tokenToTradeAddress);
  const amountOutB = await getPrice(routerB, amountInUSDC, config.chainB.usdcAddress, tokenToTradeAddress);

  if (!amountOutA || !amountOutB) {
    logger.warn('Could not retrieve prices from one or both DEXs. Skipping this check.');
    return;
  }

  logger.info(`Chain A: ${tradeAmountUSD} USDC => ${ethers.utils.formatEther(amountOutA)} WETH`);
  logger.info(`Chain B: ${tradeAmountUSD} USDC => ${ethers.utils.formatEther(amountOutB)} WETH`);

  const estimatedFeesUSD = 75.0;
  let tradePlan = null;

  if (amountOutA.gt(amountOutB)) {
    const revenueOnB = await getPrice(routerB, amountOutA, tokenToTradeAddress, config.chainB.usdcAddress);
    if (revenueOnB) {
      const potentialProfit = parseFloat(ethers.utils.formatUnits(revenueOnB, 6)) - tradeAmountUSD;
      const netProfit = potentialProfit - estimatedFeesUSD;
      const profitPercentage = (netProfit / tradeAmountUSD) * 100;

      if (profitPercentage > profitThresholdPercentage) {
        logger.opportunity(`PROFITABLE: Buy on ${config.chainA.name}, Sell on ${config.chainB.name}. Net Profit: ~${profitPercentage.toFixed(2)}%`);
        tradePlan = {
          sourceWallet: walletA,
          sourceRouterAddress: config.chainA.dexRouterAddress,
          sourceToken: { address: config.chainA.usdcAddress, decimals: 6 },
          destToken: { address: tokenToTradeAddress, decimals: 18 },
          amountIn: amountInUSDC,
          expectedAmountOut: amountOutA,
          bridgeConfig: {
            sourceChainName: config.chainA.name,
            bridgeAddress: config.chainA.wormholeTokenBridgeAddress,
            destinationChainId: config.chainB.wormholeChainId,
          }
        };
      }
    }
  } else if (amountOutB.gt(amountOutA)) {
    const revenueOnA = await getPrice(routerA, amountOutB, tokenToTradeAddress, config.chainA.usdcAddress);
    if (revenueOnA) {
      const potentialProfit = parseFloat(ethers.utils.formatUnits(revenueOnA, 6)) - tradeAmountUSD;
      const netProfit = potentialProfit - estimatedFeesUSD;
      const profitPercentage = (netProfit / tradeAmountUSD) * 100;

      if (profitPercentage > profitThresholdPercentage) {
        logger.opportunity(`PROFITABLE: Buy on ${config.chainB.name}, Sell on ${config.chainA.name}. Net Profit: ~${profitPercentage.toFixed(2)}%`);
        tradePlan = {
          sourceWallet: walletB,
          sourceRouterAddress: config.chainB.dexRouterAddress,
          sourceToken: { address: config.chainB.usdcAddress, decimals: 6 },
          destToken: { address: tokenToTradeAddress, decimals: 18 },
          amountIn: amountInUSDC,
          expectedAmountOut: amountOutB,
          bridgeConfig: {
            sourceChainName: config.chainB.name,
            bridgeAddress: config.chainB.wormholeTokenBridgeAddress,
            destinationChainId: config.chainA.wormholeChainId,
          }
        };
      }
    }
  }

  if (tradePlan) {
    isExecutingTrade = true;
    await executeTrade(tradePlan);
    isExecutingTrade = false; // Reset after execution attempt
  } else {
    logger.info('No profitable opportunity found this cycle.');
  }
}

module.exports = {
  checkArbitrage
};
