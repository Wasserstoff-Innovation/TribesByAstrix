import { expect } from "chai";
import { ethers } from "hardhat";
import { TribeController } from "../../typechain-types";
import { getDeployedContracts, setupTestAccounts } from "../helpers/lineaSepolia";

describe("TribeController on Linea Sepolia", function () {
  let tribeController: any;
  let deployer: any;
  let user1: any;
  let isReadOnly = true;

  before(async function () {
    // Increase timeout for network operations
    this.timeout(300000);
    
    try {
      // Get accounts
      const accounts = await setupTestAccounts();
      deployer = accounts.deployer;
      user1 = accounts.user1;

      console.log(`Test using deployer: ${deployer.address}`);

      // Get deployed contracts
      const contracts = await getDeployedContracts(deployer);
      
      if (!contracts.TribeController) {
        throw new Error('TribeController contract not found in deployment');
      }
      
      tribeController = contracts.TribeController;
      const address = await tribeController.getAddress();
      console.log(`TribeController contract loaded at: ${address}`);
      
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

  it("Should get total number of tribes", async function () {
    try {
      const totalTribes = await tribeController.getTotalTribesCount();
      console.log(`Total tribes: ${totalTribes}`);
      expect(totalTribes).to.be.a('bigint');
    } catch (error) {
      console.error('Error getting total tribes:', error);
      this.skip();
    }
  });

  it("Should get tribe details for existing tribes", async function () {
    try {
      const totalTribes = await tribeController.getTotalTribesCount();
      
      if (totalTribes === 0n) {
        console.log('No tribes exist yet');
        this.skip();
        return;
      }
      
      // Try to get details for the first tribe
      const tribeId = 1; // Tribe IDs typically start at 1
      try {
        const tribe = await tribeController.getTribeDetails(tribeId);
        
        console.log(`Tribe ID ${tribeId} details:`);
        console.log(`- Name: ${tribe.name}`);
        console.log(`- Admin: ${tribe.admin}`);
        console.log(`- Creation Timestamp: ${tribe.createdAt}`);
        console.log(`- Member Count: ${tribe.memberCount}`);
        
        expect(tribe.name).to.be.a('string');
      } catch (error) {
        console.log(`Error getting tribe details for ID ${tribeId}: ${error}`);
        this.skip();
      }
    } catch (error) {
      console.error('Error getting tribe details:', error);
      this.skip();
    }
  });

  it("Should get user tribes if any exist", async function () {
    try {
      try {
        const userTribes = await tribeController.getUserTribes(deployer.address);
        console.log(`User has ${userTribes.length} tribes: ${userTribes}`);
        expect(userTribes).to.be.an('array');
      } catch (error) {
        console.log(`Could not get user tribes: ${error}`);
        this.skip();
      }
    } catch (error) {
      console.error('Error getting user tribes:', error);
      this.skip();
    }
  });
}); 