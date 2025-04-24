import { ethers } from 'ethers';

/**
 * Contract addresses for the Astrix ecosystem
 */
export interface ContractAddresses {
  /**
   * Astrix token contract address
   */
  astrixToken: string;
  
  /**
   * Token dispenser contract address
   */
  tokenDispenser: string;
  
  /**
   * Astrix point system contract address
   */
  astrixPointSystem: string;
  
  /**
   * Role manager contract address
   */
  roleManager: string;
  
  /**
   * Tribe controller contract address
   */
  tribeController: string;
  
  /**
   * Profile NFT minter contract address
   */
  profileNFTMinter: string;
  
  /**
   * Collectible controller contract address
   */
  collectibleController?: string;
  
  /**
   * Post minter contract address
   */
  postMinter?: string;
  
  /**
   * Post feed manager contract address
   */
  postFeedManager?: string;
  
  /**
   * Community points contract address
   */
  communityPoints?: string;
  
  /**
   * Event controller contract address
   */
  eventController?: string;
  
  /**
   * Super community controller contract address
   */
  superCommunityController?: string;
  
  /**
   * Voting contract address
   */
  voting?: string;
}

/**
 * Interface for interaction counts in the post system
 */
export interface InteractionCounts {
  likes: number;
  dislikes: number;
  shares: number;
  comments: number;
  saves: number;
}

/**
 * Interface representing a post in the contract
 */
export interface ContractPost {
  id: bigint;
  tribeId: bigint;
  creator: string;
  metadata: string;
  isGated: boolean;
  collectibleContract: string;
  collectibleId: bigint;
  isEncrypted: boolean;
  accessSigner: string;
  timestamp: bigint;
  reportCount: bigint;
  interactionCounts: [bigint, bigint, bigint, bigint, bigint]; // Raw values from contract
}

/**
 * Interface for batch post creation data
 */
export interface ContractBatchPostData {
  metadata: string;
  isGated: boolean;
  collectibleContract: string;
  collectibleId: bigint | number;
  postType: number;
}

/**
 * Interface for post pagination results from the contract
 */
export interface ContractPostPaginationResult {
  postIds: bigint[];
  total: bigint;
}

/**
 * Type guard for checking post created events
 */
export function isPostCreatedEvent(log: ethers.Log): boolean {
  return log instanceof ethers.EventLog && log.eventName === "PostCreated";
}

/**
 * Type guard for checking batch posts created events
 */
export function isBatchPostsCreatedEvent(log: ethers.Log): boolean {
  return log instanceof ethers.EventLog && log.eventName === "BatchPostsCreated";
}

/**
 * Type guard for checking encrypted post created events
 */
export function isEncryptedPostCreatedEvent(log: ethers.Log): boolean {
  return log instanceof ethers.EventLog && log.eventName === "EncryptedPostCreated";
}

/**
 * Type guard for checking signature gated post created events
 */
export function isSignatureGatedPostCreatedEvent(log: ethers.Log): boolean {
  return log instanceof ethers.EventLog && log.eventName === "SignatureGatedPostCreated";
}

/**
 * Type guard for checking post interaction events
 */
export function isPostInteractionEvent(log: ethers.Log): boolean {
  return log instanceof ethers.EventLog && log.eventName === "PostInteraction";
} 