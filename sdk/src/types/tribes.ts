/**
 * Tribe join types
 */
export enum JoinType {
  PUBLIC = 0,
  PRIVATE = 1,
  INVITE_ONLY = 2
}

/**
 * Member status
 */
export enum MemberStatus {
  NONE = 0,
  ACTIVE = 1,
  PENDING = 2,
  BANNED = 3
}

/**
 * Tribe information
 */
export interface TribeInfo {
  /**
   * Tribe ID
   */
  id: number;
  
  /**
   * Tribe name
   */
  name: string;
  
  /**
   * Admin address
   */
  admin: string;
  
  /**
   * Metadata JSON string
   */
  metadata: string;
  
  /**
   * Join type
   */
  joinType: JoinType;
  
  /**
   * Entry fee in wei
   */
  entryFee: bigint;
  
  /**
   * Member count
   */
  memberCount: number;
  
  /**
   * Creation time
   */
  createdAt: number;
  
  /**
   * Organization address
   */
  organization?: string;
  
  /**
   * Token address
   */
  tokenAddress?: string;
}

/**
 * Tribe member information
 */
export interface TribeMemberInfo {
  /**
   * Member address
   */
  address: string;
  
  /**
   * Membership status
   */
  status: MemberStatus;
  
  /**
   * Joining time
   */
  joinedAt: number;
  
  /**
   * Points balance
   */
  points?: number;
  
  /**
   * Roles assigned to the member
   */
  roles?: string[];
}

/**
 * NFT requirement
 */
export interface NFTRequirement {
  /**
   * NFT contract address
   */
  contractAddress: string;
  
  /**
   * Minimum token ID (optional)
   */
  minTokenId?: number;
  
  /**
   * Maximum token ID (optional)
   */
  maxTokenId?: number;
}

/**
 * Parameters for creating a tribe
 */
export interface CreateTribeParams {
  /**
   * Tribe name
   */
  name: string;
  
  /**
   * Tribe metadata (JSON string)
   */
  metadata: string;
  
  /**
   * Array of admin addresses
   */
  admins?: string[];
  
  /**
   * Join type
   */
  joinType?: JoinType;
  
  /**
   * Entry fee in wei
   */
  entryFee?: bigint;
  
  /**
   * NFT requirements for joining
   */
  nftRequirements?: NFTRequirement[];
}

/**
 * Parameters for updating a tribe configuration
 */
export interface UpdateTribeConfigParams {
  /**
   * Tribe ID
   */
  tribeId: number;
  
  /**
   * Join type
   */
  joinType: JoinType;
  
  /**
   * Entry fee in wei
   */
  entryFee: bigint;
  
  /**
   * NFT requirements for joining
   */
  nftRequirements?: NFTRequirement[];
}

/**
 * Parameters for updating a tribe
 */
export interface UpdateTribeParams {
  /**
   * Tribe ID
   */
  tribeId: number;
  
  /**
   * New metadata
   */
  newMetadata: string;
  
  /**
   * Updated whitelist of addresses
   */
  updatedWhitelist?: string[];
}

/**
 * Parameters for joining a tribe
 */
export interface JoinTribeParams {
  /**
   * Tribe ID
   */
  tribeId: number;
}

/**
 * Parameters for requesting to join a tribe
 */
export interface RequestToJoinTribeParams {
  /**
   * Tribe ID
   */
  tribeId: number;
  
  /**
   * Entry fee in wei
   */
  entryFee: bigint;
}

/**
 * Parameters for joining a tribe with a code
 */
export interface JoinTribeWithCodeParams {
  /**
   * Tribe ID
   */
  tribeId: number;
  
  /**
   * Invite code
   */
  inviteCode: string;
}

/**
 * Parameters for managing a member
 */
export interface ManageMemberParams {
  /**
   * Tribe ID
   */
  tribeId: number;
  
  /**
   * Member address
   */
  memberAddress: string;
}

/**
 * Parameters for creating an invite code
 */
export interface CreateInviteCodeParams {
  /**
   * Tribe ID
   */
  tribeId: number;
  
  /**
   * Code string
   */
  code: string;
  
  /**
   * Maximum number of uses
   */
  maxUses: number;
  
  /**
   * Expiry time (Unix timestamp)
   */
  expiryTime?: number;
}

/**
 * Tribe details
 */
export interface TribeDetails {
  /**
   * Tribe ID
   */
  id: number;
  
  /**
   * Tribe name
   */
  name: string;
  
  /**
   * Tribe admin address
   */
  admin: string;
  
  /**
   * Tribe metadata
   */
  metadata: string;
  
  /**
   * Join type
   */
  joinType: JoinType;
  
  /**
   * Entry fee in wei
   */
  entryFee: bigint;
  
  /**
   * Member count
   */
  memberCount: number;
  
  /**
   * Creation time
   */
  creationTime: number;
  
  /**
   * NFT requirements
   */
  nftRequirements: NFTRequirement[];
  
  /**
   * Organization address that funds the tribe
   */
  organization?: string;
} 