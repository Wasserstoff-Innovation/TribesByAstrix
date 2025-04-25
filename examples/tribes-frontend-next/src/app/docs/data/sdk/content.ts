import { MethodDocumentation } from './tribes';

export const contentModule = {
  title: 'Content Management',
  description: 'Methods for creating and managing posts within a tribe, including reactions and comments.',
  methods: [
    {
      name: 'createPost',
      description: 'Creates a new post in a tribe. The post can include formatted content and structured metadata.',
      parameters: [
        {
          name: 'params',
          type: 'object',
          description: 'Parameters for creating a post',
          properties: [
            {
              name: 'tribeId',
              type: 'number',
              description: 'ID of the tribe where the post will be created',
            },
            {
              name: 'content',
              type: 'string',
              description: 'Content of the post, can be plain text or formatted (markdown, HTML, etc.)',
            },
            {
              name: 'metadata',
              type: 'string',
              description: 'JSON string containing post metadata like title, tags, attachments, etc.',
              optional: true,
            },
          ],
        },
      ],
      returns: {
        type: 'Promise<number>',
        description: 'Returns a promise that resolves to the new post ID',
      },
      example: `// Create a post with rich metadata
const postMetadata = {
  title: "Welcome to our tribe!",
  tags: ["welcome", "introduction"],
  attachments: ["https://example.com/image.jpg"],
  format: "markdown",
  preview: "A brief introduction to our community goals..."
};

const postId = await sdk.content.createPost({
  tribeId: 42,
  content: "# Welcome to our tribe!\\n\\nWe're excited to have you join our community.",
  metadata: JSON.stringify(postMetadata)
});

console.log(\`Post created with ID: \${postId}\`);

// Error handling
try {
  const postId = await sdk.content.createPost({
    tribeId: 42,
    content: "Hello tribe!"
  });
} catch (error) {
  if (error.code === 'TRIBE_NOT_FOUND') {
    console.error("The tribe does not exist");
  } else if (error.code === 'NOT_TRIBE_MEMBER') {
    console.error("You must be a member of the tribe to post");
  } else {
    console.error("Failed to create post:", error);
  }
}`,
      errors: [
        {
          code: 'TRIBE_NOT_FOUND',
          description: 'The specified tribe does not exist'
        },
        {
          code: 'NOT_TRIBE_MEMBER',
          description: 'The user is not a member of the tribe'
        },
        {
          code: 'CONTENT_TOO_LONG',
          description: 'The post content exceeds maximum length'
        },
        {
          code: 'RATE_LIMIT_EXCEEDED',
          description: 'Too many posts created in a short time period'
        }
      ]
    },
    {
      name: 'getTribePosts',
      description: 'Gets a list of posts from a tribe with pagination support.',
      parameters: [
        {
          name: 'tribeId',
          type: 'number',
          description: 'ID of the tribe to get posts from',
        },
        {
          name: 'offset',
          type: 'number',
          description: 'Number of posts to skip',
        },
        {
          name: 'limit',
          type: 'number',
          description: 'Maximum number of posts to return',
        },
      ],
      returns: {
        type: 'Promise<{ posts: Post[], total: number }>',
        description: 'Returns a promise that resolves to an object containing an array of posts and the total count',
      },
      example: `// Get the first 10 posts from a tribe
const result = await sdk.content.getTribePosts(42, 0, 10);

console.log(\`Tribe has \${result.total} posts in total\`);
console.log(\`Retrieved \${result.posts.length} posts\`);

// Iterate through posts and handle metadata
result.posts.forEach(post => {
  try {
    // Parse metadata to access structured data
    const metadata = JSON.parse(post.metadata || '{}');
    
    console.log(\`Post #\${post.id}: \${metadata.title || 'Untitled'}\`);
    console.log(\`Posted by: \${post.author}\`);
    console.log(\`Posted at: \${new Date(post.timestamp * 1000).toLocaleString()}\`);
    
    // Access other metadata fields if they exist
    if (metadata.tags) {
      console.log(\`Tags: \${metadata.tags.join(', ')}\`);
    }
  } catch (error) {
    console.error(\`Error parsing metadata for post \${post.id}:\`, error);
  }
});

// Pagination example
let currentOffset = 0;
const pageSize = 10;
let hasMorePosts = true;

async function loadNextPage() {
  if (!hasMorePosts) return;
  
  const result = await sdk.content.getTribePosts(42, currentOffset, pageSize);
  currentOffset += result.posts.length;
  hasMorePosts = currentOffset < result.total;
  
  return result.posts;
}`,
      errors: [
        {
          code: 'TRIBE_NOT_FOUND',
          description: 'The specified tribe does not exist'
        },
        {
          code: 'INVALID_PAGINATION',
          description: 'Invalid offset or limit parameters'
        }
      ]
    },
    {
      name: 'getPost',
      description: 'Gets a specific post by ID.',
      parameters: [
        { name: 'postId', type: 'number', description: 'The ID of the post' }
      ],
      returns: {
        type: 'Promise<PostData>',
        description: 'Post data'
      },
      example: `const post = await sdk.content.getPost(postId);
console.log(\`Post title: \${JSON.parse(post.metadata).title}\`);
console.log(\`Content: \${post.content}\`);
console.log(\`Author: \${post.author}\`);`
    },
    {
      name: 'reactToPost',
      description: 'Adds a reaction to a post.',
      parameters: [
        { name: 'postId', type: 'number', description: 'The ID of the post' },
        { name: 'reactionType', type: 'string', description: 'Type of reaction (e.g., "LIKE", "LOVE")' }
      ],
      returns: {
        type: 'Promise<string>',
        description: 'Transaction hash'
      },
      example: `const tx = await sdk.content.reactToPost(postId, "LIKE");
console.log(\`Reacted to post! Transaction: \${tx}\`);`
    },
    {
      name: 'commentOnPost',
      description: 'Adds a comment to a post.',
      parameters: [
        { name: 'postId', type: 'number', description: 'The ID of the post' },
        { name: 'content', type: 'string', description: 'Comment content' }
      ],
      returns: {
        type: 'Promise<number>',
        description: 'Comment ID'
      },
      example: `const commentId = await sdk.content.commentOnPost(postId, "Great post!");
console.log(\`Added comment with ID: \${commentId}\`);`
    },
    {
      name: 'getPostComments',
      description: 'Gets all comments for a specific post.',
      parameters: [
        { name: 'postId', type: 'number', description: 'The ID of the post' },
        { name: 'offset', type: 'number', description: 'Pagination offset', optional: true },
        { name: 'limit', type: 'number', description: 'Maximum number of comments to return', optional: true }
      ],
      returns: {
        type: 'Promise<{ comments: CommentData[], total: number }>',
        description: 'Comments and total count'
      },
      example: `const result = await sdk.content.getPostComments(postId, 0, 20);
console.log(\`Post has \${result.total} comments\`);
result.comments.forEach(comment => {
  console.log(\`\${comment.author}: \${comment.content}\`);
});`
    },
    {
      name: 'getUserPosts',
      description: 'Gets all posts created by a specific user.',
      parameters: [
        { name: 'userAddress', type: 'string', description: 'Address of the user' },
        { name: 'offset', type: 'number', description: 'Pagination offset', optional: true },
        { name: 'limit', type: 'number', description: 'Maximum number of posts to return', optional: true }
      ],
      returns: {
        type: 'Promise<{ posts: PostData[], total: number }>',
        description: 'Posts and total count'
      },
      example: `const result = await sdk.content.getUserPosts("0x1234...", 0, 10);
console.log(\`User has created \${result.total} posts\`);
result.posts.forEach(post => {
  console.log(\`Post in tribe \${post.tribeId}: \${post.content}\`);
});`
    },
    {
      name: 'deletePost',
      description: 'Deletes a post (must be the post author or tribe admin).',
      parameters: [
        { name: 'postId', type: 'number', description: 'The ID of the post to delete' }
      ],
      returns: {
        type: 'Promise<string>',
        description: 'Transaction hash'
      },
      example: `const tx = await sdk.content.deletePost(postId);
console.log(\`Post deleted! Transaction: \${tx}\`);`
    }
  ]
}; 