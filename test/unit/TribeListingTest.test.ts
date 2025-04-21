import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { TribeController, RoleManager } from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { EventLog } from "ethers";

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
    [owner, creator, user1, user2, ...users] = await ethers.getSigners();

    try {
      // Deploy RoleManager with proxy
      const RoleManager = await ethers.getContractFactory("RoleManager");
      roleManager = await upgrades.deployProxy(RoleManager, [], { kind: 'uups' });
      await roleManager.waitForDeployment();

      // Deploy TribeController with proxy
      const TribeController = await ethers.getContractFactory("TribeController");
      tribeController = await upgrades.deployProxy(TribeController, [await roleManager.getAddress()], { kind: 'uups' });
      await tribeController.waitForDeployment();

      // Grant creator role
      await roleManager.grantRole(ethers.keccak256(ethers.toUtf8Bytes("CREATOR_ROLE")), creator.address);
    } catch (error: any) {
      throw error;
    }
  });

  describe("Tribe Listing Tests", function () {
    it("Should get total number of tribes", async function () {
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
      }
      
      // Test getTotalTribesCount function
      const totalTribes = await tribeController.getTotalTribesCount();
      expect(totalTribes).to.equal(tribeNames.length);
    });

    it("Should get all tribes with pagination", async function () {
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
      }
      
      // Test getAllTribes function with pagination
      const pageSize = 3;
      const page1 = await tribeController.getAllTribes(0, pageSize);
      const page2 = await tribeController.getAllTribes(pageSize, pageSize);
      const page3 = await tribeController.getAllTribes(pageSize * 2, pageSize);
      
      expect(page1.tribeIds.length).to.equal(pageSize);
      expect(page2.tribeIds.length).to.equal(pageSize);
      expect(page3.tribeIds.length).to.equal(tribeNames.length - (pageSize * 2));
      expect(page1.total).to.equal(tribeNames.length);
      expect(page2.total).to.equal(tribeNames.length);
      expect(page3.total).to.equal(tribeNames.length);
    });

    it("Should get tribe details with metadata", async function () {
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
      
      // Test getTribeDetails function
      const tribeDetails = await tribeController.getTribeDetails(tribeId);
      
      expect(Number(tribeDetails.id)).to.equal(tribeId);
      expect(tribeDetails.name).to.equal(tribeName);
      expect(tribeDetails.metadata).to.equal(metadataIpfsHash);
      expect(tribeDetails.admin).to.equal(creator.address);
      expect(tribeDetails.isActive).to.equal(true);
    });
  });
}); 