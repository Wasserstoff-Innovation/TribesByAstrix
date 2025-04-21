# Tribes by Astrix

A decentralized platform for community management and engagement built on Monad blockchain.

## Overview

Tribes by Astrix is a decentralized platform that enables communities to organize, engage, and manage their members using blockchain technology. With a focus on user experience and scalability, the platform provides tools for community leaders to create tribes, manage memberships, award points, and control content creation.

## Key Features

- **Tribe Management**: Create and manage decentralized communities with customizable metadata
- **Role-Based Access Control**: Granular permission system for community governance
- **Points System**: Reward members for participation and contributions
- **Collectibles**: Issue and manage digital collectibles that can gate access to exclusive content
- **Post System**: Create and manage content with optional encryption for private tribe communication
- **Events**: Organize events with ticket sales and attendance tracking
- **Fundraisers**: Create and manage fundraising campaigns within tribes

## Repository Structure

```
├── contracts/       # Solidity smart contracts
├── sdk/             # JavaScript/TypeScript SDK
├── docs/            # Documentation
│   └── user-flows/  # User flow documentation and diagrams
├── scripts/         # Deployment and utility scripts
└── test/            # Smart contract tests
```

## Getting Started

### Prerequisites

- Node.js >= 16
- npm or yarn
- Hardhat for contract development
- A Monad-compatible wallet (like MetaMask)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/tribes-by-astrix.git
cd tribes-by-astrix
```

2. Install dependencies:

```bash
npm install
```

## Using the SDK

The Tribes by Astrix SDK provides a simple interface for interacting with the platform:

```typescript
import { AstrixSDK } from '@tribes/sdk';

// Initialize the SDK
const sdk = new AstrixSDK({
  provider: window.ethereum,
  chainId: 4165, // Monad Devnet
});

// Connect with wallet
await sdk.connect();

// Create a tribe
const tribeId = await sdk.tribes.createTribe({
  name: "My Awesome Tribe",
  description: "A community for awesome people",
  imageUrl: "https://example.com/image.png"
});

// Join a tribe
await sdk.tribes.joinTribe(tribeId);

// Create a post
await sdk.content.createPost({
  tribeId,
  content: "Hello, tribe members!",
  postType: "TEXT"
});

// Award points to a member
await sdk.points.awardPoints({
  tribeId,
  member: "0x1234...",
  points: 50,
  actionType: "CUSTOM"
});
```

For more detailed SDK documentation, see the [SDK README](./sdk/README.md).

## System Architecture

The platform is built on a set of modular, upgradeable smart contracts:

```mermaid
flowchart TD
    User[User/Client] --> SDK[JavaScript SDK]
    SDK --> Provider[Web3 Provider]
    Provider --> Blockchain[Monad Blockchain]
    
    subgraph Core Contracts
        RM[RoleManager]
        TC[TribeController]
        PS[PointSystem]
        CC[CollectibleController]
        PFM[PostFeedManager]
        PM[PostMinter]
        EC[EventController]
    end
    
    RM -.-> TC
    RM -.-> PS
    RM -.-> CC
    RM -.-> PM
    RM -.-> EC
    
    Blockchain --> Core Contracts
```

For complete architecture documentation, see [System Architecture](./docs/user-flows/SystemArchitecture.md).

## User Flows

The platform supports various user journeys that are documented with visual diagrams:

- [Fundraiser Flows](./docs/user-flows/FundraiserFlowDiagrams.md) - Create and manage fundraisers
- [Event Flows](./docs/user-flows/EventFlowDiagrams.md) - Organize events and sell tickets
- [System Architecture](./docs/user-flows/SystemArchitecture.md) - Visual representations of the platform components

## Development

### Testing

Run the test suite to ensure everything is working correctly:

```bash
npm test
```

### Deployment

For detailed deployment instructions, see [DEPLOYMENT.md](./docs/DEPLOYMENT.md).

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## Acknowledgements

- [OpenZeppelin](https://openzeppelin.com/) for secure smart contract components
- [Hardhat](https://hardhat.org/) for the Ethereum development environment
- [Monad](https://monad.xyz/) for the scalable blockchain infrastructure
