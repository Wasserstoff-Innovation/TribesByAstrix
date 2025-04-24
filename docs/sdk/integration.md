# SDK Integration Guide

This guide helps you integrate the Tribes by Astrix SDK into your application to build community and engagement features on the blockchain.

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

## Content Management

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
```

## Points & Tokens System

### Tribe Token Setup and Management

```typescript
// Create a tribe token
async function setupTribeToken(communityId) {
  // Step 1: Set the organization that will fund points for the tribe
  // This is required before creating a token
  await sdk.points.setTribeOrganization({
    tribeId: communityId,
    organization: await sdk.getSignerAddress() // Using the current signer as the organization
  });
  
  // Step 2: Create a tribe token
  await sdk.points.createTribeToken({
    tribeId: communityId,
    name: "Community Token",
    symbol: "COMM"
  });
  
  // Get the token address to verify creation
  const tokenAddress = await sdk.points.getTribeTokenAddress(communityId);
  console.log(`Tribe token created at address: ${tokenAddress}`);
  
  // Step 3: Set the exchange rate (tribe tokens per 1 Astrix token)
  await sdk.points.setExchangeRate({
    tribeId: communityId,
    rate: 100 // 100 tribe tokens per 1 Astrix token
  });
  
  // Step 4: Set action points for different activities
  const actions = [
    { type: "POST_ACTION", points: 50 },
    { type: "COMMENT_ACTION", points: 10 },
    { type: "LIKE_ACTION", points: 5 }
  ];
  
  for (const action of actions) {
    await sdk.points.setActionPoints({
      tribeId: communityId,
      actionType: action.type,
      points: action.points
    });
    console.log(`Set ${action.points} points for ${action.type}`);
    
    // Verify action points were set correctly
    const actionPoints = await sdk.points.getActionPoints(communityId, action.type);
    console.log(`Verified ${action.type} points: ${actionPoints}`);
  }
  
  // Retrieve the exchange rate to verify it was set correctly
  const exchangeRate = await sdk.points.getExchangeRate(communityId);
  console.log(`Exchange rate: ${exchangeRate} tribe tokens per 1 Astrix token`);
  
  return {
    tokenAddress,
    exchangeRate,
    actions: actions.map(a => ({ type: a.type, points: a.points }))
  };
}
```

### Recording User Actions

```typescript
// Record an action taken by a user that should earn points
async function recordUserAction(communityId, userAddress, actionType) {
  try {
    // This will automatically award points based on the action type configuration
    await sdk.points.recordAction({
      tribeId: communityId,
      member: userAddress,
      actionType: actionType // e.g., "POST_ACTION", "COMMENT_ACTION", "LIKE_ACTION"
    });
    
    // Get the user's updated point balance
    const pointBalance = await sdk.points.getMemberPoints(communityId, userAddress);
    console.log(`User now has ${pointBalance} points`);
    
    return pointBalance;
  } catch (error) {
    console.error('Failed to record action:', error);
    throw error;
  }
}
```

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

## Framework Integration

### React Integration

Here's a custom hook for using the SDK in React components:

```jsx
// hooks/useAstrixSDK.js
import { useState, useEffect } from 'react';
import { AstrixSDK } from '@wasserstoff/tribes-sdk';
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
          const provider = new JsonRpcProvider('https://rpc.sepolia.linea.build');
          sdkInstance = new AstrixSDK({
            provider,
            chainId: 59141
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
  
  return { 
    sdk, 
    loading, 
    error, 
    account, 
    connectWallet, 
    isConnected: !!account
  };
}
```

### Next.js Integration

Create a singleton pattern for the SDK in Next.js:

```jsx
// lib/sdk.js
import { AstrixSDK } from '@wasserstoff/tribes-sdk';
import { JsonRpcProvider } from 'ethers';

let sdkInstance = null;

export function getSDK() {
  if (typeof window === 'undefined') {
    // Server-side: return null or handle differently
    return null;
  }
  
  if (!sdkInstance) {
    const provider = new JsonRpcProvider('https://rpc.sepolia.linea.build');
    sdkInstance = new AstrixSDK({
      provider,
      chainId: 59141
    });
  }
  
  return sdkInstance;
}
```

## Advanced Configurations

### Custom Transaction Options

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