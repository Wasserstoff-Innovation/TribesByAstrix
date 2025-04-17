import { ethers } from 'ethers';
import { BaseModule } from '../core/BaseModule';
import { ErrorType } from '../types/core';
import {
  CreatePostParams,
  CreateReplyParams,
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
  ParsedPostData
} from '../types/content';

// Import ABIs
import PostMinterABI from '../../abis/PostMinter.json';
import PostFeedManagerABI from '../../abis/PostFeedManager.json';

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
   * Get a post by ID
   * @param postId Post ID
   * @returns Post details
   */
  public async getPost(postId: number): Promise<PostDetails> {
    try {
      const postMinter = this.getPostMinterContract();
      const post = await postMinter.getPost(postId);

      return {
        id: Number(post.id),
        creator: post.creator,
        tribeId: Number(post.tribeId),
        metadata: post.metadata,
        isGated: post.isGated,
        collectibleContract: post.collectibleContract,
        collectibleId: Number(post.collectibleId),
        isEncrypted: post.isEncrypted,
        accessSigner: post.accessSigner,
        createdAt: post.createdAt ? Number(post.createdAt) : undefined
      };
    } catch (error) {
      return this.handleError(
        error,
        'Failed to get post',
        ErrorType.CONTRACT_ERROR
      );
    }
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
    try {
      const postMinter = this.getPostMinterContract();
      const result = await postMinter.getPostsByTribe(
        params.tribeId,
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
        'Failed to get posts by tribe',
        ErrorType.CONTRACT_ERROR
      );
    }
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
    try {
      const postMinter = this.getPostMinterContract();
      const result = await postMinter.getFeedForUser(
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
        'Failed to get feed for user',
        ErrorType.CONTRACT_ERROR
      );
    }
  }

  /**
   * Create a reply to a post
   * @param params Reply parameters
   * @returns Post ID of the created reply
   */
  public async createReply(params: CreateReplyParams): Promise<number> {
    try {
      const postMinter = this.getPostMinterContract(true);
      const tx = await postMinter.createReply(
        params.parentPostId,
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

      this.log(`Created reply`, {
        postId,
        parentPostId: params.parentPostId,
        txHash: receipt.hash
      });
      
      return postId;
    } catch (error) {
      return this.handleError(
        error,
        'Failed to create reply',
        ErrorType.CONTRACT_ERROR
      );
    }
  }

  /**
   * Get full post details for multiple post IDs
   * @param postIds Array of post IDs
   * @returns Array of post details
   */
  public async getPostDetailsByIds(postIds: number[]): Promise<PostDetails[]> {
    try {
      const promises = postIds.map(id => this.getPost(id));
      return Promise.all(promises);
    } catch (error) {
      return this.handleError(
        error,
        'Failed to get multiple posts',
        ErrorType.CONTRACT_ERROR
      );
    }
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
   * @param postId Post ID
   * @returns Post with parsed metadata
   */
  public async getParsedPostDetails(postId: number): Promise<ParsedPostData> {
    try {
      const post = await this.getPost(postId);
      
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
    } catch (error) {
      return this.handleError(
        error,
        'Failed to get parsed post details',
        ErrorType.CONTRACT_ERROR
      );
    }
  }
} 