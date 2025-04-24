// import { ethers } from 'ethers'; // Removed unused import
import { BaseModule } from '../core/BaseModule';
import { ErrorType } from '../types/core';
import { ethers } from 'ethers';

// Import RoleManager ABI 
import RoleManagerABI from '../../abis/RoleManager.json';

/**
 * Module for managing roles
 */
export class RolesModule extends BaseModule {
  /**
   * Get the RoleManager contract
   * @param useSigner Whether to use the signer
   */
  private getRoleManagerContract(useSigner: boolean = false) {
    // Use ethers.Contract for the specific contract type if ABI matches
    // Use unknown cast as intermediate step if direct cast fails
    return this.getContract<ethers.Contract>(
      this.config.contracts.roleManager,
      RoleManagerABI,
      useSigner
    );
  }

  /**
   * Get the DEFAULT_ADMIN_ROLE bytes
   */
  public async getDefaultAdminRole(): Promise<string> {
    try {
      const roleManager = this.getRoleManagerContract();
      return await roleManager.DEFAULT_ADMIN_ROLE();
    } catch (error) {
      return this.handleError(
        error,
        'Failed to get DEFAULT_ADMIN_ROLE',
        ErrorType.CONTRACT_ERROR
      );
    }
  }

  /**
   * Get the ORGANIZER_ROLE bytes
   */
  public async getOrganizerRole(): Promise<string> {
    try {
      const roleManager = this.getRoleManagerContract();
      return await roleManager.ORGANIZER_ROLE();
    } catch (error) {
      return this.handleError(
        error,
        'Failed to get ORGANIZER_ROLE',
        ErrorType.CONTRACT_ERROR
      );
    }
  }

  /**
   * Check if an account has a specific role
   * @param role Role bytes string
   * @param account Account address
   */
  public async hasRole(role: string, account: string): Promise<boolean> {
    try {
      const roleManager = this.getRoleManagerContract();
      return await roleManager.hasRole(role, account);
    } catch (error) {
      return this.handleError(
        error,
        'Failed to check role',
        ErrorType.CONTRACT_ERROR
      );
    }
  }

  /**
   * Check if an account is an admin
   * @param account Account address
   */
  public async isAdmin(account: string): Promise<boolean> {
    try {
      const adminRole = await this.getDefaultAdminRole();
      return this.hasRole(adminRole, account);
    } catch (error) {
      return this.handleError(
        error,
        'Failed to check admin status',
        ErrorType.CONTRACT_ERROR
      );
    }
  }

  /**
   * Check if an account is an organizer
   * @param account Account address 
   */
  public async isOrganizer(account: string): Promise<boolean> {
    try {
      const organizerRole = await this.getOrganizerRole();
      return this.hasRole(organizerRole, account);
    } catch (error) {
      return this.handleError(
        error,
        'Failed to check organizer status',
        ErrorType.CONTRACT_ERROR
      );
    }
  }

  /**
   * Assign a role to an account
   * @param account Account address
   * @param role Role bytes string
   * @returns Transaction hash
   */
  public async assignRole(account: string, role: string): Promise<string> {
    try {
      const roleManager = this.getRoleManagerContract(true);
      const tx = await roleManager.assignRole(account, role);
      const receipt = await tx.wait();

      this.log(`Assigned role`, {
        account,
        role,
        txHash: receipt.hash
      });

      return receipt.hash;
    } catch (error) {
      return this.handleError(
        error,
        'Failed to assign role',
        ErrorType.CONTRACT_ERROR
      );
    }
  }

  /**
   * Remove a role from an account
   * @param account Account address
   * @param role Role bytes string
   * @returns Transaction hash
   */
  public async removeRole(account: string, role: string): Promise<string> {
    try {
      const roleManager = this.getRoleManagerContract(true);
      const tx = await roleManager.removeRole(account, role);
      const receipt = await tx.wait();

      this.log(`Removed role`, {
        account,
        role,
        txHash: receipt.hash
      });

      return receipt.hash;
    } catch (error) {
      return this.handleError(
        error,
        'Failed to remove role',
        ErrorType.CONTRACT_ERROR
      );
    }
  }

  /**
   * Make an account an admin
   * @param account Account address
   * @returns Transaction hash
   */
  public async makeAdmin(account: string): Promise<string> {
    try {
      const adminRole = await this.getDefaultAdminRole();
      return this.assignRole(account, adminRole);
    } catch (error) {
      return this.handleError(
        error,
        'Failed to make admin',
        ErrorType.CONTRACT_ERROR
      );
    }
  }

  /**
   * Make an account an organizer
   * @param account Account address
   * @returns Transaction hash
   */
  public async makeOrganizer(account: string): Promise<string> {
    try {
      const organizerRole = await this.getOrganizerRole();
      return this.assignRole(account, organizerRole);
    } catch (error) {
      return this.handleError(
        error,
        'Failed to make organizer',
        ErrorType.CONTRACT_ERROR
      );
    }
  }
} 