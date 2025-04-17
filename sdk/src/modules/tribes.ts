import { ethers } from 'ethers';
import { BaseModule } from '../core/BaseModule';
import { ErrorType } from '../types/core';
import { 
  CreateTribeParams, 
  UpdateTribeParams,
  UpdateTribeConfigParams,
  JoinTribeParams,
  RequestToJoinTribeParams,
  JoinTribeWithCodeParams,
  ManageMemberParams,
  CreateInviteCodeParams,
  TribeDetails,
  JoinType,
  MemberStatus,
} from '../types/tribes';
import { validateAddress, validateNonEmptyString, validatePositiveBigInt } from '../utils/validation';

// Import TribeController ABI
import TribeControllerABI from '../../abis/TribeController.json';

/**
 * Module for managing tribes and tribe membership
 */
export class TribesModule extends BaseModule {
  /**
   * Get the TribeController contract
   * @param useSigner Whether to use the signer
   */
  private getTribeControllerContract(useSigner: boolean = false) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.// eslint-disable-next-line @typescript-eslint/no-explicit-any
  getContract<any>(
      this.config.contracts.tribeController,
      TribeControllerABI,
      useSigner
    );
  }

  /**
   * Create a new tribe
   * @param params Tribe creation parameters
   * @returns Tribe ID of the newly created tribe
   */
  public async createTribe(params: CreateTribeParams): Promise<number> {
    try {
      // Validate input
      validateNonEmptyString(params.name, 'name');
      validateNonEmptyString(params.metadata, 'metadata');
      
      if (params.admins) {
        params.admins.forEach((admin, index) => {
          validateAddress(admin, `admins[${index}]`);
        });
      }
      
      if (params.entryFee) {
        validatePositiveBigInt(params.entryFee, 'entryFee');
      }

      const tribeController = this.getTribeControllerContract(true);
      const tx = await tribeController.createTribe(
        params.name,
        params.metadata,
        params.admins || [],
        params.joinType !== undefined ? params.joinType : JoinType.PUBLIC,
        params.entryFee || 0n,
        params.nftRequirements || []
      );
      const receipt = await tx.wait();
      
      // Extract tribeId from event
      const event = receipt.logs.find((log: any) => {
        return log instanceof ethers.EventLog && log.eventName === "TribeCreated";
      }) as ethers.EventLog | undefined;
      
      if (!event) {
        throw new Error('Tribe creation event not found');
      }
      
      const tribeId = Number(event.args[0]);
      
      this.log(`Created tribe`, {
        tribeId,
        name: params.name,
        txHash: receipt.hash
      });
      
      return tribeId;
    } catch (error) {
      return this.handleError(
        error,
        'Failed to create tribe',
        ErrorType.CONTRACT_ERROR
      );
    }
  }

  /**
   * Update tribe configuration
   * @param params Tribe configuration update parameters
   * @returns Transaction hash
   */
  public async updateTribeConfig(params: UpdateTribeConfigParams): Promise<string> {
    try {
      if (params.entryFee) {
        validatePositiveBigInt(params.entryFee, 'entryFee');
      }
      
      const tribeController = this.getTribeControllerContract(true);
      const tx = await tribeController.updateTribeConfig(
        params.tribeId,
        params.joinType,
        params.entryFee,
        params.nftRequirements || []
      );
      const receipt = await tx.wait();
      
      this.log(`Updated tribe configuration`, {
        tribeId: params.tribeId,
        joinType: params.joinType,
        entryFee: params.entryFee?.toString(),
        txHash: receipt.hash
      });
      
      return receipt.hash;
    } catch (error) {
      return this.handleError(
        error,
        'Failed to update tribe configuration',
        ErrorType.CONTRACT_ERROR
      );
    }
  }

  /**
   * Update tribe metadata and whitelist
   * @param params Tribe update parameters
   * @returns Transaction hash
   */
  public async updateTribe(params: UpdateTribeParams): Promise<string> {
    try {
      validateNonEmptyString(params.newMetadata, 'newMetadata');
      
      if (params.updatedWhitelist) {
        params.updatedWhitelist.forEach((address, index) => {
          validateAddress(address, `updatedWhitelist[${index}]`);
        });
      }
      
      const tribeController = this.getTribeControllerContract(true);
      const tx = await tribeController.updateTribe(
        params.tribeId,
        params.newMetadata,
        params.updatedWhitelist || []
      );
      const receipt = await tx.wait();
      
      this.log(`Updated tribe`, {
        tribeId: params.tribeId,
        txHash: receipt.hash
      });
      
      return receipt.hash;
    } catch (error) {
      return this.handleError(
        error,
        'Failed to update tribe',
        ErrorType.CONTRACT_ERROR
      );
    }
  }

  /**
   * Join a tribe
   * @param params Join tribe parameters
   * @returns Transaction hash
   */
  public async joinTribe(params: JoinTribeParams): Promise<string> {
    try {
      const tribeController = this.getTribeControllerContract(true);
      const tx = await tribeController.joinTribe(params.tribeId);
      const receipt = await tx.wait();
      
      this.log(`Joined tribe`, {
        tribeId: params.tribeId,
        txHash: receipt.hash
      });
      
      return receipt.hash;
    } catch (error) {
      return this.handleError(
        error,
        'Failed to join tribe',
        ErrorType.CONTRACT_ERROR
      );
    }
  }

  /**
   * Request to join a private tribe
   * @param params Request to join parameters
   * @returns Transaction hash
   */
  public async requestToJoinTribe(params: RequestToJoinTribeParams): Promise<string> {
    try {
      if (params.entryFee) {
        validatePositiveBigInt(params.entryFee, 'entryFee');
      }
      
      const tribeController = this.getTribeControllerContract(true);
      const tx = await tribeController.requestToJoinTribe(
        params.tribeId,
        { value: params.entryFee || 0n }
      );
      const receipt = await tx.wait();
      
      this.log(`Requested to join tribe`, {
        tribeId: params.tribeId,
        entryFee: params.entryFee?.toString(),
        txHash: receipt.hash
      });
      
      return receipt.hash;
    } catch (error) {
      return this.handleError(
        error,
        'Failed to request to join tribe',
        ErrorType.CONTRACT_ERROR
      );
    }
  }

  /**
   * Join a tribe using an invite code
   * @param params Join with code parameters
   * @returns Transaction hash
   */
  public async joinTribeWithCode(params: JoinTribeWithCodeParams): Promise<string> {
    try {
      validateNonEmptyString(params.inviteCode, 'inviteCode');
      
      const tribeController = this.getTribeControllerContract(true);
      const tx = await tribeController.joinTribeWithCode(
        params.tribeId,
        params.inviteCode
      );
      const receipt = await tx.wait();
      
      this.log(`Joined tribe with code`, {
        tribeId: params.tribeId,
        txHash: receipt.hash
      });
      
      return receipt.hash;
    } catch (error) {
      return this.handleError(
        error,
        'Failed to join tribe with code',
        ErrorType.CONTRACT_ERROR
      );
    }
  }

  /**
   * Approve a member's request to join
   * @param params Manage member parameters
   * @returns Transaction hash
   */
  public async approveMember(params: ManageMemberParams): Promise<string> {
    try {
      validateAddress(params.memberAddress, 'memberAddress');
      
      const tribeController = this.getTribeControllerContract(true);
      const tx = await tribeController.approveMember(
        params.tribeId,
        params.memberAddress
      );
      const receipt = await tx.wait();
      
      this.log(`Approved member`, {
        tribeId: params.tribeId,
        member: params.memberAddress,
        txHash: receipt.hash
      });
      
      return receipt.hash;
    } catch (error) {
      return this.handleError(
        error,
        'Failed to approve member',
        ErrorType.CONTRACT_ERROR
      );
    }
  }

  /**
   * Remove a member from a tribe
   * @param params Manage member parameters
   * @returns Transaction hash
   */
  public async removeMember(params: ManageMemberParams): Promise<string> {
    try {
      validateAddress(params.memberAddress, 'memberAddress');
      
      const tribeController = this.getTribeControllerContract(true);
      const tx = await tribeController.removeMember(
        params.tribeId,
        params.memberAddress
      );
      const receipt = await tx.wait();
      
      this.log(`Removed member`, {
        tribeId: params.tribeId,
        member: params.memberAddress,
        txHash: receipt.hash
      });
      
      return receipt.hash;
    } catch (error) {
      return this.handleError(
        error,
        'Failed to remove member',
        ErrorType.CONTRACT_ERROR
      );
    }
  }

  /**
   * Ban a member from a tribe
   * @param params Manage member parameters
   * @returns Transaction hash
   */
  public async banMember(params: ManageMemberParams): Promise<string> {
    try {
      validateAddress(params.memberAddress, 'memberAddress');
      
      const tribeController = this.getTribeControllerContract(true);
      const tx = await tribeController.banMember(
        params.tribeId,
        params.memberAddress
      );
      const receipt = await tx.wait();
      
      this.log(`Banned member`, {
        tribeId: params.tribeId,
        member: params.memberAddress,
        txHash: receipt.hash
      });
      
      return receipt.hash;
    } catch (error) {
      return this.handleError(
        error,
        'Failed to ban member',
        ErrorType.CONTRACT_ERROR
      );
    }
  }

  /**
   * Create an invite code for a tribe
   * @param params Create invite code parameters
   * @returns Transaction hash
   */
  public async createInviteCode(params: CreateInviteCodeParams): Promise<string> {
    try {
      validateNonEmptyString(params.code, 'code');
      
      const tribeController = this.getTribeControllerContract(true);
      const tx = await tribeController.createInviteCode(
        params.tribeId,
        params.code,
        params.maxUses,
        params.expiryTime || 0
      );
      const receipt = await tx.wait();
      
      this.log(`Created invite code`, {
        tribeId: params.tribeId,
        code: params.code,
        maxUses: params.maxUses,
        expiryTime: params.expiryTime,
        txHash: receipt.hash
      });
      
      return receipt.hash;
    } catch (error) {
      return this.handleError(
        error,
        'Failed to create invite code',
        ErrorType.CONTRACT_ERROR
      );
    }
  }

  /**
   * Get tribe details
   * @param tribeId Tribe ID
   * @returns Tribe details object
   */
  public async getTribeDetails(tribeId: number): Promise<TribeDetails> {
    try {
      const tribeController = this.getTribeControllerContract();
      const tribeData = await tribeController.getTribe(tribeId);
      
      return {
        id: tribeId,
        name: tribeData.name,
        admin: tribeData.admin,
        metadata: tribeData.metadata,
        joinType: tribeData.joinType,
        entryFee: tribeData.entryFee,
        memberCount: Number(tribeData.memberCount),
        creationTime: Number(tribeData.creationTime),
        nftRequirements: tribeData.nftRequirements,
        organization: tribeData.organization || undefined
      };
    } catch (error) {
      return this.handleError(
        error,
        'Failed to get tribe details',
        ErrorType.CONTRACT_ERROR
      );
    }
  }

  /**
   * Check if an address is a member of a tribe
   * @param tribeId Tribe ID
   * @param address Address to check
   * @returns Member status
   */
  public async getMemberStatus(tribeId: number, address: string): Promise<MemberStatus> {
    try {
      validateAddress(address, 'address');
      
      const tribeController = this.getTribeControllerContract();
      const status = await tribeController.getMemberStatus(tribeId, address);
      
      return status;
    } catch (error) {
      return this.handleError(
        error,
        'Failed to get member status',
        ErrorType.CONTRACT_ERROR
      );
    }
  }

  /**
   * Get all members of a tribe
   * @param tribeId Tribe ID
   * @returns Array of member addresses
   */
  public async getMembers(tribeId: number): Promise<string[]> {
    try {
      const tribeController = this.getTribeControllerContract();
      const members = await tribeController.getMembers(tribeId);
      
      return members;
    } catch (error) {
      return this.handleError(
        error,
        'Failed to get tribe members',
        ErrorType.CONTRACT_ERROR
      );
    }
  }

  /**
   * Get all tribes a user is a member of
   * @param address User address
   * @returns Array of tribe IDs
   */
  public async getUserTribes(address: string): Promise<number[]> {
    try {
      validateAddress(address, 'address');
      
      const tribeController = this.getTribeControllerContract();
      const tribes = await tribeController.getUserTribes(address);
      
      return tribes.map((tribeId: any) => Number(tribeId));
    } catch (error) {
      return this.handleError(
        error,
        'Failed to get user tribes',
        ErrorType.CONTRACT_ERROR
      );
    }
  }

  /**
   * Check if an invite code is valid
   * @param tribeId Tribe ID
   * @param code Invite code
   * @returns True if the code is valid
   */
  public async isInviteCodeValid(tribeId: number, code: string): Promise<boolean> {
    try {
      validateNonEmptyString(code, 'code');
      
      const tribeController = this.getTribeControllerContract();
      return await tribeController.isInviteCodeValid(tribeId, code);
    } catch (error) {
      return this.handleError(
        error,
        'Failed to check invite code validity',
        ErrorType.CONTRACT_ERROR
      );
    }
  }

  /**
   * Get all tribes
   * @returns Array of tribe IDs
   */
  public async getAllTribes(): Promise<number[]> {
    try {
      const tribeController = this.getTribeControllerContract();
      const tribes = await tribeController.getAllTribes();
      
      return tribes.map((tribeId: any) => Number(tribeId));
    } catch (error) {
      return this.handleError(
        error,
        'Failed to get all tribes',
        ErrorType.CONTRACT_ERROR
      );
    }
  }
} 