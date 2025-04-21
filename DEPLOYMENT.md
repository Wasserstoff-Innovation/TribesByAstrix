# Deployment and Testing Guide

This guide provides instructions for deploying the Tribes by Astrix contracts and updating the SDK with the deployed contract addresses.

## Table of Contents

1. [Local Testing and Development](#local-testing-and-development)
2. [Testnet Deployment (Monad Devnet)](#testnet-deployment-monad-devnet)
3. [Mainnet Deployment](#mainnet-deployment)
4. [Upgrading Contracts](#upgrading-contracts)
5. [SDK Integration](#sdk-integration)

## Local Testing and Development

### Quick Start

For a quick end-to-end test of the contracts and SDK on a local development network, run:

```bash
npm run test:local
```

This will:
1. Start a local Hardhat node
2. Deploy all contracts to the local network
3. Save deployment addresses to `deployments/local-latest.json`
4. Update the SDK's contract addresses configuration
5. Build the SDK
6. Run a simple test script to verify functionality

### Manual Testing Steps

If you prefer to run each step manually:

1. Start a local Hardhat node:
   ```bash
   npx hardhat node
   ```

2. Deploy contracts:
   ```bash
   npx hardhat run scripts/deploy-upgradeable.ts --network localhost
   ```

3. Save deployment addresses:
   ```bash
   npm run save:deployment:local
   ```

4. Update SDK contract addresses:
   ```bash
   npm run update:sdk:local
   ```

5. Build the SDK:
   ```bash
   npm run build:sdk
   ```

## Testnet Deployment (Monad Devnet)

### Prerequisites

Before deploying to Monad Devnet, ensure:
1. You have ETH in your deployer account on the Monad Devnet
2. Your `.env` file contains the correct private key and RPC URL

### Deployment Steps

1. Deploy all contracts:
   ```bash
   npm run deploy:testnet
   ```

2. Save deployment addresses:
   ```bash
   npm run save:deployment:testnet
   ```

3. Update SDK contract addresses:
   ```bash
   npm run update:sdk:testnet
   ```

4. Build the SDK with updated addresses:
   ```bash
   npm run build:sdk
   ```

5. Verify contracts on the block explorer:
   ```bash
   # For each contract
   npx hardhat verify --network monadDevnet <CONTRACT_IMPLEMENTATION_ADDRESS>
   ```

## Mainnet Deployment

### Preparation

1. Conduct a thorough security audit of all contracts
2. Test extensively on testnets
3. Ensure you have sufficient ETH for deployment gas fees
4. Back up your deployment wallet private key securely

### Deployment Process

The mainnet deployment process is similar to testnet, but with additional precautions:

1. First deploy to a staging environment with the same configuration as mainnet
2. Verify all functions work as expected
3. Deploy to mainnet with a multi-signature wallet as the contract owner
4. Save deployment addresses
5. Update SDK configuration
6. Verify all contracts on block explorer

## Upgrading Contracts

The contracts use the OpenZeppelin Upgrades plugin to support upgradeable contracts.

### Upgrade Process

1. Make changes to the contract implementation
2. Ensure storage layout compatibility with the previous version
3. Run tests to verify the upgraded contract works correctly
4. Execute the upgrade:
   ```bash
   # For testnet
   npm run upgrade:testnet
   
   # For local network
   npx hardhat run scripts/upgrade-contract.ts --network localhost
   ```

5. Save the new implementation addresses:
   ```bash
   npm run save:deployment:testnet
   ```

6. Update the SDK if necessary:
   ```bash
   npm run update:sdk:testnet
   ```

### Storage Layout Compatibility

When upgrading contracts, be aware of storage layout constraints:
- Never remove storage variables
- Never change variable types
- Always add new variables at the end of the contract
- Use the OpenZeppelin storage gap pattern for future-proofing

## SDK Integration

The SDK needs to be updated with the correct contract addresses after deployment.

### Manual Address Updates

If you need to manually update contract addresses:

1. Edit `sdk/src/config/contracts.ts`
2. Update the addresses in the appropriate network section
3. Build the SDK:
   ```bash
   npm run build:sdk
   ```

### Using the SDK in Your Application

Install the SDK from npm or from a local folder:

```bash
# From npm (when published)
npm install tribes-by-astrix-sdk

# From local folder
npm install ../path/to/tribes-by-astrix/sdk
```

Initialize the SDK in your application:

```typescript
import { AstrixSDK } from 'tribes-by-astrix-sdk';
import { ethers } from 'ethers';

async function initializeSDK() {
  // Create provider
  const provider = new ethers.JsonRpcProvider('https://rpc.monad.xyz/devnet');
  
  // Initialize SDK
  const sdk = new AstrixSDK({
    provider,
    chainId: 20143, // Monad Devnet
    verbose: true // Optional debugging
  });
  
  // Initialize contract addresses
  await sdk.init();
  
  // Connect a wallet for writing operations
  const wallet = new ethers.Wallet('YOUR_PRIVATE_KEY', provider);
  await sdk.connect(wallet);
  
  return sdk;
}

// Use the SDK
async function example() {
  const sdk = await initializeSDK();
  
  // Use SDK methods
  const tribeDetails = await sdk.tribes.getTribeDetails(1);
  console.log('Tribe details:', tribeDetails);
}
```

### Troubleshooting SDK Issues

If you encounter issues with the SDK, refer to the [Troubleshooting Guide](./TROUBLESHOOTING.md). 