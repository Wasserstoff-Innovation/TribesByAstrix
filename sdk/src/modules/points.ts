import { ethers } from 'ethers';
import { BaseModule } from '../core/BaseModule';
import { ErrorType } from '../types/core';
// AstrixSDKError is used indirectly through this.handleError
import {
  ActionType,
  AwardPointsParams,
  BatchAwardPointsParams,
  CreateTribeTokenParams,
  DeductPointsParams,
  ExchangeTokensParams,
  RecordActionParams,
  SetActionPointsParams,
  SetExchangeRateParams,
  SetTribeOrganizationParams,
  TopMemberResponse
} from '../types/points';

// Import ABI
import AstrixPointSystemABI from '../../abis/AstrixPointSystem.json';

/**
 * Module for interacting with the point system
 */
export class PointsModule extends BaseModule {
  /**
   * Get the point system contract
   * @param useSigner Whether to use the signer
   */
  private getPointSystemContract(useSigner: boolean = false) {
    return this.// eslint-disable-next-line @typescript-eslint/no-explicit-any
  getContract<any>(
      this.config.contracts.astrixPointSystem,
      AstrixPointSystemABI,
      useSigner
    );
  }

  /**
   * Set the organization that will fund points for a tribe
   * @param params Parameters for setting the tribe organization
   */
  public async setTribeOrganization(
    params: SetTribeOrganizationParams
  ): Promise<string> {
    try {
      const pointSystem = this.getPointSystemContract(true);
      const tx = await pointSystem.setTribeOrganization(
        params.tribeId,
        params.organization
      );
      const receipt = await tx.wait();

      this.log(`Set tribe organization`, {
        tribeId: params.tribeId,
        organization: params.organization,
        txHash: receipt.hash
      });

      return receipt.hash;
    } catch (error) {
      return this.handleError(
        error,
        'Failed to set tribe organization',
        ErrorType.CONTRACT_ERROR
      );
    }
  }

  /**
   * Set the exchange rate for a tribe
   * @param params Parameters for setting the exchange rate
   */
  public async setExchangeRate(params: SetExchangeRateParams): Promise<string> {
    try {
      const pointSystem = this.getPointSystemContract(true);
      const tx = await pointSystem.setExchangeRate(
        params.tribeId,
        params.rate
      );
      const receipt = await tx.wait();

      this.log(`Set exchange rate`, {
        tribeId: params.tribeId,
        rate: params.rate,
        txHash: receipt.hash
      });

      return receipt.hash;
    } catch (error) {
      return this.handleError(
        error,
        'Failed to set exchange rate',
        ErrorType.CONTRACT_ERROR
      );
    }
  }

  /**
   * Create a new tribe token
   * @param params Parameters for creating a tribe token
   */
  public async createTribeToken(
    params: CreateTribeTokenParams
  ): Promise<string> {
    try {
      const pointSystem = this.getPointSystemContract(true);
      const tx = await pointSystem.createTribeToken(
        params.tribeId,
        params.name,
        params.symbol
      );
      const receipt = await tx.wait();

      this.log(`Created tribe token`, {
        tribeId: params.tribeId,
        name: params.name,
        symbol: params.symbol,
        txHash: receipt.hash
      });

      return receipt.hash;
    } catch (error) {
      return this.handleError(
        error,
        'Failed to create tribe token',
        ErrorType.CONTRACT_ERROR
      );
    }
  }

  /**
   * Set points for an action type
   * @param params Parameters for setting action points
   */
  public async setActionPoints(
    params: SetActionPointsParams
  ): Promise<string> {
    try {
      const pointSystem = this.getPointSystemContract(true);
      
      // Convert action type to bytes32 if it's a string from the enum
      let actionType: string;
      if (typeof params.actionType === 'string') {
        actionType = ethers.keccak256(ethers.toUtf8Bytes(params.actionType));
      } else {
        actionType = ethers.keccak256(ethers.toUtf8Bytes(params.actionType));
      }

      const tx = await pointSystem.setActionPoints(
        params.tribeId,
        actionType,
        params.points
      );
      const receipt = await tx.wait();

      this.log(`Set action points`, {
        tribeId: params.tribeId,
        actionType: params.actionType,
        points: params.points,
        txHash: receipt.hash
      });

      return receipt.hash;
    } catch (error) {
      return this.handleError(
        error,
        'Failed to set action points',
        ErrorType.CONTRACT_ERROR
      );
    }
  }

  /**
   * Award points to a member
   * @param params Parameters for awarding points
   */
  public async awardPoints(params: AwardPointsParams): Promise<string> {
    try {
      const pointSystem = this.getPointSystemContract(true);
      
      // Convert action type to bytes32 if it's a string from the enum
      let actionType: string;
      if (typeof params.actionType === 'string') {
        actionType = ethers.keccak256(ethers.toUtf8Bytes(params.actionType));
      } else {
        actionType = ethers.keccak256(ethers.toUtf8Bytes(params.actionType));
      }

      const tx = await pointSystem.awardPoints(
        params.tribeId,
        params.member,
        params.points,
        actionType
      );
      const receipt = await tx.wait();

      this.log(`Awarded points`, {
        tribeId: params.tribeId,
        member: params.member,
        points: params.points,
        actionType: params.actionType,
        txHash: receipt.hash
      });

      return receipt.hash;
    } catch (error) {
      return this.handleError(
        error,
        'Failed to award points',
        ErrorType.CONTRACT_ERROR
      );
    }
  }

  /**
   * Deduct points from a member
   * @param params Parameters for deducting points
   */
  public async deductPoints(params: DeductPointsParams): Promise<string> {
    try {
      const pointSystem = this.getPointSystemContract(true);
      const tx = await pointSystem.deductPoints(
        params.tribeId,
        params.member,
        params.points,
        params.reason
      );
      const receipt = await tx.wait();

      this.log(`Deducted points`, {
        tribeId: params.tribeId,
        member: params.member,
        points: params.points,
        reason: params.reason,
        txHash: receipt.hash
      });

      return receipt.hash;
    } catch (error) {
      return this.handleError(
        error,
        'Failed to deduct points',
        ErrorType.CONTRACT_ERROR
      );
    }
  }

  /**
   * Record an action performed by a member
   * @param params Parameters for recording an action
   */
  public async recordAction(params: RecordActionParams): Promise<string> {
    try {
      const pointSystem = this.getPointSystemContract(true);
      
      // Convert action type to bytes32 if it's a string from the enum
      let actionType: string;
      if (typeof params.actionType === 'string') {
        actionType = ethers.keccak256(ethers.toUtf8Bytes(params.actionType));
      } else {
        actionType = ethers.keccak256(ethers.toUtf8Bytes(params.actionType));
      }

      const tx = await pointSystem.recordAction(
        params.tribeId,
        params.member,
        actionType
      );
      const receipt = await tx.wait();

      this.log(`Recorded action`, {
        tribeId: params.tribeId,
        member: params.member,
        actionType: params.actionType,
        txHash: receipt.hash
      });

      return receipt.hash;
    } catch (error) {
      return this.handleError(
        error,
        'Failed to record action',
        ErrorType.CONTRACT_ERROR
      );
    }
  }

  /**
   * Award points to multiple members
   * @param params Parameters for batch awarding points
   */
  public async batchAwardPoints(
    params: BatchAwardPointsParams
  ): Promise<string> {
    try {
      const pointSystem = this.getPointSystemContract(true);
      
      // Convert action type to bytes32 if it's a string from the enum
      let actionType: string;
      if (typeof params.actionType === 'string') {
        actionType = ethers.keccak256(ethers.toUtf8Bytes(params.actionType));
      } else {
        actionType = ethers.keccak256(ethers.toUtf8Bytes(params.actionType));
      }

      const tx = await pointSystem.batchAwardPoints(
        params.tribeId,
        params.members,
        params.points,
        actionType
      );
      const receipt = await tx.wait();

      this.log(`Batch awarded points`, {
        tribeId: params.tribeId,
        memberCount: params.members.length,
        points: params.points,
        actionType: params.actionType,
        txHash: receipt.hash
      });

      return receipt.hash;
    } catch (error) {
      return this.handleError(
        error,
        'Failed to batch award points',
        ErrorType.CONTRACT_ERROR
      );
    }
  }

  /**
   * Exchange Astrix tokens for tribe tokens
   * @param params Parameters for exchanging tokens
   */
  public async exchangeTokens(params: ExchangeTokensParams): Promise<string> {
    try {
      const pointSystem = this.getPointSystemContract(true);
      const tx = await pointSystem.exchangeAstrixForTribeTokens(
        params.tribeId,
        params.astrixAmount
      );
      const receipt = await tx.wait();

      this.log(`Exchanged tokens`, {
        tribeId: params.tribeId,
        astrixAmount: params.astrixAmount.toString(),
        txHash: receipt.hash
      });

      return receipt.hash;
    } catch (error) {
      return this.handleError(
        error,
        'Failed to exchange tokens',
        ErrorType.CONTRACT_ERROR
      );
    }
  }

  /**
   * Get a member's point balance
   * @param tribeId Tribe ID
   * @param member Member address
   */
  public async getMemberPoints(
    tribeId: number,
    member: string
  ): Promise<number> {
    try {
      const pointSystem = this.getPointSystemContract();
      const points = await pointSystem.getMemberPoints(tribeId, member);
      return Number(points);
    } catch (error) {
      return this.handleError(
        error,
        'Failed to get member points',
        ErrorType.CONTRACT_ERROR
      );
    }
  }

  /**
   * Get the points value for an action
   * @param tribeId Tribe ID
   * @param actionType Action type
   */
  public async getActionPoints(
    tribeId: number,
    actionType: ActionType | string
  ): Promise<number> {
    try {
      const pointSystem = this.getPointSystemContract();
      
      // Convert action type to bytes32 if it's a string from the enum
      let actionTypeBytes: string;
      if (typeof actionType === 'string') {
        actionTypeBytes = ethers.keccak256(ethers.toUtf8Bytes(actionType));
      } else {
        actionTypeBytes = ethers.keccak256(ethers.toUtf8Bytes(actionType));
      }

      const points = await pointSystem.getActionPoints(tribeId, actionTypeBytes);
      return Number(points);
    } catch (error) {
      return this.handleError(
        error,
        'Failed to get action points',
        ErrorType.CONTRACT_ERROR
      );
    }
  }

  /**
   * Get the count of actions performed by a member
   * @param tribeId Tribe ID
   * @param member Member address
   * @param actionType Action type
   */
  public async getActionCount(
    tribeId: number,
    member: string,
    actionType: ActionType | string
  ): Promise<number> {
    try {
      const pointSystem = this.getPointSystemContract();
      
      // Convert action type to bytes32 if it's a string from the enum
      let actionTypeBytes: string;
      if (typeof actionType === 'string') {
        actionTypeBytes = ethers.keccak256(ethers.toUtf8Bytes(actionType));
      } else {
        actionTypeBytes = ethers.keccak256(ethers.toUtf8Bytes(actionType));
      }

      const count = await pointSystem.getActionCount(
        tribeId,
        member,
        actionTypeBytes
      );
      return Number(count);
    } catch (error) {
      return this.handleError(
        error,
        'Failed to get action count',
        ErrorType.CONTRACT_ERROR
      );
    }
  }

  /**
   * Get the top members by points
   * @param tribeId Tribe ID
   * @param limit Maximum number of members to return
   */
  public async getTopMembers(
    tribeId: number,
    limit: number = 10
  ): Promise<TopMemberResponse[]> {
    try {
      const pointSystem = this.getPointSystemContract();
      const [members, points] = await pointSystem.getTopMembers(tribeId, limit);
      
      const results: TopMemberResponse[] = [];
      for (let i = 0; i < members.length; i++) {
        if (members[i] !== ethers.ZeroAddress) {
          results.push({
            address: members[i],
            points: Number(points[i])
          });
        }
      }
      
      return results;
    } catch (error) {
      return this.handleError(
        error,
        'Failed to get top members',
        ErrorType.CONTRACT_ERROR
      );
    }
  }

  /**
   * Get the tribe token address
   * @param tribeId Tribe ID
   */
  public async getTribeTokenAddress(tribeId: number): Promise<string> {
    try {
      const pointSystem = this.getPointSystemContract();
      return await pointSystem.tribeTokens(tribeId);
    } catch (error) {
      return this.handleError(
        error,
        'Failed to get tribe token address',
        ErrorType.CONTRACT_ERROR
      );
    }
  }

  /**
   * Get the tribe organization address
   * @param tribeId Tribe ID
   */
  public async getTribeOrganization(tribeId: number): Promise<string> {
    try {
      const pointSystem = this.getPointSystemContract();
      return await pointSystem.tribeOrganizations(tribeId);
    } catch (error) {
      return this.handleError(
        error,
        'Failed to get tribe organization',
        ErrorType.CONTRACT_ERROR
      );
    }
  }

  /**
   * Get the exchange rate for a tribe
   * @param tribeId Tribe ID
   */
  public async getExchangeRate(tribeId: number): Promise<number> {
    try {
      const pointSystem = this.getPointSystemContract();
      const rate = await pointSystem.exchangeRates(tribeId);
      return Number(rate);
    } catch (error) {
      return this.handleError(
        error,
        'Failed to get exchange rate',
        ErrorType.CONTRACT_ERROR
      );
    }
  }
} 