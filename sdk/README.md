# Tribes by Astrix SDK

A powerful JavaScript/TypeScript SDK for interacting with the Tribes by Astrix platform.

## Installation

```bash
npm install @wasserstoff-innovation/tribes-sdk
# or
yarn add @wasserstoff-innovation/tribes-sdk
```

## Quick Start

```typescript
import { AstrixSDK } from '@wasserstoff-innovation/tribes-sdk';

// Initialize the SDK with configuration
const sdk = new AstrixSDK({
  provider: window.ethereum, // or any ethers-compatible provider
  
  // Choose a network:
  // Monad networks
  chainId: 4165, // Monad Testnet
  // or chainId: 1284, // Monad Mainnet (future)
  
  // XDC networks
  // chainId: 51, // XDC Apothem Testnet
  // chainId: 50, // XDC Mainnet
  
  // Optional: Provide contract addresses if not using standard deployment
  contracts: {
    // Contract addresses will be automatically detected based on chainId if not provided
  },
  // Optional: Configure caching behavior
  cache: {
    defaultMaxAge: 60000, // 1 minute in milliseconds
    disabled: false       // Enable/disable cache globally
  }
});

// Connect with wallet
await sdk.connect();
console.log('Connected with address:', await sdk.getAddress());
```

## Core Modules

The SDK provides several modules for interacting with different aspects of the platform:

### Token Module

Interact with the Astrix token and related functionality.

```typescript
// Get token information
const tokenInfo = await sdk.token.getTokenInfo();
console.log('Token name:', tokenInfo.name);
console.log('Token symbol:', tokenInfo.symbol);
console.log('Total supply:', tokenInfo.totalSupply);

// Get token balance
const balance = await sdk.token.getBalance();
console.log('Your balance:', balance);

// Deposit tokens to the dispenser
const depositTx = await sdk.token.deposit({ 
  amount: ethers.parseEther('100') // 100 tokens
});
console.log('Deposit transaction hash:', depositTx);
```

### Points Module

Manage tribe points, rewards, and point-based actions.

```typescript
// Create a tribe token
const createTokenTx = await sdk.points.createTribeToken({
  tribeId: 1,
  name: 'Tribe Token',
  symbol: 'TT'
});

// Set exchange rate (10 tribe tokens per 1 Astrix token)
await sdk.points.setExchangeRate({
  tribeId: 1,
  rate: 10
});

// Award points to a member
await sdk.points.awardPoints({
  tribeId: 1,
  member: '0x1234...',
  points: 50,
  actionType: 'CUSTOM'
});

// Get member's point balance
const balance = await sdk.points.getMemberPoints(1, '0x1234...');

// Get top members by points
const topMembers = await sdk.points.getTopMembers(1, 5);
```

### Content Module

Create, manage, and interact with tribe content and posts.

```typescript
// Create a post
const postId = await sdk.content.createPost({
  tribeId: 1,
  content: 'Hello, tribe members!',
  postType: 'TEXT'
});

// Get posts for a tribe
const posts = await sdk.content.getTribePosts(1);

// React to a post
await sdk.content.reactToPost({
  postId,
  reaction: 'LIKE'
});

// Comment on a post
await sdk.content.commentOnPost({
  postId,
  content: 'Great post!'
});
```

### Tribes Module

Create and manage tribes and memberships.

```typescript
// Create a tribe
const tribeId = await sdk.tribes.createTribe({
  name: "My Awesome Tribe",
  description: "A community for awesome people",
  imageUrl: "https://example.com/image.png"
});

// Join a tribe
await sdk.tribes.joinTribe(tribeId);

// Get tribe details
const tribeDetails = await sdk.tribes.getTribeDetails(tribeId);

// Get tribe members
const members = await sdk.tribes.getTribeMembers(tribeId);
```

## Advanced Features

### Caching System

The SDK includes a sophisticated caching system to optimize performance and reduce network calls. Each module inherits this functionality from the `BaseModule` class.

```typescript
// Example with explicit cache control
const members = await sdk.tribes.getTribeMembers(tribeId, {
  cache: {
    disabled: false,   // Use cache for this request
    maxAge: 120000,    // Cache valid for 2 minutes
    blockBased: true   // Invalidate on new blocks
  }
});

// Manually invalidate specific cache
sdk.tribes.invalidateCache(`tribe:${tribeId}:members`);

// Clear all cache
sdk.clearCache();
```

#### Cache Options

- `disabled`: Boolean to disable caching for a specific request
- `maxAge`: Time in milliseconds before cache expires
- `blockBased`: When true, cache is invalidated on new blocks

### Error Handling

The SDK provides consistent error handling across all modules.

```typescript
try {
  await sdk.tribes.createTribe({
    name: "My Tribe"
    // Missing required fields will cause validation error
  });
} catch (error) {
  if (error.type === 'VALIDATION_ERROR') {
    console.error('Validation error:', error.message);
  } else if (error.type === 'CONTRACT_ERROR') {
    console.error('Smart contract error:', error.message);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## Complete Examples

See the [examples directory](./examples) for complete usage examples:
- [Basic Usage (TypeScript)](./examples/basic-usage.ts)
- [Basic Usage (JavaScript)](./examples/basic-usage.js)

## API Reference

For detailed API documentation, see the [API Reference](./docs/API.md).

## Troubleshooting

Having issues? Check our [Troubleshooting Guide](./docs/guides/troubleshooting.md).

## Supported Networks

Tribes by Astrix SDK supports multiple blockchain networks:

| Network | Chain ID | Status |
|---------|----------|--------|
| Monad Testnet | 4165 | Active Development |
| XDC Apothem Testnet | 51 | Active Development |
| Monad Mainnet | 1284 | Future |
| XDC Mainnet | 50 | Future |

Each network has its own deployment of the core contracts. The SDK automatically selects the appropriate contract addresses based on the `chainId` provided during initialization. 