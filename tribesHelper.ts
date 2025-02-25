import { ethers } from 'ethers';
import type { 
  RoleManager, 
  TribeController, 
  ProfileNFTMinter, 
  PostMinter, 
  PointSystem, 
  CollectibleController, 
  ProjectController 
} from '../typechain-types';

/**
 * Error types for better error handling
 */
export enum ErrorType {
  CONTRACT_ERROR = 'CONTRACT_ERROR',
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  UNAUTHORIZED = 'UNAUTHORIZED',
  COOLDOWN_ACTIVE = 'COOLDOWN_ACTIVE',
  ALREADY_EXISTS = 'ALREADY_EXISTS'
}

export interface TribesError {
  type: ErrorType;
  message: string;
  details?: any;
}

/**
 * Contract addresses - replace with your deployed contract addresses
 */
interface ContractAddresses {
  roleManager: string;
  profileNFTMinter: string;
  tribeController: string;
  pointSystem: string;
  collectibleController: string;
  postMinter: string;
  projectController: string;
}

/**
 * TribesHelper class for interacting with the Tribes by Astrix contracts
 */
export class TribesHelper {
  private provider: ethers.JsonRpcProvider;
  private signer: ethers.Signer | null = null;
  private addresses: ContractAddresses;

  // Contract instances
  private roleManager: RoleManager | null = null;
  private profileNFTMinter: ProfileNFTMinter | null = null;
  private tribeController: TribeController | null = null;
  private pointSystem: PointSystem | null = null;
  private collectibleController: CollectibleController | null = null;
  private postMinter: PostMinter | null = null;
  private projectController: ProjectController | null = null;

  constructor(provider: ethers.JsonRpcProvider, addresses: ContractAddresses) {
    this.provider = provider;
    this.addresses = addresses;
  }

  /**
   * Connect with a signer (wallet)
   * @param signer Ethers signer object
   */
  public async connect(signer: ethers.Signer): Promise<void> {
    try {
      this.signer = signer;
      await this.initContracts();
    } catch (error) {
      throw this.handleError(ErrorType.CONNECTION_ERROR, 'Failed to connect signer', error);
    }
  }

  /**
   * Initialize contract instances
   */
  private async initContracts(): Promise<void> {
    try {
      // Load contract ABIs
      const RoleManagerABI = await import('../artifacts/contracts/RoleManager.sol/RoleManager.json');
      const ProfileNFTMinterABI = await import('../artifacts/contracts/ProfileNFTMinter.sol/ProfileNFTMinter.json');
      const TribeControllerABI = await import('../artifacts/contracts/TribeController.sol/TribeController.json');
      const PointSystemABI = await import('../artifacts/contracts/PointSystem.sol/PointSystem.json');
      const CollectibleControllerABI = await import('../artifacts/contracts/CollectibleController.sol/CollectibleController.json');
      const PostMinterABI = await import('../artifacts/contracts/PostMinter.sol/PostMinter.json');
      const ProjectControllerABI = await import('../artifacts/contracts/ProjectController.sol/ProjectController.json');

      // Initialize contracts with signer
      if (this.signer) {
        this.roleManager = new ethers.Contract(
          this.addresses.roleManager,
          RoleManagerABI.abi,
          this.signer
        ) as unknown as RoleManager;

        this.profileNFTMinter = new ethers.Contract(
          this.addresses.profileNFTMinter,
          ProfileNFTMinterABI.abi,
          this.signer
        ) as unknown as ProfileNFTMinter;

        this.tribeController = new ethers.Contract(
          this.addresses.tribeController,
          TribeControllerABI.abi,
          this.signer
        ) as unknown as TribeController;

        this.pointSystem = new ethers.Contract(
          this.addresses.pointSystem,
          PointSystemABI.abi,
          this.signer
        ) as unknown as PointSystem;

        this.collectibleController = new ethers.Contract(
          this.addresses.collectibleController,
          CollectibleControllerABI.abi,
          this.signer
        ) as unknown as CollectibleController;

        this.postMinter = new ethers.Contract(
          this.addresses.postMinter,
          PostMinterABI.abi,
          this.signer
        ) as unknown as PostMinter;

        this.projectController = new ethers.Contract(
          this.addresses.projectController,
          ProjectControllerABI.abi,
          this.signer
        ) as unknown as ProjectController;
      }
    } catch (error) {
      throw this.handleError(ErrorType.CONNECTION_ERROR, 'Failed to initialize contracts', error);
    }
  }

  /**
   * Create standardized error objects
   */
  private handleError(type: ErrorType, message: string, error?: any): TribesError {
    console.error(`${type}: ${message}`, error);
    
    // Extract custom error information if available
    let details = error;
    if (error?.error?.error?.data) {
      try {
        // Try to decode custom error data from contract
        details = this.signer?.provider?.decodeError(error.error.error.data);
      } catch (e) {
        details = error;
      }
    }

    return {
      type,
      message,
      details
    };
  }

  /**********************
   * PROFILE MANAGEMENT *
   **********************/

  /**
   * Create a new user profile
   * @param username Unique username
   * @param metadata Profile metadata (JSON string)
   * @returns Profile ID
   */
  public async createProfile(username: string, metadata: string): Promise<number> {
    try {
      if (!this.profileNFTMinter || !this.signer) {
        throw new Error('Contracts not initialized or signer not connected');
      }

      // Validate username
      if (!this.validateUsername(username)) {
        throw this.handleError(
          ErrorType.VALIDATION_ERROR, 
          'Username must be 3-20 characters and contain only letters, numbers, and underscores'
        );
      }

      // Check if username is available
      const isAvailable = await this.profileNFTMinter.isUsernameAvailable(username);
      if (!isAvailable) {
        throw this.handleError(ErrorType.ALREADY_EXISTS, 'Username is already taken');
      }

      // Create profile
      const tx = await this.profileNFTMinter.createProfile(username, metadata);
      const receipt = await tx.wait();
      
      // Get tokenId from event
      const event = receipt?.logs.find(
        x => x instanceof ethers.EventLog && x.eventName === "ProfileCreated"
      ) as ethers.EventLog | undefined;
      
      if (!event) {
        throw this.handleError(ErrorType.CONTRACT_ERROR, 'Profile creation event not found');
      }
      
      return Number(event.args[0]);
    } catch (error) {
      if (error.type) return Promise.reject(error); // If it's already our error type
      throw this.handleError(ErrorType.CONTRACT_ERROR, 'Failed to create profile', error);
    }
  }

  /**
   * Update profile metadata
   * @param profileId Profile token ID
   * @param metadata New profile metadata
   */
  public async updateProfileMetadata(profileId: number, metadata: string): Promise<void> {
    try {
      if (!this.profileNFTMinter || !this.signer) {
        throw new Error('Contracts not initialized or signer not connected');
      }

      const tx = await this.profileNFTMinter.updateProfileMetadata(profileId, metadata);
      await tx.wait();
    } catch (error) {
      throw this.handleError(ErrorType.CONTRACT_ERROR, 'Failed to update profile', error);
    }
  }

  /**
   * Get profile data by ID
   * @param profileId Profile token ID
   */
  public async getProfile(profileId: number): Promise<{
    owner: string;
    username: string;
    metadata: string;
  }> {
    try {
      if (!this.profileNFTMinter) {
        throw new Error('Contracts not initialized');
      }

      const profile = await this.profileNFTMinter.getProfile(profileId);
      return {
        owner: profile.owner,
        username: profile.username,
        metadata: profile.metadata
      };
    } catch (error) {
      throw this.handleError(ErrorType.CONTRACT_ERROR, 'Failed to get profile', error);
    }
  }

  /**
   * Get profile ID by username
   * @param username Username to look up
   */
  public async getProfileIdByUsername(username: string): Promise<number> {
    try {
      if (!this.profileNFTMinter) {
        throw new Error('Contracts not initialized');
      }

      const profileId = await this.profileNFTMinter.getProfileIdByUsername(username);
      return Number(profileId);
    } catch (error) {
      throw this.handleError(ErrorType.CONTRACT_ERROR, 'Failed to get profile ID', error);
    }
  }

  /**
   * Check if a username is available
   * @param username Username to check
   */
  public async isUsernameAvailable(username: string): Promise<boolean> {
    try {
      if (!this.profileNFTMinter) {
        throw new Error('Contracts not initialized');
      }

      return await this.profileNFTMinter.isUsernameAvailable(username);
    } catch (error) {
      throw this.handleError(ErrorType.CONTRACT_ERROR, 'Failed to check username availability', error);
    }
  }

  /**
   * Validate username format
   * @param username Username to validate
   */
  private validateUsername(username: string): boolean {
    // Usernames must be 3-20 characters and only contain letters, numbers, and underscores
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    return usernameRegex.test(username);
  }

  /********************
   * TRIBE MANAGEMENT *
   ********************/

  /**
   * Create a new tribe
   * @param name Tribe name
   * @param metadata Tribe metadata (JSON string)
   * @param admins Array of admin addresses
   * @param joinType Tribe join type (0=PUBLIC, 1=PRIVATE, 2=INVITE_ONLY, etc.)
   * @param entryFee Entry fee in wei (for private tribes)
   * @param nftRequirements NFT requirements for joining
   * @returns Tribe ID
   */
  public async createTribe(
    name: string,
    metadata: string,
    admins: string[] = [],
    joinType: number = 0,
    entryFee: bigint = 0n,
    nftRequirements: any[] = []
  ): Promise<number> {
    try {
      if (!this.tribeController || !this.signer) {
        throw new Error('Contracts not initialized or signer not connected');
      }

      const tx = await this.tribeController.createTribe(
        name,
        metadata,
        admins,
        joinType,
        entryFee,
        nftRequirements
      );
      const receipt = await tx.wait();
      
      // Get tribeId from event
      const event = receipt?.logs.find(
        x => x instanceof ethers.EventLog && x.eventName === "TribeCreated"
      ) as ethers.EventLog | undefined;
      
      if (!event) {
        throw this.handleError(ErrorType.CONTRACT_ERROR, 'Tribe creation event not found');
      }
      
      return Number(event.args[0]);
    } catch (error) {
      throw this.handleError(ErrorType.CONTRACT_ERROR, 'Failed to create tribe', error);
    }
  }

  /**
   * Update tribe configuration
   * @param tribeId Tribe ID
   * @param joinType New join type
   * @param entryFee New entry fee
   * @param nftRequirements New NFT requirements
   */
  public async updateTribeConfig(
    tribeId: number,
    joinType: number,
    entryFee: bigint,
    nftRequirements: any[] = []
  ): Promise<void> {
    try {
      if (!this.tribeController || !this.signer) {
        throw new Error('Contracts not initialized or signer not connected');
      }

      const tx = await this.tribeController.updateTribeConfig(
        tribeId,
        joinType,
        entryFee,
        nftRequirements
      );
      await tx.wait();
    } catch (error) {
      throw this.handleError(ErrorType.CONTRACT_ERROR, 'Failed to update tribe configuration', error);
    }
  }

  /**
   * Update tribe metadata
   * @param tribeId Tribe ID
   * @param newMetadata New tribe metadata
   * @param updatedWhitelist Updated whitelist of addresses
   */
  public async updateTribe(
    tribeId: number,
    newMetadata: string,
    updatedWhitelist: string[] = []
  ): Promise<void> {
    try {
      if (!this.tribeController || !this.signer) {
        throw new Error('Contracts not initialized or signer not connected');
      }

      const tx = await this.tribeController.updateTribe(
        tribeId,
        newMetadata,
        updatedWhitelist
      );
      await tx.wait();
    } catch (error) {
      throw this.handleError(ErrorType.CONTRACT_ERROR, 'Failed to update tribe', error);
    }
  }

  /**
   * Join a public tribe
   * @param tribeId Tribe ID
   */
  public async joinTribe(tribeId: number): Promise<void> {
    try {
      if (!this.tribeController || !this.signer) {
        throw new Error('Contracts not initialized or signer not connected');
      }

      const tx = await this.tribeController.joinTribe(tribeId);
      await tx.wait();
    } catch (error) {
      throw this.handleError(ErrorType.CONTRACT_ERROR, 'Failed to join tribe', error);
    }
  }

  /**
   * Request to join a private tribe
   * @param tribeId Tribe ID
   * @param entryFee Entry fee to pay
   */
  public async requestToJoinTribe(tribeId: number, entryFee: bigint): Promise<void> {
    try {
      if (!this.tribeController || !this.signer) {
        throw new Error('Contracts not initialized or signer not connected');
      }

      const tx = await this.tribeController.requestToJoinTribe(tribeId, {
        value: entryFee
      });
      await tx.wait();
    } catch (error) {
      throw this.handleError(ErrorType.CONTRACT_ERROR, 'Failed to request joining tribe', error);
    }
  }

  /**
   * Join a tribe using an invite code
   * @param tribeId Tribe ID
   * @param inviteCode Invite code
   */
  public async joinTribeWithCode(tribeId: number, inviteCode: string): Promise<void> {
    try {
      if (!this.tribeController || !this.signer) {
        throw new Error('Contracts not initialized or signer not connected');
      }

      // Hash the invite code
      const codeHash = ethers.keccak256(ethers.toUtf8Bytes(inviteCode));
      const tx = await this.tribeController.joinTribeWithCode(tribeId, codeHash);
      await tx.wait();
    } catch (error) {
      throw this.handleError(ErrorType.CONTRACT_ERROR, 'Failed to join tribe with code', error);
    }
  }

  /**
   * Approve a pending member
   * @param tribeId Tribe ID
   * @param memberAddress Address of the member to approve
   */
  public async approveMember(tribeId: number, memberAddress: string): Promise<void> {
    try {
      if (!this.tribeController || !this.signer) {
        throw new Error('Contracts not initialized or signer not connected');
      }

      const tx = await this.tribeController.approveMember(tribeId, memberAddress);
      await tx.wait();
    } catch (error) {
      throw this.handleError(ErrorType.CONTRACT_ERROR, 'Failed to approve member', error);
    }
  }

  /**
   * Reject a pending member
   * @param tribeId Tribe ID
   * @param memberAddress Address of the member to reject
   */
  public async rejectMember(tribeId: number, memberAddress: string): Promise<void> {
    try {
      if (!this.tribeController || !this.signer) {
        throw new Error('Contracts not initialized or signer not connected');
      }

      const tx = await this.tribeController.rejectMember(tribeId, memberAddress);
      await tx.wait();
    } catch (error) {
      throw this.handleError(ErrorType.CONTRACT_ERROR, 'Failed to reject member', error);
    }
  }

  /**
   * Ban a member
   * @param tribeId Tribe ID
   * @param memberAddress Address of the member to ban
   */
  public async banMember(tribeId: number, memberAddress: string): Promise<void> {
    try {
      if (!this.tribeController || !this.signer) {
        throw new Error('Contracts not initialized or signer not connected');
      }

      const tx = await this.tribeController.banMember(tribeId, memberAddress);
      await tx.wait();
    } catch (error) {
      throw this.handleError(ErrorType.CONTRACT_ERROR, 'Failed to ban member', error);
    }
  }

  /**
   * Create an invite code for a tribe
   * @param tribeId Tribe ID
   * @param code Invite code
   * @param maxUses Maximum number of uses
   * @param expiryTime Expiration timestamp (0 for no expiry)
   */
  public async createInviteCode(
    tribeId: number,
    code: string,
    maxUses: number,
    expiryTime: number = 0
  ): Promise<void> {
    try {
      if (!this.tribeController || !this.signer) {
        throw new Error('Contracts not initialized or signer not connected');
      }

      const tx = await this.tribeController.createInviteCode(
        tribeId,
        code,
        maxUses,
        expiryTime
      );
      await tx.wait();
    } catch (error) {
      throw this.handleError(ErrorType.CONTRACT_ERROR, 'Failed to create invite code', error);
    }
  }

  /**
   * Get a member's status in a tribe
   * @param tribeId Tribe ID
   * @param memberAddress Member address
   * @returns Member status (0=NONE, 1=ACTIVE, 2=PENDING, 3=BANNED)
   */
  public async getMemberStatus(tribeId: number, memberAddress: string): Promise<number> {
    try {
      if (!this.tribeController) {
        throw new Error('Contracts not initialized');
      }

      const status = await this.tribeController.getMemberStatus(tribeId, memberAddress);
      return Number(status);
    } catch (error) {
      throw this.handleError(ErrorType.CONTRACT_ERROR, 'Failed to get member status', error);
    }
  }

  /**
   * Get tribe configuration
   * @param tribeId Tribe ID
   */
  public async getTribeConfig(tribeId: number): Promise<any> {
    try {
      if (!this.tribeController) {
        throw new Error('Contracts not initialized');
      }

      return await this.tribeController.getTribeConfigView(tribeId);
    } catch (error) {
      throw this.handleError(ErrorType.CONTRACT_ERROR, 'Failed to get tribe configuration', error);
    }
  }

  /**
   * Get all tribes a user is a member of
   * @param userAddress User address
   */
  public async getUserTribes(userAddress: string): Promise<number[]> {
    try {
      if (!this.tribeController) {
        throw new Error('Contracts not initialized');
      }

      const tribeIds = await this.tribeController.getUserTribes(userAddress);
      return tribeIds.map(id => Number(id));
    } catch (error) {
      throw this.handleError(ErrorType.CONTRACT_ERROR, 'Failed to get user tribes', error);
    }
  }

  /*******************
   * POST MANAGEMENT *
   *******************/

  /**
   * Create a post
   * @param tribeId Tribe ID
   * @param metadata Post metadata (JSON string)
   * @param isGated Whether the post is gated
   * @param collectibleContract Collectible contract address (for gated posts)
   * @param collectibleId Collectible ID (for gated posts)
   * @returns Post ID
   */
  public async createPost(
    tribeId: number,
    metadata: string,
    isGated: boolean = false,
    collectibleContract: string = ethers.ZeroAddress,
    collectibleId: number = 0
  ): Promise<number> {
    try {
      if (!this.postMinter || !this.signer) {
        throw new Error('Contracts not initialized or signer not connected');
      }

      // Check if user is a tribe member
      const address = await this.signer.getAddress();
      const memberStatus = await this.getMemberStatus(tribeId, address);
      if (memberStatus !== 1) { // Not active
        throw this.handleError(ErrorType.UNAUTHORIZED, 'Must be an active tribe member to post');
      }

      // Validate post type-specific requirements from metadata
      try {
        const parsedMetadata = JSON.parse(metadata);
        if (parsedMetadata.type === 'PROJECT' || parsedMetadata.type === 'PROJECT_UPDATE') {
          // Check if user has the PROJECT_CREATOR_ROLE role
          const roleHash = ethers.keccak256(ethers.toUtf8Bytes("PROJECT_CREATOR_ROLE"));
          const hasRole = await this.roleManager?.hasRole(roleHash, address);
          if (!hasRole) {
            throw this.handleError(ErrorType.UNAUTHORIZED, 'Must have PROJECT_CREATOR_ROLE to create project posts');
          }
        }
      } catch (parseError) {
        throw this.handleError(ErrorType.VALIDATION_ERROR, 'Invalid metadata format', parseError);
      }

      const tx = await this.postMinter.createPost(
        tribeId,
        metadata,
        isGated,
        collectibleContract,
        collectibleId
      );
      const receipt = await tx.wait();
      
      // Get postId from event
      const event = receipt?.logs.find(
        x => x instanceof ethers.EventLog && x.eventName === "PostCreated"
      ) as ethers.EventLog | undefined;
      
      if (!event) {
        throw this.handleError(ErrorType.CONTRACT_ERROR, 'Post creation event not found');
      }
      
      return Number(event.args[0]);
    } catch (error) {
      if (error.type) return Promise.reject(error); // If it's already our error type
      
      // Handle specific contract errors
      if (error.message?.includes('CooldownActive')) {
        throw this.handleError(ErrorType.COOLDOWN_ACTIVE, 'Post creation cooldown is active', error);
      }
      
      throw this.handleError(ErrorType.CONTRACT_ERROR, 'Failed to create post', error);
    }
  }

  /**
   * Create a project post
   * @param tribeId Tribe ID
   * @param projectData Project data
   * @returns Post ID and Project ID
   */
  public async createProjectPost(
    tribeId: number,
    projectData: {
      title: string;
      content: string;
      projectDetails: {
        totalBudget: string;
        startDate: number;
        duration: number;
        milestones: Array<{
          title: string;
          description: string;
          budget: string;
          deadline: number;
          dependencies: number[];
        }>;
      };
      team?: Array<{
        address: string;
        role: string;
        permissions: string[];
      }>;
    }
  ): Promise<{ postId: number, projectId: number }> {
    try {
      if (!this.postMinter || !this.projectController || !this.signer) {
        throw new Error('Contracts not initialized or signer not connected');
      }

      // Add type field to metadata
      const metadata = {
        ...projectData,
        type: 'PROJECT'
      };

      // Create post
      const postId = await this.createPost(
        tribeId,
        JSON.stringify(this.replaceBigInts(metadata)),
        false,
        ethers.ZeroAddress,
        0
      );

      // Validate and create project
      const tx = await this.projectController.validateAndCreateProject(postId);
      const receipt = await tx.wait();
      
      // Get projectId from event
      const event = receipt?.logs.find(
        x => x instanceof ethers.EventLog && x.eventName === "ProjectCreated"
      ) as ethers.EventLog | undefined;
      
      if (!event) {
        throw this.handleError(ErrorType.CONTRACT_ERROR, 'Project creation event not found');
      }
      
      const projectId = Number(event.args[0]);
      
      return { postId, projectId };
    } catch (error) {
      if (error.type) return Promise.reject(error); // If it's already our error type
      throw this.handleError(ErrorType.CONTRACT_ERROR, 'Failed to create project', error);
    }
  }

  /**
   * Create a project update post
   * @param tribeId Tribe ID
   * @param projectId ID of the original project
   * @param updateData Update data
   * @returns Post ID
   */
  public async createProjectUpdatePost(
    tribeId: number,
    projectId: number,
    updateData: {
      title: string;
      content: string;
      updateType: 'STATUS_UPDATE' | 'MILESTONE_UPDATE' | 'MILESTONE_SUBMISSION';
      milestoneIndex?: number;
      newStatus?: string;
      deliverables?: string;
    }
  ): Promise<number> {
    try {
      if (!this.postMinter || !this.projectController || !this.signer) {
        throw new Error('Contracts not initialized or signer not connected');
      }

      // Add type field and projectId to metadata
      const metadata = {
        ...updateData,
        type: 'PROJECT_UPDATE',
        projectPostId: projectId
      };

      // Create post
      const postId = await this.createPost(
        tribeId,
        JSON.stringify(this.replaceBigInts(metadata)),
        false,
        ethers.ZeroAddress,
        0
      );

      // Validate and create update
      const tx = await this.projectController.validateAndCreateUpdate(postId);
      await tx.wait();
      
      return postId;
    } catch (error) {
      if (error.type) return Promise.reject(error); // If it's already our error type
      throw this.handleError(ErrorType.CONTRACT_ERROR, 'Failed to create project update', error);
    }
  }

  /**
   * Create an encrypted post
   * @param tribeId Tribe ID
   * @param metadata Post metadata
   * @param encryptionKeyHash Hash of the encryption key
   * @param accessSigner Address of the signer who can grant access
   * @returns Post ID
   */
  public async createEncryptedPost(
    tribeId: number,
    metadata: string,
    encryptionKeyHash: string,
    accessSigner: string
  ): Promise<number> {
    try {
      if (!this.postMinter || !this.signer) {
        throw new Error('Contracts not initialized or signer not connected');
      }

      const tx = await this.postMinter.createEncryptedPost(
        tribeId,
        metadata,
        encryptionKeyHash,
        accessSigner
      );
      const receipt = await tx.wait();
      
      // Get postId from event
      const event = receipt?.logs.find(
        x => x instanceof ethers.EventLog && x.eventName === "EncryptedPostCreated"
      ) as ethers.EventLog | undefined;
      
      if (!event) {
        throw this.handleError(ErrorType.CONTRACT_ERROR, 'Encrypted post creation event not found');
      }
      
      return Number(event.args[0]);
    } catch (error) {
      throw this.handleError(ErrorType.CONTRACT_ERROR, 'Failed to create encrypted post', error);
    }
  }

  /**
   * Create a signature-gated post
   * @param tribeId Tribe ID
   * @param metadata Post metadata
   * @param encryptionKeyHash Hash of the encryption key
   * @param accessSigner Address of the signer who can grant access
   * @param collectibleContract Collectible contract address
   * @param collectibleId Collectible ID
   * @returns Post ID
   */
  public async createSignatureGatedPost(
    tribeId: number,
    metadata: string,
    encryptionKeyHash: string,
    accessSigner: string,
    collectibleContract: string,
    collectibleId: number
  ): Promise<number> {
    try {
      if (!this.postMinter || !this.signer) {
        throw new Error('Contracts not initialized or signer not connected');
      }

      const tx = await this.postMinter.createSignatureGatedPost(
        tribeId,
        metadata,
        encryptionKeyHash,
        accessSigner,
        collectibleContract,
        collectibleId
      );
      const receipt = await tx.wait();
      
      // Get postId from event
      const event = receipt?.logs.find(
        x => x instanceof ethers.EventLog && x.eventName === "SignatureGatedPostCreated"
      ) as ethers.EventLog | undefined;
      
      if (!event) {
        throw this.handleError(ErrorType.CONTRACT_ERROR, 'Signature-gated post creation event not found');
      }
      
      return Number(event.args[0]);
    } catch (error) {
      throw this.handleError(ErrorType.CONTRACT_ERROR, 'Failed to create signature-gated post', error);
    }
  }

  /**
   * Create a reply to an existing post
   * @param parentPostId Parent post ID
   * @param metadata Reply metadata
   * @param isGated Whether the reply is gated
   * @param collectibleContract Collectible contract address
   * @param collectibleId Collectible ID
   * @returns Post ID
   */
  public async createReply(
    parentPostId: number,
    metadata: string,
    isGated: boolean = false,
    collectibleContract: string = ethers.ZeroAddress,
    collectibleId: number = 0
  ): Promise<number> {
    try {
      if (!this.postMinter || !this.signer) {
        throw new Error('Contracts not initialized or signer not connected');
      }

      const tx = await this.postMinter.createReply(
        parentPostId,
        metadata,
        isGated,
        collectibleContract,
        collectibleId
      );
      const receipt = await tx.wait();
      
      // Get postId from event
      const event = receipt?.logs.find(
        x => x instanceof ethers.EventLog && x.eventName === "PostCreated"
      ) as ethers.EventLog | undefined;
      
      if (!event) {
        throw this.handleError(ErrorType.CONTRACT_ERROR, 'Reply creation event not found');
      }
      
      return Number(event.args[0]);
    } catch (error) {
      throw this.handleError(ErrorType.CONTRACT_ERROR, 'Failed to create reply', error);
    }
  }

  /**
   * Delete a post
   * @param postId Post ID
   */
  public async deletePost(postId: number): Promise<void> {
    try {
      if (!this.postMinter || !this.signer) {
        throw new Error('Contracts not initialized or signer not connected');
      }

      const tx = await this.postMinter.deletePost(postId);
      await tx.wait();
    } catch (error) {
      throw this.handleError(ErrorType.CONTRACT_ERROR, 'Failed to delete post', error);
    }
  }

  /**
   * Interact with a post (like, comment, etc.)
   * @param postId Post ID
   * @param interactionType Interaction type (0=LIKE, 1=COMMENT, etc.)
   */
  public async interactWithPost(postId: number, interactionType: number): Promise<void> {
    try {
      if (!this.postMinter || !this.signer) {
        throw new Error('Contracts not initialized or signer not connected');
      }

      const tx = await this.postMinter.interactWithPost(postId, interactionType);
      await tx.wait();
    } catch (error) {
      throw this.handleError(ErrorType.CONTRACT_ERROR, 'Failed to interact with post', error);
    }
  }

  /**
   * Get post info
   * @param postId Post ID
   */
  public async getPost(postId: number): Promise<{
    id: number;
    creator: string;
    tribeId: number;
    metadata: string;
    isGated: boolean;
    collectibleContract: string;
    collectibleId: number;
    isEncrypted: boolean;
    accessSigner: string;
  }> {
    try {
      if (!this.postMinter) {
        throw new Error('Contracts not initialized');
      }

      const post = await this.postMinter.getPost(postId);
      return {
        id: Number(post[0]),
        creator: post[1],
        tribeId: Number(post[2]),
        metadata: post[3],
        isGated: post[4],
        collectibleContract: post[5],
        collectibleId: Number(post[6]),
        isEncrypted: post[7],
        accessSigner: post[8]
      };
    } catch (error) {
      throw this.handleError(ErrorType.CONTRACT_ERROR, 'Failed to get post', error);
    }
  }

  /**
   * Check if a user can view a post
   * @param postId Post ID
   * @param viewer Viewer address
   */
  public async canViewPost(postId: number, viewer: string): Promise<boolean> {
    try {
      if (!this.postMinter) {
        throw new Error('Contracts not initialized');
      }

      return await this.postMinter.canViewPost(postId, viewer);
    } catch (error) {
      throw this.handleError(ErrorType.CONTRACT_ERROR, 'Failed to check post access', error);
    }
  }

  /**
   * Get posts by tribe
   * @param tribeId Tribe ID
   * @param offset Pagination offset
   * @param limit Pagination limit
   */
  public async getPostsByTribe(
    tribeId: number,
    offset: number = 0,
    limit: number = 10
  ): Promise<{ postIds: number[], total: number }> {
    try {
      if (!this.postMinter) {
        throw new Error('Contracts not initialized');
      }

      const [postIds, total] = await this.postMinter.getPostsByTribe(tribeId, offset, limit);
      
      return {
        postIds: postIds.map((id: bigint) => Number(id)),
        total: Number(total)
      };
    } catch (error) {
      throw this.handleError(ErrorType.CONTRACT_ERROR, 'Failed to get tribe posts', error);
    }
  }

  /**
   * Get posts by user
   * @param userAddress User address
   * @param offset Pagination offset
   * @param limit Pagination limit
   */
  public async getPostsByUser(
    userAddress: string,
    offset: number = 0,
    limit: number = 10
  ): Promise<{ postIds: number[], total: number }> {
    try {
      if (!this.postMinter) {
        throw new Error('Contracts not initialized');
      }

      const [postIds, total] = await this.postMinter.getPostsByUser(userAddress, offset, limit);
      
      return {
        postIds: postIds.map((id: bigint) => Number(id)),
        total: Number(total)
      };
    } catch (error) {
      throw this.handleError(ErrorType.CONTRACT_ERROR, 'Failed to get user posts', error);
    }
  }

  /**
   * Get post interaction count
   * @param postId Post ID
   * @param interactionType Interaction type (0=LIKE, 1=COMMENT, etc.)
   */
  public async getInteractionCount(postId: number, interactionType: number): Promise<number> {
    try {
      if (!this.postMinter) {
        throw new Error('Contracts not initialized');
      }

      const count = await this.postMinter.getInteractionCount(postId, interactionType);
      return Number(count);
    } catch (error) {
      throw this.handleError(ErrorType.CONTRACT_ERROR, 'Failed to get interaction count', error);
    }
  }

  /********************
   * POINTS & REWARDS *
   ********************/

  /**
   * Create a tribe token
   * @param tribeId Tribe ID
   * @param name Token name
   * @param symbol Token symbol
   */
  public async createTribeToken(tribeId: number, name: string, symbol: string): Promise<void> {
    try {
      if (!this.pointSystem || !this.signer) {
        throw new Error('Contracts not initialized or signer not connected');
      }

      const tx = await this.pointSystem.createTribeToken(tribeId, name, symbol);
      await tx.wait();
    } catch (error) {
      throw this.handleError(ErrorType.CONTRACT_ERROR, 'Failed to create tribe token', error);
    }
  }

  /**
   * Set points for an action type
   * @param tribeId Tribe ID
   * @param actionType Action type (bytes32 string)
   * @param points Points value
   */
  public async setActionPoints(
    tribeId: number,
    actionType: string,
    points: number
  ): Promise<void> {
    try {
      if (!this.pointSystem || !this.signer) {
        throw new Error('Contracts not initialized or signer not connected');
      }

      // Convert string to bytes32
      const actionTypeBytes = ethers.keccak256(ethers.toUtf8Bytes(actionType));
      
      const tx = await this.pointSystem.setActionPoints(tribeId, actionTypeBytes, points);
      await tx.wait();
    } catch (error) {
      throw this.handleError(ErrorType.CONTRACT_ERROR, 'Failed to set action points', error);
    }
  }

  /**
   * Award points to a member
   * @param tribeId Tribe ID
   * @param member Member address
   * @param points Points to award
   * @param actionType Action type (bytes32 string)
   */
  public async awardPoints(
    tribeId: number,
    member: string,
    points: number,
    actionType: string
  ): Promise<void> {
    try {
      if (!this.pointSystem || !this.signer) {
        throw new Error('Contracts not initialized or signer not connected');
      }

      // Convert string to bytes32
      const actionTypeBytes = ethers.keccak256(ethers.toUtf8Bytes(actionType));
      
      const tx = await this.pointSystem.awardPoints(tribeId, member, points, actionTypeBytes);
      await tx.wait();
    } catch (error) {
      throw this.handleError(ErrorType.CONTRACT_ERROR, 'Failed to award points', error);
    }
  }

  /**
   * Record an action for a member (awards points if configured)
   * @param tribeId Tribe ID
   * @param member Member address
   * @param actionType Action type (bytes32 string)
   */
  public async recordAction(
    tribeId: number,
    member: string,
    actionType: string
  ): Promise<void> {
    try {
      if (!this.pointSystem || !this.signer) {
        throw new Error('Contracts not initialized or signer not connected');
      }

      // Convert string to bytes32
      const actionTypeBytes = ethers.keccak256(ethers.toUtf8Bytes(actionType));
      
      const tx = await this.pointSystem.recordAction(tribeId, member, actionTypeBytes);
      await tx.wait();
    } catch (error) {
      throw this.handleError(ErrorType.CONTRACT_ERROR, 'Failed to record action', error);
    }
  }

  /**
   * Get member points
   * @param tribeId Tribe ID
   * @param member Member address
   */
  public async getMemberPoints(tribeId: number, member: string): Promise<number> {
    try {
      if (!this.pointSystem) {
        throw new Error('Contracts not initialized');
      }

      const points = await this.pointSystem.getMemberPoints(tribeId, member);
      return Number(points);
    } catch (error) {
      throw this.handleError(ErrorType.CONTRACT_ERROR, 'Failed to get member points', error);
    }
  }

  /************************
   * COLLECTIBLE MANAGEMENT *
   ************************/

  /**
   * Create a collectible
   * @param tribeId Tribe ID
   * @param name Collectible name
   * @param symbol Collectible symbol
   * @param metadataURI Metadata URI
   * @param maxSupply Maximum supply
   * @param price Price in wei
   * @param pointsRequired Points required to claim
   * @returns Collectible ID
   */
  public async createCollectible(
    tribeId: number,
    name: string,
    symbol: string,
    metadataURI: string,
    maxSupply: number,
    price: bigint = 0n,
    pointsRequired: number = 0
  ): Promise<number> {
    try {
      if (!this.collectibleController || !this.signer) {
        throw new Error('Contracts not initialized or signer not connected');
      }

      const tx = await this.collectibleController.createCollectible(
        tribeId,
        name,
        symbol,
        metadataURI,
        maxSupply,
        price,
        pointsRequired
      );
      const receipt = await tx.wait();
      
      // Get collectibleId from event
      const event = receipt?.logs.find(
        x => x instanceof ethers.EventLog && x.eventName === "CollectibleCreated"
      ) as ethers.EventLog | undefined;
      
      if (!event) {
        throw this.handleError(ErrorType.CONTRACT_ERROR, 'Collectible creation event not found');
      }
      
      return Number(event.args[0]);
    } catch (error) {
      throw this.handleError(ErrorType.CONTRACT_ERROR, 'Failed to create collectible', error);
    }
  }

  /**
   * Claim a collectible
   * @param tribeId Tribe ID
   * @param collectibleId Collectible ID
   * @param price Price to pay (in wei)
   */
  public async claimCollectible(
    tribeId: number,
    collectibleId: number,
    price: bigint = 0n
  ): Promise<void> {
    try {
      if (!this.collectibleController || !this.signer) {
        throw new Error('Contracts not initialized or signer not connected');
      }

      const tx = await this.collectibleController.claimCollectible(tribeId, collectibleId, {
        value: price
      });
      await tx.wait();
    } catch (error) {
      throw this.handleError(ErrorType.CONTRACT_ERROR, 'Failed to claim collectible', error);
    }
  }

  /**
   * Get collectible details
   * @param collectibleId Collectible ID
   */
  public async getCollectible(collectibleId: number): Promise<{
    name: string;
    symbol: string;
    metadataURI: string;
    maxSupply: number;
    currentSupply: number;
    price: bigint;
    pointsRequired: number;
    isActive: boolean;
  }> {
    try {
      if (!this.collectibleController) {
        throw new Error('Contracts not initialized');
      }

      const collectible = await this.collectibleController.getCollectible(collectibleId);
      return {
        name: collectible.name,
        symbol: collectible.symbol,
        metadataURI: collectible.metadataURI,
        maxSupply: Number(collectible.maxSupply),
        currentSupply: Number(collectible.currentSupply),
        price: collectible.price,
        pointsRequired: Number(collectible.pointsRequired),
        isActive: collectible.isActive
      };
    } catch (error) {
      throw this.handleError(ErrorType.CONTRACT_ERROR, 'Failed to get collectible details', error);
    }
  }

  /**
   * Helper function to replace BigInt values in an object with strings
   * @param obj Object potentially containing BigInt values
   * @returns Object with BigInt values converted to strings
   */
  private replaceBigInts(obj: any): any {
    if (typeof obj !== 'object' || obj === null) return obj;
    if (typeof obj === 'bigint') return obj.toString();
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.replaceBigInts(item));
    }
    
    const newObj: any = {};
    for (const key in obj) {
      const value = obj[key];
      if (typeof value === 'bigint') {
        newObj[key] = value.toString();
      } else if (typeof value === 'object' && value !== null) {
        newObj[key] = this.replaceBigInts(value);
      } else {
        newObj[key] = value;
      }
    }
    return newObj;
  }
}
