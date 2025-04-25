export interface UserFlow {
  id: string;
  title: string;
  description: string;
  steps: UserFlowStep[];
  complexity: 'Simple' | 'Moderate' | 'Complex';
  category: 'Authentication' | 'Content' | 'Tribe Management' | 'Collectibles' | 'Points';
}

export interface UserFlowStep {
  id: string;
  title: string;
  description: string;
  code?: string;
  apiMethod?: string;
}

export const userFlows: UserFlow[] = [
  {
    id: 'auth-flow',
    title: 'User Authentication Flow',
    description: 'Complete authentication flow for users to connect their wallet and sign in to your application',
    complexity: 'Simple',
    category: 'Authentication',
    steps: [
      {
        id: 'auth-1',
        title: 'Initialize SDK',
        description: 'Set up the Tribes SDK with your application credentials',
        code: `import { TribesSDK } from '@tribes/sdk';

const sdk = new TribesSDK({
  appId: 'YOUR_APP_ID',
  environment: 'testnet'
});`
      },
      {
        id: 'auth-2',
        title: 'Connect Wallet',
        description: 'Prompt user to connect their wallet using the provided method',
        code: `// Connect using wallet connect or other provider
const connected = await sdk.auth.connect();

if (connected) {
  console.log('Wallet connected successfully');
} else {
  console.error('Failed to connect wallet');
}`,
        apiMethod: 'auth.connect'
      },
      {
        id: 'auth-3',
        title: 'Sign Authentication Message',
        description: 'Request user to sign the authentication message to verify ownership of the wallet',
        code: `// Request signature for authentication
try {
  const user = await sdk.auth.authenticate();
  console.log('User authenticated:', user);
} catch (error) {
  console.error('Authentication failed:', error);
}`,
        apiMethod: 'auth.authenticate'
      },
      {
        id: 'auth-4',
        title: 'Get User Profile',
        description: 'Retrieve the authenticated user profile information',
        code: `// Fetch user profile data
const profile = await sdk.user.getProfile();
console.log('User profile:', profile);`,
        apiMethod: 'user.getProfile'
      }
    ]
  },
  {
    id: 'post-creation-flow',
    title: 'Post Creation and Interaction',
    description: 'Complete flow for creating and interacting with posts in a tribe',
    complexity: 'Moderate',
    category: 'Content',
    steps: [
      {
        id: 'post-1',
        title: 'Join a Tribe',
        description: 'User must first join a tribe to post content',
        code: `// Join an existing tribe
const tribeId = 'example-tribe-id';
await sdk.tribes.joinTribe(tribeId);`,
        apiMethod: 'tribes.joinTribe'
      },
      {
        id: 'post-2',
        title: 'Create a Post',
        description: 'Create a new post within the joined tribe',
        code: `// Create a new post with text content
const postData = {
  tribeId: 'example-tribe-id',
  content: 'Hello Tribes! This is my first post.',
  metadata: {
    tags: ['introduction', 'firstPost']
  }
};

const post = await sdk.content.createPost(postData);
console.log('Created post:', post);`,
        apiMethod: 'content.createPost'
      },
      {
        id: 'post-3',
        title: 'React to Posts',
        description: 'Add reactions to posts within the tribe',
        code: `// React to an existing post
await sdk.content.reactToPost({
  postId: post.id,
  reaction: 'LIKE'
});`,
        apiMethod: 'content.reactToPost'
      },
      {
        id: 'post-4',
        title: 'Comment on Posts',
        description: 'Add comments to existing posts',
        code: `// Comment on a post
const comment = await sdk.content.commentOnPost({
  postId: post.id,
  content: 'Great post! Thanks for sharing.'
});

console.log('Comment added:', comment);`,
        apiMethod: 'content.commentOnPost'
      },
      {
        id: 'post-5',
        title: 'Retrieve Post Comments',
        description: 'Get all comments for a specific post',
        code: `// Get comments for a post
const comments = await sdk.content.getPostComments(post.id);
console.log('Post comments:', comments);`,
        apiMethod: 'content.getPostComments'
      }
    ]
  },
  {
    id: 'tribe-creation-flow',
    title: 'Tribe Creation and Management',
    description: 'Complete flow for creating and managing a tribe',
    complexity: 'Complex',
    category: 'Tribe Management',
    steps: [
      {
        id: 'tribe-1',
        title: 'Create New Tribe',
        description: 'Create a new tribe with custom settings',
        code: `// Create a new tribe with configurations
const tribeData = {
  name: 'My Awesome Tribe',
  description: 'A community for awesome people',
  isPrivate: false,
  customFields: {
    category: 'Technology',
    locale: 'en-US'
  }
};

const tribe = await sdk.tribes.createTribe(tribeData);
console.log('Created tribe:', tribe);`,
        apiMethod: 'tribes.createTribe'
      },
      {
        id: 'tribe-2',
        title: 'Configure Tribe Settings',
        description: 'Update tribe settings and permissions',
        code: `// Update tribe configuration
await sdk.tribes.updateTribe({
  tribeId: tribe.id,
  settings: {
    allowGuestPosting: false,
    requireApproval: true
  }
});`,
        apiMethod: 'tribes.updateTribe'
      },
      {
        id: 'tribe-3',
        title: 'Manage Member Roles',
        description: 'Assign and manage roles within the tribe',
        code: `// Assign moderator role to a member
await sdk.tribes.assignRole({
  tribeId: tribe.id,
  userId: 'member-user-id',
  role: 'MODERATOR'
});`,
        apiMethod: 'tribes.assignRole'
      },
      {
        id: 'tribe-4',
        title: 'Create Invitation Links',
        description: 'Generate invitation links for private tribes',
        code: `// Create invitation with expiration
const invitation = await sdk.tribes.createInvitation({
  tribeId: tribe.id,
  expiration: '24h',
  maxUses: 10
});

console.log('Invitation link:', invitation.url);`,
        apiMethod: 'tribes.createInvitation'
      }
    ]
  }
]; 