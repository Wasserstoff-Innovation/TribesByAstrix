# Tribes by Astrix SDK API Reference

This document provides detailed information about all available methods, parameters, and return types in the Tribes by Astrix SDK.

## Table of Contents

- [Core SDK](#core-sdk)
- [Authentication](#authentication)
- [Network](#network)
- [Communities](#communities)
- [Posts](#posts)
- [Points System](#points-system)
- [Roles & Permissions](#roles--permissions)
- [Events](#events)
- [Types](#types)

## Core SDK

### Constructor

Initialize a new instance of the Astrix SDK.

```typescript
constructor(config: AstrixSDKConfig)
```

**Parameters:**

- `config: AstrixSDKConfig` - Configuration object for the SDK

**AstrixSDKConfig Object:**

```typescript
interface AstrixSDKConfig {
  provider: JsonRpcProvider | BrowserProvider;  // Ethereum provider
  chainId: number;                              // Chain ID of the network
  contracts?: ContractAddresses;                // Optional custom contract addresses
  verbose?: boolean;                            // Enable detailed logging (default: false)
  timeout?: number;                             // Request timeout in ms (default: 30000)
}
```

**Example:**

```typescript
import { AstrixSDK } from 'tribes-by-astrix-sdk';
import { JsonRpcProvider } from 'ethers';

const provider = new JsonRpcProvider('https://polygon-rpc.com');
const sdk = new AstrixSDK({
  provider,
  chainId: 137,
  verbose: true
});
```

### Error Handling

All methods in the SDK can throw the following errors:

- `ContractError`: Thrown when a contract interaction fails
- `ConnectionError`: Thrown when there are network connectivity issues
- `ValidationError`: Thrown when input validation fails
- `AuthenticationError`: Thrown when the user lacks required permissions
- `TimeoutError`: Thrown when a request times out

## Authentication

### connect

Connect a signer to the SDK for authenticated transactions.

```typescript
async connect(signer: Signer): Promise<void>
```

**Parameters:**

- `signer: Signer` - Ethers.js Signer instance

**Returns:** `Promise<void>`

**Example:**

```typescript
const provider = new BrowserProvider(window.ethereum);
const signer = await provider.getSigner();
await sdk.connect(signer);
```

### disconnect

Disconnect the current signer from the SDK.

```typescript
disconnect(): void
```

**Returns:** `void`

**Example:**

```typescript
sdk.disconnect();
```

### isConnected

Check if a signer is connected to the SDK.

```typescript
isConnected(): boolean
```

**Returns:** `boolean` - `true` if a signer is connected, `false` otherwise

**Example:**

```typescript
if (sdk.isConnected()) {
  // Perform authenticated action
}
```

### getSignerAddress

Get the address of the currently connected signer.

```typescript
async getSignerAddress(): Promise<string>
```

**Returns:** `Promise<string>` - The Ethereum address of the connected signer

**Throws:** `AuthenticationError` if no signer is connected

**Example:**

```typescript
const address = await sdk.getSignerAddress();
console.log(`Connected as: ${address}`);
```

## Network

### getNetworkInfo

Get information about the currently connected network.

```typescript
async getNetworkInfo(): Promise<NetworkInfo>
```

**Returns:** `Promise<NetworkInfo>` - Information about the connected network

**NetworkInfo Object:**

```typescript
interface NetworkInfo {
  name: string;     // Network name (e.g., "Polygon Mainnet")
  chainId: number;  // Chain ID (e.g., 137)
  ensAddress?: string;  // ENS address if available
}
```

**Example:**

```typescript
const network = await sdk.getNetworkInfo();
console.log(`Connected to ${network.name} (Chain ID: ${network.chainId})`);
```

### getContractAddress

Get the address of a specific contract.

```typescript
getContractAddress(contractName: string): string
```

**Parameters:**

- `contractName: string` - Name of the contract (e.g., "postMinter", "astrixPointSystem")

**Returns:** `string` - The contract address

**Example:**

```typescript
const postMinterAddress = sdk.getContractAddress("postMinter");
console.log(`PostMinter contract: ${postMinterAddress}`);
```

## Communities

### createCommunity

Create a new community.

```typescript
async createCommunity(metadata: CommunityMetadata | string): Promise<string>
```

**Parameters:**

- `metadata: CommunityMetadata | string` - Community metadata object or JSON string

**CommunityMetadata Object:**

```typescript
interface CommunityMetadata {
  name: string;               // Community name
  description: string;        // Community description
  avatarUrl?: string;         // URL to community avatar image
  bannerUrl?: string;         // URL to community banner image
  website?: string;           // Community website URL
  socialLinks?: {             // Social media links
    twitter?: string;
    discord?: string;
    telegram?: string;
    [key: string]: string;    // Other social links
  };
  [key: string]: any;         // Additional custom metadata
}
```

**Returns:** `Promise<string>` - The ID of the created community

**Throws:** 
- `AuthenticationError` if no signer is connected
- `ValidationError` if the metadata is invalid

**Example:**

```typescript
const metadata = {
  name: "My Community",
  description: "A community for blockchain enthusiasts",
  avatarUrl: "https://example.com/avatar.png",
  bannerUrl: "https://example.com/banner.jpg",
  website: "https://example.com"
};

const communityId = await sdk.createCommunity(metadata);
console.log(`Created community with ID: ${communityId}`);
```

### getCommunities

Get a list of communities.

```typescript
async getCommunities(options?: PaginationOptions): Promise<Community[]>
```

**Parameters:**

- `options?: PaginationOptions` - Optional pagination parameters

**PaginationOptions Object:**

```typescript
interface PaginationOptions {
  offset?: number;  // Starting index (default: 0)
  limit?: number;   // Maximum number of results (default: 100)
}
```

**Returns:** `Promise<Community[]>` - Array of community objects

**Community Object:**

```typescript
interface Community {
  id: string;               // Community ID
  creator: string;          // Creator's Ethereum address
  metadata: string;         // Community metadata JSON string
  memberCount: number;      // Number of community members
  createdAt: number;        // Timestamp of creation
}
```

**Example:**

```typescript
// Get all communities
const communities = await sdk.getCommunities();

// With pagination
const paginatedCommunities = await sdk.getCommunities({ offset: 10, limit: 20 });
```

### getCommunity

Get details of a specific community.

```typescript
async getCommunity(communityId: string): Promise<Community>
```

**Parameters:**

- `communityId: string` - ID of the community to retrieve

**Returns:** `Promise<Community>` - Community object

**Example:**

```typescript
const community = await sdk.getCommunity("123");
console.log("Community:", community);
```

### addCommunityMember

Add a member to a community.

```typescript
async addCommunityMember(communityId: string, memberAddress: string): Promise<void>
```

**Parameters:**

- `communityId: string` - ID of the community
- `memberAddress: string` - Ethereum address of the new member

**Returns:** `Promise<void>`

**Throws:** `AuthenticationError` if the signer lacks COMMUNITY_ADMIN role

**Example:**

```typescript
await sdk.addCommunityMember("123", "0x1234...");
```

### removeCommunityMember

Remove a member from a community.

```typescript
async removeCommunityMember(communityId: string, memberAddress: string): Promise<void>
```

**Parameters:**

- `communityId: string` - ID of the community
- `memberAddress: string` - Ethereum address of the member to remove

**Returns:** `Promise<void>`

**Throws:** `AuthenticationError` if the signer lacks COMMUNITY_ADMIN role

**Example:**

```typescript
await sdk.removeCommunityMember("123", "0x1234...");
```

### isCommunityMember

Check if an address is a member of a community.

```typescript
async isCommunityMember(communityId: string, address: string): Promise<boolean>
```

**Parameters:**

- `communityId: string` - ID of the community
- `address: string` - Ethereum address to check

**Returns:** `Promise<boolean>` - `true` if the address is a member, `false` otherwise

**Example:**

```typescript
const isMember = await sdk.isCommunityMember("123", "0x1234...");
console.log(`Is member: ${isMember}`);
```

### getCommunityMembers

Get all members of a community.

```typescript
async getCommunityMembers(communityId: string, options?: PaginationOptions): Promise<string[]>
```

**Parameters:**

- `communityId: string` - ID of the community
- `options?: PaginationOptions` - Optional pagination parameters

**Returns:** `Promise<string[]>` - Array of member Ethereum addresses

**Example:**

```typescript
const members = await sdk.getCommunityMembers("123");
console.log(`Community has ${members.length} members`);
```

### updateCommunity

Update community metadata.

```typescript
async updateCommunity(communityId: string, metadata: CommunityMetadata | string): Promise<void>
```

**Parameters:**

- `communityId: string` - ID of the community
- `metadata: CommunityMetadata | string` - Updated community metadata object or JSON string

**Returns:** `Promise<void>`

**Throws:** `AuthenticationError` if the signer lacks COMMUNITY_ADMIN role

**Example:**

```typescript
const updatedMetadata = {
  name: "Updated Community Name",
  description: "New description"
};

await sdk.updateCommunity("123", updatedMetadata);
```

## Posts

### createPost

Create a new post in a community.

```typescript
async createPost(communityId: string, metadata: PostMetadata | string, txOptions?: TransactionOptions): Promise<string>
```

**Parameters:**

- `communityId: string` - ID of the community
- `metadata: PostMetadata | string` - Post metadata object or JSON string
- `txOptions?: TransactionOptions` - Optional transaction options

**PostMetadata Object:**

```typescript
interface PostMetadata {
  type: "TEXT" | "IMAGE" | "VIDEO" | "EVENT" | "POLL" | string;  // Post type
  title: string;            // Post title
  body?: string;            // Post content (for TEXT type)
  imageUrl?: string;        // Image URL (for IMAGE type)
  videoUrl?: string;        // Video URL (for VIDEO type)
  startDate?: string;       // Event start date (for EVENT type)
  endDate?: string;         // Event end date (for EVENT type)
  location?: string;        // Event location (for EVENT type)
  options?: string[];       // Poll options (for POLL type)
  [key: string]: any;       // Additional custom metadata
}
```

**TransactionOptions Object:**

```typescript
interface TransactionOptions {
  gasLimit?: bigint | number;            // Gas limit for the transaction
  gasPrice?: bigint | number;            // Gas price (for legacy transactions)
  maxFeePerGas?: bigint | number;        // Max fee per gas (for EIP-1559)
  maxPriorityFeePerGas?: bigint | number; // Max priority fee (for EIP-1559)
  nonce?: number;                        // Transaction nonce
}
```

**Returns:** `Promise<string>` - The ID of the created post

**Throws:** 
- `AuthenticationError` if no signer is connected
- `ValidationError` if the metadata is invalid

**Example:**

```typescript
// Text post
const textPostMetadata = {
  type: "TEXT",
  title: "My First Post",
  body: "This is the content of my post."
};

const postId = await sdk.createPost("123", textPostMetadata);

// Event post
const eventPostMetadata = {
  type: "EVENT",
  title: "Community Meetup",
  body: "Join us for our monthly meetup!",
  startDate: "2023-12-01T18:00:00Z",
  endDate: "2023-12-01T20:00:00Z",
  location: "Virtual"
};

await sdk.createPost("123", eventPostMetadata);
```

### getPosts

Get posts from a community.

```typescript
async getPosts(communityId: string, options?: PostQueryOptions): Promise<Post[]>
```

**Parameters:**

- `communityId: string` - ID of the community
- `options?: PostQueryOptions` - Optional query parameters

**PostQueryOptions Object:**

```typescript
interface PostQueryOptions extends PaginationOptions {
  type?: string;         // Filter by post type
  creator?: string;      // Filter by creator address
  startTime?: number;    // Filter by start time (timestamp)
  endTime?: number;      // Filter by end time (timestamp)
  sortBy?: "time" | "popularity";  // Sort method (default: "time")
  sortDirection?: "asc" | "desc";  // Sort direction (default: "desc")
}
```

**Returns:** `Promise<Post[]>` - Array of post objects

**Post Object:**

```typescript
interface Post {
  id: string;            // Post ID
  communityId: string;   // Community ID
  creator: string;       // Creator's Ethereum address
  metadata: string;      // Post metadata JSON string
  timestamp: number;     // Creation timestamp
  likeCount?: number;    // Number of likes
  commentCount?: number; // Number of comments
}
```

**Example:**

```typescript
// Get all posts
const posts = await sdk.getPosts("123");

// Filter by type
const eventPosts = await sdk.getPosts("123", { type: "EVENT" });

// With pagination
const recentPosts = await sdk.getPosts("123", { 
  limit: 20, 
  sortBy: "time", 
  sortDirection: "desc" 
});
```

### getPost

Get details of a specific post.

```typescript
async getPost(postId: string): Promise<Post>
```

**Parameters:**

- `postId: string` - ID of the post to retrieve

**Returns:** `Promise<Post>` - Post object

**Example:**

```typescript
const post = await sdk.getPost("456");
console.log("Post:", post);

// Parse metadata
const metadata = JSON.parse(post.metadata);
console.log("Post title:", metadata.title);
```

### getPostsByCreator

Get posts created by a specific address in a community.

```typescript
async getPostsByCreator(communityId: string, creatorAddress: string, options?: PaginationOptions): Promise<Post[]>
```

**Parameters:**

- `communityId: string` - ID of the community
- `creatorAddress: string` - Ethereum address of the creator
- `options?: PaginationOptions` - Optional pagination parameters

**Returns:** `Promise<Post[]>` - Array of post objects

**Example:**

```typescript
const userPosts = await sdk.getPostsByCreator("123", "0x1234...");
console.log(`User has created ${userPosts.length} posts`);
```

### likePost

Like a post.

```typescript
async likePost(postId: string): Promise<void>
```

**Parameters:**

- `postId: string` - ID of the post to like

**Returns:** `Promise<void>`

**Throws:** `AuthenticationError` if no signer is connected

**Example:**

```typescript
await sdk.likePost("456");
```

### commentOnPost

Add a comment to a post.

```typescript
async commentOnPost(postId: string, commentMetadata: CommentMetadata | string): Promise<string>
```

**Parameters:**

- `postId: string` - ID of the post
- `commentMetadata: CommentMetadata | string` - Comment metadata object or JSON string

**CommentMetadata Object:**

```typescript
interface CommentMetadata {
  body: string;          // Comment text content
  [key: string]: any;    // Additional custom metadata
}
```

**Returns:** `Promise<string>` - The ID of the created comment

**Throws:** `AuthenticationError` if no signer is connected

**Example:**

```typescript
const commentMetadata = {
  body: "Great post! Thanks for sharing."
};

const commentId = await sdk.commentOnPost("456", commentMetadata);
```

### getPostComments

Get comments on a post.

```typescript
async getPostComments(postId: string, options?: PaginationOptions): Promise<Comment[]>
```

**Parameters:**

- `postId: string` - ID of the post
- `options?: PaginationOptions` - Optional pagination parameters

**Returns:** `Promise<Comment[]>` - Array of comment objects

**Comment Object:**

```typescript
interface Comment {
  id: string;          // Comment ID
  postId: string;      // Post ID
  creator: string;     // Creator's Ethereum address
  metadata: string;    // Comment metadata JSON string
  timestamp: number;   // Creation timestamp
}
```

**Example:**

```typescript
const comments = await sdk.getPostComments("456");
console.log(`Post has ${comments.length} comments`);
```

### validateMetadata

Validate post metadata before submitting to the blockchain.

```typescript
validateMetadata(metadata: PostMetadata | string, type?: string): boolean
```

**Parameters:**

- `metadata: PostMetadata | string` - Metadata to validate
- `type?: string` - Optional post type to validate against

**Returns:** `boolean` - `true` if metadata is valid

**Throws:** `ValidationError` if the metadata is invalid

**Example:**

```typescript
try {
  const isValid = sdk.validateMetadata({
    type: "TEXT",
    title: "My Post",
    body: "Content"
  });
  console.log("Metadata is valid");
} catch (error) {
  console.error("Invalid metadata:", error.message);
}
```

## Points System

### awardPoints

Award points to a user in a community.

```typescript
async awardPoints(communityId: string, recipientAddress: string, amount: number, reason?: string): Promise<void>
```

**Parameters:**

- `communityId: string` - ID of the community
- `recipientAddress: string` - Ethereum address of the recipient
- `amount: number` - Number of points to award
- `reason?: string` - Optional reason for awarding points

**Returns:** `Promise<void>`

**Throws:** `AuthenticationError` if the signer lacks POINTS_MANAGER role

**Example:**

```typescript
await sdk.awardPoints("123", "0x1234...", 100, "Active participation");
```

### batchAwardPoints

Award points to multiple users in a community.

```typescript
async batchAwardPoints(communityId: string, recipients: PointRecipient[]): Promise<void>
```

**Parameters:**

- `communityId: string` - ID of the community
- `recipients: PointRecipient[]` - Array of recipient objects

**PointRecipient Object:**

```typescript
interface PointRecipient {
  address: string;    // Ethereum address of the recipient
  amount: number;     // Number of points to award
  reason?: string;    // Optional reason for awarding points
}
```

**Returns:** `Promise<void>`

**Throws:** `AuthenticationError` if the signer lacks POINTS_MANAGER role

**Example:**

```typescript
const recipients = [
  { address: "0x1234...", amount: 50, reason: "Comment contribution" },
  { address: "0x5678...", amount: 100, reason: "Post creation" }
];

await sdk.batchAwardPoints("123", recipients);
```

### getPointBalance

Get the point balance of a user in a community.

```typescript
async getPointBalance(communityId: string, address: string): Promise<number>
```

**Parameters:**

- `communityId: string` - ID of the community
- `address: string` - Ethereum address of the user

**Returns:** `Promise<number>` - Point balance

**Example:**

```typescript
const balance = await sdk.getPointBalance("123", "0x1234...");
console.log(`User has ${balance} points`);
```

### getTotalPointBalance

Get the total point balance of a user across all communities.

```typescript
async getTotalPointBalance(address: string): Promise<number>
```

**Parameters:**

- `address: string` - Ethereum address of the user

**Returns:** `Promise<number>` - Total point balance

**Example:**

```typescript
const totalBalance = await sdk.getTotalPointBalance("0x1234...");
console.log(`User has ${totalBalance} points in total`);
```

### getPointLeaderboard

Get the point leaderboard for a community.

```typescript
async getPointLeaderboard(communityId: string, options?: PaginationOptions): Promise<LeaderboardEntry[]>
```

**Parameters:**

- `communityId: string` - ID of the community
- `options?: PaginationOptions` - Optional pagination parameters

**Returns:** `Promise<LeaderboardEntry[]>` - Array of leaderboard entries

**LeaderboardEntry Object:**

```typescript
interface LeaderboardEntry {
  address: string;    // User's Ethereum address
  points: number;     // Point balance
  rank: number;       // Leaderboard rank
}
```

**Example:**

```typescript
const leaderboard = await sdk.getPointLeaderboard("123", { limit: 10 });
console.log("Top 10 community members:", leaderboard);
```

### getPointHistory

Get the point transaction history for a user in a community.

```typescript
async getPointHistory(communityId: string, address: string, options?: PaginationOptions): Promise<PointTransaction[]>
```

**Parameters:**

- `communityId: string` - ID of the community
- `address: string` - Ethereum address of the user
- `options?: PaginationOptions` - Optional pagination parameters

**Returns:** `Promise<PointTransaction[]>` - Array of point transactions

**PointTransaction Object:**

```typescript
interface PointTransaction {
  id: string;             // Transaction ID
  communityId: string;    // Community ID
  recipient: string;      // Recipient's Ethereum address
  sender: string;         // Sender's Ethereum address
  amount: number;         // Point amount
  reason?: string;        // Transaction reason
  timestamp: number;      // Transaction timestamp
}
```

**Example:**

```typescript
const history = await sdk.getPointHistory("123", "0x1234...");
console.log("Point history:", history);
```

## Roles & Permissions

### hasRole

Check if an address has a specific role in a community.

```typescript
async hasRole(roleName: Role, communityId: string, address: string): Promise<boolean>
```

**Parameters:**

- `roleName: Role` - Name of the role to check
- `communityId: string` - ID of the community
- `address: string` - Ethereum address to check

**Role Type:**

```typescript
type Role = "COMMUNITY_ADMIN" | "POINTS_MANAGER" | "CONTENT_CREATOR" | "COMMUNITY_CREATOR" | "EVENT_MANAGER" | "SUPER_ADMIN";
```

**Returns:** `Promise<boolean>` - `true` if the address has the role, `false` otherwise

**Example:**

```typescript
const isAdmin = await sdk.hasRole("COMMUNITY_ADMIN", "123", "0x1234...");
console.log(`Is admin: ${isAdmin}`);
```

### grantRole

Grant a role to an address in a community.

```typescript
async grantRole(roleName: Role, communityId: string, address: string): Promise<void>
```

**Parameters:**

- `roleName: Role` - Name of the role to grant
- `communityId: string` - ID of the community
- `address: string` - Ethereum address to grant the role to

**Returns:** `Promise<void>`

**Throws:** `AuthenticationError` if the signer lacks COMMUNITY_ADMIN role

**Example:**

```typescript
await sdk.grantRole("POINTS_MANAGER", "123", "0x1234...");
```

### revokeRole

Revoke a role from an address in a community.

```typescript
async revokeRole(roleName: Role, communityId: string, address: string): Promise<void>
```

**Parameters:**

- `roleName: Role` - Name of the role to revoke
- `communityId: string` - ID of the community
- `address: string` - Ethereum address to revoke the role from

**Returns:** `Promise<void>`

**Throws:** `AuthenticationError` if the signer lacks COMMUNITY_ADMIN role

**Example:**

```typescript
await sdk.revokeRole("POINTS_MANAGER", "123", "0x1234...");
```

### getAddressesWithRole

Get all addresses with a specific role in a community.

```typescript
async getAddressesWithRole(roleName: Role, communityId: string): Promise<string[]>
```

**Parameters:**

- `roleName: Role` - Name of the role
- `communityId: string` - ID of the community

**Returns:** `Promise<string[]>` - Array of Ethereum addresses with the role

**Example:**

```typescript
const admins = await sdk.getAddressesWithRole("COMMUNITY_ADMIN", "123");
console.log(`Community has ${admins.length} admins`);
```

## Events

### onNewPost

Listen for new posts in a community.

```typescript
onNewPost(communityId: string, callback: (post: Post) => void): void
```

**Parameters:**

- `communityId: string` - ID of the community
- `callback: (post: Post) => void` - Callback function to execute when a new post is created

**Returns:** `void`

**Example:**

```typescript
sdk.onNewPost("123", (post) => {
  console.log("New post created:", post);
  // Update UI or trigger notifications
});
```

### offNewPost

Stop listening for new posts in a community.

```typescript
offNewPost(communityId: string): void
```

**Parameters:**

- `communityId: string` - ID of the community

**Returns:** `void`

**Example:**

```typescript
sdk.offNewPost("123");
```

### onPointsAwarded

Listen for points awarded in a community.

```typescript
onPointsAwarded(communityId: string, callback: (event: PointsAwardedEvent) => void): void
```

**Parameters:**

- `communityId: string` - ID of the community
- `callback: (event: PointsAwardedEvent) => void` - Callback function to execute when points are awarded

**PointsAwardedEvent Object:**

```typescript
interface PointsAwardedEvent {
  communityId: string;   // Community ID
  sender: string;        // Sender's Ethereum address
  recipient: string;     // Recipient's Ethereum address
  amount: number;        // Point amount
  reason?: string;       // Award reason
  timestamp: number;     // Event timestamp
}
```

**Returns:** `void`

**Example:**

```typescript
sdk.onPointsAwarded("123", (event) => {
  console.log(`${event.amount} points awarded to ${event.recipient}`);
  // Update leaderboard or user balance
});
```

### offPointsAwarded

Stop listening for points awarded in a community.

```typescript
offPointsAwarded(communityId: string): void
```

**Parameters:**

- `communityId: string` - ID of the community

**Returns:** `void`

**Example:**

```typescript
sdk.offPointsAwarded("123");
```

### onContractEvent

Listen for any contract event.

```typescript
onContractEvent(contractName: string, eventName: string, callback: (event: any) => void): void
```

**Parameters:**

- `contractName: string` - Name of the contract
- `eventName: string` - Name of the event
- `callback: (event: any) => void` - Callback function to execute when the event is emitted

**Returns:** `void`

**Example:**

```typescript
sdk.onContractEvent("postMinter", "PostCreated", (event) => {
  console.log("Post created event:", event);
});
```

### offContractEvent

Stop listening for a contract event.

```typescript
offContractEvent(contractName: string, eventName: string): void
```

**Parameters:**

- `contractName: string` - Name of the contract
- `eventName: string` - Name of the event

**Returns:** `void`

**Example:**

```typescript
sdk.offContractEvent("postMinter", "PostCreated");
```

### removeAllListeners

Remove all event listeners.

```typescript
removeAllListeners(): void
```

**Returns:** `void`

**Example:**

```typescript
sdk.removeAllListeners();
```

## Types

### NetworkId

Enum of supported network IDs.

```typescript
enum NetworkId {
  MAINNET = 1,
  POLYGON = 137,
  MUMBAI = 80001,
  MONAD_DEVNET = 999,
  LOCAL = 31337
}
```

### ContractAddresses

Interface for contract addresses configuration.

```typescript
interface ContractAddresses {
  roleManager: string;
  tribeController: string;
  astrixPointSystem: string;
  astrixToken?: string;
  tokenDispenser?: string;
  pointSystem?: string;          // Alias for astrixPointSystem (deprecated)
  collectibleController?: string;
  postFeedManager?: string;
  postMinter?: string;
  profileNFTMinter?: string;
  communityPoints?: string;
  eventController?: string;
  superCommunityController?: string;
  voting?: string;
  [key: string]: string;         // Additional contract addresses
}
```

### AstrixError

Interface for SDK error objects.

```typescript
interface AstrixError {
  type: ErrorType;
  message: string;
  details?: any;
  originalError?: Error;
}
```

### ErrorType

Enum of error types.

```typescript
enum ErrorType {
  CONTRACT_ERROR = "CONTRACT_ERROR",
  CONNECTION_ERROR = "CONNECTION_ERROR",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  AUTHENTICATION_ERROR = "AUTHENTICATION_ERROR",
  TIMEOUT_ERROR = "TIMEOUT_ERROR",
  UNKNOWN_ERROR = "UNKNOWN_ERROR"
}
``` 