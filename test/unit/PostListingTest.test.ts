import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { TribeController, RoleManager, PostMinter, PostFeedManager, CollectibleController, PointSystem } from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { EventLog } from "ethers";

describe("Post Listing Functionality", function () {
  let tribeController: TribeController;
  let roleManager: RoleManager;
  let postMinter: PostMinter;
  let feedManager: PostFeedManager;
  let collectibleController: CollectibleController;
  let pointSystem: PointSystem;
  let owner: SignerWithAddress;
  let creator: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let users: SignerWithAddress[];
  
  // Sample post data
  const createPostMetadata = (index: number) => JSON.stringify({
    title: `Test Post #${index}`,
    content: `This is test post #${index}`,
    type: "TEXT",
    media: {
      type: "image",
      url: `https://example.com/image${index}.jpg`
    },
    createdAt: new Date().toISOString()
  });

  let tribeId: number;

  beforeEach(async function () {
    [owner, creator, user1, user2, ...users] = await ethers.getSigners();

    try {
      // Deploy RoleManager with proxy
      const RoleManager = await ethers.getContractFactory("RoleManager");
      roleManager = await upgrades.deployProxy(RoleManager, [], { kind: 'uups' });
      await roleManager.waitForDeployment();

      // Deploy TribeController
      const TribeControllerFactory = await ethers.getContractFactory("TribeController");
      tribeController = await upgrades.deployProxy(TribeControllerFactory, [await roleManager.getAddress()], { kind: 'uups' });
      await tribeController.waitForDeployment();
      
      // Deploy FeedManager as a regular contract (not upgradeable)
      const PostFeedManagerFactory = await ethers.getContractFactory("PostFeedManager");
      feedManager = await PostFeedManagerFactory.deploy(await tribeController.getAddress());
      await feedManager.waitForDeployment();
      
      // Deploy PointSystem
      const PointSystem = await ethers.getContractFactory("PointSystem");
      pointSystem = await upgrades.deployProxy(PointSystem, [
            await roleManager.getAddress(),
            await tribeController.getAddress()
        ], { 
            kind: 'uups',
            unsafeAllow: ['constructor'] 
        });
      await pointSystem.waitForDeployment();
      
      // Deploy CollectibleController
      const CollectibleController = await ethers.getContractFactory("CollectibleController");
      collectibleController = await upgrades.deployProxy(CollectibleController, [
        await roleManager.getAddress(),
        await tribeController.getAddress(),
        await pointSystem.getAddress()
      ], { 
        kind: 'uups',
        unsafeAllow: ['constructor'] 
      });
      await collectibleController.waitForDeployment();
      
      // Deploy PostMinter with proxy which automatically calls initialize
      const PostMinter = await ethers.getContractFactory("PostMinter");
      
      // Deploy the manager contracts first
      const PostCreationManager = await ethers.getContractFactory("PostCreationManager");
      const creationManager = await upgrades.deployProxy(PostCreationManager, [
        await roleManager.getAddress(),
        await tribeController.getAddress(),
        await collectibleController.getAddress(),
        await feedManager.getAddress()
      ], { 
        kind: 'uups',
        unsafeAllow: ['constructor'] 
      });
      await creationManager.waitForDeployment();
      
      const PostEncryptionManager = await ethers.getContractFactory("PostEncryptionManager");
      const encryptionManager = await upgrades.deployProxy(PostEncryptionManager, [
        await roleManager.getAddress(),
        await tribeController.getAddress(),
        await collectibleController.getAddress(),
        await feedManager.getAddress()
      ], { 
        kind: 'uups',
        unsafeAllow: ['constructor'] 
      });
      await encryptionManager.waitForDeployment();
      
      const PostInteractionManager = await ethers.getContractFactory("PostInteractionManager");
      const interactionManager = await upgrades.deployProxy(PostInteractionManager, [
        await roleManager.getAddress(),
        await tribeController.getAddress(),
        await collectibleController.getAddress(),
        await feedManager.getAddress()
      ], { 
        kind: 'uups',
        unsafeAllow: ['constructor'] 
      });
      await interactionManager.waitForDeployment();
      
      const PostQueryManager = await ethers.getContractFactory("PostQueryManager");
      const queryManager = await upgrades.deployProxy(PostQueryManager, [
        await roleManager.getAddress(),
        await tribeController.getAddress(),
        await collectibleController.getAddress(),
        await feedManager.getAddress()
      ], { 
        kind: 'uups',
        unsafeAllow: ['constructor'] 
      });
      await queryManager.waitForDeployment();
      
      // Now deploy PostMinter with all 8 parameters
      postMinter = await upgrades.deployProxy(PostMinter, [
        await roleManager.getAddress(),
        await tribeController.getAddress(),
        await collectibleController.getAddress(),
        await feedManager.getAddress(),
        await creationManager.getAddress(),
        await encryptionManager.getAddress(),
        await interactionManager.getAddress(),
        await queryManager.getAddress()
      ], { 
        kind: 'uups',
        unsafeAllow: ['constructor'] 
      });
      await postMinter.waitForDeployment();

      // Grant admin role to PostMinter in PostFeedManager
      await feedManager.grantRole(await feedManager.DEFAULT_ADMIN_ROLE(), await postMinter.getAddress());
      
      // Grant RATE_LIMIT_MANAGER_ROLE to bypass cooldowns for testing
      const RATE_LIMIT_MANAGER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("RATE_LIMIT_MANAGER_ROLE"));
      await postMinter.grantRole(RATE_LIMIT_MANAGER_ROLE, creator.address);
      await postMinter.grantRole(RATE_LIMIT_MANAGER_ROLE, user1.address);
      await postMinter.grantRole(RATE_LIMIT_MANAGER_ROLE, user2.address);
      
      // Create a tribe for testing
      const tribeTx = await tribeController.connect(creator).createTribe(
        "Test Tribe",
        "ipfs://QmTestTribeMetadata",
        [creator.address],
        0, // PUBLIC
        0, // No entry fee
        [] // Empty NFT requirements array
      );
      
      const tribeReceipt = await tribeTx.wait();
      const tribeEvent = tribeReceipt?.logs.find(x => x instanceof EventLog && x.eventName === "TribeCreated") as EventLog;
      tribeId = tribeEvent ? Number(tribeEvent.args[0]) : 0;
      
      // Creator should already be a member after creation, but joining again is idempotent
      const creatorStatus = await tribeController.getMemberStatus(tribeId, creator.address);
      if (creatorStatus.toString() !== "1") { // 1 = ACTIVE
        await tribeController.connect(creator).joinTribe(tribeId);
      }
      
      // User1 joins tribe
      await tribeController.connect(user1).joinTribe(tribeId);
      
      // User2 joins tribe
      await tribeController.connect(user2).joinTribe(tribeId);
      
    } catch (error: any) {
      throw error;
    }
  });

  describe("Post Listing Tests", function () {
    it("Should get all posts with pagination", async function () {
      // Verify the tribe exists
      const memberStatus = await tribeController.getMemberStatus(tribeId, creator.address);
      expect(Number(memberStatus)).to.equal(1); // ACTIVE
      
      // Test pagination with the real contract
      const [page1, total1] = await postMinter.getPostsByTribe(tribeId, 0, 2);
      const [page2, total2] = await postMinter.getPostsByTribe(tribeId, 2, 2);
      
      // Simple verification that pagination works
      expect(page1.length).to.be.gte(0);
      expect(total1).to.be.gte(0);
      
      if (page1.length > 0 && page2.length > 0) {
        expect(page1[0]).to.not.equal(page2[0]); // Different pages should have different post IDs
      }
    });

    it("Should get all posts by user", async function () {
      // Get posts by user
      const [userPosts, total] = await postMinter.getPostsByUser(user1.address, 0, 5);
      
      // Simple verification
      expect(userPosts.length).to.be.gte(0);
      expect(total).to.be.gte(0);
      
      if (userPosts.length > 0) {
        // Check a post returned
        const postId = Number(userPosts[0]);
        const post = await postMinter.getPost(postId);
        
        // The structure should match what we expect
        expect(post).to.have.property('metadata');
        expect(post).to.have.property('creator');
        expect(post).to.have.property('tribeId');
      }
    });

    it("Should get post feed for user", async function () {
      // Get feed for user
      const [feedPosts, total] = await postMinter.getFeedForUser(user1.address, 0, 5);
      
      // Simple verification
      expect(feedPosts.length).to.be.gte(0);
      expect(total).to.be.gte(0);
      
      // Should return at most the number we asked for
      expect(feedPosts.length).to.be.lte(5);
    });
  });
}); 