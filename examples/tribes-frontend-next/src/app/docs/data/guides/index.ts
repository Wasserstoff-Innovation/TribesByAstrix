export interface GuideStep {
  title: string;
  description: string;
  code?: string;
  codeLanguage?: string;
}

export interface Guide {
  id: string;
  title: string;
  description: string;
  steps: GuideStep[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  estimated_time: string;
}

export const guides: Guide[] = [
  {
    id: 'creating-first-tribe',
    title: 'Creating Your First Tribe',
    description: 'Learn how to create a tribe, set its metadata, and configure membership settings.',
    difficulty: 'beginner',
    tags: ['tribes', 'onboarding'],
    estimated_time: '10 minutes',
    steps: [
      {
        title: 'Setting up the SDK',
        description: 'Initialize the SDK and connect your wallet.',
        code: `import { AstrixSDK } from '@wasserstoff/tribes-sdk';
import { ethers } from 'ethers';

// Initialize SDK
const sdk = new AstrixSDK({
  provider: window.ethereum,
  chainId: 59141 // Linea Sepolia
});

// Connect wallet
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();
await sdk.connect(signer);`,
        codeLanguage: 'typescript'
      },
      {
        title: 'Preparing Tribe Metadata',
        description: 'Create the metadata for your tribe including description, logo, and banner.',
        code: `const tribeMetadata = {
  description: "A community for blockchain enthusiasts",
  logoUrl: "https://example.com/logo.png",
  bannerUrl: "https://example.com/banner.png",
  tags: ["blockchain", "web3", "community"],
  socials: {
    twitter: "https://twitter.com/mytribe",
    discord: "https://discord.gg/mytribe"
  },
  visibility: "PUBLIC"
};

// Convert to JSON string for contract storage
const metadataString = JSON.stringify(tribeMetadata);`,
        codeLanguage: 'typescript'
      },
      {
        title: 'Creating the Tribe',
        description: 'Call the createTribe method to create your tribe on-chain.',
        code: `// Create the tribe
const tribeId = await sdk.tribes.createTribe({
  name: "My Amazing Tribe",
  metadata: metadataString,
  joinType: 0, // 0 = Public, 1 = Private, 2 = Invite Only
  entryFee: 0n, // No entry fee
  admins: [] // No additional admins
});

console.log(\`Tribe created with ID: \${tribeId}\`);`,
        codeLanguage: 'typescript'
      },
      {
        title: 'Setting Up Permissions',
        description: 'Configure who can perform certain actions in your tribe.',
        code: `// Set permissions for members
await sdk.tribes.setMemberPermissions(tribeId, {
  canCreatePosts: true,
  canComment: true,
  canInvite: false,
  canModerate: false
});

console.log("Tribe permissions configured");`,
        codeLanguage: 'typescript'
      },
      {
        title: 'Verifying the Tribe',
        description: 'Check that your tribe was created successfully and view its details.',
        code: `// Get tribe details
const tribeDetails = await sdk.tribes.getTribeDetails(tribeId);

console.log("Tribe name:", tribeDetails.name);
console.log("Creator:", tribeDetails.creator);
console.log("Member count:", tribeDetails.memberCount);

// Parse metadata
const metadata = JSON.parse(tribeDetails.metadata);
console.log("Description:", metadata.description);`,
        codeLanguage: 'typescript'
      }
    ]
  },
  {
    id: 'setting-up-tribe-token',
    title: 'Setting Up a Tribe Token',
    description: 'Learn how to create a token for your tribe and configure token rewards.',
    difficulty: 'intermediate',
    tags: ['tokens', 'rewards'],
    estimated_time: '15 minutes',
    steps: [
      {
        title: 'Creating a Tribe Token',
        description: 'Create an ERC20 token for your tribe that can be used for rewards.',
        code: `// Create the tribe token
const tx = await sdk.points.createTribeToken({
  tribeId: 42, // Your tribe ID
  name: "My Tribe Token",
  symbol: "MTT"
});

console.log(\`Created tribe token! Transaction: \${tx}\`);

// Get the token address
const tokenAddress = await sdk.points.getTribeTokenAddress(42);
console.log(\`Token contract address: \${tokenAddress}\`);`,
        codeLanguage: 'typescript'
      },
      {
        title: 'Configuring Point Values',
        description: 'Set up how many points users earn for different actions.',
        code: `// Set points for different actions
await sdk.points.setPointsForAction(42, "POST_CREATE", 10);
await sdk.points.setPointsForAction(42, "COMMENT", 2);
await sdk.points.setPointsForAction(42, "REACTION", 1);
await sdk.points.setPointsForAction(42, "INVITE_MEMBER", 15);

console.log("Point values configured");`,
        codeLanguage: 'typescript'
      },
      {
        title: 'Setting Exchange Rate',
        description: 'Set the rate at which points can be converted to tokens.',
        code: `// Set exchange rate: 100 points = 1 token
await sdk.points.setExchangeRate(42, 100);
console.log("Exchange rate set");`,
        codeLanguage: 'typescript'
      },
      {
        title: 'Minting Initial Tokens',
        description: 'Mint some initial tokens to your treasury or team members.',
        code: `// Mint 1000 tokens to the tribe treasury
const amount = ethers.parseUnits("1000", 18); // 1000 tokens with 18 decimals
const treasuryAddress = "0x..."; // Your treasury address

await sdk.points.mintTokens(42, amount, treasuryAddress);
console.log(\`Minted \${ethers.formatUnits(amount, 18)} tokens to treasury\`);`,
        codeLanguage: 'typescript'
      },
      {
        title: 'Testing Point Accrual',
        description: 'Verify that users earn points for actions they take.',
        code: `// Create a post (user earns points automatically)
const postId = await sdk.content.createPost({
  tribeId: 42,
  content: "Hello tribe members!",
  metadata: JSON.stringify({ title: "My First Post" })
});

// Check user's points
const userAddress = await signer.getAddress();
const points = await sdk.points.getPoints(42, userAddress);
console.log(\`User has \${points} points\`);`,
        codeLanguage: 'typescript'
      }
    ]
  },
  {
    id: 'creating-nft-collectibles',
    title: 'Creating NFT Collectibles',
    description: 'Learn how to create and distribute NFT collectibles for your tribe members.',
    difficulty: 'advanced',
    tags: ['collectibles', 'nft'],
    estimated_time: '20 minutes',
    steps: [
      {
        title: 'Creating a Collectible Type',
        description: 'Define a new collectible for your tribe.',
        code: `// Create a new collectible
const collectibleId = await sdk.collectibles.createCollectible({
  tribeId: 42,
  name: "Early Adopter Badge",
  metadata: JSON.stringify({
    description: "Badge for early adopters of the tribe",
    image: "ipfs://QmXyZ123...",
    attributes: [
      { trait_type: "Rarity", value: "Rare" },
      { trait_type: "Member Type", value: "Early Adopter" }
    ]
  }),
  maxSupply: 100,
  transferable: true
});

console.log(\`Created collectible with ID: \${collectibleId}\`);`,
        codeLanguage: 'typescript'
      },
      {
        title: 'Viewing Collectible Details',
        description: 'Inspect the details of your new collectible.',
        code: `// Get collectible details
const details = await sdk.collectibles.getCollectibleDetails(collectibleId);
console.log(\`Collectible Name: \${details.name}\`);
console.log(\`Max Supply: \${details.maxSupply}\`);
console.log(\`Transferable: \${details.transferable ? 'Yes' : 'No'}\`);`,
        codeLanguage: 'typescript'
      },
      {
        title: 'Creating a Distribution Strategy',
        description: 'Plan how to distribute your collectibles to tribe members.',
        code: `// Get tribe members
const members = await sdk.tribes.getMembers(42);
console.log(\`Tribe has \${members.length} members\`);

// Filter for members who joined before a certain date
// This is just a placeholder - in a real app, you'd query this data differently
const earlyMembers = members.filter(member => {
  // Logic to determine early members
  return true;
});

console.log(\`\${earlyMembers.length} members qualify for the collectible\`);`,
        codeLanguage: 'typescript'
      },
      {
        title: 'Minting Collectibles',
        description: 'Mint and distribute collectibles to qualifying members.',
        code: `// Mint collectibles to early members (limited to first 10 for this example)
const mintedTokenIds = [];
for (let i = 0; i < Math.min(earlyMembers.length, 10); i++) {
  const result = await sdk.collectibles.mintCollectible(collectibleId, earlyMembers[i]);
  mintedTokenIds.push(result.tokenIds[0]);
  console.log(\`Minted collectible to \${earlyMembers[i]}\`);
}

console.log(\`Minted \${mintedTokenIds.length} collectibles\`);`,
        codeLanguage: 'typescript'
      },
      {
        title: 'Setting up Collectible Rewards',
        description: 'Set up automatic collectible rewards for certain actions.',
        code: `// This is a conceptual example - implementation would depend on your backend
async function setupCollectibleRewards() {
  // Set up a rule: members who earn 1000+ points get a collectible
  const rewardRule = {
    tribeId: 42,
    collectibleId: collectibleId,
    condition: {
      type: "POINTS_THRESHOLD",
      threshold: 1000
    }
  };
  
  // Store the rule in your database or smart contract
  // ...
  
  console.log("Collectible reward rule established");
}

await setupCollectibleRewards();`,
        codeLanguage: 'typescript'
      }
    ]
  },
  {
    id: 'managing-tribe-content',
    title: 'Managing Content in Your Tribe',
    description: 'Learn how to create, retrieve, and interact with content in your tribe.',
    difficulty: 'beginner',
    tags: ['content', 'posts', 'engagement'],
    estimated_time: '15 minutes',
    steps: [
      {
        title: 'Setting up the SDK',
        description: 'Initialize the SDK and connect your wallet to start managing content.',
        code: `import { AstrixSDK } from '@wasserstoff/tribes-sdk';
import { ethers } from 'ethers';

// Initialize SDK
const sdk = new AstrixSDK({
  provider: window.ethereum,
  chainId: 59141 // Linea Sepolia
});

// Connect wallet
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();
await sdk.connect(signer);

// Get user address
const userAddress = await signer.getAddress();
console.log(\`Connected with address: \${userAddress}\`);`,
        codeLanguage: 'typescript'
      },
      {
        title: 'Creating a Post with Metadata',
        description: 'Create a new post in your tribe with formatted metadata.',
        code: `// Prepare post metadata
const postMetadata = {
  title: "Welcome to our tribe!",
  tags: ["welcome", "introduction"],
  attachments: [], // URLs to images or other media
  format: "markdown", // Optional content format
  preview: "A brief introduction to our community goals..."
};

// Create the post
const postId = await sdk.content.createPost({
  tribeId: 42, // Your tribe ID
  content: "# Welcome to our tribe!\n\nWe're excited to have you join our community. Here, we'll be discussing blockchain technology, Web3 developments, and community initiatives.",
  metadata: JSON.stringify(postMetadata)
});

console.log(\`Created post with ID: \${postId}\`);`,
        codeLanguage: 'typescript'
      },
      {
        title: 'Retrieving Tribe Posts',
        description: 'Get a list of posts from your tribe with pagination.',
        code: `// Get the first 10 posts from the tribe
const result = await sdk.content.getTribePosts(42, 0, 10);

console.log(\`Tribe has \${result.total} posts in total\`);

// Iterate through the posts
result.posts.forEach(post => {
  // Parse metadata to access structured data
  const metadata = JSON.parse(post.metadata);
  
  console.log(\`Post #\${post.id}: \${metadata.title}\`);
  console.log(\`Posted by: \${post.author}\`);
  console.log(\`Content: \${post.content.substring(0, 50)}...\`);
  console.log(\`Tags: \${metadata.tags.join(', ')}\`);
  console.log('---');
});`,
        codeLanguage: 'typescript'
      },
      {
        title: 'Reacting to Posts',
        description: 'Add reactions to posts to engage with content.',
        code: `// React to a post with a "LIKE" reaction
const reactionTx = await sdk.content.reactToPost(postId, "LIKE");
console.log(\`Reaction recorded! Transaction: \${reactionTx}\`);

// Other common reaction types
const reactionTypes = ["LOVE", "LAUGH", "WOW", "SAD", "ANGRY"];

// Example of custom reaction (if supported by your implementation)
await sdk.content.reactToPost(postId, "INSIGHTFUL");`,
        codeLanguage: 'typescript'
      },
      {
        title: 'Adding Comments to Posts',
        description: 'Comment on posts to start conversations.',
        code: `// Add a simple comment
const commentId = await sdk.content.commentOnPost(
  postId, 
  "This is a fantastic initiative! Looking forward to collaborating."
);

console.log(\`Comment posted with ID: \${commentId}\`);

// Get comments for a post
const comments = await sdk.content.getPostComments(postId, 0, 20);

console.log(\`Post has \${comments.total} comments\`);
comments.comments.forEach(comment => {
  console.log(\`\${comment.author}: \${comment.content}\`);
  console.log(\`Posted at: \${new Date(comment.timestamp * 1000).toLocaleString()}\`);
  console.log('---');
});`,
        codeLanguage: 'typescript'
      },
      {
        title: 'Managing User Content',
        description: 'Retrieve and manage content for specific users.',
        code: `// Get posts by a specific user
const userPosts = await sdk.content.getUserPosts(userAddress, 0, 10);

console.log(\`User has created \${userPosts.total} posts\`);
userPosts.posts.forEach(post => {
  console.log(\`Post #\${post.id} in tribe \${post.tribeId}\`);
});

// Delete a post (must be the author or tribe admin)
async function deleteUserPost(postId) {
  try {
    const tx = await sdk.content.deletePost(postId);
    console.log(\`Post deleted! Transaction: \${tx}\`);
  } catch (error) {
    console.error("Failed to delete post:", error);
    // Handle unauthorized attempts or other errors
  }
}

// Example: Delete post if you're the author
const post = await sdk.content.getPost(postId);
if (post.author.toLowerCase() === userAddress.toLowerCase()) {
  await deleteUserPost(postId);
}`,
        codeLanguage: 'typescript'
      },
      {
        title: 'Building a Content Feed',
        description: 'Combine various methods to create a full content feed experience.',
        code: `async function loadTribeFeed(tribeId, page = 0, pageSize = 10) {
  // Get posts with pagination
  const postResult = await sdk.content.getTribePosts(tribeId, page * pageSize, pageSize);
  
  // Process each post to create a rich feed
  const feed = await Promise.all(postResult.posts.map(async (post) => {
    // Get comments for this post
    const commentResult = await sdk.content.getPostComments(post.id, 0, 3); // Get first 3 comments
    
    // Parse metadata
    const metadata = JSON.parse(post.metadata);
    
    // Format the post for display
    return {
      post: {
        id: post.id,
        author: post.author,
        authorName: await getAuthorName(post.author), // Implement this function to get user profile
        content: post.content,
        title: metadata.title || '',
        preview: metadata.preview || '',
        tags: metadata.tags || [],
        attachments: metadata.attachments || [],
        timestamp: post.timestamp
      },
      commentCount: commentResult.total,
      recentComments: commentResult.comments.map(c => ({
        id: c.id,
        author: c.author,
        content: c.content,
        timestamp: c.timestamp
      }))
    };
  }));
  
  return {
    items: feed,
    total: postResult.total,
    hasMore: (page + 1) * pageSize < postResult.total
  };
}

// Example usage
const feed = await loadTribeFeed(42);
console.log(\`Loaded \${feed.items.length} posts\`);
console.log(\`Has more posts: \${feed.hasMore}\`);

// Helper function example (you would implement this)
async function getAuthorName(address) {
  // This could query your backend or blockchain for user profiles
  return address.substring(0, 6) + '...' + address.substring(address.length - 4);
}`,
        codeLanguage: 'typescript'
      }
    ]
  }
]; 