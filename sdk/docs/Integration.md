# Tribes by Astrix SDK Integration Guide

This guide helps you integrate the Tribes by Astrix SDK into your application to build community and engagement features on the blockchain.

## Table of Contents

- [Installation](#installation)
- [Basic Setup](#basic-setup)
- [Wallet Connection](#wallet-connection)
- [Community Management](#community-management)
- [Post Management](#post-management)
- [Points System](#points-system)
- [Role Management](#role-management)
- [React Integration](#react-integration)
- [Next.js Integration](#nextjs-integration)
- [Advanced Configuration](#advanced-configuration)
- [Testing and Debugging](#testing-and-debugging)

## Installation

Install the SDK using npm or yarn:

```bash
# Using npm
npm install tribes-by-astrix-sdk ethers@6.11.1

# Using yarn
yarn add tribes-by-astrix-sdk ethers@6.11.1
```

The SDK requires ethers.js v6 as a peer dependency.

## Basic Setup

Import and initialize the SDK:

```typescript
import { AstrixSDK } from 'tribes-by-astrix-sdk';
import { JsonRpcProvider } from 'ethers';

// Initialize the SDK with a provider
const provider = new JsonRpcProvider('https://polygon-rpc.com');
const sdk = new AstrixSDK({
  provider,
  chainId: 137, // Polygon Mainnet
  verbose: true // Set to true for detailed logging during development
});

// Check connection
const network = await sdk.getNetworkInfo();
console.log(`Connected to ${network.name} (Chain ID: ${network.chainId})`);
```

## Wallet Connection

Connect a wallet for transactions that require signing:

```typescript
// Browser environment with MetaMask
async function connectWallet() {
  // Request account access if needed
  await window.ethereum.request({ method: 'eth_requestAccounts' });
  
  // Create a provider and signer
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  
  // Connect the signer to the SDK
  await sdk.connect(signer);
  
  console.log('Wallet connected:', await signer.getAddress());
  return signer;
}

// Check if wallet is connected
function isWalletConnected() {
  return sdk.isConnected();
}
```

For Node.js or server environments:

```typescript
import { Wallet } from 'ethers';

// Using a private key (secure this appropriately!)
const privateKey = process.env.PRIVATE_KEY;
const provider = new JsonRpcProvider('https://polygon-rpc.com');
const wallet = new Wallet(privateKey, provider);

// Connect the wallet to the SDK
await sdk.connect(wallet);
```

## Community Management

### Creating a Community

```typescript
async function createCommunity() {
  // Check if wallet is connected
  if (!sdk.isConnected()) {
    throw new Error('Wallet not connected');
  }
  
  // Define community metadata
  const metadata = {
    name: 'My Awesome Community',
    description: 'A community for blockchain enthusiasts',
    avatarUrl: 'https://example.com/avatar.png',
    bannerUrl: 'https://example.com/banner.jpg',
    website: 'https://example.com',
    socialLinks: {
      twitter: 'https://twitter.com/mycommunity',
      discord: 'https://discord.gg/mycommunity'
    }
  };
  
  try {
    // Create the community
    const communityId = await sdk.createCommunity(metadata);
    console.log('Community created with ID:', communityId);
    return communityId;
  } catch (error) {
    console.error('Failed to create community:', error);
    throw error;
  }
}
```

### Retrieving Communities

```typescript
// Get all communities
async function getAllCommunities() {
  const communities = await sdk.getCommunities();
  console.log(`Found ${communities.length} communities`);
  return communities;
}

// Get a specific community
async function getCommunityDetails(communityId) {
  const community = await sdk.getCommunity(communityId);
  console.log('Community details:', community);
  return community;
}

// Get communities with pagination
async function getPaginatedCommunities(page = 1, pageSize = 10) {
  const offset = (page - 1) * pageSize;
  const communities = await sdk.getCommunities({ 
    offset, 
    limit: pageSize 
  });
  
  return communities;
}
```

### Managing Community Members

```typescript
// Add a member to a community
async function addMember(communityId, memberAddress) {
  // Check if user has admin rights
  const isAdmin = await sdk.hasRole('COMMUNITY_ADMIN', communityId, await sdk.getSignerAddress());
  if (!isAdmin) {
    throw new Error('Only community admins can add members');
  }
  
  await sdk.addCommunityMember(communityId, memberAddress);
  console.log(`Added ${memberAddress} to community ${communityId}`);
}

// Remove a member
async function removeMember(communityId, memberAddress) {
  await sdk.removeCommunityMember(communityId, memberAddress);
  console.log(`Removed ${memberAddress} from community ${communityId}`);
}

// Check if an address is a member
async function checkMembership(communityId, address) {
  const isMember = await sdk.isCommunityMember(communityId, address);
  console.log(`Is member: ${isMember}`);
  return isMember;
}
```

## Post Management

### Creating Posts

```typescript
async function createTextPost(communityId, title, body) {
  // Create post metadata
  const metadata = {
    type: 'TEXT',
    title,
    body
  };
  
  try {
    // Convert metadata to JSON string
    const metadataString = JSON.stringify(metadata);
    
    // Create the post
    const postId = await sdk.createPost(communityId, metadataString);
    console.log('Post created with ID:', postId);
    return postId;
  } catch (error) {
    console.error('Failed to create post:', error);
    throw error;
  }
}

// Create an event post
async function createEventPost(communityId, eventDetails) {
  const metadata = {
    type: 'EVENT',
    title: eventDetails.title,
    description: eventDetails.description,
    location: eventDetails.location,
    startDate: eventDetails.startDate, // ISO format
    endDate: eventDetails.endDate, // ISO format
    imageUrl: eventDetails.imageUrl
  };
  
  const metadataString = JSON.stringify(metadata);
  const postId = await sdk.createPost(communityId, metadataString);
  return postId;
}
```

### Retrieving Posts

```typescript
// Get all posts from a community
async function getCommunityPosts(communityId, options = {}) {
  const posts = await sdk.getPosts(communityId, options);
  console.log(`Found ${posts.length} posts in community ${communityId}`);
  return posts;
}

// Get a specific post
async function getPostDetails(postId) {
  const post = await sdk.getPost(postId);
  
  // Parse metadata for display
  const metadata = JSON.parse(post.metadata);
  console.log('Post details:', {
    id: post.id,
    creator: post.creator,
    timestamp: post.timestamp,
    type: metadata.type,
    title: metadata.title,
    // Other metadata fields based on post type
  });
  
  return post;
}

// Get posts by creator
async function getPostsByCreator(communityId, creatorAddress) {
  const posts = await sdk.getPostsByCreator(communityId, creatorAddress);
  return posts;
}
```

## Points System

### Awarding Points

```typescript
async function awardPoints(communityId, recipientAddress, amount, reason) {
  try {
    await sdk.awardPoints(communityId, recipientAddress, amount, reason);
    console.log(`Awarded ${amount} points to ${recipientAddress}`);
    
    // Verify points were awarded
    const newBalance = await sdk.getPointBalance(communityId, recipientAddress);
    console.log(`New balance: ${newBalance} points`);
  } catch (error) {
    console.error('Failed to award points:', error);
    throw error;
  }
}

// Batch award points to multiple users
async function batchAwardPoints(communityId, recipients) {
  // recipients is an array of { address, amount, reason } objects
  await sdk.batchAwardPoints(communityId, recipients);
  console.log(`Awarded points to ${recipients.length} recipients`);
}
```

### Checking Point Balances

```typescript
// Get point balance for a user
async function getBalance(communityId, address) {
  const balance = await sdk.getPointBalance(communityId, address);
  console.log(`${address} has ${balance} points in community ${communityId}`);
  return balance;
}

// Get leaderboard
async function getLeaderboard(communityId, limit = 10) {
  const leaderboard = await sdk.getPointLeaderboard(communityId, { limit });
  console.log('Points leaderboard:', leaderboard);
  return leaderboard;
}
```

## Role Management

### Checking and Assigning Roles

```typescript
// Available roles:
// - COMMUNITY_ADMIN
// - POINTS_MANAGER
// - CONTENT_CREATOR
// - COMMUNITY_CREATOR
// - EVENT_MANAGER

// Check if a user has a specific role
async function checkRole(roleName, communityId, address) {
  const hasRole = await sdk.hasRole(roleName, communityId, address);
  console.log(`Does ${address} have role ${roleName}? ${hasRole}`);
  return hasRole;
}

// Grant a role to a user (requires admin privileges)
async function grantRole(roleName, communityId, address) {
  // Check if caller has admin privileges
  const callerAddress = await sdk.getSignerAddress();
  const isAdmin = await sdk.hasRole('COMMUNITY_ADMIN', communityId, callerAddress);
  
  if (!isAdmin) {
    throw new Error('Only admins can grant roles');
  }
  
  await sdk.grantRole(roleName, communityId, address);
  console.log(`Granted role ${roleName} to ${address}`);
}

// Revoke a role
async function revokeRole(roleName, communityId, address) {
  await sdk.revokeRole(roleName, communityId, address);
  console.log(`Revoked role ${roleName} from ${address}`);
}
```

## React Integration

Create a custom hook for using the SDK in React components:

```jsx
// hooks/useAstrixSDK.js
import { useState, useEffect } from 'react';
import { AstrixSDK } from 'tribes-by-astrix-sdk';
import { BrowserProvider, JsonRpcProvider } from 'ethers';

let sdkInstance = null;

export function useAstrixSDK() {
  const [sdk, setSdk] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [account, setAccount] = useState(null);
  
  // Initialize SDK
  useEffect(() => {
    async function initializeSDK() {
      try {
        if (!sdkInstance) {
          // Create SDK instance if it doesn't exist
          const provider = new JsonRpcProvider('https://polygon-rpc.com');
          sdkInstance = new AstrixSDK({
            provider,
            chainId: 137
          });
        }
        
        setSdk(sdkInstance);
        setLoading(false);
      } catch (err) {
        console.error('Failed to initialize SDK:', err);
        setError(err.message);
        setLoading(false);
      }
    }
    
    initializeSDK();
  }, []);
  
  // Connect wallet function
  const connectWallet = async () => {
    if (!sdk) return;
    
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      await sdk.connect(signer);
      
      const address = await signer.getAddress();
      setAccount(address);
      
      return address;
    } catch (err) {
      console.error('Failed to connect wallet:', err);
      setError(err.message);
      throw err;
    }
  };
  
  // Disconnect wallet
  const disconnectWallet = () => {
    if (sdk) {
      sdk.disconnect();
      setAccount(null);
    }
  };
  
  return { 
    sdk, 
    loading, 
    error, 
    account, 
    connectWallet, 
    disconnectWallet,
    isConnected: !!account
  };
}

// Usage in a component
function CommunityComponent() {
  const { sdk, loading, account, connectWallet } = useAstrixSDK();
  const [communities, setCommunities] = useState([]);
  
  useEffect(() => {
    if (sdk && !loading) {
      // Fetch communities
      sdk.getCommunities()
        .then(data => setCommunities(data))
        .catch(err => console.error('Error fetching communities:', err));
    }
  }, [sdk, loading]);
  
  return (
    <div>
      {!account ? (
        <button onClick={connectWallet}>Connect Wallet</button>
      ) : (
        <div>
          <p>Connected: {account}</p>
          <h2>Communities</h2>
          {communities.map(community => (
            <div key={community.id}>
              <h3>{community.metadata.name}</h3>
              <p>{community.metadata.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

## Next.js Integration

Create a singleton pattern for the SDK in Next.js:

```jsx
// lib/sdk.js
import { AstrixSDK } from 'tribes-by-astrix-sdk';
import { JsonRpcProvider } from 'ethers';

let sdkInstance = null;

export function getSDK() {
  if (typeof window === 'undefined') {
    // Server-side: return null or handle differently
    return null;
  }
  
  if (!sdkInstance) {
    const provider = new JsonRpcProvider('https://polygon-rpc.com');
    sdkInstance = new AstrixSDK({
      provider,
      chainId: 137
    });
  }
  
  return sdkInstance;
}

// pages/index.js
'use client';
import { useState, useEffect } from 'react';
import { getSDK } from '../lib/sdk';
import { BrowserProvider } from 'ethers';

export default function Home() {
  const [account, setAccount] = useState(null);
  const [communities, setCommunities] = useState([]);
  
  useEffect(() => {
    const sdk = getSDK();
    if (sdk) {
      sdk.getCommunities()
        .then(data => setCommunities(data))
        .catch(err => console.error(err));
    }
  }, []);
  
  async function connectWallet() {
    const sdk = getSDK();
    if (!sdk) return;
    
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      await sdk.connect(signer);
      const address = await signer.getAddress();
      setAccount(address);
    } catch (err) {
      console.error('Failed to connect wallet:', err);
    }
  }
  
  return (
    <div>
      <h1>Tribes by Astrix</h1>
      
      {!account ? (
        <button onClick={connectWallet}>Connect Wallet</button>
      ) : (
        <div>
          <p>Connected: {account}</p>
          <h2>Communities</h2>
          {communities.map(community => (
            <div key={community.id}>
              <h3>{JSON.parse(community.metadata).name}</h3>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

## Advanced Configuration

### Custom Contract Addresses

```typescript
// Initialize SDK with custom contract addresses
const sdk = new AstrixSDK({
  provider,
  chainId: 137,
  contracts: {
    roleManager: '0x1234...',
    tribeController: '0x5678...',
    astrixPointSystem: '0x9abc...',
    postMinter: '0xdef0...'
    // Add other contract addresses as needed
  }
});
```

### Transaction Options

```typescript
// Create a post with custom transaction options
const postId = await sdk.createPost(
  communityId, 
  metadataString, 
  {
    gasLimit: 500000, // Custom gas limit
    maxFeePerGas: ethers.parseUnits('50', 'gwei'), // For EIP-1559
    maxPriorityFeePerGas: ethers.parseUnits('2', 'gwei'),
    nonce: 5 // Custom nonce
  }
);
```

### Event Listeners

```typescript
// Listen for new posts in a community
sdk.onNewPost(communityId, (post) => {
  console.log('New post created:', post);
  // Update UI or trigger notifications
});

// Listen for point awards
sdk.onPointsAwarded(communityId, (event) => {
  console.log(`${event.amount} points awarded to ${event.recipient}`);
  // Update leaderboard or user balance
});

// Remove listeners when done
sdk.removeAllListeners();
```

## Testing and Debugging

### Working with Test Networks

```typescript
// Connect to Mumbai testnet
const testProvider = new JsonRpcProvider('https://rpc-mumbai.maticvigil.com');
const testSDK = new AstrixSDK({
  provider: testProvider,
  chainId: 80001 // Mumbai testnet
});

// Or connect to local development network
const localProvider = new JsonRpcProvider('http://localhost:8545');
const localSDK = new AstrixSDK({
  provider: localProvider,
  chainId: 31337 // Hardhat local network
});
```

### Debug Mode

```typescript
// Enable verbose logging
const sdk = new AstrixSDK({
  provider,
  chainId: 137,
  verbose: true
});

// Manual debugging of transactions
async function debugTransaction(txHash) {
  const receipt = await sdk.provider.getTransactionReceipt(txHash);
  console.log('Transaction status:', receipt.status === 1 ? 'Success' : 'Failed');
  console.log('Gas used:', receipt.gasUsed.toString());
  console.log('Block number:', receipt.blockNumber);
  
  // Get transaction details
  const tx = await sdk.provider.getTransaction(txHash);
  console.log('Transaction data:', tx.data);
  console.log('From:', tx.from);
  console.log('To:', tx.to);
  
  return { receipt, tx };
}
```

For more details on specific methods and their parameters, see the [API Reference](./API.md). If you encounter any issues during integration, refer to the [Troubleshooting Guide](./Troubleshooting.md). 