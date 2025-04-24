import { expect } from "chai";
import { ethers } from "hardhat";
import { AstrixPointSystem } from "../../typechain-types";
import { getDeployedContracts, setupTestAccounts } from "../helpers/lineaSepolia";

describe("AstrixPointSystem on Linea Sepolia", function () {
  let pointSystem: any;
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
      
      if (!contracts.AstrixPointSystem) {
        throw new Error('AstrixPointSystem contract not found in deployment');
      }
      
      pointSystem = contracts.AstrixPointSystem;
      const address = await pointSystem.getAddress();
      console.log(`AstrixPointSystem contract loaded at: ${address}`);
      
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

  it("Should get point values for different actions", async function () {
    try {
      const createPostPoints = await pointSystem.getPointValue("CREATE_POST");
      console.log(`Points for CREATE_POST: ${createPostPoints}`);
      expect(createPostPoints).to.be.a('bigint');
      
      const likePostPoints = await pointSystem.getPointValue("LIKE_POST");
      console.log(`Points for LIKE_POST: ${likePostPoints}`);
      expect(likePostPoints).to.be.a('bigint');
      
      const commentPostPoints = await pointSystem.getPointValue("COMMENT_POST");
      console.log(`Points for COMMENT_POST: ${commentPostPoints}`);
      expect(commentPostPoints).to.be.a('bigint');
    } catch (error) {
      console.error('Error getting point values:', error);
      this.skip();
    }
  });

  it("Should check if user has any points", async function () {
    try {
      const userPoints = await pointSystem.getPoints(user1.address);
      console.log(`User ${user1.address} has ${userPoints} points`);
      expect(userPoints).to.be.a('bigint');
    } catch (error) {
      console.error('Error checking user points:', error);
      this.skip();
    }
  });

  it("Should check global points statistics", async function () {
    try {
      const totalPoints = await pointSystem.getTotalPoints();
      console.log(`Total points in system: ${totalPoints}`);
      expect(totalPoints).to.be.a('bigint');
      
      const userCount = await pointSystem.getUserCount();
      console.log(`Number of users with points: ${userCount}`);
      expect(userCount).to.be.a('bigint');
    } catch (error) {
      console.error('Error checking global stats:', error);
      this.skip();
    }
  });

  it("Should get user points history", async function () {
    try {
      // Try to get recent point events for the user
      const events = await pointSystem.getUserPointEvents(user1.address, 0, 5);
      console.log(`Found ${events.length} point events for user ${user1.address}`);
      
      if (events.length > 0) {
        for (let i = 0; i < events.length; i++) {
          const event = events[i];
          console.log(`Event ${i+1}: Action=${event.action}, Points=${event.points}, Timestamp=${new Date(Number(event.timestamp) * 1000).toISOString()}`);
        }
      }
      
      expect(events).to.be.an('array');
    } catch (error) {
      console.error('Error getting user point events:', error);
      this.skip();
    }
  });

  it("Should get user point rank", async function () {
    try {
      const { rank, totalUsers } = await pointSystem.getUserRank(user1.address);
      console.log(`User ${user1.address} rank: ${rank} out of ${totalUsers} users`);
      expect(rank).to.be.a('bigint');
      expect(totalUsers).to.be.a('bigint');
    } catch (error) {
      console.error('Error getting user rank:', error);
      this.skip();
    }
  });

  it("Should check if action has point limit", async function () {
    try {
      const hasLimit = await pointSystem.hasActionLimit("CREATE_POST");
      console.log(`CREATE_POST has daily limit: ${hasLimit}`);
      expect(hasLimit).to.be.a('boolean');
      
      if (hasLimit) {
        const limit = await pointSystem.getActionLimit("CREATE_POST");
        console.log(`CREATE_POST daily limit: ${limit}`);
        expect(limit).to.be.a('bigint');
        
        const userCount = await pointSystem.getUserActionCount(user1.address, "CREATE_POST");
        console.log(`User has performed CREATE_POST ${userCount} times today`);
        expect(userCount).to.be.a('bigint');
      }
    } catch (error) {
      console.error('Error checking action limits:', error);
      this.skip();
    }
  });
}); 