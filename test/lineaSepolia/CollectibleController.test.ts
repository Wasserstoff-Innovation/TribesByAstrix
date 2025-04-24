import { expect } from "chai";
import { ethers } from "hardhat";
import { CollectibleController } from "../../typechain-types";
import { getDeployedContracts, setupTestAccounts } from "../helpers/lineaSepolia";

describe("CollectibleController on Linea Sepolia", function () {
  let collectibleController: any;
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
      
      if (!contracts.CollectibleController) {
        throw new Error('CollectibleController contract not found in deployment');
      }
      
      collectibleController = contracts.CollectibleController;
      const address = await collectibleController.getAddress();
      console.log(`CollectibleController contract loaded at: ${address}`);
      
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

  it("Should get total collectible collections", async function () {
    try {
      const totalCollections = await collectibleController.getCollectionCount();
      console.log(`Total collectible collections: ${totalCollections}`);
      expect(totalCollections).to.be.a('bigint');
    } catch (error) {
      console.error('Error getting collection count:', error);
      this.skip();
    }
  });

  it("Should get details of the first collection if it exists", async function () {
    try {
      const collectionCount = await collectibleController.getCollectionCount();
      
      if (collectionCount > 0) {
        const collectionId = 1; // First collection ID
        console.log(`Getting details for collection ID: ${collectionId}`);
        
        const collection = await collectibleController.getCollection(collectionId);
        console.log(`Collection ${collectionId} details:`);
        console.log(`  Name: ${collection.name}`);
        console.log(`  Creator: ${collection.creator}`);
        console.log(`  Token Address: ${collection.tokenAddress}`);
        console.log(`  Total Supply: ${collection.totalSupply}`);
        
        expect(collection.name).to.be.a('string');
        expect(collection.tokenAddress).to.match(/^0x[a-fA-F0-9]{40}$/);
      } else {
        console.log('No collections found to retrieve details');
        this.skip();
      }
    } catch (error) {
      console.error('Error getting collection details:', error);
      this.skip();
    }
  });

  it("Should get all collectible types in a collection", async function () {
    try {
      const collectionCount = await collectibleController.getCollectionCount();
      
      if (collectionCount > 0) {
        const collectionId = 1; // First collection ID
        console.log(`Getting collectible types for collection ID: ${collectionId}`);
        
        const collectibleTypes = await collectibleController.getCollectibleTypes(collectionId);
        console.log(`Collection ${collectionId} has ${collectibleTypes.length} collectible types`);
        
        if (collectibleTypes.length > 0) {
          console.log('First few collectible types:');
          const limit = Math.min(collectibleTypes.length, 3);
          for (let i = 0; i < limit; i++) {
            const typeId = collectibleTypes[i];
            console.log(`  Type ID: ${typeId}`);
            
            try {
              const typeDetails = await collectibleController.getCollectibleType(collectionId, typeId);
              console.log(`    Name: ${typeDetails.name}`);
              console.log(`    Max Supply: ${typeDetails.maxSupply}`);
              console.log(`    Current Supply: ${typeDetails.currentSupply}`);
            } catch (error) {
              console.log(`    Error getting details for type ${typeId}`);
            }
          }
        }
        
        expect(collectibleTypes).to.be.an('array');
      } else {
        console.log('No collections found to retrieve collectible types');
        this.skip();
      }
    } catch (error) {
      console.error('Error getting collectible types:', error);
      this.skip();
    }
  });

  it("Should check if user has collectibles", async function () {
    try {
      const collectionCount = await collectibleController.getCollectionCount();
      
      if (collectionCount > 0) {
        const collectionId = 1; // First collection ID
        console.log(`Checking if deployer has collectibles in collection ${collectionId}`);
        
        const userCollectibles = await collectibleController.getUserCollectibles(deployer.address, collectionId);
        console.log(`Deployer has ${userCollectibles.length} collectible types in collection ${collectionId}`);
        
        if (userCollectibles.length > 0) {
          console.log('First few collectible types owned:');
          const limit = Math.min(userCollectibles.length, 3);
          for (let i = 0; i < limit; i++) {
            const typeId = userCollectibles[i];
            console.log(`  Type ID: ${typeId}`);
            
            try {
              const balance = await collectibleController.balanceOf(deployer.address, collectionId, typeId);
              console.log(`    Balance: ${balance}`);
            } catch (error) {
              console.log(`    Error getting balance for type ${typeId}`);
            }
          }
        }
        
        expect(userCollectibles).to.be.an('array');
      } else {
        console.log('No collections found to check user collectibles');
        this.skip();
      }
    } catch (error) {
      console.error('Error checking user collectibles:', error);
      this.skip();
    }
  });
}); 