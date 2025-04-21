# Tribes by Astrix Deployment Guide

## Pre-Deployment Setup

1. Configure your environment:
   ```bash
   # Create .env file with required variables
   PRIVATE_KEY=your_private_key_here
   ```

2. Verify you have sufficient native tokens for gas fees

3. Run test suite to validate contracts:
   ```bash
   npm test
   ```

4. Compile contracts:
   ```bash
   npm run compile
   ```

## Deployment Options

### Automated Deployment (Recommended)

Execute the full deployment process:

```bash
npm run deploy:full:complete
```

This executes:
- Contract deployment to target network
- Saving deployment information
- SDK contract address updates
- Contract verification
- Post-deployment configuration

Alternative deployment options:
```bash
# Deploy without verification/setup
npm run deploy:full

# Deploy and verify
npm run deploy:full:verify

# Test deployment workflow (mock mode)
npm run deploy:full:mock
```

### Manual Step-by-Step Deployment

```bash
# 1. Deploy contracts
npm run deploy:monad

# 2. Save deployment information
npm run save:deployment:monad

# 3. Update SDK contract addresses
npm run update:sdk:monad

# 4. Build the SDK
npm run build:sdk

# 5. Verify contracts
npm run verify:monad

# 6. Run post-deployment setup
npm run setup:monad

# 7. Test deployed contracts
npm run test:deployed
```

## Contract Upgrading

For upgrading specific contracts:

```bash
# Upgrade a single contract
node scripts/upgrade-specific-contract.js --contract TribeController --network monad-devnet --proxy 0x1234...
```

After upgrading:
1. Update SDK with new implementation addresses
   ```bash
   npm run update:sdk:monad
   ```

2. Build the updated SDK
   ```bash
   npm run build:sdk
   ```

## Deployment Best Practices

1. All contracts are deployed as upgradeable (UUPS pattern)
2. Keep private keys secure and never commit them
3. Back up deployment information stored in `deployments/` directory
4. Verify all contracts after deployment for transparency
5. For contracts with proxies, verify both implementation and proxy contracts
6. Run post-deployment tests to ensure proper functioning

## Contract Dependencies

Contract deployment follows this sequence to handle dependencies:

1. RoleManager
2. TribeController
3. PointSystem
4. CollectibleController 
5. PostFeedManager
6. PostMinter
7. Additional contracts

Post-deployment setup assigns proper roles and permissions automatically. 