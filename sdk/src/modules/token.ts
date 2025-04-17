import { ethers } from 'ethers';
import { BaseModule } from '../core/BaseModule';
import { ErrorType } from '../types/core';
// AstrixSDKError is used indirectly through this.handleError
import {
  BalanceResponse,
  DepositParams,
  PlatformSpendParams,
  SpendWithSignatureParams,
  TokenInfo,
  UpdateOrganizationAdminParams,
  WithdrawParams
} from '../types/token';

// Import ABIs
import AstrixTokenABI from '../../abis/AstrixToken.json';
import TokenDispenserABI from '../../abis/TokenDispenser.json';

/**
 * Module for managing Astrix tokens and the token dispenser
 */
export class TokenModule extends BaseModule {
  /**
   * Get the Astrix token contract
   * @param useSigner Whether to use the signer
   */
  private getAstrixTokenContract(useSigner: boolean = false) {
    return this.// eslint-disable-next-line @typescript-eslint/no-explicit-any
  getContract<any>(
      this.config.contracts.astrixToken,
      AstrixTokenABI,
      useSigner
    );
  }

  /**
   * Get the token dispenser contract
   * @param useSigner Whether to use the signer
   */
  private getTokenDispenserContract(useSigner: boolean = false) {
    return this.// eslint-disable-next-line @typescript-eslint/no-explicit-any
  getContract<any>(
      this.config.contracts.tokenDispenser,
      TokenDispenserABI,
      useSigner
    );
  }

  /**
   * Deposit Astrix tokens to the token dispenser
   * @param params Deposit parameters
   */
  public async deposit(params: DepositParams): Promise<string> {
    try {
      const signer = this.requireSigner();
      const _signerAddress = await signer.getAddress();

      // First, approve the token transfer
      const astrixToken = this.getAstrixTokenContract(true);
      const approvalTx = await astrixToken.approve(
        this.config.contracts.tokenDispenser,
        params.amount
      );
      await approvalTx.wait();

      this.log(`Approved token transfer: ${params.amount.toString()} wei`);

      // Now deposit the tokens
      const tokenDispenser = this.getTokenDispenserContract(true);
      const tx = await tokenDispenser.deposit(params.amount);
      const receipt = await tx.wait();

      this.log(`Deposited tokens`, {
        amount: params.amount.toString(),
        txHash: receipt.hash
      });

      return receipt.hash;
    } catch (error) {
      return this.handleError(
        error,
        'Failed to deposit tokens',
        ErrorType.CONTRACT_ERROR
      );
    }
  }

  /**
   * Withdraw Astrix tokens from the token dispenser
   * @param params Withdrawal parameters
   */
  public async withdraw(params: WithdrawParams): Promise<string> {
    try {
      const tokenDispenser = this.getTokenDispenserContract(true);
      const tx = await tokenDispenser.withdraw(params.amount);
      const receipt = await tx.wait();

      this.log(`Withdrew tokens`, {
        amount: params.amount.toString(),
        txHash: receipt.hash
      });

      return receipt.hash;
    } catch (error) {
      return this.handleError(
        error,
        'Failed to withdraw tokens',
        ErrorType.CONTRACT_ERROR
      );
    }
  }

  /**
   * Update the organization admin
   * @param params Update parameters
   */
  public async updateOrganizationAdmin(
    params: UpdateOrganizationAdminParams
  ): Promise<string> {
    try {
      const tokenDispenser = this.getTokenDispenserContract(true);
      const tx = await tokenDispenser.updateOrganizationAdmin(params.newAdmin);
      const receipt = await tx.wait();

      this.log(`Updated organization admin`, {
        newAdmin: params.newAdmin,
        txHash: receipt.hash
      });

      return receipt.hash;
    } catch (error) {
      return this.handleError(
        error,
        'Failed to update organization admin',
        ErrorType.CONTRACT_ERROR
      );
    }
  }

  /**
   * Spend tokens with a signature
   * @param params Spend parameters
   */
  public async spendWithSignature(
    params: SpendWithSignatureParams
  ): Promise<string> {
    try {
      // Requires SPENDER_ROLE
      const tokenDispenser = this.getTokenDispenserContract(true);
      const tx = await tokenDispenser.spendWithSignature(
        params.organization,
        params.recipient,
        params.amount,
        params.reason,
        params.signature
      );
      const receipt = await tx.wait();

      this.log(`Spent tokens with signature`, {
        organization: params.organization,
        recipient: params.recipient,
        amount: params.amount.toString(),
        reason: params.reason,
        txHash: receipt.hash
      });

      return receipt.hash;
    } catch (error) {
      return this.handleError(
        error,
        'Failed to spend tokens with signature',
        ErrorType.CONTRACT_ERROR
      );
    }
  }

  /**
   * Platform spend tokens
   * @param params Spend parameters
   */
  public async platformSpend(params: PlatformSpendParams): Promise<string> {
    try {
      // Requires PLATFORM_ROLE
      const tokenDispenser = this.getTokenDispenserContract(true);
      const tx = await tokenDispenser.platformSpend(
        params.organization,
        params.recipient,
        params.amount,
        params.reason
      );
      const receipt = await tx.wait();

      this.log(`Platform spent tokens`, {
        organization: params.organization,
        recipient: params.recipient,
        amount: params.amount.toString(),
        reason: params.reason,
        txHash: receipt.hash
      });

      return receipt.hash;
    } catch (error) {
      return this.handleError(
        error,
        'Failed to spend tokens as platform',
        ErrorType.CONTRACT_ERROR
      );
    }
  }

  /**
   * Grant the spender role to an address
   * @param spender Address to grant the role to
   */
  public async grantSpenderRole(spender: string): Promise<string> {
    try {
      // Requires DEFAULT_ADMIN_ROLE
      const tokenDispenser = this.getTokenDispenserContract(true);
      const tx = await tokenDispenser.grantSpenderRole(spender);
      const receipt = await tx.wait();

      this.log(`Granted spender role`, {
        spender,
        txHash: receipt.hash
      });

      return receipt.hash;
    } catch (error) {
      return this.handleError(
        error,
        'Failed to grant spender role',
        ErrorType.CONTRACT_ERROR
      );
    }
  }

  /**
   * Revoke the spender role from an address
   * @param spender Address to revoke the role from
   */
  public async revokeSpenderRole(spender: string): Promise<string> {
    try {
      // Requires DEFAULT_ADMIN_ROLE
      const tokenDispenser = this.getTokenDispenserContract(true);
      const tx = await tokenDispenser.revokeSpenderRole(spender);
      const receipt = await tx.wait();

      this.log(`Revoked spender role`, {
        spender,
        txHash: receipt.hash
      });

      return receipt.hash;
    } catch (error) {
      return this.handleError(
        error,
        'Failed to revoke spender role',
        ErrorType.CONTRACT_ERROR
      );
    }
  }

  /**
   * Get an organization's token balance
   * @param organization Organization address
   */
  public async getBalance(organization: string): Promise<BalanceResponse> {
    try {
      const tokenDispenser = this.getTokenDispenserContract();
      const balance = await tokenDispenser.getBalance(organization);

      return {
        balance,
        formattedBalance: ethers.formatEther(balance)
      };
    } catch (error) {
      return this.handleError(
        error,
        'Failed to get organization balance',
        ErrorType.CONTRACT_ERROR
      );
    }
  }

  /**
   * Get the organization admin
   * @param organization Organization address
   */
  public async getOrganizationAdmin(organization: string): Promise<string> {
    try {
      const tokenDispenser = this.getTokenDispenserContract();
      return await tokenDispenser.organizationAdmins(organization);
    } catch (error) {
      return this.handleError(
        error,
        'Failed to get organization admin',
        ErrorType.CONTRACT_ERROR
      );
    }
  }

  /**
   * Get information about the Astrix token
   */
  public async getTokenInfo(): Promise<TokenInfo> {
    try {
      const astrixToken = this.getAstrixTokenContract();
      
      const [
        name,
        symbol,
        totalSupply,
        maxSupply,
        remainingSupply,
        percentMinted
      ] = await Promise.all([
        astrixToken.name(),
        astrixToken.symbol(),
        astrixToken.totalSupply(),
        astrixToken.MAX_SUPPLY(),
        astrixToken.remainingSupply(),
        astrixToken.percentMinted()
      ]);

      return {
        name,
        symbol,
        totalSupply,
        formattedTotalSupply: ethers.formatEther(totalSupply),
        maxSupply,
        formattedMaxSupply: ethers.formatEther(maxSupply),
        remainingSupply,
        formattedRemainingSupply: ethers.formatEther(remainingSupply),
        percentMinted: Number(percentMinted)
      };
    } catch (error) {
      return this.handleError(
        error,
        'Failed to get token information',
        ErrorType.CONTRACT_ERROR
      );
    }
  }

  /**
   * Check if an account has the minter role
   * @param account Account to check
   */
  public async isMinter(account: string): Promise<boolean> {
    try {
      const astrixToken = this.getAstrixTokenContract();
      return await astrixToken.isMinter(account);
    } catch (error) {
      return this.handleError(
        error,
        'Failed to check if account is a minter',
        ErrorType.CONTRACT_ERROR
      );
    }
  }

  /**
   * Check if an account has the burner role
   * @param account Account to check
   */
  public async isBurner(account: string): Promise<boolean> {
    try {
      const astrixToken = this.getAstrixTokenContract();
      return await astrixToken.isBurner(account);
    } catch (error) {
      return this.handleError(
        error,
        'Failed to check if account is a burner',
        ErrorType.CONTRACT_ERROR
      );
    }
  }

  /**
   * Get the token balance of an account
   * @param account Account to check
   */
  public async getTokenBalance(account: string): Promise<BalanceResponse> {
    try {
      const astrixToken = this.getAstrixTokenContract();
      const balance = await astrixToken.balanceOf(account);

      return {
        balance,
        formattedBalance: ethers.formatEther(balance)
      };
    } catch (error) {
      return this.handleError(
        error,
        'Failed to get token balance',
        ErrorType.CONTRACT_ERROR
      );
    }
  }
} 