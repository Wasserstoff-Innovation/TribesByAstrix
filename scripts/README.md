# Scripts for Tribes by Astrix

This directory contains scripts for testing, deployment, and utility tasks for the Tribes by Astrix project.

## Deployment Scripts

### 1. deploy.ts

Standard deployment script for the Tribes platform without Astrix token integration.

#### Usage:

```bash
npx hardhat run scripts/deploy.ts --network <network-name>
```

### 2. deployWithAstrix.ts

This script deploys all the necessary contracts for the Tribes platform with Astrix token integration:

- **Basic Tribes Contracts**: RoleManager, ProfileNFTMinter, TribeController, etc.
- **Astrix Token System**: AstrixToken, TokenDispenser, AstrixPointSystem
- **Legacy Support**: Maintains backward compatibility with original PointSystem

#### Usage:

```bash
npx hardhat run scripts/deployWithAstrix.ts --network <network-name>
```

The script:
1. Deploys all contracts
2. Sets up initial roles
3. Configures TokenDispenser with proper permissions
4. Transfers initial tokens to the TokenDispenser for testing
5. Outputs all contract addresses and verification details

### 3. test-astrix-deployment.ts

This script validates a deployed Astrix token integration to ensure everything is configured correctly.

#### Usage:

First, set environment variables with your deployed contract addresses:

```bash
export ASTRIX_TOKEN_ADDRESS=0x...
export TOKEN_DISPENSER_ADDRESS=0x...
export ASTRIX_POINT_SYSTEM_ADDRESS=0x...
export TRIBE_CONTROLLER_ADDRESS=0x...
```

Or edit the script to hardcode these values.

Then run:

```bash
npx hardhat run scripts/test-astrix-deployment.ts --network <network-name>
```

The script performs the following validation steps:
1. Checks Astrix Token details (name, symbol, supply)
2. Verifies TokenDispenser configuration
3. Validates AstrixPointSystem contract connections
4. Tests role configurations
5. Creates a test tribe if none exists
6. Sets up the tribe with an organization and token
7. Tests token deposit functionality
8. Validates point awarding works properly

## Test Runner

The `test-runner.js` script provides a comprehensive solution for running tests and generating reports.

### Usage

```bash
# Run all tests and generate a report
npm run test:report

# Run specific test types (unit, integration, journey)
npm run test:report -- --type=unit
npm run test:report -- --type=integration
npm run test:report -- --type=journey

# Run tests and start the report server
npm run test:report -- --serve

# Run tests with a custom port for the report server
npm run test:report -- --serve --port=8080
```

### Features

- Runs tests with Hardhat
- Generates detailed test results in JSON format
- Maintains test history for trend analysis
- Optional interactive HTML report viewing
- Supports filtering by test type (unit, integration, journey)

## Test Reports

Test reports are saved in the `reports/` directory:

- `test-results.json` - Latest test results
- `test-history.json` - Historical test data

## Other NPM Scripts

The project includes several additional scripts in `package.json`:

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:journey

# Run a specific test file
npm run test:file -- path/to/file.test.ts

# Generate coverage report
npm run test:coverage

# Compile contracts
npm run compile

# Deploy to networks
npm run deploy:fuse
npm run deploy:monad

# Code quality
npm run lint
npm run format

# Clean build artifacts
npm run clean
```

## Deployment Workflow

### Fresh Deployment

For a completely new deployment:

1. Deploy with `deployWithAstrix.ts`
2. Note the output addresses
3. Run `test-astrix-deployment.ts` to validate the deployment

### Updating Existing Deployment

If you need to update just the Astrix components of an existing deployment:

1. Modify `deployWithAstrix.ts` to use existing contract addresses
2. Run the script with the `--network` flag
3. Validate with `test-astrix-deployment.ts`

## Contract Interactions

### Organization Setup

For an organization to use the Astrix point system:

1. Organization acquires Astrix tokens
2. Organization calls `deposit()` on TokenDispenser to deposit tokens
3. Tribe admin calls `setTribeOrganization()` on AstrixPointSystem to link tribe and organization
4. Tribe admin creates tribe token with `createTribeToken()`
5. Tribe admin sets exchange rate with `setExchangeRate()`
6. Tribe admin configures point values with `setActionPoints()`

### Awarding Points

When users perform actions in a tribe:
1. Points are awarded via `awardPoints()` or `recordAction()`
2. AstrixPointSystem uses the TokenDispenser to spend organization's Astrix tokens
3. Equivalent tribe tokens are minted to the user

## Security Considerations

- The TokenDispenser contract allows organizations to securely fund point operations
- Role-based access control is used throughout the system
- Signature-based spending provides a secure way for organizations to authorize token usage

## Troubleshooting

If the validation script fails:

1. Check that all contract addresses are correct
2. Verify that the deployer account has sufficient permissions
3. Ensure the deployer has Astrix tokens for testing
4. Confirm that the TokenDispenser has the correct roles assigned 