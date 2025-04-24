# Tokens & Points System

The Tribes by Astrix platform provides a robust token and points system that enables tribes to create their own token economies, reward members for contributions, and incentivize engagement.

## Overview

Each tribe can have its own ERC20 token that represents value within that community. The platform also includes a points system for tracking contributions and engagement.

## Tribe Tokens

### What are Tribe Tokens?

Tribe tokens are ERC20 tokens that represent the economic value within a tribe. Each tribe can create its own token with a custom name and symbol. These tokens can be used for:

- Rewarding community contributions
- Purchasing digital goods or services within the tribe
- Voting on community decisions
- Accessing premium content or features

### Creating a Tribe Token

Tribe tokens can be created by tribe administrators using the SDK:

```typescript
// Create a tribe token
await sdk.points.createTribeToken({
  tribeId: 1, // Your tribe ID
  name: "Community Token",
  symbol: "COMM"
});

// Verify the token was created
const tokenAddress = await sdk.points.getTribeTokenAddress(1);
console.log(`Tribe token address: ${tokenAddress}`);
```

You can set up a tribe token in one of two ways:

1. Using the `scripts/setup-tribe-token.ts` script to quickly set up a tribe token with default values:
   ```bash
   npx hardhat run scripts/setup-tribe-token.ts --network lineaSepolia
   ```

2. Using the example in `examples/sdk-usage/tribe-token-setup.ts` which demonstrates a more customizable approach with detailed error handling and documentation:
   ```bash
   npx ts-node examples/sdk-usage/tribe-token-setup.ts
   ```

### Exchange Rate

You can set an exchange rate between tribe tokens and Astrix tokens:

```typescript
// Set exchange rate (tribe tokens per 1 Astrix token)
await sdk.points.setExchangeRate({
  tribeId: 1,
  rate: 100 // 100 tribe tokens per 1 Astrix token
});
```

## Points System

The points system allows tribes to reward members for different actions within the community.

### Setting Action Points

Define how many points members earn for different actions:

```typescript
// Set points for different actions
await sdk.points.setActionPoints({
  tribeId: 1,
  actionType: "POST_ACTION", // Creating a post
  points: 50
});

await sdk.points.setActionPoints({
  tribeId: 1,
  actionType: "COMMENT_ACTION", // Commenting on a post
  points: 10
});

await sdk.points.setActionPoints({
  tribeId: 1,
  actionType: "LIKE_ACTION", // Liking a post
  points: 5
});
```

### Awarding Points

Tribe administrators can manually award points to members:

```typescript
// Award points to a member
await sdk.points.awardPoints({
  tribeId: 1,
  member: "0x123...", // Member address
  amount: 100,
  reason: "Valuable contribution to the community"
});

// Batch award points to multiple users
const recipients = [
  { address: "0x123...", amount: 100, reason: "Contest winner" },
  { address: "0x456...", amount: 50, reason: "Runner-up" },
  { address: "0x789...", amount: 25, reason: "Honorable mention" }
];

await sdk.points.batchAwardPoints(1, recipients);
```

### Checking Point Balances

```typescript
// Get point balance for a user
const balance = await sdk.points.getPointBalance(1, "0x123...");
console.log(`User has ${balance} points in tribe 1`);

// Get top members by points (leaderboard)
const leaderboard = await sdk.points.getPointLeaderboard(1, { limit: 10 });
console.log('Top 10 members by points:', leaderboard);
```

## Token Economy Examples

Here are some ways tribes can use tokens and points:

1. **Content Rewards**: Members earn tokens for creating high-quality content
2. **Curation Rewards**: Members earn tokens for curating content (likes, shares)
3. **Premium Access**: Members can spend tokens to access exclusive content
4. **Governance**: Token holders can vote on community decisions
5. **Merchandise**: Members can purchase physical or digital merchandise with tokens

## Complete Token Setup Process

Here's a complete example of setting up a token economy for a tribe:

```typescript
async function setupTokenEconomy(tribeId) {
  // Step 1: Create the tribe token
  await sdk.points.createTribeToken({
    tribeId,
    name: "Web3 Community Token",
    symbol: "W3CT"
  });
  
  // Step 2: Set exchange rate
  await sdk.points.setExchangeRate({
    tribeId,
    rate: 100 // 100 tribe tokens per 1 Astrix token
  });
  
  // Step 3: Configure point rewards for actions
  const actions = [
    { type: "POST_ACTION", points: 50 },
    { type: "COMMENT_ACTION", points: 10 },
    { type: "LIKE_ACTION", points: 5 }
  ];
  
  for (const action of actions) {
    await sdk.points.setActionPoints({
      tribeId,
      actionType: action.type,
      points: action.points
    });
  }
  
  // Step 4: Initial token distribution to core members
  const initialMembers = [
    { address: "0x123...", amount: 1000 }, // Founder
    { address: "0x456...", amount: 500 },  // Co-founder
    { address: "0x789...", amount: 200 }   // Early contributor
  ];
  
  for (const member of initialMembers) {
    await sdk.points.awardPoints({
      tribeId,
      member: member.address,
      amount: member.amount,
      reason: "Initial distribution"
    });
  }
  
  console.log("Token economy setup complete!");
}
``` 