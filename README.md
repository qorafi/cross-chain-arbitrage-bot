# Cross-Chain Arbitrage Bot

## ⚠️ Disclaimer
This project is for educational purposes only. Cryptocurrency arbitrage is extremely risky and complex. You can lose money due to price volatility, transaction fees (gas), network latency, slippage, and smart contract bugs. Do not use this code with real funds unless you fully understand the risks and have thoroughly tested it.

## Overview
This project is a Node.js-based bot designed to identify and execute cross-chain arbitrage opportunities between two decentralized exchanges (DEXs) on different EVM-compatible blockchains (e.g., Ethereum and Polygon).

The bot continuously monitors the price of a specific token pair on both chains. When a profitable price discrepancy is found (after accounting for all transaction fees), it automatically executes a series of transactions to capitalize on the opportunity.

## How It Works
The bot's core logic follows these steps:

Price Monitoring: The bot connects to two different blockchains via RPC providers and constantly fetches the price of a target asset (e.g., WETH) from a specified DEX on each chain.

Profitability Calculation: It calculates the potential profit from buying on the cheaper exchange and selling on the more expensive one. This calculation includes estimated costs for:

Gas fees for the "buy" transaction on the source chain.

Fees for using a cross-chain bridge.

Gas fees for the "sell" transaction on the destination chain.

Opportunity Check: If the calculated net profit exceeds a user-defined threshold (e.g., 0.5%), it flags an arbitrage opportunity.

Automated Execution: The bot executes the trade sequence:

Buys the asset on the source chain.

Bridges the asset to the destination chain.

Sells the asset on the destination chain.

## Project Structure
A clean and modular structure is used to separate the different parts of the application.

```
├── src/
│   ├── main.js             # Main entry point, contains the primary monitoring loop.
│   ├── services/
│   │   ├── blockchain.js   # Handles connections to RPC providers and ethers.js setup.
│   │   ├── dex.js          # Functions for interacting with DEX smart contracts (e.g., getting prices).
│   │   └── bridge.js       # Functions for interacting with cross-chain bridge contracts.
│   ├── core/
│   │   ├── arbitrage.js    # The core logic for checking profitability and executing trades.
│   │   └── transactions.js # Helper functions for building and sending transactions.
│   └── utils/
│       └── logger.js       # Utility for logging messages to the console.
│
├── config/
│   └── default.json        # Configuration for tokens, contracts, and thresholds.
│
├── .env                    # Environment variables (API keys, private key).
├── .gitignore              # Files to be ignored by Git.
├── package.json            # Project dependencies and scripts.
└── README.md               # This file.

```

## Getting Started
Prerequisites
Node.js (v18 or later)

npm or Yarn

An RPC Provider URL for each blockchain (e.g., from Infura or Alchemy).

A blockchain wallet's private key with funds on both chains for gas and trading.

Installation
Clone the repository:

git clone https://github.com/your-username/cross-chain-arbitrage-bot.git
cd cross-chain-arbitrage-bot

Install dependencies:

npm install

Set up environment variables:
Create a file named .env in the root of the project and add the following variables. Never commit this file to GitHub.

# Your wallet's private key (without the '0x' prefix)
PRIVATE_KEY="YOUR_WALLET_PRIVATE_KEY"

# RPC Provider URLs
CHAIN_A_RPC_URL="https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID"
CHAIN_B_RPC_URL="https://polygon-mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID"

Configuration
All trading parameters are located in config/default.json. Here you can define which tokens, DEXs, and bridges to use, as well as the profitability threshold.
```bash
{
  "chainA": {
    "name": "Ethereum",
    "dexRouterAddress": "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D", // Uniswap V2 on Ethereum
    "usdcAddress": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
  },
  "chainB": {
    "name": "Polygon",
    "dexRouterAddress": "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff", // QuickSwap on Polygon
    "usdcAddress": "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"
  },
  "tradeSettings": {
    "tokenToTradeAddress": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // WETH on Ethereum
    "tradeAmountUSD": 1000,
    "profitThresholdPercentage": 0.5
  }
}
```
## Usage
To start the bot, run the following command from the project's root directory:

npm start

The bot will initialize and begin monitoring prices. All activity, including potential opportunities and executed trades, will be logged to the console.

---
