/**
 * Content types based on the PostMinter contract
 */

/**
 * Post interaction types
 */
export enum InteractionType {
  LIKE = 'LIKE',
  COMMENT = 'COMMENT',
  SHARE = 'SHARE',
  BOOKMARK = 'BOOKMARK',
  REPORT = 'REPORT',
  REPLY = 'REPLY',
  MENTION = 'MENTION',
  REPOST = 'REPOST',
  TIP = 'TIP'
}

/**
 * Post types
 */
export enum PostType {
  TEXT = 'TEXT',
  RICH_MEDIA = 'RICH_MEDIA',
  EVENT = 'EVENT',
  POLL = 'POLL',
  PROJECT_UPDATE = 'PROJECT_UPDATE',
  COMMUNITY_UPDATE = 'COMMUNITY_UPDATE',
  ENCRYPTED = 'ENCRYPTED'
}

/**
 * Post details
 */
export interface PostDetails {
  id: number;
  creator: string;
  tribeId: number;
  metadata: string;
  isGated: boolean;
  collectibleContract: string;
  collectibleId: number;
  isEncrypted: boolean;
  accessSigner: string;
  createdAt?: number;
}

/**
 * Post pagination result
 */
export interface PostPaginationResult {
  postIds: number[];
  total: number;
  posts?: PostDetails[];
}

/**
 * Parameters for creating a post
 */
export interface CreatePostParams {
  tribeId: number;
  metadata: string;
  isGated?: boolean;
  collectibleContract?: string;
  collectibleId?: number;
}

/**
 * Parameters for creating a reply
 */
export interface CreateReplyParams {
  parentPostId: number;
  metadata: string;
  isGated?: boolean;
  collectibleContract?: string;
  collectibleId?: number;
}

/**
 * Parameters for creating an encrypted post
 */
export interface CreateEncryptedPostParams {
  tribeId: number;
  metadata: string;
  encryptionKeyHash: string;
  accessSigner: string;
}

/**
 * Parameters for batch creating posts
 */
export interface BatchPostData {
  metadata: string;
  isGated?: boolean;
  collectibleContract?: string;
  collectibleId?: number;
  postType?: PostType;
}

/**
 * Parameters for batch creating posts
 */
export interface BatchCreatePostsParams {
  tribeId: number;
  posts: BatchPostData[];
}

/**
 * Parameters for retrieving posts by tribe
 */
export interface GetPostsByTribeParams {
  tribeId: number;
  offset?: number;
  limit?: number;
  includeDetails?: boolean;
  postType?: PostType;
}

/**
 * Parameters for retrieving posts by user
 */
export interface GetPostsByUserParams {
  user: string;
  offset?: number;
  limit?: number;
  includeDetails?: boolean;
  postType?: PostType;
}

/**
 * Parameters for retrieving posts by tribe and user
 */
export interface GetPostsByTribeAndUserParams {
  tribeId: number;
  user: string;
  offset?: number;
  limit?: number;
  includeDetails?: boolean;
  postType?: PostType;
}

/**
 * Parameters for retrieving feed for user
 */
export interface GetFeedForUserParams {
  user: string;
  offset?: number;
  limit?: number;
  includeDetails?: boolean;
  postType?: PostType;
}

/**
 * Post with parsed metadata for UI display
 */
export interface ParsedPostData extends PostDetails {
  parsedMetadata: {
    type?: PostType;
    title?: string;
    content?: string;
    mediaContent?: {
      images?: string[];
      videos?: string[];
    };
    tags?: string[];
    createdAt?: number;
    [key: string]: any;
  };
} 