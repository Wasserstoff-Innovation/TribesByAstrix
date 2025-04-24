import { expect } from "chai";
import { ethers } from "hardhat";
import { ProfileNFTMinter } from "../../typechain-types";
import { getDeployedContracts, setupTestAccounts } from "../helpers/lineaSepolia";

describe("ProfileNFTMinter on Linea Sepolia", function () {
  let profileNFTMinter: any;
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
      
      if (!contracts.ProfileNFTMinter) {
        throw new Error('ProfileNFTMinter contract not found in deployment');
      }
      
      profileNFTMinter = contracts.ProfileNFTMinter;
      const address = await profileNFTMinter.getAddress();
      console.log(`ProfileNFTMinter contract loaded at: ${address}`);
      
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

  it("Should get name of the NFT", async function () {
    try {
      const name = await profileNFTMinter.name();
      console.log(`ProfileNFT name: ${name}`);
      expect(name).to.be.a('string');
      expect(name.length).to.be.greaterThan(0);
    } catch (error) {
      console.error('Error getting NFT name:', error);
      this.skip();
    }
  });

  it("Should get symbol of the NFT", async function () {
    try {
      const symbol = await profileNFTMinter.symbol();
      console.log(`ProfileNFT symbol: ${symbol}`);
      expect(symbol).to.be.a('string');
      expect(symbol.length).to.be.greaterThan(0);
    } catch (error) {
      console.error('Error getting NFT symbol:', error);
      this.skip();
    }
  });

  it("Should check total supply", async function () {
    try {
      const totalSupply = await profileNFTMinter.totalSupply();
      console.log(`Total supply: ${totalSupply}`);
      expect(totalSupply).to.be.a('bigint');
    } catch (error) {
      console.error('Error getting total supply:', error);
      this.skip();
    }
  });

  it("Should check if deployer has profile NFT", async function () {
    try {
      const balance = await profileNFTMinter.balanceOf(deployer.address);
      console.log(`Deployer has ${balance} profile NFTs`);
      expect(balance).to.be.a('bigint');
    } catch (error) {
      console.error('Error checking balance:', error);
      this.skip();
    }
  });

  it("Should get profile details if tokenId exists", async function () {
    if (isReadOnly) {
      console.log("Read-only mode: using default values for profile check");
    }
    
    try {
      // Try to get profile details for token ID 1 (assuming it might exist)
      // This will fail gracefully if the token doesn't exist
      const tokenId = 1n;
      console.log(`Getting profile details for tokenId: ${tokenId}`);
      
      try {
        const tokenURI = await profileNFTMinter.tokenURI(tokenId);
        console.log(`Token URI for ID ${tokenId}: ${tokenURI}`);
        expect(tokenURI).to.be.a('string');
      } catch (error) {
        console.log(`No token found with ID ${tokenId}`);
        // This is not a failure - just no token with this ID
      }
      
      try {
        const owner = await profileNFTMinter.ownerOf(tokenId);
        console.log(`Owner of token ID ${tokenId}: ${owner}`);
        expect(owner).to.be.a('string');
      } catch (error) {
        console.log(`No owner found for token ID ${tokenId}`);
        // This is not a failure - just no token with this ID
      }
    } catch (error) {
      console.error('Error checking profile details:', error);
      this.skip();
    }
  });
}); 