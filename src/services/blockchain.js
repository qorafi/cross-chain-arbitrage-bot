/**
 * @file Handles blockchain connections, providers, and wallet setup.
 */

// Load environment variables from .env file
require('dotenv').config();
const { ethers } = require('ethers');
const logger = require('../utils/logger');

// Ensure all required environment variables are set
if (!process.env.PRIVATE_KEY || !process.env.CHAIN_A_RPC_URL || !process.env.CHAIN_B_RPC_URL) {
  logger.error('Missing required environment variables. Please check your .env file.');
  process.exit(1);
}

// Setup provider for Chain A (e.g., Ethereum)
const providerA = new ethers.providers.JsonRpcProvider(process.env.CHAIN_A_RPC_URL);
const walletA = new ethers.Wallet(process.env.PRIVATE_KEY, providerA);

// Setup provider for Chain B (e.g., Polygon)
const providerB = new ethers.providers.JsonRpcProvider(process.env.CHAIN_B_RPC_URL);
const walletB = new ethers.Wallet(process.env.PRIVATE_KEY, providerB);

logger.info(`Connected to Chain A. Wallet address: ${walletA.address}`);
logger.info(`Connected to Chain B. Wallet address: ${walletB.address}`);

module.exports = {
  providerA,
  walletA,
  providerB,
  walletB,
};
