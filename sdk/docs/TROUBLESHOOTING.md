# Troubleshooting Guide for Tribes by Astrix SDK

This guide covers common issues and their solutions when working with the Tribes by Astrix SDK.

## Table of Contents

- [Installation Issues](#installation-issues)
- [Connection Problems](#connection-problems)
- [Contract Interaction Issues](#contract-interaction-issues)
- [Post Creation Errors](#post-creation-errors)
- [SDK Instance Management](#sdk-instance-management)
- [Common Error Codes](#common-error-codes)
- [Deployment Issues](#deployment-issues)
- [Getting Additional Help](#getting-additional-help)

## Installation Issues

### Problem: Package installation fails

**Symptoms:**
- npm/yarn install errors
- Missing dependencies
- Version conflicts

**Solution:**
1. Ensure you're using Node.js version 14 or higher:
```bash
node -v
```

2. Clear npm/yarn cache:
```bash
npm cache clean --force
# or
yarn cache clean
```

3. Try installing with the `--legacy-peer-deps` flag:
```bash
npm install tribes-by-astrix-sdk --legacy-peer-deps
```

4. If the issue persists, check your package.json for conflicting dependency versions, especially with ethers.

## Connection Problems

### Problem: Cannot connect to the blockchain network

**Symptoms:**
- `CONNECTION_ERROR` errors
- Timeout errors
- "Network not supported" errors

**Solution:**
1. Verify the network configuration:
```typescript
const sdk = new AstrixSDK({
  provider: new ethers.JsonRpcProvider('https://rpc-url-for-your-network'),
  chainId: 125999, // Monad Devnet
  verbose: true // Enable detailed logging
});
```

2. Check if the RPC endpoint is working by testing it directly:
```bash
curl -X POST https://your-rpc-endpoint \
  -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

3. Ensure you have the right network permissions and API keys if required.

4. If using a local development environment, ensure your local node is running and properly configured.

## Contract Interaction Issues

### Problem: Contract function calls fail

**Symptoms:**
- `CONTRACT_ERROR` errors
- Function reverts
- Gas estimation failures

**Solution:**
1. Ensure you have the correct contract addresses configured for your network:
```typescript
// Manually check contract addresses
console.log(sdk.contractAddresses);
```

2. Verify you have sufficient balance for gas fees:
```typescript
const balance = await sdk.provider.getBalance(userAddress);
console.log(`Balance: ${ethers.formatEther(balance)} ETH`);
```

3. Check if your account has the right permissions for the operation.

4. For function-specific issues, verify the parameters passed to the function.

## Post Creation Errors

### Problem: Post creation fails with metadata validation errors

**Symptoms:**
- `INVALID_METADATA` errors
- Missing required fields
- Invalid JSON format

**Solution:**
1. Ensure your post metadata has all required fields based on post type:

```typescript
const validMetadata = {
  title: "Post Title", // Required for all post types
  description: "Post description",
  content: "Post content", // Required for blog type posts
  // Include other required fields based on post type
};
```

2. Validate your metadata structure before submitting:
```typescript
// Simple validation utility
function validatePostMetadata(metadata, postType) {
  const requiredFields = {
    blog: ['title', 'content'],
    image: ['title', 'imageUrl'],
    video: ['title', 'videoUrl'],
    // other post types
  };
  
  if (!metadata || typeof metadata !== 'object') {
    return false;
  }
  
  return requiredFields[postType].every(field => 
    metadata.hasOwnProperty(field) && metadata[field]
  );
}
```

3. Check for special characters or encoding issues in your metadata JSON.

## SDK Instance Management

### Problem: Multiple SDK instances in Next.js application

**Symptoms:**
- Memory leaks
- Duplicate contract events
- Inconsistent state between components

**Solution:**
Create a singleton SDK instance for client components:

```typescript
// lib/sdk.ts
import { AstrixSDK } from 'tribes-by-astrix-sdk';
import { ethers } from 'ethers';

let sdk: AstrixSDK | undefined = undefined;

export function getSDK() {
  // Skip on the server side
  if (typeof window === 'undefined') {
    return null;
  }
  
  if (!sdk) {
    const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL);
    sdk = new AstrixSDK({
      provider,
      chainId: parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '125999'),
      verbose: process.env.NODE_ENV === 'development'
    });
  }
  
  return sdk;
}
```

Then use this singleton in your components:

```typescript
// components/CommunityViewer.tsx
'use client';
import { useEffect, useState } from 'react';
import { getSDK } from '../lib/sdk';

export default function CommunityViewer({ communityId }) {
  const [community, setCommunity] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function loadCommunity() {
      const sdk = getSDK();
      if (sdk) {
        try {
          const data = await sdk.getCommunityData(communityId);
          setCommunity(data);
        } catch (error) {
          console.error('Failed to load community:', error);
        } finally {
          setLoading(false);
        }
      }
    }
    
    loadCommunity();
  }, [communityId]);
  
  if (loading) return <div>Loading...</div>;
  if (!community) return <div>Community not found</div>;
  
  return (
    <div>
      <h1>{community.name}</h1>
      {/* Display community data */}
    </div>
  );
}
```

## Common Error Codes

| Error Code | Description | Solution |
|------------|-------------|----------|
| `CONNECTION_ERROR` | Failed to connect to the blockchain network | Check network configuration, RPC URL, and connectivity |
| `CONTRACT_ERROR` | Error interacting with smart contracts | Verify contract addresses, permissions, and parameters |
| `TIMEOUT` | Operation timed out | Increase timeout settings or check network congestion |
| `INVALID_METADATA` | Post metadata doesn't meet requirements | Check metadata format and required fields |
| `PERMISSION_DENIED` | Insufficient permissions for operation | Ensure the account has appropriate roles |
| `UNSUPPORTED_NETWORK` | The specified network is not supported | Use one of the supported networks |
| `RATE_LIMIT` | Too many requests in a short time | Implement rate limiting or caching strategies |
| `INVALID_ADDRESS` | Provided address is not valid | Check address format and checksums |

## Deployment Issues

### Problem: Contracts not being detected on the network

**Symptoms:**
- "Contract not found" errors
- Zero address returned for expected contracts

**Solution:**
1. Run the update-contract-addresses script after deployment:
```bash
node scripts/update-contract-addresses.js --network monad-devnet --file deployment-output.json
```

2. Manually verify contract deployment:
```bash
npx hardhat verify --network monadDevnet <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

3. Check contract creation transaction status:
```bash
npx hardhat tx --network monadDevnet <TRANSACTION_HASH>
```

## Getting Additional Help

If you're still experiencing issues after following this guide, you can:

1. **Check the SDK Reference Documentation**: [SDK Reference](https://docs.tribebyastrix.io/sdk)
2. **Review the Integration Guide**: [Integration Guide](https://docs.tribebyastrix.io/integration)
3. **Join the Community**: [Astrix Discord](https://discord.gg/astrix)
4. **Contact Support**: For enterprise customers, email support@astrix.network

---

*This troubleshooting guide is regularly updated. Last update: [Current Date]* 