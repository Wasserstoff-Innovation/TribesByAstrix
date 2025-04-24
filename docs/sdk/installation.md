# SDK Installation & Setup

This guide will walk you through the process of installing and configuring the Tribes by Astrix SDK for your project.

## Installation

Install the Tribes by Astrix SDK using npm:

```bash
npm install @wasserstoff/tribes-sdk
```

Or using yarn:

```bash
yarn add @wasserstoff/tribes-sdk
```

The SDK requires ethers.js v6 as a peer dependency:

```bash
npm install ethers@6.11.1
```

## Basic Configuration

Import and initialize the SDK in your application:

```typescript
import { AstrixSDK } from '@wasserstoff/tribes-sdk';
import { JsonRpcProvider } from 'ethers';

// Initialize the SDK with a provider
const provider = new JsonRpcProvider('https://rpc.sepolia.linea.build');
const sdk = new AstrixSDK({
  provider,
  chainId: 59141, // Linea Sepolia
  verbose: true // Optional debug logging
});

// Check connection
const network = await sdk.getNetworkInfo();
console.log(`Connected to ${network.name} (Chain ID: ${network.chainId})`);
```

## Wallet Connection

Connect a wallet for transactions that require signing:

```typescript
// Browser environment with MetaMask
async function connectWallet() {
  // Request account access if needed
  await window.ethereum.request({ method: 'eth_requestAccounts' });
  
  // Create a provider and signer
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  
  // Connect the signer to the SDK
  await sdk.connect(signer);
  
  console.log('Wallet connected:', await signer.getAddress());
  return signer;
}

// For Node.js or server environments
import { Wallet } from 'ethers';

// Using a private key (secure this appropriately!)
const privateKey = process.env.PRIVATE_KEY;
const provider = new JsonRpcProvider('https://rpc.sepolia.linea.build');
const wallet = new Wallet(privateKey, provider);

// Connect the wallet to the SDK
await sdk.connect(wallet);
```

## Environment-Specific Configuration

### Development Environment

```typescript
const sdk = new AstrixSDK({
  provider: new JsonRpcProvider('https://rpc.sepolia.linea.build'),
  chainId: 59141, // Linea Sepolia testnet
  verbose: true,  // Enable debug logging
});
```

### Production Environment

```typescript
const sdk = new AstrixSDK({
  provider: new JsonRpcProvider('https://linea-mainnet.infura.io/v3/YOUR_API_KEY'),
  chainId: 59144, // Linea Mainnet
  verbose: false, // Disable debug logging
});
```

## Advanced Configuration

### Custom Contract Addresses

If you're working with custom contract deployments:

```typescript
const sdk = new AstrixSDK({
  provider,
  chainId: 59141,
  contracts: {
    roleManager: '0x123...',
    tribeController: '0x456...',
    astrixPointSystem: '0x789...',
    // Other contract addresses as needed
  }
});
```

### Error Handling

The SDK will throw specific error types for different issues. It's recommended to handle these appropriately:

```typescript
try {
  const result = await sdk.tribes.createTribe(/* ... */);
  // Process result
} catch (error) {
  if (error.code === 'UNAUTHORIZED') {
    // Handle authentication issues
  } else if (error.code === 'CONTRACT_ERROR') {
    // Handle blockchain contract errors
  } else {
    // Handle other errors
  }
}
```

## Setting Up Tribe Tokens

After creating a tribe, you can set up a tribe token to enable a token economy within your tribe:

```typescript
// Create a tribe token 
await sdk.points.createTribeToken({
  tribeId: 1, // Your tribe ID
  name: "Community Token",
  symbol: "COMM"
});

// Set exchange rate (tribe tokens per 1 Astrix token)
await sdk.points.setExchangeRate({
  tribeId: 1,
  rate: 100 // 100 tribe tokens per 1 Astrix token
});

// Set points for different actions
await sdk.points.setActionPoints({
  tribeId: 1,
  actionType: "POST_ACTION", // Available actions: POST_ACTION, COMMENT_ACTION, LIKE_ACTION
  points: 50
});

// Check if token was set up correctly
const tokenAddress = await sdk.points.getTribeTokenAddress(1);
console.log(`Tribe token address: ${tokenAddress}`);
```

You can also use the provided `setup-tribe-token.ts` script in the scripts directory to set up a tribe token with default values. 