# Deployment Scripts

This directory contains scripts for deploying and managing the Tribes by Astrix platform.

## Overview

The deployment scripts are organized to handle different deployment scenarios and environments:

- **Full Deployment**: Deploy all contracts in the correct order with proper initialization
- **Upgrading**: Upgrade specific contracts while preserving state
- **Verification**: Verify contract source code on block explorers
- **Utilities**: Helper scripts for common operations

## Key Scripts

- `deploy-full.ts` - Deploy all contracts with proper initialization
- `deploy-core.ts` - Deploy only core contracts
- `upgrade-contract.ts` - Upgrade a specific contract
- `verify-contracts.ts` - Verify contracts on block explorers

## Usage Examples

### Full Deployment

```bash
# Deploy to Monad Devnet
npm run deploy:full:monad

# Deploy to local development network
npm run deploy:full:local
```

### Contract Upgrades

```bash
# Upgrade TribeController on Monad Devnet
npm run upgrade:monad -- --contract TribeController --proxy 0x1234...

# Verify storage layout compatibility before upgrading
npm run storage-layout:compare -- --contract TribeController
```

### Contract Verification

```bash
# Verify all contracts on Monad Devnet
npm run verify:monad

# Verify a specific contract
npm run verify:monad -- --contract TribeController --address 0x1234...
```

## Configuration

Deployment uses the following configuration sources:

1. Environment variables (`.env` file)
2. Hardhat configuration (`hardhat.config.ts`)
3. Command line arguments

Required environment variables:

```
PRIVATE_KEY=your_private_key
MONAD_RPC_URL=https://monad-rpc-url
```

## Adding New Scripts

When creating new deployment scripts:

1. Follow the existing pattern of using the deployments framework
2. Add proper error handling and logging
3. Update this README with usage instructions
4. Test thoroughly on a local network before using on testnet/mainnet 