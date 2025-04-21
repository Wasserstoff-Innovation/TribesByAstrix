# Tribes by Astrix SDK Examples

This directory contains example scripts that demonstrate how to use the Tribes by Astrix SDK.

## Prerequisites

Before running these examples, make sure you have:

1. Built the SDK: `npm run build` in the SDK directory
2. A private key with some ETH on the network you're connecting to
3. Access to an RPC endpoint for the network

## Configuration

Create a `.env` file in this directory with the following variables:

```
PRIVATE_KEY=your_private_key_here
RPC_URL=your_rpc_url_here
CHAIN_ID=your_chain_id_here
```

For example:

```
PRIVATE_KEY=0x123456789abcdef...
RPC_URL=https://rpc.monad.xyz/devnet
CHAIN_ID=20143
```

## Available Examples

### Basic Usage

The basic usage example demonstrates core SDK functionality:

- Initializing the SDK
- Connecting a wallet
- Listing contract addresses
- Fetching tribes count and details
- Getting user tribes
- Creating a new tribe

Run it with:

```bash
node basic-usage.js
```

### Additional Examples

More examples coming soon:

- Working with posts
- Managing tribe members
- Using the points system
- Interacting with tokens

## Troubleshooting

If you encounter any issues:

1. Ensure your `.env` file is properly configured
2. Check that you have the latest SDK build
3. Verify that the contract addresses in the SDK match your deployment
4. Make sure you have sufficient ETH for gas fees
5. Check that your account has the necessary permissions for certain operations

For more detailed troubleshooting, refer to the [Troubleshooting Guide](../../docs/TROUBLESHOOTING.md). 