# Tribes by Astrix Examples

This directory contains examples for using the Tribes by Astrix platform.

## Directory Structure

- `sdk-usage/`: Examples demonstrating the use of the SDK for interacting with tribes, tokens, and points
- `frontend/`: React-based frontend examples that showcase how to build UIs with the Tribes by Astrix SDK

## Prerequisites

- Node.js v16+
- Yarn or npm
- A deployed instance of Tribes by Astrix contracts
- An Ethereum wallet with some test ETH on the target network (e.g., Linea Sepolia)

## Getting Started

1. Make sure you have deployed contracts to your target network. If not, deploy them:

```bash
node scripts/tribes-manager.js deploy --network lineaSepolia
```

2. Create and set up a test tribe:

```bash
node scripts/tribes-manager.js create-tribe --network lineaSepolia
node scripts/tribes-manager.js setup-token --network lineaSepolia
```

3. Install dependencies:

```bash
npm install
```

## Running the Examples

### SDK Usage Examples

These examples demonstrate how to interact with the tribes and tokens directly:

```bash
# Run the direct contract interaction example
npx hardhat run examples/sdk-usage/interact-with-tribe.ts --network lineaSepolia

# Run the SDK-based example
npx hardhat run examples/sdk-usage/sdk-tribe-demo.ts --network lineaSepolia
```

### Frontend Examples

The frontend examples demonstrate how to build UIs with the Tribes by Astrix SDK:

```bash
# Install frontend dependencies
cd examples/frontend
npm install

# Start the development server
npm run dev
```

Then visit http://localhost:3000 to see the frontend in action.

## Role Assignment

Some operations (like awarding points) require specific roles. You may need to assign roles to your account:

```bash
npx hardhat run scripts/assign-tribe-roles.ts --network lineaSepolia
```

This will assign the `COMMUNITY_ADMIN`, `POINTS_MANAGER`, and `CONTENT_CREATOR` roles to your account for the tribe.

## Troubleshooting

- Make sure your `.env` file contains proper values for `LINEA_SEPOLIA_RPC_URL` and `PRIVATE_KEY`
- Ensure you have deployed contracts to the target network
- Check that your account has the appropriate roles for operations like awarding points or recording actions 