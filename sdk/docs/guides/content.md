# Content Module Guide

The Content module allows you to create, retrieve, and interact with content in the Tribes by Astrix platform. This guide covers common operations for working with tribe content.

## Initialization

The Content module is automatically initialized when you create an AstrixSDK instance:

```typescript
import { AstrixSDK } from '@tribes/sdk';

const sdk = new AstrixSDK({
  provider: window.ethereum,
  chainId: 4165, // Monad Devnet
});

// The content module is accessible via sdk.content
```

## Creating Content

### Create a Text Post

```typescript
const postId = await sdk.content.createPost({
  tribeId: 1,
  content: "Hello, tribe members!",
  postType: "TEXT",
  title: "My First Post",  // Optional
  tags: ["announcement", "welcome"]  // Optional
});

console.log(`Post created with ID: ${postId}`);
```

### Create a Media Post

```typescript
const mediaPostId = await sdk.content.createPost({
  tribeId: 1,
  content: "Check out this image!",
  postType: "MEDIA",
  title: "My Media Post",
  mediaUrl: "https://example.com/image.jpg",
  mediaType: "IMAGE"
});
```

### Create a Link Post

```typescript
const linkPostId = await sdk.content.createPost({
  tribeId: 1,
  content: "Great article about blockchain",
  postType: "LINK",
  title: "Interesting Article",
  linkUrl: "https://example.com/article",
  linkPreviewImageUrl: "https://example.com/preview.jpg"  // Optional
});
```

## Retrieving Content

### Get Posts for a Tribe

```typescript
// Get the latest 10 posts
const posts = await sdk.content.getTribePosts(1, { limit: 10 });

// Get posts with pagination
const page2 = await sdk.content.getTribePosts(1, { 
  limit: 10,
  offset: 10,
  sortBy: "createdAt",
  sortDirection: "desc"
});
```

### Get a Specific Post

```typescript
const post = await sdk.content.getPost(postId);
console.log(`Post title: ${post.title}`);
console.log(`Post content: ${post.content}`);
console.log(`Created by: ${post.creator}`);
```

### Get Posts by Creator

```typescript
const creatorAddress = "0x1234...";
const creatorPosts = await sdk.content.getPostsByCreator(creatorAddress);
```

### Get Posts by Tag

```typescript
const taggedPosts = await sdk.content.getPostsByTag("announcement");
```

## Interacting with Content

### React to a Post

```typescript
await sdk.content.reactToPost({
  postId: 123,
  reaction: "LIKE"  // Options: LIKE, LOVE, LAUGH, SAD, ANGRY
});
```

### Comment on a Post

```typescript
const commentId = await sdk.content.commentOnPost({
  postId: 123,
  content: "Great post!"
});
```

### Get Comments for a Post

```typescript
const comments = await sdk.content.getPostComments(123);
```

## Deleting Content

```typescript
await sdk.content.deletePost(postId);
```

## Content Privacy

For private or tribe-only content:

```typescript
const privatePostId = await sdk.content.createPost({
  tribeId: 1,
  content: "This is only visible to tribe members",
  postType: "TEXT",
  visibility: "TRIBE_ONLY"  // Options: PUBLIC, TRIBE_ONLY, PRIVATE
});
```

## Access Control

Only members with appropriate permissions in a tribe can create and interact with content. The SDK will automatically check permissions and return appropriate errors if operations are not allowed.

## Caching

The Content module leverages the SDK's caching system:

```typescript
// With explicit cache options
const posts = await sdk.content.getTribePosts(1, {
  limit: 10,
  cache: {
    maxAge: 60000,  // 1 minute cache
    blockBased: false
  }
});

// Clear cache for specific tribe content
sdk.content.invalidateCache(`tribe:1:posts`);
```

## Error Handling

```typescript
try {
  await sdk.content.createPost({
    tribeId: 999,  // Non-existent tribe
    content: "Test post",
    postType: "TEXT"
  });
} catch (error) {
  if (error.type === 'NOT_FOUND') {
    console.error("Tribe not found");
  } else if (error.type === 'UNAUTHORIZED') {
    console.error("Not authorized to post in this tribe");
  } else {
    console.error("Error creating post:", error.message);
  }
}
``` 