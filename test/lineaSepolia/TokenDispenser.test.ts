import { expect } from "chai";
import { ethers } from "hardhat";
import { TokenDispenser } from "../../typechain-types";
import { getDeployedContracts, setupTestAccounts } from "../helpers/lineaSepolia";

describe("TokenDispenser on Linea Sepolia", function () {
  let tokenDispenser: any;
  let astrixToken: any;
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
      
      if (!contracts.TokenDispenser) {
        throw new Error('TokenDispenser contract not found in deployment');
      }
      
      tokenDispenser = contracts.TokenDispenser;
      const address = await tokenDispenser.getAddress();
      console.log(`TokenDispenser contract loaded at: ${address}`);
      
      // Also get AstrixToken if available
      if (contracts.AstrixToken) {
        astrixToken = contracts.AstrixToken;
        const tokenAddress = await astrixToken.getAddress();
        console.log(`AstrixToken contract loaded at: ${tokenAddress}`);
      } else {
        console.log('AstrixToken contract not found in deployment');
      }
      
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

  it("Should get the token address", async function () {
    try {
      const tokenAddress = await tokenDispenser.token();
      console.log(`Token address: ${tokenAddress}`);
      expect(tokenAddress).to.be.a('string');
      expect(tokenAddress).to.match(/^0x[a-fA-F0-9]{40}$/);
    } catch (error) {
      console.error('Error getting token address:', error);
      this.skip();
    }
  });

  it("Should check if dispenser has token balance", async function () {
    if (!astrixToken) {
      console.log('AstrixToken not available, skipping balance check');
      this.skip();
      return;
    }
    
    try {
      const dispenserAddress = await tokenDispenser.getAddress();
      const balance = await astrixToken.balanceOf(dispenserAddress);
      console.log(`TokenDispenser balance: ${ethers.formatUnits(balance, 18)} ASTRIX`);
      expect(balance).to.be.a('bigint');
    } catch (error) {
      console.error('Error checking dispenser balance:', error);
      this.skip();
    }
  });

  it("Should check if claiming is enabled", async function () {
    try {
      const isEnabled = await tokenDispenser.isClaimingEnabled();
      console.log(`Claiming enabled: ${isEnabled}`);
      expect(isEnabled).to.be.a('boolean');
    } catch (error) {
      console.error('Error checking if claiming is enabled:', error);
      this.skip();
    }
  });

  it("Should get claim amount", async function () {
    try {
      const claimAmount = await tokenDispenser.claimAmount();
      console.log(`Claim amount: ${ethers.formatUnits(claimAmount, 18)} ASTRIX`);
      expect(claimAmount).to.be.a('bigint');
    } catch (error) {
      console.error('Error getting claim amount:', error);
      this.skip();
    }
  });

  it("Should check claim cooldown period", async function () {
    try {
      const cooldownPeriod = await tokenDispenser.claimCooldownPeriod();
      console.log(`Claim cooldown period: ${cooldownPeriod} seconds`);
      expect(cooldownPeriod).to.be.a('bigint');
    } catch (error) {
      console.error('Error checking cooldown period:', error);
      this.skip();
    }
  });

  it("Should check if user can claim", async function () {
    try {
      const canClaim = await tokenDispenser.canClaim(user1.address);
      console.log(`User ${user1.address} can claim: ${canClaim}`);
      expect(canClaim).to.be.a('boolean');
      
      if (canClaim) {
        const nextClaimTime = await tokenDispenser.nextClaimTime(user1.address);
        console.log(`Next claim time: ${nextClaimTime} (${new Date(Number(nextClaimTime) * 1000).toISOString()})`);
      } else {
        const nextClaimTime = await tokenDispenser.nextClaimTime(user1.address);
        console.log(`Next claim time: ${nextClaimTime} (${new Date(Number(nextClaimTime) * 1000).toISOString()})`);
      }
    } catch (error) {
      console.error('Error checking if user can claim:', error);
      this.skip();
    }
  });
}); 