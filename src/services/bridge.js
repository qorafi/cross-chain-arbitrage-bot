/**
 * @file Functions for interacting with the Wormhole Token Bridge.
 */
const { ethers } = require('ethers');
const logger = require('../utils/logger');

// Minimal ABI for the Wormhole Token Bridge
const WORMHOLE_BRIDGE_ABI = [
  'function transferTokens(address token, uint256 amount, uint16 recipientChain, bytes32 recipient, uint256 arbiterFee, uint32 nonce) external payable returns (uint64 sequence)'
];

// Standard ERC20 ABI for the approve function
const ERC20_ABI = [
  'function approve(address spender, uint256 amount) external returns (bool)'
];

/**
 * Initiates a token transfer across the Wormhole bridge.
 * @param {ethers.Wallet} sourceWallet - The wallet instance for the source chain.
 * @param {string} bridgeAddress - The address of the Wormhole bridge contract on the source chain.
 * @param {string} tokenAddress - The address of the token to be bridged.
 * @param {ethers.BigNumber} amount - The amount of the token to bridge.
 * @param {number} destinationChainId - The Wormhole-specific ID of the destination chain.
 * @param {string} destinationAddress - The recipient address on the destination chain.
 * @returns {Promise<string|null>} The transaction hash of the bridge transfer, or null on failure.
 */
async function initiateBridgeTransfer(sourceWallet, bridgeAddress, tokenAddress, amount, destinationChainId, destinationAddress) {
  const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, sourceWallet);
  const bridgeContract = new ethers.Contract(bridgeAddress, WORMHOLE_BRIDGE_ABI, sourceWallet);

  try {
    // 1. Approve the bridge to spend the tokens
    logger.info(`Approving bridge contract (${bridgeAddress}) to spend ${ethers.utils.formatUnits(amount, 18)} tokens...`);
    const approveTx = await tokenContract.approve(bridgeAddress, amount);
    await approveTx.wait(); // Wait for the approval transaction to be mined
    logger.info(`Approval successful. Tx: ${approveTx.hash}`);

    // 2. Initiate the bridge transfer
    logger.info(`Initiating bridge transfer to chain ID ${destinationChainId}...`);
    // Convert the recipient address to bytes32, which is required by Wormhole
    const recipientBytes32 = ethers.utils.hexZeroPad(destinationAddress, 32);
    
    // Nonce can be a random number for each transfer
    const nonce = Math.floor(Math.random() * 100000);

    const transferTx = await bridgeContract.transferTokens(
      tokenAddress,
      amount,
      destinationChainId,
      recipientBytes32,
      0, // arbiterFee (set to 0 for this example)
      nonce,
      { gasLimit: 300000 } // Set a reasonable gas limit
    );

    await transferTx.wait();
    logger.info(`Bridge transfer initiated successfully! Tx: ${transferTx.hash}`);
    return transferTx.hash;

  } catch (error) {
    logger.error('Error during bridge transfer process.', error);
    return null;
  }
}

module.exports = {
  initiateBridgeTransfer
};
