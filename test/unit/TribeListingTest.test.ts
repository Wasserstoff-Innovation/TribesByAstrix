import { expect } from "chai";
import { ethers } from "hardhat";
import { TribeController, RoleManager } from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { EventLog } from "ethers";

// Import console for logging
const hre = require("hardhat");
const { console } = hre;

describe("Tribe Listing Functionality", function () {
  let tribeController: TribeController;
  let roleManager: RoleManager;
  let owner: SignerWithAddress;
  let creator: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let users: SignerWithAddress[];

  // Sample metadata for tribes
  const createMetadata = (name: string, index: number) => ({
    id: `tribe-${index}`,
    name: name,
    description: `A tribe for ${name} enthusiasts`,
    avatar: `/images/${name.toLowerCase()}.svg`,
    coverImage: `/images/${name.toLowerCase()}-banner.png`,
    privacy: 'public',
    isVerified: index % 2 === 0, // Alternate verification status
    topics: [
      {
        id: `topic-${index}-1`,
        name: 'General',
        description: 'General discussion',
        postCount: 0
      }
    ],
    createdAt: new Date().toISOString()
  });

  beforeEach(async function () {
    process.stdout.write("\n=== Setting up test environment ===\n");
    [owner, creator, user1, user2, ...users] = await ethers.getSigners();
    process.stdout.write("Signers initialized\n");

    try {
      // Deploy RoleManager
      process.stdout.write("Deploying RoleManager...\n");
      const RoleManager = await ethers.getContractFactory("RoleManager");
      roleManager = await RoleManager.deploy();
      await roleManager.waitForDeployment();
      process.stdout.write(`RoleManager deployed at: ${await roleManager.getAddress()}\n`);

      // Deploy TribeController
      process.stdout.write("Deploying TribeController...\n");
      const TribeController = await ethers.getContractFactory("TribeController");
      tribeController = await TribeController.deploy(await roleManager.getAddress());
      await tribeController.waitForDeployment();
      process.stdout.write(`TribeController deployed at: ${await tribeController.getAddress()}\n`);

      // Grant creator role
      process.stdout.write("Granting CREATOR_ROLE to creator...\n");
      await roleManager.grantRole(ethers.keccak256(ethers.toUtf8Bytes("CREATOR_ROLE")), creator.address);
      process.stdout.write("Setup complete\n");
    } catch (error: any) {
      process.stdout.write(`\nError during setup: ${error.message}\n`);
      if (error.data) {
        process.stdout.write(`Error data: ${error.data}\n`);
      }
      throw error;
    }
  });

  describe("Tribe Listing Tests", function () {
    it("Should get total number of tribes", async function () {
      process.stdout.write("\n=== Testing get total tribes ===\n");
      
      // Create several tribes first
      const tribeNames = ["Ethereum", "Bitcoin", "Solana", "Monad", "Arbitrum"];
      const createdTribeIds = [];
      
      for (let i = 0; i < tribeNames.length; i++) {
        const metadataIpfsHash = `ipfs://QmTribeMetadata${i}`;
        const tx = await tribeController.connect(creator).createTribe(
          tribeNames[i],
          metadataIpfsHash,
          [creator.address],
          0, // PUBLIC
          0, // No entry fee
          [] // Empty NFT requirements array
        );
        
        const receipt = await tx.wait();
        const event = receipt?.logs.find(x => x instanceof EventLog && x.eventName === "TribeCreated") as EventLog;
        const tribeId = event ? Number(event.args[0]) : 0;
        createdTribeIds.push(tribeId);
        process.stdout.write(`Created tribe ${tribeNames[i]} with ID: ${tribeId}\n`);
      }
      
      // Test getTotalTribesCount function (to be implemented in contract)
      const totalTribes = await tribeController.getTotalTribesCount();
      process.stdout.write(`Total tribes count: ${totalTribes}\n`);
      expect(totalTribes).to.equal(tribeNames.length);
    });

    it("Should get all tribes with pagination", async function () {
      process.stdout.write("\n=== Testing get all tribes with pagination ===\n");
      
      // Create several tribes first
      const tribeNames = ["Ethereum", "Bitcoin", "Solana", "Monad", "Arbitrum", "Polygon", "Avalanche"];
      const createdTribeIds = [];
      
      for (let i = 0; i < tribeNames.length; i++) {
        const metadataIpfsHash = `ipfs://QmTribeMetadata${i}`;
        const tx = await tribeController.connect(creator).createTribe(
          tribeNames[i],
          metadataIpfsHash,
          [creator.address],
          0, // PUBLIC
          0, // No entry fee
          [] // Empty NFT requirements array
        );
        
        const receipt = await tx.wait();
        const event = receipt?.logs.find(x => x instanceof EventLog && x.eventName === "TribeCreated") as EventLog;
        const tribeId = event ? Number(event.args[0]) : 0;
        createdTribeIds.push(tribeId);
        process.stdout.write(`Created tribe ${tribeNames[i]} with ID: ${tribeId}\n`);
      }
      
      // Test getAllTribes function with pagination (to be implemented in contract)
      const pageSize = 3;
      const page1 = await tribeController.getAllTribes(0, pageSize);
      const page2 = await tribeController.getAllTribes(pageSize, pageSize);
      const page3 = await tribeController.getAllTribes(pageSize * 2, pageSize);
      
      process.stdout.write(`Page 1 tribe count: ${page1.tribeIds.length}\n`);
      process.stdout.write(`Page 2 tribe count: ${page2.tribeIds.length}\n`);
      process.stdout.write(`Page 3 tribe count: ${page3.tribeIds.length}\n`);
      
      expect(page1.tribeIds.length).to.equal(pageSize);
      expect(page2.tribeIds.length).to.equal(pageSize);
      expect(page3.tribeIds.length).to.equal(tribeNames.length - (pageSize * 2));
      expect(page1.total).to.equal(tribeNames.length);
      expect(page2.total).to.equal(tribeNames.length);
      expect(page3.total).to.equal(tribeNames.length);
    });

    it("Should get tribe details with metadata", async function () {
      process.stdout.write("\n=== Testing get tribe details with metadata ===\n");
      
      // Create a tribe
      const tribeName = "Ethereum DAO";
      const metadataIpfsHash = "ipfs://QmTribeMetadataEthereum";
      const tx = await tribeController.connect(creator).createTribe(
        tribeName,
        metadataIpfsHash,
        [creator.address],
        0, // PUBLIC
        0, // No entry fee
        [] // Empty NFT requirements array
      );
      
      const receipt = await tx.wait();
      const event = receipt?.logs.find(x => x instanceof EventLog && x.eventName === "TribeCreated") as EventLog;
      const tribeId = event ? Number(event.args[0]) : 0;
      process.stdout.write(`Created tribe ${tribeName} with ID: ${tribeId}\n`);
      
      // Test getTribeDetails function (to be implemented in contract)
      const tribeDetails = await tribeController.getTribeDetails(tribeId);
      
      // Format tribeDetails for output to avoid BigInt serialization issues
      const formattedDetails = {
        id: Number(tribeDetails.id),
        name: tribeDetails.name,
        metadata: tribeDetails.metadata,
        admin: tribeDetails.admin,
        joinType: Number(tribeDetails.joinType),
        entryFee: Number(tribeDetails.entryFee),
        memberCount: Number(tribeDetails.memberCount),
        isActive: tribeDetails.isActive,
        canMerge: tribeDetails.canMerge
      };
      
      process.stdout.write(`Tribe details: ${JSON.stringify(formattedDetails)}\n`);
      
      expect(Number(tribeDetails.id)).to.equal(tribeId);
      expect(tribeDetails.name).to.equal(tribeName);
      expect(tribeDetails.metadata).to.equal(metadataIpfsHash);
      expect(tribeDetails.admin).to.equal(creator.address);
      expect(tribeDetails.isActive).to.equal(true);
    });
  });
}); 