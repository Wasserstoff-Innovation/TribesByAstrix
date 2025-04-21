import { ethers } from 'ethers';
import { BaseModule } from '../core/BaseModule';
import { ErrorType } from '../types/core';
import {
  CreatePostParams,
  CreateEncryptedPostParams,
  BatchCreatePostsParams,
  GetPostsByTribeParams,
  GetPostsByUserParams,
  GetPostsByTribeAndUserParams,
  GetFeedForUserParams,
  PostDetails,
  PostPaginationResult,
  PostType,
  InteractionType,
  ParsedPostData,
  CreateSignatureGatedPostParams,
  ValidatePostMetadataParams
} from '../types/content';
import axios, { AxiosInstance } from 'axios';

// Import ABIs
import PostMinterABI from '../../abis/PostMinter.json';
import PostFeedManagerABI from '../../abis/PostFeedManager.json';

// Add missing interfaces
interface PostMetadata {
  title: string;
  content: string;
  media: Array<{
    url: string;
    type: string;
    mimeType?: string;
  }>;
}

/**
 * Module for managing content (posts, comments, etc.)
 */
export class ContentModule extends BaseModule {
  /**
   * Get the PostMinter contract
   * @param useSigner Whether to use the signer
   */
  private getPostMinterContract(useSigner: boolean = false) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.getContract<any>(
      this.config.contracts.postMinter || '',
      PostMinterABI,
      useSigner
    );
  }

  /**
   * Get the PostFeedManager contract
   * @param useSigner Whether to use the signer
   */
  private getPostFeedManagerContract(useSigner: boolean = false) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.getContract<any>(
      this.config.contracts.postFeedManager || '',
      PostFeedManagerABI,
      useSigner
    );
  }

  /**
   * Create a new post
   * @param params Post creation parameters
   * @returns Post ID of the created post
   */
  public async createPost(params: CreatePostParams): Promise<number> {
    try {
      const postMinter = this.getPostMinterContract(true);
      const tx = await postMinter.createPost(
        params.tribeId,
        params.metadata,
        params.isGated || false,
        params.collectibleContract || ethers.ZeroAddress,
        params.collectibleId || 0
      );
      const receipt = await tx.wait();

      // Find the PostCreated event in the receipt
      const event = receipt.logs.find((log: any) => {
        return log instanceof ethers.EventLog && log.eventName === "PostCreated";
      }) as ethers.EventLog | undefined;
      
      if (!event) {
        throw new Error('Post creation event not found');
      }
      
      const postId = Number(event.args[0]);

      this.log(`Created post`, {
        postId,
        tribeId: params.tribeId,
        txHash: receipt.hash
      });
      
      // Invalidate relevant caches
      this.invalidateTribePostsCache(params.tribeId);
      
      return postId;
    } catch (error) {
      return this.handleError(
        error,
        'Failed to create post',
        ErrorType.CONTRACT_ERROR
      );
    }
  }

  /**
   * Create multiple posts in a batch to save gas
   * @param params Batch post creation parameters
   * @returns Array of created post IDs
   */
  public async createBatchPosts(params: BatchCreatePostsParams): Promise<number[]> {
    try {
      const postMinter = this.getPostMinterContract(true);
      
      // Map BatchPostData to contract-compatible format
      const batchData = params.posts.map(post => ({
        metadata: post.metadata,
        isGated: post.isGated || false,
        collectibleContract: post.collectibleContract || ethers.ZeroAddress,
        collectibleId: post.collectibleId || 0,
        postType: this.getPostTypeValue(post.postType || PostType.TEXT)
      }));
      
      const tx = await postMinter.createBatchPosts(
        params.tribeId,
        batchData
      );
      
      const receipt = await tx.wait();

      // Find the BatchPostsCreated event in the receipt
      const event = receipt.logs.find((log: any) => {
        return log instanceof ethers.EventLog && log.eventName === "BatchPostsCreated";
      }) as ethers.EventLog | undefined;
      
      if (!event) {
        throw new Error('Batch post creation event not found');
      }
      
      const postIds = event.args[2].map((id: bigint) => Number(id));

      this.log(`Created batch posts`, {
        tribeId: params.tribeId,
        count: postIds.length,
        txHash: receipt.hash
      });
      
      return postIds;
    } catch (error) {
      return this.handleError(
        error,
        'Failed to create batch posts',
        ErrorType.CONTRACT_ERROR
      );
    }
  }

  /**
   * Create an encrypted post
   * @param params Encrypted post creation parameters
   * @returns Post ID of the created encrypted post
   */
  public async createEncryptedPost(params: CreateEncryptedPostParams): Promise<number> {
    try {
      const postMinter = this.getPostMinterContract(true);
      const tx = await postMinter.createEncryptedPost(
        params.tribeId,
        params.metadata,
        params.encryptionKeyHash,
        params.accessSigner
      );
      
      const receipt = await tx.wait();

      // Find the EncryptedPostCreated event in the receipt
      const event = receipt.logs.find((log: any) => {
        return log instanceof ethers.EventLog && log.eventName === "EncryptedPostCreated";
      }) as ethers.EventLog | undefined;
      
      if (!event) {
        throw new Error('Encrypted post creation event not found');
      }
      
      const postId = Number(event.args[0]);

      this.log(`Created encrypted post`, {
        postId,
        tribeId: params.tribeId,
        txHash: receipt.hash
      });
      
      return postId;
    } catch (error) {
      return this.handleError(
        error,
        'Failed to create encrypted post',
        ErrorType.CONTRACT_ERROR
      );
    }
  }

  /**
   * Create a signature-gated post that requires both collectible ownership and encryption
   * @param params Signature gated post creation parameters
   * @returns Post ID of the created signature-gated post
   */
  public async createSignatureGatedPost(params: CreateSignatureGatedPostParams): Promise<number> {
    try {
      const postMinter = this.getPostMinterContract(true);
      const tx = await postMinter.createSignatureGatedPost(
        params.tribeId,
        params.metadata,
        params.encryptionKeyHash,
        params.accessSigner,
        params.collectibleContract,
        params.collectibleId
      );
      
      const receipt = await tx.wait();

      // Find the SignatureGatedPostCreated event in the receipt
      const event = receipt.logs.find((log: any) => {
        return log instanceof ethers.EventLog && log.eventName === "SignatureGatedPostCreated";
      }) as ethers.EventLog | undefined;
      
      if (!event) {
        throw new Error('Signature gated post creation event not found');
      }
      
      const postId = Number(event.args[0]);

      this.log(`Created signature gated post`, {
        postId,
        tribeId: params.tribeId,
        txHash: receipt.hash
      });
      
      return postId;
    } catch (error) {
      return this.handleError(
        error,
        'Failed to create signature gated post',
        ErrorType.CONTRACT_ERROR
      );
    }
  }

  /**
   * Delete a post (can only be done by the creator)
   * @param postId ID of the post to delete
   * @returns Transaction receipt
   */
  public async deletePost(postId: number): Promise<ethers.TransactionReceipt> {
    try {
      const postMinter = this.getPostMinterContract(true);
      const tx = await postMinter.deletePost(postId);
      const receipt = await tx.wait();
      
      // Invalidate post cache
      this.invalidatePostCache(postId);
      
      // Get the post to find the tribe ID
      const post = await this.getPost(postId);
      this.invalidateTribePostsCache(post.tribeId);
      
      this.log(`Deleted post ${postId}`);
      return receipt;
    } catch (error) {
      return this.handleError(
        error,
        `Failed to delete post ${postId}`,
        ErrorType.CONTRACT_ERROR
      );
    }
  }

  /**
   * Report a post for inappropriate content
   * @param postId ID of the post to report
   * @param reason Reason for reporting
   * @returns Transaction receipt
   */
  public async reportPost(postId: number, reason: string): Promise<ethers.TransactionReceipt> {
    try {
      const postMinter = this.getPostMinterContract(true);
      const tx = await postMinter.reportPost(postId, reason);
      const receipt = await tx.wait();
      
      this.log(`Reported post`, {
        postId,
        reason,
        txHash: receipt.hash
      });
      
      return receipt;
    } catch (error) {
      return this.handleError(
        error,
        'Failed to report post',
        ErrorType.CONTRACT_ERROR
      );
    }
  }

  /**
   * Interact with a post (like, share, etc.)
   * @param postId ID of the post to interact with
   * @param interactionType Type of interaction
   * @returns Transaction receipt
   */
  public async interactWithPost(
    postId: number, 
    interactionType: InteractionType
  ): Promise<ethers.TransactionReceipt> {
    try {
      const postMinter = this.getPostMinterContract(true);
      // Convert from string enum to numeric enum for the contract
      const interactionTypeValue = this.getInteractionTypeValue(interactionType);
      
      const tx = await postMinter.interactWithPost(postId, interactionTypeValue);
      const receipt = await tx.wait();
      
      this.log(`Interacted with post`, {
        postId,
        interactionType,
        txHash: receipt.hash
      });
      
      return receipt;
    } catch (error) {
      return this.handleError(
        error,
        'Failed to interact with post',
        ErrorType.CONTRACT_ERROR
      );
    }
  }

  /**
   * Get the numeric value of a post type for the contract
   * @param postType Post type enum
   * @returns Numeric value for the contract
   */
  private getPostTypeValue(postType: PostType): number {
    const postTypeMap: Record<PostType, number> = {
      [PostType.TEXT]: 0,
      [PostType.RICH_MEDIA]: 1,
      [PostType.EVENT]: 2,
      [PostType.POLL]: 3,
      [PostType.PROJECT_UPDATE]: 4,
      [PostType.COMMUNITY_UPDATE]: 5,
      [PostType.ENCRYPTED]: 6
    };
    return postTypeMap[postType] || 0;
  }

  /**
   * Get the numeric value of an interaction type for the contract
   * @param interactionType Interaction type enum
   * @returns Numeric value for the contract
   */
  private getInteractionTypeValue(interactionType: InteractionType): number {
    const interactionTypeMap: Record<InteractionType, number> = {
      [InteractionType.LIKE]: 0,
      [InteractionType.COMMENT]: 1,
      [InteractionType.SHARE]: 2,
      [InteractionType.BOOKMARK]: 3,
      [InteractionType.REPORT]: 4,
      [InteractionType.REPLY]: 5,
      [InteractionType.MENTION]: 6,
      [InteractionType.REPOST]: 7,
      [InteractionType.TIP]: 8
    };
    return interactionTypeMap[interactionType] || 0;
  }

  /**
   * Authorize a viewer to access an encrypted post
   * @param postId ID of the post
   * @param viewer Address of the viewer to authorize
   * @returns Transaction receipt
   */
  public async authorizeViewer(
    postId: number, 
    viewer: string
  ): Promise<ethers.TransactionReceipt> {
    try {
      const postMinter = this.getPostMinterContract(true);
      const tx = await postMinter.authorizeViewer(postId, viewer);
      const receipt = await tx.wait();
      
      this.log(`Authorized viewer for post`, {
        postId,
        viewer,
        txHash: receipt.hash
      });
      
      return receipt;
    } catch (error) {
      return this.handleError(
        error,
        'Failed to authorize viewer',
        ErrorType.CONTRACT_ERROR
      );
    }
  }

  /**
   * Validate post metadata format and required fields
   * @param params Validation parameters
   * @returns True if metadata is valid
   */
  public async validatePostMetadata(params: ValidatePostMetadataParams): Promise<boolean> {
    try {
      const postMinter = this.getPostMinterContract();
      const postTypeValue = this.getPostTypeValue(params.postType);
      
      return await postMinter.validateMetadata(params.metadata, postTypeValue);
    } catch (error) {
      return this.handleError(
        error,
        'Failed to validate post metadata',
        ErrorType.CONTRACT_ERROR
      );
    }
  }

  /**
   * Get a post by ID
   * @param postId Post ID
   * @returns Post details
   */
  public async getPost(postId: number): Promise<PostDetails> {
    return this.getWithCache(
      `post:${postId}`,
      async () => {
        try {
          const postMinter = this.getPostMinterContract();
          const post = await postMinter.getPost(postId);
          
          return {
            id: Number(post.id),
            tribeId: Number(post.tribeId),
            creator: post.creator,
            metadata: post.metadata,
            isGated: post.isGated,
            collectibleContract: post.collectibleContract,
            collectibleId: Number(post.collectibleId),
            isEncrypted: post.isEncrypted,
            accessSigner: post.accessSigner,
            createdAt: Number(post.timestamp),
            reportCount: Number(post.reportCount),
            interactionCounts: {
              likes: Number(post.interactionCounts[0]),
              dislikes: Number(post.interactionCounts[1]),
              shares: Number(post.interactionCounts[2]),
              comments: Number(post.interactionCounts[3]),
              saves: Number(post.interactionCounts[4])
            }
          };
        } catch (error) {
          return this.handleError(
            error,
            `Failed to get post ${postId}`,
            ErrorType.CONTRACT_ERROR
          );
        }
      },
      { blockBased: true } // Use block-based caching for contract state
    );
  }

  /**
   * Filter posts by post type
   * @param postIds Array of post IDs
   * @param postType Post type to filter by
   * @returns Filtered post IDs and fetched post details if any were retrieved
   */
  private async filterPostsByType(
    postIds: number[], 
    postType?: PostType, 
    existingPosts?: PostDetails[]
  ): Promise<{ filteredIds: number[]; filteredPosts?: PostDetails[] }> {
    if (!postType || postIds.length === 0) {
      return { filteredIds: postIds, filteredPosts: existingPosts };
    }

    // If we don't have post details yet, we need to fetch them
    let posts = existingPosts;
    if (!posts) {
      posts = await this.getPostDetailsByIds(postIds);
    }

    // Filter posts by type
    const filteredPosts = posts.filter(post => {
      try {
        const metadata = JSON.parse(post.metadata);
        return metadata.type === postType;
      } catch (error) {
        // If metadata can't be parsed or doesn't have a type, exclude it
        return false;
      }
    });

    // Return the filtered post IDs and posts
    return { 
      filteredIds: filteredPosts.map(post => post.id),
      filteredPosts
    };
  }

  /**
   * Get posts by tribe with pagination
   * @param params Query parameters
   * @returns Paginated posts
   */
  public async getPostsByTribe(params: GetPostsByTribeParams): Promise<PostPaginationResult> {
    const { tribeId, offset = 0, limit = 10, postType } = params;
    
    return this.getWithCache(
      `posts:tribe:${tribeId}:${offset}:${limit}:${postType || 'all'}`,
      async () => {
        try {
          const postMinter = this.getPostMinterContract();
          const [postIds, total] = await postMinter.getPostsByTribe(tribeId, offset, limit);
          
          const mappedIds = postIds.map((id: bigint) => Number(id));
          
          // Check if we need to filter by post type
          if (postType !== undefined) {
            const { filteredIds } = await this.filterPostsByType(mappedIds, postType);
            
            // Get post details for the filtered IDs
            const posts = await this.getPostDetailsByIds(filteredIds);
            
            return {
              postIds: filteredIds,
              posts,
              total: Number(total)
            };
          }
          
          // No filtering needed, get all post details
          const posts = await this.getPostDetailsByIds(mappedIds);
          
          return {
            postIds: mappedIds,
            posts,
            total: Number(total)
          };
        } catch (error) {
          return this.handleError(
            error,
            `Failed to get posts for tribe ${tribeId}`,
            ErrorType.CONTRACT_ERROR
          );
        }
      },
      { blockBased: true } // Use block-based caching
    );
  }

  /**
   * Get posts by user with pagination
   * @param params Query parameters
   * @returns Paginated posts
   */
  public async getPostsByUser(params: GetPostsByUserParams): Promise<PostPaginationResult> {
    try {
      const postMinter = this.getPostMinterContract();
      const result = await postMinter.getPostsByUser(
        params.user,
        params.offset || 0,
        params.limit || 10
      );

      const postIds = result.postIds.map((id: any) => Number(id));
      const total = Number(result.total);

      // If requested, fetch full post details for each post ID
      let posts: PostDetails[] | undefined;
      if ((params.includeDetails || params.postType) && postIds.length > 0) {
        posts = await this.getPostDetailsByIds(postIds);
      }

      // Apply post type filtering if needed
      if (params.postType && posts) {
        const { filteredIds, filteredPosts } = await this.filterPostsByType(postIds, params.postType, posts);
        return {
          postIds: filteredIds,
          total: params.postType ? filteredIds.length : total, // Adjust total count when filtering
          posts: params.includeDetails ? filteredPosts : undefined
        };
      }

      return {
        postIds,
        total,
        posts: params.includeDetails ? posts : undefined
      };
    } catch (error) {
      return this.handleError(
        error,
        'Failed to get posts by user',
        ErrorType.CONTRACT_ERROR
      );
    }
  }

  /**
   * Get posts by tribe and user with pagination
   * @param params Query parameters
   * @returns Paginated posts
   */
  public async getPostsByTribeAndUser(params: GetPostsByTribeAndUserParams): Promise<PostPaginationResult> {
    try {
      const postMinter = this.getPostMinterContract();
      const result = await postMinter.getPostsByTribeAndUser(
        params.tribeId,
        params.user,
        params.offset || 0,
        params.limit || 10
      );

      const postIds = result.postIds.map((id: any) => Number(id));
      const total = Number(result.total);

      // If requested, fetch full post details for each post ID
      let posts: PostDetails[] | undefined;
      if ((params.includeDetails || params.postType) && postIds.length > 0) {
        posts = await this.getPostDetailsByIds(postIds);
      }

      // Apply post type filtering if needed
      if (params.postType && posts) {
        const { filteredIds, filteredPosts } = await this.filterPostsByType(postIds, params.postType, posts);
        return {
          postIds: filteredIds,
          total: params.postType ? filteredIds.length : total, // Adjust total count when filtering
          posts: params.includeDetails ? filteredPosts : undefined
        };
      }

      return {
        postIds,
        total,
        posts: params.includeDetails ? posts : undefined
      };
    } catch (error) {
      return this.handleError(
        error,
        'Failed to get posts by tribe and user',
        ErrorType.CONTRACT_ERROR
      );
    }
  }

  /**
   * Get feed for user with pagination
   * @param params Query parameters
   * @returns Paginated posts
   */
  public async getFeedForUser(params: GetFeedForUserParams): Promise<PostPaginationResult> {
    const { user, offset = 0, limit = 10, postType } = params;
    
    return this.getWithCache(
      `feed:user:${user}:${offset}:${limit}:${postType || 'all'}`,
      async () => {
        try {
          const postMinter = this.getPostMinterContract();
          const [postIds, total] = await postMinter.getFeedForUser(user, offset, limit);
          
          const mappedIds = postIds.map((id: bigint) => Number(id));
          
          // Check if we need to filter by post type
          if (postType !== undefined) {
            const { filteredIds } = await this.filterPostsByType(mappedIds, postType);
            
            // Get post details for the filtered IDs
            const posts = await this.getPostDetailsByIds(filteredIds);
            
            return {
              postIds: filteredIds,
              posts,
              total: Number(total)
            };
          }
          
          // No filtering needed, get all post details
          const posts = await this.getPostDetailsByIds(mappedIds);
          
          return {
            postIds: mappedIds,
            posts,
            total: Number(total)
          };
        } catch (error) {
          return this.handleError(
            error,
            `Failed to get feed for user ${user}`,
            ErrorType.CONTRACT_ERROR
          );
        }
      },
      { 
        blockBased: true, // Update on new blocks
        maxAge: 60000 // Cache for 1 minute maximum
      }
    );
  }

  /**
   * Get full post details for multiple post IDs
   * @param postIds Array of post IDs
   * @returns Array of post details
   */
  public async getPostDetailsByIds(postIds: number[]): Promise<PostDetails[]> {
    // If there are no post IDs, return an empty array
    if (postIds.length === 0) {
      return [];
    }
    
    // For small batches, use individual cached calls
    if (postIds.length <= 3) {
      const postsPromises = postIds.map(id => this.getPost(id));
      return Promise.all(postsPromises);
    }
    
    // For larger batches, use a single cache entry for the batch
    return this.getWithCache(
      `post:batch:${postIds.sort((a, b) => a - b).join(',')}`,
      async () => {
        try {
          const postMinter = this.getPostMinterContract();
          const posts = await postMinter.getPostBatch(postIds);
          
          return posts.map((post: any) => ({
            id: Number(post.id),
            tribeId: Number(post.tribeId),
            creator: post.creator,
            metadata: post.metadata,
            isGated: post.isGated,
            collectibleContract: post.collectibleContract,
            collectibleId: Number(post.collectibleId),
            isEncrypted: post.isEncrypted,
            accessSigner: post.accessSigner,
            createdAt: Number(post.timestamp),
            reportCount: Number(post.reportCount),
            interactionCounts: {
              likes: Number(post.interactionCounts[0]),
              dislikes: Number(post.interactionCounts[1]),
              shares: Number(post.interactionCounts[2]),
              comments: Number(post.interactionCounts[3]),
              saves: Number(post.interactionCounts[4])
            }
          }));
        } catch (error) {
          return this.handleError(
            error,
            'Failed to get post batch',
            ErrorType.CONTRACT_ERROR
          );
        }
      },
      { blockBased: true }
    );
  }

  /**
   * Refresh feed for user to get the latest posts
   * @param params Query parameters
   * @returns Paginated posts with latest content
   */
  public async refreshFeed(params: GetFeedForUserParams): Promise<PostPaginationResult> {
    try {
      // Clear any caching that might be happening in the SDK or client
      this.log('Refreshing feed for user', { user: params.user });
      
      // Just call getFeedForUser with the same parameters
      return this.getFeedForUser(params);
    } catch (error) {
      return this.handleError(
        error,
        'Failed to refresh feed',
        ErrorType.CONTRACT_ERROR
      );
    }
  }

  /**
   * Get feed with parsed metadata for UI display
   * @param params Query parameters 
   * @returns Feed with parsed metadata
   */
  public async getFeedWithParsedMetadata(params: GetFeedForUserParams): Promise<ParsedPostData[]> {
    try {
      // Get feed with included details
      const paramsWithDetails = {
        ...params,
        includeDetails: true
      };
      
      const feed = await this.getFeedForUser(paramsWithDetails);
      
      if (!feed.posts || feed.posts.length === 0) {
        return [];
      }
      
      // Parse metadata for each post
      return feed.posts.map(post => {
        try {
          const parsedMetadata = JSON.parse(post.metadata);
          return {
            ...post,
            parsedMetadata
          };
        } catch (error) {
          this.log('Error parsing post metadata', { postId: post.id, error });
          return {
            ...post,
            parsedMetadata: { error: 'Invalid metadata format' }
          };
        }
      });
    } catch (error) {
      return this.handleError(
        error,
        'Failed to get feed with parsed metadata',
        ErrorType.CONTRACT_ERROR
      );
    }
  }

  /**
   * Get a post with parsed metadata
   * @param post Post details
   * @returns Post with parsed metadata
   */
  public async getParsedPostDetails(post: PostDetails): Promise<ParsedPostData> {
    return this.getWithCache(
      `parsed:post:${post.id}`,
      async () => {
        try {
          // Fetch the metadata if it's a URL
          let parsedMetadata: any;
          
          if (!post.metadata) {
            parsedMetadata = { title: "", content: "", media: [] };
          } else if (typeof post.metadata === 'string' && post.metadata.startsWith('http')) {
            // Use axios directly for API calls
            const response = await axios.get(post.metadata);
            parsedMetadata = response.data;
          } else {
            try {
              parsedMetadata = JSON.parse(post.metadata as string);
            } catch (e) {
              parsedMetadata = { title: "", content: post.metadata, media: [] };
            }
          }
          
          const parsedPost: ParsedPostData = {
            ...post,
            parsedMetadata
          };
          
          return parsedPost;
        } catch (error) {
          return this.handleError(
            error,
            `Failed to parse post details for post ${post.id}`,
            ErrorType.API_ERROR
          );
        }
      },
      {
        blockBased: false, // Not dependent on blockchain state
        maxAge: 300000 // Cache parsed metadata for 5 minutes
      }
    );
  }

  /**
   * Invalidate cache for a specific post
   */
  public invalidatePostCache(postId: number): void {
    this.invalidateCache(`post:${postId}`);
    this.invalidateCache(`parsed:post:${postId}`);
    
    // Also invalidate any batch caches that might contain this post
    const batchKeyPattern = `post:batch:`;
    this.invalidateCacheByPattern(batchKeyPattern);
  }

  /**
   * Invalidate cache for posts in a tribe
   */
  public invalidateTribePostsCache(tribeId: number): void {
    const keyPattern = `posts:tribe:${tribeId}:`;
    this.invalidateCacheByPattern(keyPattern);
  }

  /**
   * Invalidate user feed cache
   */
  public invalidateUserFeedCache(userAddress: string): void {
    const keyPattern = `feed:user:${userAddress}:`;
    this.invalidateCacheByPattern(keyPattern);
  }
} 