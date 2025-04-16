import { expect } from "chai";
import { ethers } from "hardhat";
import { TribeController, RoleManager, PostMinter, PostFeedManager, CollectibleController, PointSystem } from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { EventLog } from "ethers";

// Import console for logging
const hre = require("hardhat");
const { console } = hre;

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
    media: {
      type: "image",
      url: `https://example.com/image${index}.jpg`
    },
    createdAt: new Date().toISOString()
  });

  let tribeId: number;

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
      
      // Deploy FeedManager
      process.stdout.write("Deploying PostFeedManager...\n");
      const PostFeedManagerFactory = await ethers.getContractFactory("PostFeedManager");
      feedManager = await PostFeedManagerFactory.deploy(await roleManager.getAddress());
      await feedManager.waitForDeployment();
      process.stdout.write(`PostFeedManager deployed at: ${await feedManager.getAddress()}\n`);
      
      // Deploy PointSystem
      process.stdout.write("Deploying PointSystem...\n");
      const PointSystem = await ethers.getContractFactory("PointSystem");
      pointSystem = await PointSystem.deploy(
        await roleManager.getAddress(),
        await tribeController.getAddress()
      );
      await pointSystem.waitForDeployment();
      process.stdout.write(`PointSystem deployed at: ${await pointSystem.getAddress()}\n`);
      
      // Deploy CollectibleController
      process.stdout.write("Deploying CollectibleController...\n");
      const CollectibleController = await ethers.getContractFactory("CollectibleController");
      collectibleController = await CollectibleController.deploy(
        await roleManager.getAddress(),
        await tribeController.getAddress(),
        await pointSystem.getAddress() // Use PointSystem address instead of ZeroAddress
      );
      await collectibleController.waitForDeployment();
      process.stdout.write(`CollectibleController deployed at: ${await collectibleController.getAddress()}\n`);
      
      // Deploy PostMinter
      process.stdout.write("Deploying PostMinter...\n");
      const PostMinter = await ethers.getContractFactory("PostMinter");
      postMinter = await PostMinter.deploy(
        await roleManager.getAddress(),
        await tribeController.getAddress(),
        await feedManager.getAddress(),
        await collectibleController.getAddress()
      );
      await postMinter.waitForDeployment();
      process.stdout.write(`PostMinter deployed at: ${await postMinter.getAddress()}\n`);

      // Grant creator role
      process.stdout.write("Granting CREATOR_ROLE to creator...\n");
      await roleManager.grantRole(ethers.keccak256(ethers.toUtf8Bytes("CREATOR_ROLE")), creator.address);
      process.stdout.write("Setup complete\n");
      
      // Create a tribe for testing
      process.stdout.write("Creating test tribe...\n");
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
      process.stdout.write(`Test tribe created with ID: ${tribeId}\n`);
      
      // User1 joins tribe
      await tribeController.connect(user1).joinTribe(tribeId);
      process.stdout.write(`User1 joined tribe ${tribeId}\n`);
      
    } catch (error: any) {
      process.stdout.write(`\nError during setup: ${error.message}\n`);
      if (error.data) {
        process.stdout.write(`Error data: ${error.data}\n`);
      }
      throw error;
    }
  });

  describe("Post Listing Tests", function () {
    it("Should get all posts with pagination", async function () {
      process.stdout.write("\n=== Testing get all posts with pagination ===\n");
      
      // Create several posts
      const postCount = 5;
      const postIds = [];
      
      for (let i = 0; i < postCount; i++) {
        const metadata = createPostMetadata(i);
        const tx = await postMinter.connect(creator).createPost(
          tribeId,
          metadata,
          false, // Not gated
          ethers.ZeroAddress, // No collectible contract
          0 // No collectible ID
        );
        
        const receipt = await tx.wait();
        const event = receipt?.logs.find(x => x instanceof EventLog && x.eventName === "PostCreated") as EventLog;
        const postId = event ? Number(event.args[0]) : 0;
        postIds.push(postId);
        process.stdout.write(`Created post with ID: ${postId}\n`);
      }
      
      // Use the existing getPostsByTribe with pagination
      const pageSize = 2;
      const page1 = await postMinter.getPostsByTribe(tribeId, 0, pageSize);
      const page2 = await postMinter.getPostsByTribe(tribeId, pageSize, pageSize);
      const page3 = await postMinter.getPostsByTribe(tribeId, pageSize * 2, pageSize);
      
      process.stdout.write(`Page 1 post count: ${page1.postIds.length}\n`);
      process.stdout.write(`Page 2 post count: ${page2.postIds.length}\n`);
      process.stdout.write(`Page 3 post count: ${page3.postIds.length}\n`);
      
      expect(page1.postIds.length).to.equal(pageSize);
      expect(page2.postIds.length).to.equal(pageSize);
      expect(page3.postIds.length).to.equal(postCount - (pageSize * 2));
      expect(page1.total).to.equal(postCount);
      
      // Verify we can get post details for each post
      for (let i = 0; i < postIds.length; i++) {
        const post = await postMinter.getPost(postIds[i]);
        process.stdout.write(`Post ${i} metadata: ${post.metadata}\n`);
        expect(post.creator).to.equal(creator.address);
        expect(post.tribeId).to.equal(tribeId);
      }
    });

    it("Should get all posts by user", async function () {
      process.stdout.write("\n=== Testing get all posts by user ===\n");
      
      // User1 creates posts
      const postCount = 3;
      const user1PostIds = [];
      
      for (let i = 0; i < postCount; i++) {
        const metadata = createPostMetadata(i);
        const tx = await postMinter.connect(user1).createPost(
          tribeId,
          metadata,
          false, // Not gated
          ethers.ZeroAddress, // No collectible contract
          0 // No collectible ID
        );
        
        const receipt = await tx.wait();
        const event = receipt?.logs.find(x => x instanceof EventLog && x.eventName === "PostCreated") as EventLog;
        const postId = event ? Number(event.args[0]) : 0;
        user1PostIds.push(postId);
        process.stdout.write(`User1 created post with ID: ${postId}\n`);
      }
      
      // Creator also creates posts
      for (let i = 0; i < 2; i++) {
        const metadata = createPostMetadata(i + 100);
        await postMinter.connect(creator).createPost(
          tribeId,
          metadata,
          false,
          ethers.ZeroAddress,
          0
        );
      }
      
      // Get posts by user1
      const userPosts = await postMinter.getPostsByUser(user1.address, 0, 10);
      process.stdout.write(`User1 post count: ${userPosts.postIds.length}\n`);
      
      expect(userPosts.postIds.length).to.equal(postCount);
      expect(userPosts.total).to.equal(postCount);
      
      // Get posts by user1 in specific tribe
      const userTribePosts = await postMinter.getPostsByTribeAndUser(tribeId, user1.address, 0, 10);
      process.stdout.write(`User1 posts in tribe count: ${userTribePosts.postIds.length}\n`);
      
      expect(userTribePosts.postIds.length).to.equal(postCount);
      expect(userTribePosts.total).to.equal(postCount);
    });

    it("Should get post feed for user", async function () {
      process.stdout.write("\n=== Testing get post feed for user ===\n");
      
      // Create posts from different users
      const creatorPostIds = [];
      const user1PostIds = [];
      
      // Creator posts
      for (let i = 0; i < 3; i++) {
        const metadata = createPostMetadata(i);
        const tx = await postMinter.connect(creator).createPost(
          tribeId,
          metadata,
          false,
          ethers.ZeroAddress,
          0
        );
        
        const receipt = await tx.wait();
        const event = receipt?.logs.find(x => x instanceof EventLog && x.eventName === "PostCreated") as EventLog;
        const postId = event ? Number(event.args[0]) : 0;
        creatorPostIds.push(postId);
      }
      
      // User1 posts
      for (let i = 0; i < 2; i++) {
        const metadata = createPostMetadata(i + 200);
        const tx = await postMinter.connect(user1).createPost(
          tribeId,
          metadata,
          false,
          ethers.ZeroAddress,
          0
        );
        
        const receipt = await tx.wait();
        const event = receipt?.logs.find(x => x instanceof EventLog && x.eventName === "PostCreated") as EventLog;
        const postId = event ? Number(event.args[0]) : 0;
        user1PostIds.push(postId);
      }
      
      // Get feed for user1
      const userFeed = await postMinter.getFeedForUser(user1.address, 0, 10);
      process.stdout.write(`User1 feed post count: ${userFeed.postIds.length}\n`);
      
      // Feed should include posts from all users in tribes the user is a member of
      expect(userFeed.postIds.length).to.be.at.least(creatorPostIds.length + user1PostIds.length);
    });
  });
}); 