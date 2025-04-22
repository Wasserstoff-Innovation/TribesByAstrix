# Tribes by Astrix SDK

[![npm version](https://img.shields.io/npm/v/@wasserstoff/tribes-sdk.svg)](https://www.npmjs.com/package/@wasserstoff/tribes-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A TypeScript/JavaScript SDK for interacting with the Tribes by Astrix platform, enabling seamless integration with tribe management, points system, content creation, and more.

## Installation

```bash
npm install @wasserstoff/tribes-sdk
# or
yarn add @wasserstoff/tribes-sdk
```

## Quick Start

```typescript
import { AstrixSDK } from '@wasserstoff/tribes-sdk';
import { ethers } from 'ethers';

// Initialize with Ethereum provider
const sdk = new AstrixSDK({
  provider: window.ethereum, // Browser provider or any ethers provider
  chainId: 59141,           // Linea Sepolia testnet
  verbose: true             // Optional debug logging
});

// Initialize for read-only operations
await sdk.init();

// Connect wallet for write operations
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();
await sdk.connect(signer);

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

// Join a tribe
await sdk.tribes.joinTribe(tribeId);

// Get tribe details
const tribeDetails = await sdk.tribes.getTribeDetails(tribeId);
console.log("Tribe details:", tribeDetails);
```

## Documentation

### Core Modules

The SDK consists of several modules for different aspects of the platform:

- **Tribes**: Create and manage tribes, memberships, and tribe settings
- **Points**: Handle tribe tokens, points distribution, and rewards
- **Token**: Interact with the Astrix token and related functions
- **Content**: Create and manage posts and other content
- **Collectibles**: Manage collectible NFTs within tribes

### Full Documentation

For complete documentation, including detailed API reference, guides, and examples, see the main documentation in the repository:

- [SDK Overview](https://github.com/Wasserstoff-Innovation/TribesByAstrix/blob/main/docs/sdk/index.md)
- [Installation Guide](https://github.com/Wasserstoff-Innovation/TribesByAstrix/blob/main/docs/sdk/installation.md)
- [Integration Guide](https://github.com/Wasserstoff-Innovation/TribesByAstrix/blob/main/docs/sdk/integration.md)
- [API Reference](https://github.com/Wasserstoff-Innovation/TribesByAstrix/blob/main/docs/sdk/api-reference.md)

## Configuration

The SDK supports various configuration options:

```typescript
const sdk = new AstrixSDK({
  // Required options
  provider: ethers.provider,  // An ethers.js provider
  chainId: 59141,            // Chain ID where contracts are deployed

  // Optional configuration
  contracts: {               // Custom contract addresses (if not using default network addresses)
    roleManager: "0x...",
    tribeController: "0x...",
    astrixToken: "0x...",
    // ... other contract addresses
  },
  
  // Additional options
  verbose: false,            // Enable/disable verbose logging
  customFetch: myFetchFunc,  // Custom fetch implementation
  ipfsGateway: "https://ipfs.example.com/ipfs/" // Custom IPFS gateway
});
```

## Networks

The SDK supports the following networks by default:

| Network | Chain ID | Description |
|---------|----------|-------------|
| Linea Sepolia | 59141 | Linea testnet |
| LocalNet | 31337 | Local development |

## Examples

### Creating a Tribe

```typescript
// Create a tribe
const tribeId = await sdk.tribes.createTribe({
  name: "Web3 Developers",
  metadata: JSON.stringify({
    description: "A tribe for web3 developers",
    logoUrl: "https://example.com/logo.png",
    coverImageUrl: "https://example.com/cover.png",
    visibility: "PUBLIC"
  })
});
```

### Setting up Tribe Token

```typescript
// Create tribe token
await sdk.points.createTribeToken({
  tribeId: 1,
  name: "Developer Token",
  symbol: "DEV"
});

// Set exchange rate (tribe tokens per Astrix token)
await sdk.points.setExchangeRate({
  tribeId: 1,
  rate: 100
});

// Set points for actions
await sdk.points.setActionPoints({
  tribeId: 1,
  actionType: "POST_ACTION",
  points: 50
});
```

### Managing Content

```typescript
// Create a post
const postId = await sdk.content.createPost({
  tribeId: 1,
  content: "Hello tribe members!",
  metadata: JSON.stringify({
    title: "First Post",
    tags: ["welcome", "intro"]
  })
});

// Comment on a post
await sdk.content.commentOnPost({
  tribeId: 1,
  postId: postId,
  content: "Great first post!"
});
```

## Building and Contributing

To build the SDK locally:

```bash
# Clone the repository
git clone https://github.com/Wasserstoff-Innovation/TribesByAstrix.git
cd TribesByAstrix/sdk

# Install dependencies
npm install

# Build the SDK
npm run build

# Generate documentation
npm run docs
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For questions, issues, or feature requests, please open an issue on the [GitHub repository](https://github.com/Wasserstoff-Innovation/TribesByAstrix/issues) or contact us at support@astrix.live. 