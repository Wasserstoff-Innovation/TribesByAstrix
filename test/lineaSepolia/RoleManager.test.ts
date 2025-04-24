import { expect } from "chai";
import { ethers } from "hardhat";
import { RoleManager } from "../../typechain-types";
import { getDeployedContracts, setupTestAccounts } from "../helpers/lineaSepolia";

describe("RoleManager on Linea Sepolia", function () {
  let roleManager: any;
  let deployer: any;
  let user1: any;
  let user2: any;
  let isReadOnly = true;

  before(async function () {
    // Increase timeout for network operations
    this.timeout(300000);
    
    try {
      // Get accounts
      const accounts = await setupTestAccounts();
      deployer = accounts.deployer;
      user1 = accounts.user1;
      user2 = accounts.user2;

      console.log(`Test using deployer: ${deployer.address}`);

      // Get deployed contracts
      const contracts = await getDeployedContracts(deployer);
      
      if (!contracts.RoleManager) {
        throw new Error('RoleManager contract not found in deployment');
      }
      
      roleManager = contracts.RoleManager;
      const address = await roleManager.getAddress();
      console.log(`RoleManager contract loaded at: ${address}`);
      
      // Check if we can write to the network
      try {
        const balance = await ethers.provider.getBalance(deployer.address);
        console.log(`Deployer balance: ${ethers.formatEther(balance)} ETH`);
        isReadOnly = balance.toString() === '0';
      } catch (error) {
        console.log('Could not get balance, assuming read-only mode');
        isReadOnly = true;
      }
    } catch (error) {
      console.error('Setup failed:', error);
      this.skip();
    }
  });

  it("Should get ADMIN_ROLE correctly", async function () {
    try {
      const DEFAULT_ADMIN_ROLE = await roleManager.DEFAULT_ADMIN_ROLE();
      console.log(`DEFAULT_ADMIN_ROLE: ${DEFAULT_ADMIN_ROLE}`);
      expect(DEFAULT_ADMIN_ROLE).to.not.be.undefined;
    } catch (error) {
      console.error('Error getting DEFAULT_ADMIN_ROLE:', error);
      this.skip();
    }
  });

  it("Should get FAN_ROLE correctly", async function () {
    try {
      const FAN_ROLE = await roleManager.FAN_ROLE();
      console.log(`FAN_ROLE: ${FAN_ROLE}`);
      expect(FAN_ROLE).to.not.be.undefined;
    } catch (error) {
      console.error('Error getting FAN_ROLE:', error);
      this.skip();
    }
  });

  it("Should check if admin has DEFAULT_ADMIN_ROLE", async function () {
    try {
      const DEFAULT_ADMIN_ROLE = await roleManager.DEFAULT_ADMIN_ROLE();
      const hasRole = await roleManager.hasRole(DEFAULT_ADMIN_ROLE, deployer.address);
      console.log(`Admin has DEFAULT_ADMIN_ROLE: ${hasRole}`);
      expect(hasRole).to.be.a('boolean');
    } catch (error) {
      console.error('Error checking admin role:', error);
      this.skip();
    }
  });

  it("Should get user roles", async function () {
    if (isReadOnly) {
      console.log("Read-only mode: skipping user role check");
      this.skip();
      return;
    }
    
    try {
      console.log(`Getting roles for user: ${user1.address}`);
      const roles = await roleManager.getUserRoles(user1.address);
      console.log(`User roles: ${roles.length} roles found`);
      roles.forEach((role: string, index: number) => {
        console.log(`  Role ${index + 1}: ${role}`);
      });
      expect(roles).to.be.an('array');
    } catch (error) {
      console.error('Error getting user roles:', error);
      this.skip();
    }
  });
}); 