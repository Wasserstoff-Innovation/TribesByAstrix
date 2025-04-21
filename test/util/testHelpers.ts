import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { BaseContract } from "ethers";
import { RoleManager } from "../../typechain-types";

interface TestContract extends BaseContract {
  initialize?: () => Promise<any>;
  DEFAULT_ADMIN_ROLE?: () => Promise<string>;
  grantRole?: (role: string, account: string) => Promise<any>;
}

/**
 * Helper function to fix common test issues with ethers.js v6
 * 
 * This function can be used in the beforeEach/before hooks of tests
 * to fix common issues like contract initialization and role assignments
 */
export async function fixTestEnvironment(contractName: string, ...args: any[]) {
  // Check if we should apply fixes
  if (process.env.USE_TEST_FIXES !== 'true') {
    return null;
  }
  
  try {
    const [owner, ...signers] = await ethers.getSigners();
    
    // Deploy specified contract
    const factory = await ethers.getContractFactory(contractName);
    const contract = await factory.deploy() as TestContract;
    await contract.waitForDeployment();
    
    // Handle RoleManager initialization
    if (contractName === 'RoleManager') {
      // Initialize if not initialized
      try {
        if (contract.initialize) {
          await contract.initialize();
        }
      } catch (error: any) {
        // Ignore "already initialized" errors
        if (!error.message.includes('already initialized')) {
          throw error;
        }
      }
      
      // Grant admin role to owner
      try {
        if (contract.DEFAULT_ADMIN_ROLE && contract.grantRole) {
          const adminRole = await contract.DEFAULT_ADMIN_ROLE();
          await contract.grantRole(adminRole, owner.address);
        }
      } catch (error: any) {
        // Ignore role already granted errors
        if (!error.message.includes('AccessControl')) {
          throw error;
        }
      }
    }
    
    return {
      contract,
      owner,
      signers
    };
  } catch (error) {
    console.error(`Error in fixTestEnvironment: ${error}`);
    return null;
  }
}

/**
 * Helper function to properly setup roles for tests
 */
export async function setupTestRoles(roleManager: RoleManager, accounts: SignerWithAddress[]) {
  const [owner, admin, contentCreator, moderator] = accounts;
  
  // Setup common roles
  const adminRole = await roleManager.DEFAULT_ADMIN_ROLE();
  const adminRoleHash = ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE"));
  const moderatorRoleHash = ethers.keccak256(ethers.toUtf8Bytes("MODERATOR_ROLE"));
  const contentCreatorRoleHash = ethers.keccak256(ethers.toUtf8Bytes("CONTENT_CREATOR_ROLE"));
  const fanRoleHash = ethers.keccak256(ethers.toUtf8Bytes("FAN_ROLE"));
  const organizerRoleHash = ethers.keccak256(ethers.toUtf8Bytes("ORGANIZER_ROLE"));
  
  // Grant admin role to owner
  try {
    await roleManager.grantRole(adminRole, owner.address);
  } catch (error) {
    // Ignore if already granted
  }
  
  // Grant roles to test accounts
  const roleAssignments = [
    { role: adminRole, account: admin.address },
    { role: adminRoleHash, account: admin.address },
    { role: moderatorRoleHash, account: moderator.address },
    { role: contentCreatorRoleHash, account: contentCreator.address },
    { role: fanRoleHash, account: owner.address },
    { role: fanRoleHash, account: admin.address },
    { role: fanRoleHash, account: contentCreator.address },
    { role: fanRoleHash, account: moderator.address },
    { role: organizerRoleHash, account: owner.address },
    { role: organizerRoleHash, account: admin.address }
  ];
  
  for (const assignment of roleAssignments) {
    try {
      await roleManager.grantRole(assignment.role, assignment.account);
    } catch (error) {
      // Ignore if already granted
    }
  }
  
  return {
    roles: {
      adminRole,
      adminRoleHash,
      moderatorRoleHash,
      contentCreatorRoleHash,
      fanRoleHash,
      organizerRoleHash
    }
  };
} 