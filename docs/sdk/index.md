# Tribes by Astrix SDK

[![npm version](https://img.shields.io/npm/v/@wasserstoff/tribes-sdk.svg)](https://www.npmjs.com/package/@wasserstoff/tribes-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A TypeScript/JavaScript SDK for interacting with the Tribes by Astrix platform, enabling seamless integration with tribe management, points system, content creation, and more.

## Core Modules

The SDK consists of several modules for different aspects of the platform:

- **Tribes**: Create and manage tribes, memberships, and tribe settings
- **Points**: Handle tribe tokens, points distribution, and rewards
- **Token**: Interact with the Astrix token and related functions
- **Content**: Create and manage posts and other content
- **Collectibles**: Manage collectible NFTs within tribes

## Features

- **Easy Integration**: Simple methods to interact with Tribes by Astrix contracts
- **Type Safety**: Full TypeScript support with comprehensive types and interfaces
- **Modular Design**: Use only the modules you need for your application
- **Caching Layer**: Optimized performance with intelligent caching
- **Comprehensive Error Handling**: Clear error messages and recovery options
- **Detailed Documentation**: Complete API documentation and examples

## Example Usage

```typescript
import { AstrixSDK } from '@wasserstoff/tribes-sdk';
import { ethers } from 'ethers';

// Initialize with Ethereum provider
const sdk = new AstrixSDK({
  provider: window.ethereum, // Browser provider or any ethers provider
  chainId: 59141,           // Linea Sepolia testnet
  verbose: true             // Optional debug logging
});

// Initialize for read-only operations
await sdk.init();

// Connect wallet for write operations
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();
await sdk.connect(signer);

// Create a tribe
const tribeId = await sdk.tribes.createTribe({
  name: "My Amazing Tribe",
  metadata: JSON.stringify({
    description: "A community for blockchain enthusiasts",
    logoUrl: "https://example.com/logo.png",
    coverImageUrl: "https://example.com/cover.png",
    visibility: "PUBLIC"
  })
});

// Get tribe details
const tribeDetails = await sdk.tribes.getTribeDetails(tribeId);
console.log("Tribe details:", tribeDetails);
```

## Documentation

For detailed information on using the SDK, please refer to:

- [Installation Guide](./installation.md)
- [API Reference](./api-reference.md)
- [Integration Guide](./integration.md)
- [Quickstart Guide](./quickstart.md)

## Support

For questions, issues, or feature requests, please open an issue on the [GitHub repository](https://github.com/Wasserstoff-Innovation/TribesByAstrix/issues) or contact us at support@astrix.live.

## Tribe Management

The Tribes module provides comprehensive functionality for creating and managing tribes on the platform.

### Creating a Tribe

Creates a new tribe with the specified name and metadata.

**Parameters:**
- `name`: String - The name of the tribe
- `metadata`: String - JSON string with tribe metadata (description, logo, banner, etc.)
- `admins`: Array (optional) - List of additional admin addresses
- `joinType`: Number (optional) - Type of tribe (0=Public, 1=Private, 2=Invite)
- `entryFee`: BigInt (optional) - Fee to join the tribe in wei
- `nftRequirements`: Array (optional) - NFT requirements for joining

**Returns:** Promise<number> - The ID of the newly created tribe

**Example:**
```typescript
const tribeId = await sdk.tribes.createTribe({
  name: 'My Awesome Tribe',
  metadata: JSON.stringify({
    description: 'A tribe for awesome people',
    logoUrl: 'https://example.com/logo.png',
    bannerUrl: 'https://example.com/banner.png',
    tags: ['awesome', 'community']
  }),
  joinType: 0, // Public
  entryFee: 0n // No entry fee
});

console.log(`Created tribe with ID: ${tribeId}`);
```

### Getting All Tribes

Retrieves a list of all tribes on the platform with optional pagination.

**Parameters:**
- `offset`: Number (optional) - Pagination offset (default: 0)
- `limit`: Number (optional) - Maximum number of tribes to return (default: 100)

**Returns:** Promise<{ tribeIds: number[], total: number }>

**Example:**
```typescript
// Get all tribes
const allTribes = await sdk.tribes.getAllTribes();
console.log(`Total tribes: ${allTribes.total}`);
console.log(`Tribe IDs: ${allTribes.tribeIds.join(', ')}`);

// With pagination
const page1 = await sdk.tribes.getAllTribes(0, 10); // First 10 tribes
const page2 = await sdk.tribes.getAllTribes(10, 10); // Next 10 tribes
```

### Getting Tribe Details

Get detailed information about a specific tribe by ID.

**Parameters:**
- `tribeId`: Number - The ID of the tribe to retrieve

**Returns:** Promise<TribeDetails> - Object containing tribe details

> **Note:** The SDK internally uses a contract method called `getTribe`, but this method is exposed through the SDK as `getTribeDetails`. Always use `getTribeDetails` in your application code.

**Example:**
```typescript
const tribeDetails = await sdk.tribes.getTribeDetails(tribeId);

console.log(`Tribe Name: ${tribeDetails.name}`);
console.log(`Members: ${tribeDetails.memberCount}`);
console.log(`Creator: ${tribeDetails.creator}`);

// Parse metadata if needed
const metadata = JSON.parse(tribeDetails.metadata);
console.log(`Description: ${metadata.description}`);
```

The structure of the returned object includes:
- `id`: The tribe ID
- `name`: The tribe name
- `metadata`: JSON string containing tribe metadata
- `creator`: Address of the tribe creator
- `memberCount`: Number of members in the tribe
- `joinType`: The type of joining (0 = Public, 1 = Private, 2 = Invite)
- `entryFee`: Entry fee to join the tribe (in wei)
- `requirementsContract`: Address of NFT requirements contract (if any)
- `requirementsData`: Additional requirement data

### Getting Tribe Members

Retrieves a list of all members in a specific tribe.

**Parameters:**
- `tribeId`: Number - The ID of the tribe

**Returns:** Promise<string[]> - Array of member addresses

**Example:**
```typescript
const members = await sdk.tribes.getMembers(tribeId);
console.log(`Tribe has ${members.length} members`);
console.log(`Members: ${members.join(', ')}`);
```

### Joining a Tribe

Allows the connected wallet to join a public tribe.

**Parameters:**
- `tribeId`: Number - The ID of the tribe to join

**Returns:** Promise<string> - Transaction hash

**Example:**
```typescript
const tx = await sdk.tribes.joinTribe({ tribeId: 42 });
console.log(`Joined tribe! Transaction: ${tx}`);
```

### Requesting to Join a Private Tribe

Requests to join a private tribe, potentially with an entry fee.

**Parameters:**
- `tribeId`: Number - The ID of the tribe
- `entryFee`: BigInt (optional) - Entry fee to include with the request

**Returns:** Promise<string> - Transaction hash

**Example:**
```typescript
// Request with entry fee
const tx = await sdk.tribes.requestToJoinTribe({
  tribeId: 42,
  entryFee: ethers.parseEther("0.01")
});
console.log(`Request submitted! Transaction: ${tx}`);
```

### Joining a Tribe with Invite Code

Joins a tribe using an invite code.

**Parameters:**
- `tribeId`: Number - The ID of the tribe
- `inviteCode`: String - The invite code

**Returns:** Promise<string> - Transaction hash

**Example:**
```typescript
const tx = await sdk.tribes.joinTribeWithCode({
  tribeId: 42,
  inviteCode: "ABC123XYZ"
});
console.log(`Joined tribe with invite code! Transaction: ${tx}`);
```

### User's Tribes

Get a list of tribe IDs that a specific address is a member of.

**Parameters:**
- `address`: String - Address to check memberships for

**Returns:** Promise<number[]> - Array of tribe IDs

**Example:**
```typescript
// Get tribes for a specific address
const userTribes = await sdk.tribes.getUserTribes("0x1234...");
console.log(`User is a member of tribes: ${userTribes.join(', ')}`);

// Get tribes for connected wallet
const myTribes = await sdk.tribes.getUserTribes(await signer.getAddress());
console.log(`You are a member of ${myTribes.length} tribes`);
```

### Checking Member Status

Checks the membership status of an address in a tribe.

**Parameters:**
- `tribeId`: Number - The ID of the tribe
- `address`: String - The address to check

**Returns:** Promise<MemberStatus> - Member status enum (0=NotMember, 1=Pending, 2=Member, 3=Admin)

**Example:**
```typescript
const status = await sdk.tribes.getMemberStatus(tribeId, "0x1234...");

if (status === 2) {
  console.log("User is a member");
} else if (status === 3) {
  console.log("User is an admin");
} else if (status === 1) {
  console.log("User has a pending request");
} else {
  console.log("User is not a member");
}
```

## Points & Tokens

The Points module provides functionality for managing tribe tokens and points systems.

### Creating a Tribe Token

Creates a new ERC20 token for a tribe that can be used for rewards, access control, or other functionality.

**Parameters:**
- `tribeId`: Number - The ID of the tribe
- `name`: String - Name of the token
- `symbol`: String - Symbol of the token (ticker)

**Returns:** Promise<string> - Transaction hash

**Example:**
```typescript
const tx = await sdk.points.createTribeToken({
  tribeId: 42,
  name: "Awesome Tribe Token",
  symbol: "ATT"
});

console.log(`Created tribe token! Transaction: ${tx}`);
```

### Getting Tribe Token Address

Retrieves the address of a tribe's token.

**Parameters:**
- `tribeId`: Number - The ID of the tribe

**Returns:** Promise<string> - Token contract address

**Example:**
```typescript
const tokenAddress = await sdk.points.getTribeTokenAddress(tribeId);
console.log(`Tribe ${tribeId} token address: ${tokenAddress}`);
```

### Minting Tokens

Mints tokens to a specific address.

**Parameters:**
- `tribeId`: Number - The ID of the tribe
- `amount`: BigInt - Amount of tokens to mint
- `recipient`: String - Address to receive the tokens

**Returns:** Promise<string> - Transaction hash

**Example:**
```typescript
const amount = ethers.parseUnits("100", 18); // 100 tokens with 18 decimals
const tx = await sdk.points.mintTokens(tribeId, amount, userAddress);
console.log(`Minted ${amount} tokens! Transaction: ${tx}`);
```

### Setting Point Values for Actions

Sets the number of points earned for performing different actions within a tribe.

**Parameters:**
- `tribeId`: Number - The ID of the tribe
- `actionType`: String - Type of action (e.g., "POST_CREATE", "COMMENT")
- `points`: Number - Number of points for the action

**Returns:** Promise<string> - Transaction hash

**Example:**
```typescript
const tx = await sdk.points.setPointsForAction(tribeId, "POST_CREATE", 10);
console.log(`Set points for creating posts! Transaction: ${tx}`);
```

### Getting User Points

Gets the total points a user has earned in a tribe.

**Parameters:**
- `tribeId`: Number - The ID of the tribe
- `userAddress`: String - Address of the user

**Returns:** Promise<number> - Total points earned

**Example:**
```typescript
const points = await sdk.points.getPoints(tribeId, userAddress);
console.log(`User has earned ${points} points in tribe ${tribeId}`);
```

### Setting Exchange Rate

Sets the exchange rate between tribe tokens and Astrix tokens.

**Parameters:**
- `tribeId`: Number - The ID of the tribe
- `rate`: Number - Exchange rate (tribe tokens per 1 Astrix token)

**Returns:** Promise<string> - Transaction hash

**Example:**
```typescript
// 10 tribe tokens for 1 Astrix token
const tx = await sdk.points.setExchangeRate(tribeId, 10);
console.log(`Set exchange rate! Transaction: ${tx}`);
```

## Content Management

The Content module provides functionality for creating and managing posts and other content within tribes.

### Creating a Post

Creates a new post within a tribe.

**Parameters:**
- `tribeId`: Number - The ID of the tribe
- `content`: String - Post content
- `metadata`: String - JSON metadata for the post

**Returns:** Promise<number> - Post ID

**Example:**
```typescript
const postId = await sdk.content.createPost({
  tribeId: 42,
  content: "Hello tribe members!",
  metadata: JSON.stringify({
    title: "My First Post",
    tags: ["introduction", "hello"],
    attachments: []
  })
});

console.log(`Created post with ID: ${postId}`);
```

### Getting Posts for a Tribe

Gets all posts for a specific tribe.

**Parameters:**
- `tribeId`: Number - The ID of the tribe
- `offset`: Number (optional) - Pagination offset
- `limit`: Number (optional) - Maximum number of posts to return

**Returns:** Promise<{ posts: PostData[], total: number }> - Posts and total count

**Example:**
```typescript
const result = await sdk.content.getTribePosts(tribeId, 0, 10);
console.log(`Tribe has ${result.total} posts`);
result.posts.forEach(post => {
  console.log(`Post ${post.id}: ${post.content}`);
});
```

### Reacting to a Post

Adds a reaction to a post.

**Parameters:**
- `postId`: Number - The ID of the post
- `reactionType`: String - Type of reaction (e.g., "LIKE", "LOVE")

**Returns:** Promise<string> - Transaction hash

**Example:**
```typescript
const tx = await sdk.content.reactToPost(postId, "LIKE");
console.log(`Reacted to post! Transaction: ${tx}`);
```

### Commenting on a Post

Adds a comment to a post.

**Parameters:**
- `postId`: Number - The ID of the post
- `content`: String - Comment content

**Returns:** Promise<number> - Comment ID

**Example:**
```typescript
const commentId = await sdk.content.commentOnPost(postId, "Great post!");
console.log(`Added comment with ID: ${commentId}`);
``` 