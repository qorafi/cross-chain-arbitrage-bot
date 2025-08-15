/**
 * @file Functions for interacting with DEX smart contracts to get token prices.
 */
const { ethers } = require('ethers');
const logger = require('../utils/logger');

// Minimal ABI for a Uniswap V2-style router. We only need `getAmountsOut`.
const UNISWAP_V2_ROUTER_ABI = [
  'function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)'
];

/**
 * Gets the price of a token on a specific DEX.
 * @param {ethers.Contract} routerContract - The ethers.js contract instance for the DEX router.
 * @param {string} amountIn - The amount of the input token (in its smallest unit, e.g., wei).
 * @param {string} tokenInAddress - The address of the token to sell.
 * @param {string} tokenOutAddress - The address of the token to buy.
 * @returns {Promise<ethers.BigNumber|null>} The amount of the output token, or null if an error occurs.
 */
async function getPrice(routerContract, amountIn, tokenInAddress, tokenOutAddress) {
  try {
    const path = [tokenInAddress, tokenOutAddress];
    // getAmountsOut returns an array of amounts, the first is the input, the second is the output
    const amounts = await routerContract.getAmountsOut(amountIn, path);
    return amounts[1];
  } catch (error) {
    logger.error(`Failed to get price from DEX at ${routerContract.address}`, error);
    return null;
  }
}

module.exports = {
  getPrice,
  UNISWAP_V2_ROUTER_ABI
};
