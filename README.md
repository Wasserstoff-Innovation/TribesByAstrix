# Tribes by Astrix

A decentralized community management platform built on Ethereum and EVM-compatible chains.

## Features

- Create and manage tribes (decentralized communities)
- Custom token creation for each tribe
- Points system for rewarding community engagement
- Content posting and moderation systems
- NFT collectibles for tribe members

## Getting Started

### Prerequisites

- Node.js v16+
- Yarn or npm
- An Ethereum wallet (MetaMask, etc.)

### Installation

1. Clone this repository
  
2. Install dependencies:
```bash
yarn install
```

3. Set up environment variables by creating a `.env` file based on `.env.example`.

## Development

### Local Development

Run a local development environment:

```bash
yarn start
```

### Testing

```bash
# Run all tests
yarn test

# Run specific tests
yarn test:contracts
```

## Deployment

The project uses a unified deployment approach that handles all contracts including the modular PostMinter system:

```bash
# Deploy all contracts to a network
npx hardhat run scripts/deploy-unified.ts --network <network-name>

# Deploy core contracts only, skipping PostMinter (for size-constrained environments)
npx hardhat run scripts/deploy-unified.ts --network <network-name> --skip-postminter
```

For upgrading contracts:

```bash
# Upgrade a specific contract
npx hardhat run scripts/upgrade-contracts.ts --network <network-name> <contract-name>

# Upgrade all contracts
npx hardhat run scripts/upgrade-contracts.ts --network <network-name> --all

# Upgrade only ModularPostMinter components
npx hardhat run scripts/upgrade-contracts.ts --network <network-name> --postminter
```

See the [Deployment Guide](./docs/deployment.md) for complete details.

## SDK

The project includes a JavaScript/TypeScript SDK for easy integration with frontends and other applications.

```typescript
// Import the SDK
import { TribesSDK } from '@wasserstoff/tribes-sdk';

// Initialize the SDK with a provider and network info
const sdk = new TribesSDK({
  provider: window.ethereum, // or any ethers provider
  network: {
    chainId: 59141, // Linea Sepolia
    name: 'lineaSepolia'
  }
});

// Connect a wallet
await sdk.connect();

// Create a tribe
const tribeId = await sdk.tribes.createTribe({
  name: "My Awesome Tribe",
  description: "A community for awesome people",
  logoUrl: "https://example.com/logo.png",
  coverImageUrl: "https://example.com/cover.jpg",
  metadata: {
    category: "Technology",
    tags: ["web3", "community"]
  }
});

// Create a post in a tribe
const postId = await sdk.content.createPost({
  tribeId: tribeId,
  content: "Hello world! This is my first post.",
  metadata: {
    title: "My First Post",
    tags: ["welcome", "introduction"]
  }
});
```

See the [SDK documentation](https://github.com/Wasserstoff-Innovation/TribesByAstrix/blob/main/docs/sdk/index.md) for more details.

## Documentation

All documentation for the Tribes by Astrix platform is centralized in the [docs](./docs/README.md) directory. Here you will find:

- [Getting Started Guide](./docs/quick-start.md)
- [Architecture Overview](./docs/architecture.md)
- [Features Documentation](./docs/features)
- [SDK Documentation](./docs/sdk)
- [Deployment Guide](./docs/deployment.md)
- [Troubleshooting](./docs/troubleshooting.md)

## Project Structure

```
├── contracts/             # Smart contracts
│   ├── interfaces/        # Contract interfaces
│   ├── libraries/         # Shared contract libraries
│   ├── post/              # Modular PostMinter components
│   └── constants/         # Contract constants
├── scripts/               # Deployment and utility scripts
│   ├── deploy-unified.ts  # Unified deployment script
│   ├── upgrade-contracts.ts # Enhanced upgrade script
│   └── cleanup-codebase.ts # Codebase maintenance utility
├── test/                  # Contract test files
│   ├── unit/              # Unit tests
│   └── journey/           # Integration tests
├── sdk/                   # JavaScript/TypeScript SDK
│   ├── src/               # SDK source code
│   ├── abis/              # Contract ABIs
│   └── examples/          # SDK usage examples
├── docs/                  # Project documentation
├── deployments/           # Deployment data
└── hardhat.config.ts      # Hardhat configuration
```

## Contract Architecture

The platform uses a modular contract architecture with specialized components:

### Core Contracts
- **RoleManager**: Central contract for permissions and access control
- **TribeController**: Handles tribe creation, membership, and management
- **PointSystem**: Manages platform rewards and incentives
- **CollectibleController**: Manages NFTs and digital collectibles

### Modular PostMinter System
- **PostMinterProxy**: Main entry point for post-related functionality
- **PostMinterBase**: Shared state and functionality for all post managers
- **PostCreationManager**: Handles post creation and management
- **PostEncryptionManager**: Manages encrypted posts and access control
- **PostInteractionManager**: Handles post interactions (likes, comments)
- **PostQueryManager**: Handles post querying and filtering

This modular design offers several advantages:
- Better separation of concerns
- Smaller contract sizes to avoid deployment limitations
- Independent upgradability for each component
- Improved maintainability and testing

See the [Architecture Overview](./docs/architecture.md) for more details.

## Contributing

Contributions are welcome! Please check out our [Contributing Guide](CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please open an issue in the GitHub repository or contact the team at [support@astrixial.com](mailto:support@astrixial.com).
