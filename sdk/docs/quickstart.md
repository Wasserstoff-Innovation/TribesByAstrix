# Quick Start Guide

This guide provides a quick introduction to using the Tribes by Astrix SDK for your application.

## Installation

```bash
npm install tribes-by-astrix-sdk ethers@^6.11.1
```

## Basic Example

Here's a complete example showing how to initialize the SDK, connect a wallet, and perform basic operations:

```typescript
import { AstrixSDK } from 'tribes-by-astrix-sdk';
import { ethers } from 'ethers';

async function main() {
  // Initialize SDK
  const provider = new ethers.BrowserProvider(window.ethereum);
  const sdk = new AstrixSDK({
    provider,
    contracts: {
      roleManager: '0x...',
      tribeController: '0x...',
      astrixToken: '0x...',
      tokenDispenser: '0x...',
      astrixPointSystem: '0x...',
      postMinter: '0x...',
      postFeedManager: '0x...'
    }
  });

  // Connect wallet
  await window.ethereum.request({ method: 'eth_requestAccounts' });
  const signer = await provider.getSigner();
  await sdk.connect(signer);
  console.log('Connected with address:', await sdk.getAddress());

  // Example 1: Create a tribe
  const tribeId = await sdk.tribes.createTribe({
    name: "My First Tribe",
    description: "A community for testing the SDK",
    metadata: JSON.stringify({
      avatar: "https://example.com/avatar.png",
      banner: "https://example.com/banner.png"
    }),
    joinType: "PUBLIC"
  });
  console.log(`Created tribe with ID: ${tribeId}`);

  // Example 2: Create a post
  const postId = await sdk.content.createPost({
    tribeId,
    metadata: JSON.stringify({
      title: "Hello World",
      content: "This is my first post using the SDK!",
      type: "TEXT"
    })
  });
  console.log(`Created post with ID: ${postId}`);

  // Example 3: Get user's tribes
  const userTribes = await sdk.tribes.getUserTribes(await sdk.getAddress());
  console.log('My tribes:', userTribes);

  // Example 4: Award points to a user
  const pointsAwarded = await sdk.points.awardPoints({
    tribeId,
    member: '0x123...', // Replace with actual address
    points: 50,
    actionType: 'POST'
  });
  console.log('Points awarded:', pointsAwarded);
}

main().catch(console.error);
```

## Common SDK Operations

### Creating a Tribe

```typescript
const tribeId = await sdk.tribes.createTribe({
  name: "Community Name",
  description: "Community description",
  metadata: JSON.stringify({
    avatar: "https://example.com/avatar.png",
    banner: "https://example.com/banner.png",
    socialLinks: {
      twitter: "https://twitter.com/mycommunity",
      discord: "https://discord.gg/mycommunity"
    }
  }),
  joinType: "PUBLIC" // Or "WHITELIST", "PAID", "COLLECTIBLE"
});
```

### Retrieving Tribe Details

```typescript
const tribeDetails = await sdk.tribes.getTribeDetails(tribeId);
console.log(tribeDetails);
```

### Managing Tribe Membership

```typescript
// Join a tribe
await sdk.tribes.joinTribe(tribeId);

// Check membership status
const isMember = await sdk.tribes.isMember(tribeId, userAddress);

// Get all members in a tribe
const members = await sdk.tribes.getMembers(tribeId);
```

### Creating Posts

```typescript
// Simple text post
const textPostId = await sdk.content.createPost({
  tribeId,
  metadata: JSON.stringify({
    title: "Text Post",
    content: "This is a simple text post",
    type: "TEXT"
  })
});

// Rich media post
const mediaPostId = await sdk.content.createPost({
  tribeId,
  metadata: JSON.stringify({
    title: "Media Post",
    content: "Check out these images",
    type: "RICH_MEDIA",
    mediaContent: {
      images: ["https://example.com/image1.jpg"]
    }
  })
});
```

### Working with Points

```typescript
// Set points for action types
await sdk.points.setActionPoints({
  tribeId,
  actionType: "POST",
  points: 50
});

// Award points to a member
await sdk.points.awardPoints({
  tribeId,
  member: userAddress,
  points: 50,
  actionType: "POST"
});

// Get user's point balance
const balance = await sdk.points.getPoints({
  tribeId,
  member: userAddress
});
```

### Reading User Feed

```typescript
// Get feed for user
const feed = await sdk.content.getFeedForUser({
  user: userAddress,
  limit: 20,
  includeDetails: true
});

// Get posts by tribe
const tribePostsResult = await sdk.content.getPostsByTribe({
  tribeId,
  limit: 10,
  includeDetails: true
});
```

## Error Handling

The SDK provides standardized error handling:

```typescript
try {
  const result = await sdk.content.createPost({
    tribeId,
    metadata: JSON.stringify({
      title: "Hello World",
      content: "This is my post!",
      type: "TEXT"
    })
  });
} catch (error) {
  if (error.type === "CONTRACT_ERROR") {
    console.error("Smart contract error:", error.message);
  } else if (error.type === "VALIDATION_ERROR") {
    console.error("Validation error:", error.message);
  } else {
    console.error("Unknown error:", error);
  }
}
```

## Next Steps

Now that you have the basics, you can:

1. [Learn how to set up caching](./guides/caching.md) for better performance
2. [Implement off-chain data handling](./guides/offchain-data.md) for scalable storage
3. Explore the [SDK modules documentation](./reference/core.md) for detailed APIs 