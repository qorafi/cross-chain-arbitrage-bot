/**
 * @file Handles the execution of a full arbitrage trade sequence.
 */
const { ethers } = require('ethers');
const logger = require('../utils/logger');
const { initiateBridgeTransfer } = require('../services/bridge');
const { UNISWAP_V2_ROUTER_ABI } = require('../services/dex');

// Minimal ABI for the swap function we need
const SWAP_ABI = [
  'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)'
];

/**
 * Executes a full arbitrage trade.
 * @param {object} tradePlan - An object containing the details of the trade.
 */
async function executeTrade(tradePlan) {
  const { sourceWallet, sourceRouterAddress, sourceToken, destToken, amountIn, expectedAmountOut, bridgeConfig } = tradePlan;

  const routerContract = new ethers.Contract(sourceRouterAddress, SWAP_ABI, sourceWallet);

  try {
    // --- Step 1: Buy the target token on the source chain ---
    logger.info(`Executing buy order on ${bridgeConfig.sourceChainName}...`);
    const path = [sourceToken.address, destToken.address];
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes from now

    const swapTx = await routerContract.swapExactTokensForTokens(
      amountIn,
      expectedAmountOut.mul(99).div(100), // Accept 1% slippage
      path,
      sourceWallet.address,
      deadline
    );
    const receipt = await swapTx.wait();
    logger.info(`Buy transaction successful! Tx: ${swapTx.hash}`);

    // --- Step 2: Bridge the newly acquired tokens ---
    // In a real scenario, you'd parse the transaction receipt to get the exact amount of tokens received.
    // For simplicity, we'll use the expected amount.
    const bridgeTxHash = await initiateBridgeTransfer(
      sourceWallet,
      bridgeConfig.bridgeAddress,
      destToken.address,
      expectedAmountOut,
      bridgeConfig.destinationChainId,
      sourceWallet.address // Sending to our own address on the other chain
    );

    if (bridgeTxHash) {
      logger.info('--- TRADE SEQUENCE INITIATED ---');
      logger.warn('Next Steps (Manual / Advanced Bot):');
      logger.warn(`1. Use the bridge Tx hash (${bridgeTxHash}) to fetch the VAA from a Wormhole block explorer.`);
      logger.warn('2. Submit the VAA to the Wormhole contract on the destination chain to redeem the tokens.');
      logger.warn('3. Execute the sell order on the destination DEX.');
    } else {
      logger.error('Trade sequence failed at the bridging step.');
    }

  } catch (error) {
    logger.error('An error occurred during trade execution.', error);
  }
}

module.exports = {
  executeTrade
};
