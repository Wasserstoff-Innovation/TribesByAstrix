# Deployment Scripts

This directory contains scripts for deploying and managing the Tribes by Astrix platform.

## Overview

The deployment process is primarily handled by a unified script:

- `deploy-unified.ts`: Deploys all core contracts and the modular PostMinter system. Saves addresses and ABIs to the `/deployments` folder.

## Key Scripts

- **`deploy-unified.ts`**: The main script for deploying the entire platform or core components.
- `upgrade-contracts.ts` - *[Keep if still relevant]* Enhanced contract upgrade script.
- `cleanup-codebase.ts` - *[Keep if still relevant]* Utility for cleaning up unused files.
- `check-storage-layout.js` - *[Keep if still relevant]* Validate storage layout compatibility before upgrading.

## Usage Examples

### Unified Deployment

```bash
# Deploy all contracts (including Modular PostMinter) to a specific network
npx hardhat run scripts/deploy-unified.ts --network lineaSepolia

# Deploy core contracts only, skipping the PostMinter system
npx hardhat run scripts/deploy-unified.ts --network lineaSepolia --skip-postminter
```

*(Ensure your `.env` file and `hardhat.config.ts` are configured for the target network)*

### Contract Upgrades *(Keep if upgrade script exists and is used)*

```bash
# Upgrade a single contract
npx hardhat run scripts/upgrade-contracts.ts --network lineaSepolia TribeController

# Upgrade all contracts
npx hardhat run scripts/upgrade-contracts.ts --network lineaSepolia --all
```

### Cleanup Utilities *(Keep if cleanup script exists and is used)*

```bash
# Identify redundant or unused files (dry run mode)
npx ts-node scripts/cleanup-codebase.ts

# Perform actual cleanup
npx ts-node scripts/cleanup-codebase.ts --execute
```

## Modular PostMinter Architecture

The platform uses a modular PostMinter architecture with the following components:

1. **PostMinterBase**: Base contract with shared state and functionality
2. **PostMinterProxy**: Main entry point that delegates calls to specialized managers
3. **PostCreationManager**: Handles post creation and management
4. **PostEncryptionManager**: Manages encrypted posts and access control
5. **PostInteractionManager**: Handles post interactions like likes, comments, shares
6. **PostQueryManager**: Handles post querying and filtering

This modular approach allows for:
- Better separation of concerns
- Smaller contract sizes
- Independent upgrades of components
- Better maintainability

## Configuration

Deployment uses the following configuration sources:

1. Environment variables (`.env` file)
2. Hardhat configuration (`hardhat.config.ts`)
3. Command line arguments (e.g., `--network`, `--skip-postminter`)

Required environment variables for deployment:

```
# Private key of the deployer wallet
DEPLOYER_PRIVATE_KEY=your_private_key 

# RPC URL for the target network (e.g., Linea Sepolia)
LINEA_SEPOLIA_RPC_URL=https://rpc.sepolia.linea.build 

# Optional: Etherscan API Key for verification
ETHERSCAN_API_KEY=your_etherscan_api_key
```

*(Update variable names above if they differ in your `.env` or Hardhat config)*

## Adding New Scripts

When creating new deployment-related scripts:

1. Follow the existing pattern, utilizing Hardhat tasks or scripts.
2. Add clear logging for each step.
3. Update this README with usage instructions.
4. Test thoroughly on a local network before using on testnet/mainnet. 