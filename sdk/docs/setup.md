# Setup Guide

This guide will walk you through the process of installing and configuring the Tribes by Astrix SDK for your project.

## Installation

Install the Tribes by Astrix SDK using npm:

```bash
npm install tribes-by-astrix-sdk
```

Or using yarn:

```bash
yarn add tribes-by-astrix-sdk
```

## Basic Configuration

Import and initialize the SDK in your application:

```typescript
import { TribesSDK } from 'tribes-by-astrix-sdk';

const sdk = new TribesSDK({
  // Required configuration
  rpcUrl: 'https://rpc-url-for-your-network.com',
  
  // Optional configurations
  chainId: 1,              // Default: 1 (Ethereum Mainnet)
  apiKey: 'your-api-key',  // If using premium features
  debug: false,            // Enable debug logging
  cacheOptions: {
    enabled: true,
    ttl: 300               // Cache TTL in seconds
  }
});
```

## Authentication

Set up user authentication using one of these methods:

### Using Private Key (For Backend Services)

```typescript
await sdk.auth.authenticateWithPrivateKey('0x123...789');
```

### Using Web3 Provider (For Frontend dApps)

```typescript
// Connect to MetaMask or other wallet providers
await sdk.auth.authenticateWithProvider(window.ethereum);
```

### Using JsonRpcSigner

```typescript
import { ethers } from 'ethers';
const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();
await sdk.auth.authenticateWithSigner(signer);
```

## Environment-Specific Configuration

### Development Environment

```typescript
const sdk = new TribesSDK({
  rpcUrl: 'https://rpc-mumbai.maticvigil.com',
  chainId: 80001, // Mumbai testnet
  debug: true,
});
```

### Production Environment

```typescript
const sdk = new TribesSDK({
  rpcUrl: 'https://polygon-rpc.com',
  chainId: 137, // Polygon Mainnet
  debug: false,
  cacheOptions: {
    enabled: true,
    ttl: 600 // 10 minutes
  }
});
```

## Advanced Configuration

### Custom Contract Addresses

If you're working with custom contract deployments:

```typescript
const sdk = new TribesSDK({
  rpcUrl: 'https://rpc-url.com',
  contractAddresses: {
    tribeController: '0x123...',
    pointsController: '0x456...',
    postMinter: '0x789...',
    // Other contracts...
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

## Next Steps

Now that you've successfully set up the SDK, check out these resources:

- [API Reference](./api/index.html) for detailed information on available methods
- [Guides](./guides/caching.md) for best practices and advanced usage scenarios
- [Example Implementations](../examples/) for complete code examples 