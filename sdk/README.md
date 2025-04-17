# Tribes by Astrix SDK

A comprehensive SDK for integrating with the Tribes by Astrix platform, allowing organizations to implement a token-based points system, community management, and engagement tools.

## Features

- **Astrix Token Integration**: Easily integrate with Astrix tokens for your organization's points system
- **Point System Management**: Award, transfer, and manage points for users within your community
- **Tribe Management**: Create and manage tribes, members, and permissions
- **User Profiles**: Handle user profiles and authentication
- **Content Management**: Support for posts, comments, and other content types
- **Analytics**: Track user engagement and community metrics

## Installation

```bash
npm install tribes-by-astrix-sdk
```

## Quick Start

```typescript
import { AstrixSDK } from 'tribes-by-astrix-sdk';

// Initialize the SDK with your configuration
const sdk = new AstrixSDK({
  provider: window.ethereum, // or any ethers provider
  contracts: {
    roleManager: '0x...',
    tribeController: '0x...',
    astrixToken: '0x...',
    tokenDispenser: '0x...',
    astrixPointSystem: '0x...',
    // other contract addresses...
  }
});

// Connect user's wallet
await sdk.connect();
```

## Modules

### Token Module

The `token` module provides functionality for interacting with Astrix tokens and the TokenDispenser contract.

```typescript
// Deposit tokens to the dispenser
const depositResult = await sdk.token.deposit({
  amount: ethers.parseEther('100')
});

// Check organization balance in dispenser
const balance = await sdk.token.getBalance('0xOrganizationAddress');
console.log(`Balance: ${balance.formattedBalance} ASTRX`);

// Withdraw tokens from dispenser
const withdrawResult = await sdk.token.withdraw({
  amount: ethers.parseEther('50')
});

// Update organization admin
const updateResult = await sdk.token.updateOrganizationAdmin({
  newAdmin: '0xNewAdminAddress'
});

// Platform operations (requires PLATFORM_ROLE)
const spendResult = await sdk.token.platformSpend({
  organization: '0xOrganizationAddress',
  recipient: '0xRecipientAddress',
  amount: ethers.parseEther('10'),
  reason: 'Reward for community contribution'
});
```

### Points Module

The `points` module provides functionality for interacting with the AstrixPointSystem contract.

```typescript
// Set organization for tribe
const setOrgResult = await sdk.points.setTribeOrganization({
  tribeId: 1,
  organization: '0xOrganizationAddress'
});

// Create tribe token
const createTokenResult = await sdk.points.createTribeToken({
  tribeId: 1,
  name: 'Tribe Token',
  symbol: 'TT1'
});

// Set exchange rate (tribe tokens per 1 Astrix)
const setRateResult = await sdk.points.setExchangeRate({
  tribeId: 1,
  rate: 100 // 100 tribe tokens per 1 Astrix
});

// Set points for action types
const setPointsResult = await sdk.points.setActionPoints({
  tribeId: 1,
  actionType: 'POST', // or ActionType.POST from enum
  points: 50
});

// Award points to a member
const awardResult = await sdk.points.awardPoints({
  tribeId: 1,
  member: '0xMemberAddress',
  points: 50,
  actionType: 'POST' // or ActionType.POST from enum
});
```

### Content Module

The `content` module provides functionality for creating and managing content.

```typescript
// Create a post
const createPostResult = await sdk.content.createPost({
  tribeId: 1,
  content: "Hello world!",
  postType: "TEXT"
});

// Get posts by tribe
const posts = await sdk.content.getPostsByTribe(1, {
  limit: 10,
  offset: 0,
  includeDetails: true
});

// Get user feed
const feed = await sdk.content.getFeedForUser('0xUserAddress', {
  limit: 20,
  offset: 0,
  includeDetails: true,
  postType: "TEXT" // Optional filter
});
```

## Complete SDK Status

### ✅ Implemented

- **Core SDK Framework**
  - Base module structure
  - Error handling system
  - Configuration and initialization

- **Token Module**
  - Deposit/withdrawal functionality
  - Balance checking
  - Admin operations
  - Token approval

- **Points Module**
  - Tribe token creation
  - Exchange rate management
  - Point awarding/deduction
  - Action tracking

- **Content Module**
  - Post/Reply creation
  - Gated post support
  - Feed retrieval (user, tribe, user/tribe)
  - Post detail fetching

### 🚧 In Progress

- **Tribes Module** (partial)
  - Basic tribe creation
  - Membership management

- **Profiles Module** (stub)
  - Profile creation
  - Authentication

- **Analytics Module** (stub)
  - Basic data retrieval

### 📅 Planned

- Enhanced authentication
- Media handling
- Advanced analytics
- Organization management tools
- Extended tribe functionality
- Improved error handling and recovery

## Example Workflows

### Organization Setup

```typescript
// 1. Deposit Astrix tokens to the dispenser
await sdk.token.deposit({
  amount: ethers.parseEther('1000')
});

// 2. Set organization for tribe
await sdk.points.setTribeOrganization({
  tribeId: 1,
  organization: sdk.account // Current connected account
});

// 3. Create tribe token
await sdk.points.createTribeToken({
  tribeId: 1,
  name: 'Community Token',
  symbol: 'COM1'
});

// 4. Set exchange rate
await sdk.points.setExchangeRate({
  tribeId: 1,
  rate: 100
});

// 5. Configure point values for actions
const actions = ['POST', 'COMMENT', 'LIKE', 'QUIZ', 'POLL'];
const pointValues = [50, 20, 5, 30, 25];

for (let i = 0; i < actions.length; i++) {
  await sdk.points.setActionPoints({
    tribeId: 1,
    actionType: actions[i],
    points: pointValues[i]
  });
}
```

### Reward User for Content Creation

```typescript
// When a user creates a post
async function rewardUserForPost(tribeId, userAddress) {
  await sdk.points.recordAction({
    tribeId,
    member: userAddress,
    actionType: 'POST'
  });
}

// When a user comments on a post
async function rewardUserForComment(tribeId, userAddress) {
  await sdk.points.recordAction({
    tribeId,
    member: userAddress,
    actionType: 'COMMENT'
  });
}
```

### Leaderboard Display

```typescript
async function getLeaderboard(tribeId) {
  const topMembers = await sdk.points.getTopMembers(tribeId, 10);
  
  return topMembers.map(member => ({
    address: member.address,
    points: member.points,
    // Fetch additional user details from your database if needed
  }));
}
```

## Error Handling

The SDK includes comprehensive error handling:

```typescript
try {
  await sdk.points.awardPoints({
    tribeId: 1,
    member: '0xMemberAddress',
    points: 50,
    actionType: 'POST'
  });
} catch (error) {
  if (error.type === 'CONTRACT_ERROR') {
    console.error('Contract interaction failed:', error.message);
    // Check if organization has enough tokens, member is active, etc.
  } else if (error.type === 'WALLET_ERROR') {
    console.error('Wallet issue:', error.message);
    // Handle wallet connection or signature issues
  } else {
    console.error('Unknown error:', error);
  }
}
```

## Best Practices

1. **Gas Optimization**:
   - Use batch operations where possible (`batchAwardPoints`)
   - Consider using the `recordAction` method which only triggers point awards if configured

2. **Organization Management**:
   - Keep enough Astrix tokens in the dispenser to cover expected point awards
   - Consider setting up automated monitoring of token balances

3. **User Experience**:
   - Cache point balances and update them optimistically
   - Show pending transactions while waiting for blockchain confirmation
   - Implement fallback mechanisms for failed transactions

4. **Security**:
   - Only tribe admins should call configuration methods
   - Use appropriate role management for platform operations
   - Validate all user inputs before sending transactions

## Development

```bash
# Clone the repository
git clone https://github.com/astrix/tribes-sdk.git

# Install dependencies
cd tribes-sdk
npm install

# Build the SDK
npm run build

# Run tests
npm test
```

## Next Steps in Development

1. **Complete Module Implementations**
   - Finish remaining modules (Profiles, Organizations, Analytics)
   - Add advanced features to existing modules

2. **Testing Infrastructure**
   - Unit tests for all modules
   - Integration tests with contracts
   - End-to-end testing with example applications

3. **Documentation**
   - Complete API documentation
   - More integration guides
   - Video tutorials

4. **Build and Publish**
   - Finalize build process
   - Publish to npm
   - Set up CI/CD pipeline

## Support

If you need help or have questions, join our Discord server or open an issue on our GitHub repository.

## License

This project is licensed under the MIT License - see the LICENSE file for details. 