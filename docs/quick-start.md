# Quick Start Guide

This guide will get you up and running with Tribes by Astrix in minutes.

## Prerequisites

- Node.js v16+
- Yarn or npm
- An Ethereum wallet (MetaMask, etc.)
- Basic understanding of blockchain and web3

## Installation

1. Clone the repository:

```bash
git clone https://github.com/Wasserstoff-Innovation/TribesByAstrix.git
cd TribesByAstrix
```

2. Install dependencies:

```bash
yarn install
```

3. Set up environment variables:

Create a `.env` file in the project root based on `.env.example`:

```env
PRIVATE_KEY=your_private_key
LINEA_SEPOLIA_RPC_URL=https://rpc.sepolia.linea.build
```

## Deploy Contracts

Deploy the contracts to Linea Sepolia testnet:

```bash
npx hardhat run scripts/tribes-manager.js --network lineaSepolia
```

This script will deploy all necessary contracts and save their addresses to the `deployments` directory.

## Set Up a Test Tribe

After deploying contracts, you can create a test tribe:

```bash
npx hardhat run scripts/create-test-tribe.ts --network lineaSepolia
```

Then set up a tribe token using one of these methods:

```bash
# Using the Hardhat script (recommended for beginners)
npx hardhat run scripts/setup-tribe-token.ts --network lineaSepolia

# OR using the example script for a more detailed approach
npx ts-node examples/sdk-usage/tribe-token-setup.ts
```

This will:
1. Create a new tribe
2. Set up the tribe token
3. Configure points for various actions

## Using the SDK

Add the SDK to your project:

```bash
npm install @wasserstoff/tribes-sdk
```

Initialize and use the SDK:

```typescript
import { AstrixSDK } from '@wasserstoff/tribes-sdk';
import { ethers } from 'ethers';

// Initialize with provider and network info
const provider = new ethers.JsonRpcProvider('https://rpc.sepolia.linea.build');
const sdk = new AstrixSDK({
  provider,
  chainId: 59141 // Linea Sepolia
});

// Initialize for read operations
await sdk.init();

// Connect wallet for write operations
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
await sdk.connect(wallet);

// Create a tribe
const tribeId = await sdk.tribes.createTribe({
  name: "My Amazing Tribe",
  metadata: JSON.stringify({
    description: "A community for blockchain enthusiasts",
    logoUrl: "https://example.com/logo.png",
    coverImageUrl: "https://example.com/cover.png",
    visibility: "PUBLIC"
  })
});

console.log(`Created tribe with ID: ${tribeId}`);
```

## Next Steps

- [Detailed Installation Guide](./installation.md)
- [SDK Documentation](./sdk/index.md)
- [Architecture Overview](./architecture.md)
- [Working with Tokens](./features/tokens.md) 