# Off-Chain Data Handling

This guide explains strategies for managing off-chain data alongside on-chain data in your Tribes by Astrix application.

## Understanding the Hybrid Approach

Blockchain applications typically use a hybrid approach to data storage:

1. **On-chain data**: Essential data stored directly on the blockchain (membership, permissions, core state)
2. **Off-chain data**: Larger or frequently changing data stored in external systems (post content, media, etc.)

The Tribes SDK helps you manage this hybrid approach effectively.

## Content Storage Options

### 1. IPFS Integration

IPFS (InterPlanetary File System) is ideal for decentralized content storage:

```typescript
import { AstrixSDK } from 'tribes-by-astrix-sdk';
import { create } from 'ipfs-http-client';

// Initialize SDK
const sdk = new AstrixSDK({/* config */});

// Initialize IPFS client
const ipfs = create({ url: 'https://ipfs.infura.io:5001/api/v0' });

// Store content on IPFS and create a post referencing it
async function createPostWithIPFSContent(tribeId: number, content: string, mediaUrls: string[] = []) {
  try {
    // Create content object
    const postContent = {
      title: "My Post Title",
      content,
      type: "RICH_MEDIA",
      mediaContent: {
        images: mediaUrls
      },
      timestamp: Date.now()
    };
    
    // Upload content to IPFS
    const { cid } = await ipfs.add(JSON.stringify(postContent));
    const ipfsUrl = `ipfs://${cid}`;
    
    // Create minimal on-chain post with IPFS reference
    const metadata = JSON.stringify({
      type: "RICH_MEDIA",
      contentURI: ipfsUrl,
      preview: content.substring(0, 100) // Optional preview
    });
    
    // Create post on-chain
    const postId = await sdk.content.createPost({
      tribeId,
      metadata
    });
    
    return {
      postId,
      ipfsUrl,
      cid: cid.toString()
    };
  } catch (error) {
    console.error('Error creating post with IPFS content:', error);
    throw error;
  }
}

// Retrieve post content from IPFS
async function getPostContentFromIPFS(postId: number) {
  try {
    // Get post details from chain
    const post = await sdk.content.getPost(postId);
    
    // Parse metadata to get IPFS URI
    const metadata = JSON.parse(post.metadata);
    
    if (!metadata.contentURI || !metadata.contentURI.startsWith('ipfs://')) {
      throw new Error('Post does not contain IPFS content URI');
    }
    
    // Extract CID from IPFS URI
    const cid = metadata.contentURI.replace('ipfs://', '');
    
    // Fetch from IPFS gateway
    const response = await fetch(`https://ipfs.io/ipfs/${cid}`);
    const fullContent = await response.json();
    
    return {
      ...post,
      fullContent
    };
  } catch (error) {
    console.error('Error retrieving IPFS content:', error);
    throw error;
  }
}
```

### 2. Centralized API Integration

For applications requiring moderation, search, or analytics:

```typescript
import { AstrixSDK } from 'tribes-by-astrix-sdk';
import axios from 'axios';

class TribesContentAPI {
  private apiBaseUrl: string;
  private apiKey: string;
  private sdk: AstrixSDK;
  
  constructor(sdk: AstrixSDK, apiBaseUrl: string, apiKey: string) {
    this.sdk = sdk;
    this.apiBaseUrl = apiBaseUrl;
    this.apiKey = apiKey;
  }
  
  // Upload content to API server
  async uploadContent(content: any) {
    try {
      const response = await axios.post(
        `${this.apiBaseUrl}/content`,
        content,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error uploading content to API:', error);
      throw error;
    }
  }
  
  // Create post with reference to API content
  async createPostWithAPIContent(tribeId: number, content: string, mediaUrls: string[] = []) {
    try {
      // Create content object
      const contentObject = {
        title: "My Post Title",
        content,
        mediaUrls,
        authorAddress: await this.sdk.getAddress(),
        tribeId,
        timestamp: Date.now()
      };
      
      // Upload to API
      const { contentId } = await this.uploadContent(contentObject);
      
      // Create minimal on-chain post with API reference
      const metadata = JSON.stringify({
        type: "RICH_MEDIA",
        contentId,
        preview: content.substring(0, 100) // Optional preview
      });
      
      // Create post on-chain
      const postId = await this.sdk.content.createPost({
        tribeId,
        metadata
      });
      
      // Link on-chain post ID to off-chain content
      await axios.patch(
        `${this.apiBaseUrl}/content/${contentId}`,
        { postId },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return {
        postId,
        contentId
      };
    } catch (error) {
      console.error('Error creating post with API content:', error);
      throw error;
    }
  }
  
  // Get full content from API
  async getFullPostContent(postId: number) {
    try {
      // Get post from chain
      const post = await this.sdk.content.getPost(postId);
      
      // Parse metadata
      const metadata = JSON.parse(post.metadata);
      
      if (!metadata.contentId) {
        throw new Error('Post does not contain content ID');
      }
      
      // Fetch from API
      const response = await axios.get(
        `${this.apiBaseUrl}/content/${metadata.contentId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );
      
      return {
        ...post,
        fullContent: response.data
      };
    } catch (error) {
      console.error('Error retrieving full post content:', error);
      throw error;
    }
  }
  
  // Search posts (off-chain)
  async searchPosts(query: string, tribeId?: number) {
    try {
      const params: any = { query };
      if (tribeId !== undefined) {
        params.tribeId = tribeId;
      }
      
      const response = await axios.get(
        `${this.apiBaseUrl}/content/search`,
        {
          params,
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error searching posts:', error);
      throw error;
    }
  }
}

// Usage example
const sdk = new AstrixSDK({/* config */});
const contentAPI = new TribesContentAPI(
  sdk, 
  'https://api.tribesbyastrix.com', 
  'your-api-key'
);

// Create a post
const { postId } = await contentAPI.createPostWithAPIContent(
  1, // tribeId
  "This is a long-form post that would be expensive to store entirely on-chain.",
  ["https://example.com/image1.jpg", "https://example.com/image2.jpg"]
);

// Retrieve full post
const fullPost = await contentAPI.getFullPostContent(postId);
console.log(fullPost.fullContent);

// Search posts
const searchResults = await contentAPI.searchPosts("keyword", 1);
```

## File Upload and Media Handling

### 1. Direct File Upload to IPFS

```typescript
async function uploadFileToIPFS(file: File) {
  try {
    const buffer = await file.arrayBuffer();
    const { cid } = await ipfs.add(buffer);
    
    const ipfsUrl = `ipfs://${cid}`;
    const gatewayUrl = `https://ipfs.io/ipfs/${cid}`;
    
    return {
      cid: cid.toString(),
      ipfsUrl,
      gatewayUrl
    };
  } catch (error) {
    console.error('Error uploading file to IPFS:', error);
    throw error;
  }
}

// Example usage with file input
document.getElementById('fileInput').addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (file) {
    const { gatewayUrl } = await uploadFileToIPFS(file);
    console.log('File uploaded:', gatewayUrl);
  }
});
```

### 2. Encrypted Content for Gated Posts

```typescript
import { ethers } from 'ethers';
import { AstrixSDK } from 'tribes-by-astrix-sdk';

// Encrypt content with a symmetric key
async function encryptContent(content: string, key: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  
  // Convert key to correct format
  const keyHash = await crypto.subtle.digest('SHA-256', encoder.encode(key));
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyHash,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );
  
  // Generate IV
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  // Encrypt
  const encryptedContent = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv
    },
    cryptoKey,
    data
  );
  
  // Format for storage
  return {
    encryptedData: Buffer.from(encryptedContent).toString('base64'),
    iv: Buffer.from(iv).toString('base64')
  };
}

// Create encrypted post using the SDK
async function createEncryptedPost(sdk: AstrixSDK, tribeId: number, content: string) {
  // Generate a random encryption key
  const encryptionKey = ethers.utils.hexlify(ethers.utils.randomBytes(32));
  
  // Create key hash for on-chain storage
  const encryptionKeyHash = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes(encryptionKey)
  );
  
  // Encrypt the content
  const { encryptedData, iv } = await encryptContent(content, encryptionKey);
  
  // Create content object with encrypted data
  const contentObj = {
    type: "ENCRYPTED",
    encryptedData,
    iv,
    previewText: "This content is encrypted and requires access."
  };
  
  // Create encrypted post
  const accessSigner = await sdk.getAddress(); // Or a designated signer
  const postId = await sdk.content.createEncryptedPost({
    tribeId,
    metadata: JSON.stringify(contentObj),
    encryptionKeyHash,
    accessSigner
  });
  
  // Store the encryption key securely (e.g., in your database)
  // This should be associated with the post and only shared with authorized users
  
  return {
    postId,
    encryptionKey // Save this securely!
  };
}
```

## Syncing On-Chain and Off-Chain Data

### 1. Event Listeners for Syncing

```typescript
import { AstrixSDK } from 'tribes-by-astrix-sdk';
import { ethers } from 'ethers';

// Initialize SDK with event handling
const sdk = new AstrixSDK({/* config */});

function setupEventListeners() {
  const postMinterContract = new ethers.Contract(
    sdk.getConfig().contracts.postMinter,
    ['event PostCreated(uint256 indexed postId, address indexed creator, uint256 indexed tribeId)'],
    sdk.getProvider()
  );
  
  // Listen for new posts
  postMinterContract.on('PostCreated', async (postId, creator, tribeId) => {
    console.log(`New post created: ${postId} by ${creator} in tribe ${tribeId}`);
    
    try {
      // Get post details from chain
      const post = await sdk.content.getPost(postId.toNumber());
      
      // Store or update in your off-chain database
      await updateOffChainDatabase({
        postId: postId.toNumber(),
        creator,
        tribeId: tribeId.toNumber(),
        metadata: post.metadata,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Error syncing new post:', error);
    }
  });
}

// Example function to update off-chain database
async function updateOffChainDatabase(postData: any) {
  // Implementation depends on your backend system
  // Example with REST API:
  await fetch('https://api.yourapp.com/sync/posts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(postData)
  });
}
```

### 2. Indexing Service Integration

For production applications, consider using indexing services like The Graph:

```typescript
import { ApolloClient, InMemoryCache, gql } from '@apollo/client';
import { AstrixSDK } from 'tribes-by-astrix-sdk';

// Create Apollo Client instance
const client = new ApolloClient({
  uri: 'https://api.thegraph.com/subgraphs/name/yourusername/tribes-subgraph',
  cache: new InMemoryCache()
});

// Query for posts
async function getRecentPostsByTribe(tribeId: number, limit: number = 10) {
  const { data } = await client.query({
    query: gql`
      query GetRecentPosts($tribeId: String!, $limit: Int!) {
        posts(
          where: { tribeId: $tribeId }
          orderBy: createdAt
          orderDirection: desc
          first: $limit
        ) {
          id
          creator {
            id
          }
          metadata
          isGated
          isEncrypted
          createdAt
        }
      }
    `,
    variables: {
      tribeId: tribeId.toString(),
      limit
    }
  });
  
  return data.posts;
}

// Combine with SDK to get full details
async function getEnrichedPostDetails(sdk: AstrixSDK, subgraphPostId: string) {
  // Get basic data from subgraph
  const { data } = await client.query({
    query: gql`
      query GetPost($id: ID!) {
        post(id: $id) {
          id
          creator {
            id
          }
          tribeId
          metadata
          isGated
          isEncrypted
          createdAt
        }
      }
    `,
    variables: {
      id: subgraphPostId
    }
  });
  
  const subgraphPost = data.post;
  
  // Get additional data from centralized API or IPFS if needed
  const metadata = JSON.parse(subgraphPost.metadata);
  let fullContent = null;
  
  if (metadata.contentURI && metadata.contentURI.startsWith('ipfs://')) {
    const cid = metadata.contentURI.replace('ipfs://', '');
    const response = await fetch(`https://ipfs.io/ipfs/${cid}`);
    fullContent = await response.json();
  } else if (metadata.contentId) {
    // Fetch from centralized API
    const response = await fetch(`https://api.yourapp.com/content/${metadata.contentId}`);
    fullContent = await response.json();
  }
  
  return {
    id: parseInt(subgraphPost.id),
    creator: subgraphPost.creator.id,
    tribeId: parseInt(subgraphPost.tribeId),
    metadata: subgraphPost.metadata,
    isGated: subgraphPost.isGated,
    isEncrypted: subgraphPost.isEncrypted,
    createdAt: parseInt(subgraphPost.createdAt) * 1000, // Convert to milliseconds
    content: fullContent
  };
}
```

## Best Practices for Off-Chain Data

1. **Content Addressing**: Use content addressing (CIDs, hashes) to reference off-chain data
2. **Validation**: Implement content validation both on and off-chain
3. **Encryption**: Encrypt sensitive or gated content
4. **Verification**: Include cryptographic proofs to verify content integrity
5. **Redundancy**: Store critical data in multiple locations
6. **Minimal On-Chain Footprint**: Only store essential data on-chain
7. **Clear Boundaries**: Define clear responsibilities between on-chain and off-chain systems

By following these patterns, you can create robust applications that leverage both blockchain security and off-chain scalability. 