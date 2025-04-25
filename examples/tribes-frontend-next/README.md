# Tribes by Astrix Frontend

<div align="center">
  <p><em>Building decentralized communities with ownership and rewards</em></p>
</div>

## Overview

This Next.js application provides a modern UI for interacting with the Tribes by Astrix platform. The interface enables users to create and manage tribes, participate in community activities, and utilize the full range of platform features.

## Documentation Updates

We've significantly enhanced the documentation to provide clearer insights into the system:

1. **Improved Error Codes**: Error codes now map directly to contract error codes with detailed explanations and solutions.

2. **Contract Documentation**: Added comprehensive documentation of contract functions with parameters and return types based on actual implementations.

3. **User Flow Diagrams**: Created visual representations of key user journeys with mermaid diagrams and code examples.

4. **SDK Flow Documentation**: Added specialized diagrams for SDK interactions in a custom theme matching the app's design.

5. **Enhanced Test Reporting**: Improved test report format with detailed tables and statistics on test coverage.

## Key Documentation Files

- [`/src/app/docs/data/error-codes.ts`](./src/app/docs/data/error-codes.ts) - Comprehensive error code documentation
- [`/src/app/docs/data/contracts.ts`](./src/app/docs/data/contracts.ts) - Detailed contract function documentation
- [`/src/app/docs/sdk-flows.tsx`](./src/app/docs/sdk-flows.tsx) - Visual SDK flow diagrams with theme-matched styling
- [`/docs/user-flows.md`](../../docs/user-flows.md) - Enhanced user journey documentation with visual elements
- [`/docs/test-report.md`](../../docs/test-report.md) - Improved test reporting with detailed statistics

## Viewing the Documentation

To view the enhanced documentation:

1. Start the development server:
```bash
npm run dev
```

2. Open your browser and navigate to:
   - Error codes and contracts: http://localhost:3000/docs
   - SDK flows: http://localhost:3000/docs/sdk-flows

## Development

### Prerequisites

- Node.js 16+
- NPM or Yarn
- A Web3 wallet (MetaMask recommended)

### Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Environment Variables

Create a `.env.local` file with the following variables:

```
NEXT_PUBLIC_RPC_URL=https://rpc.ankr.com/eth_sepolia
NEXT_PUBLIC_CHAIN_ID=59141
NEXT_PUBLIC_CONTRACT_ADDRESSES={"tribeController":"0x...","roleManager":"0x..."}
```

## Key Features

- **Modern UI**: Clean, responsive interface with Tailwind CSS
- **Web3 Integration**: Seamless wallet connection and transaction handling
- **Documentation**: Comprehensive in-app documentation for developers
- **Testing Utilities**: SDK testing interface for quick experimentation

## Contributing

Please see [CONTRIBUTING.md](../../CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.
