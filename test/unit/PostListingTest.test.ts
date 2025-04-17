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
    type: "TEXT",
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
      feedManager = await PostFeedManagerFactory.deploy(await tribeController.getAddress());
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
        await collectibleController.getAddress(),
        await feedManager.getAddress()
      );
      await postMinter.waitForDeployment();
      process.stdout.write(`PostMinter deployed at: ${await postMinter.getAddress()}\n`);

      // Grant admin role to PostMinter in PostFeedManager
      process.stdout.write("Granting admin role to PostMinter in PostFeedManager...\n");
      await feedManager.grantRole(await feedManager.DEFAULT_ADMIN_ROLE(), await postMinter.getAddress());

      // Grant creator role
      process.stdout.write("Granting CREATOR_ROLE to creator...\n");
      await roleManager.grantRole(ethers.keccak256(ethers.toUtf8Bytes("CREATOR_ROLE")), creator.address);

      // Grant RATE_LIMIT_MANAGER_ROLE to bypass cooldowns for testing
      process.stdout.write("Granting RATE_LIMIT_MANAGER_ROLE to test users...\n");
      const RATE_LIMIT_MANAGER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("RATE_LIMIT_MANAGER_ROLE"));
      await postMinter.grantRole(RATE_LIMIT_MANAGER_ROLE, creator.address);
      await postMinter.grantRole(RATE_LIMIT_MANAGER_ROLE, user1.address);
      await postMinter.grantRole(RATE_LIMIT_MANAGER_ROLE, user2.address);

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
      
      // Creator joins tribe (even though they created it, just to be explicit)
      try {
        const creatorStatus = await tribeController.getMemberStatus(tribeId, creator.address);
        if (creatorStatus.toString() != "1") { // 1 = ACTIVE
          await tribeController.connect(creator).joinTribe(tribeId);
          process.stdout.write(`Creator joined tribe ${tribeId}\n`);
        } else {
          process.stdout.write(`Creator already a member of tribe ${tribeId}\n`);
        }
      } catch (error) {
        process.stdout.write(`Note: Creator already a member of tribe ${tribeId}\n`);
      }
      
      // User1 joins tribe
      await tribeController.connect(user1).joinTribe(tribeId);
      process.stdout.write(`User1 joined tribe ${tribeId}\n`);
      
      // User2 joins tribe
      await tribeController.connect(user2).joinTribe(tribeId);
      process.stdout.write(`User2 joined tribe ${tribeId}\n`);
      
    } catch (error: any) {
      process.stdout.write(`\nError during setup: ${error.message}\n`);
      if (error.data) {
        process.stdout.write(`Error data: ${error.data}\n`);
      }
      throw error;
    }
  });

  describe("Post Listing Tests", function () {
    it("Should execute a simple test function", async function () {
      process.stdout.write("\n=== Testing simple function call ===\n");
      
      // Test the simple return function
      try {
        const result = await (postMinter as any).testCreate();
        process.stdout.write(`Simple function returned: ${result}\n`);
        expect(Number(result)).to.equal(42);
      } catch (error: any) {
        process.stdout.write(`Error calling testCreate: ${error.message}\n`);
        if (error.data) {
          process.stdout.write(`Error data: ${error.data}\n`);
        }
        throw error;
      }
    });
    
    it("Should get all posts with pagination", async function () {
      process.stdout.write("\n=== Testing get all posts with pagination ===\n");
      
      // Verify tribe membership before creating posts
      process.stdout.write(`Verifying creator is an active member of tribe ${tribeId}...\n`);
      const creatorStatus = await tribeController.getMemberStatus(tribeId, creator.address);
      process.stdout.write(`Creator membership status: ${creatorStatus}\n`);
      
      // Debug: Print actual member status value
      const creatorStatusNumeric = await tribeController.getMemberStatus(tribeId, creator.address);
      process.stdout.write(`Creator membership status numeric value: ${creatorStatusNumeric}\n`);
      
      // Check if creator is an active member directly from tribeController
      const isCreatorActiveMember = (Number(await tribeController.getMemberStatus(tribeId, creator.address)) === 1); // 1 = ACTIVE
      process.stdout.write(`Is creator an active tribe member? ${isCreatorActiveMember}\n`);
      expect(isCreatorActiveMember).to.be.true;
      
      // Create posts
      process.stdout.write(`Creating posts for pagination testing...\n`);
      const postCount = 5;
      const postIds = [];
      
      for (let i = 0; i < postCount; i++) {
        process.stdout.write(`Creating post ${i} by creator...\n`);
        const metadata = createPostMetadata(i);
        try {
          process.stdout.write(`About to call createPost with tribeId=${tribeId}, metadata=${metadata}\n`);
          const tx = await postMinter.connect(creator).createPost(
            tribeId,
            metadata,
            false, // not gated
            ethers.ZeroAddress, // no collectible contract
            0 // no collectible ID
          );
          
          const receipt = await tx.wait();
          const event = receipt?.logs.find((x: any) => x instanceof EventLog && x.eventName === "PostCreated") as EventLog;
          const postId = event ? Number(event.args[0]) : 0;
          postIds.push(postId);
          process.stdout.write(`Created post with ID: ${postId}\n`);
        } catch (error: any) {
          process.stdout.write(`Error creating post: ${error.message}\n`);
          if (error.data) {
            process.stdout.write(`Error data: ${error.data}\n`);
          }
          if (error.code) {
            process.stdout.write(`Error code: ${error.code}\n`);
          }
          if (error.reason) {
            process.stdout.write(`Error reason: ${error.reason}\n`);
          }
          throw error;
        }
      }
      
      // Test pagination
      process.stdout.write(`Testing pagination...\n`);
      const pageSize = 2;
      
      // Get first page (posts 0-1)
      const page1 = await postMinter.getPostsByTribe(tribeId, 0, pageSize);
      process.stdout.write(`Page 1 post count: ${page1.postIds.length}\n`);
      
      // Get second page (posts 2-3)
      const page2 = await postMinter.getPostsByTribe(tribeId, pageSize, pageSize);
      process.stdout.write(`Page 2 post count: ${page2.postIds.length}\n`);
      
      // Get third page (post 4)
      const page3 = await postMinter.getPostsByTribe(tribeId, pageSize * 2, pageSize);
      process.stdout.write(`Page 3 post count: ${page3.postIds.length}\n`);
      
      // Verify pagination results
      expect(Number(page1.postIds.length)).to.equal(pageSize);
      expect(Number(page2.postIds.length)).to.equal(pageSize);
      expect(Number(page3.postIds.length)).to.equal(postCount - (pageSize * 2));
      expect(Number(page1.total)).to.equal(postCount);
      
      // Verify post details
      for (let i = 0; i < postIds.length; i++) {
        const post = await postMinter.getPost(postIds[i]);
        process.stdout.write(`Post ${i} metadata: ${post.metadata}\n`);
        expect(post.creator).to.equal(creator.address);
        expect(Number(post.tribeId)).to.equal(tribeId);
      }
    });

    it("Should get all posts by user", async function () {
      process.stdout.write("\n=== Testing get all posts by user ===\n");
      
      // Create posts as user1
      process.stdout.write(`Creating posts by user1...\n`);
      const postCount = 3;
      const postIds = [];
      
      for (let i = 0; i < postCount; i++) {
        const metadata = createPostMetadata(i);
        try {
          const tx = await postMinter.connect(user1).createPost(
            tribeId,
            metadata,
            false, // not gated
            ethers.ZeroAddress, // no collectible contract
            0 // no collectible ID
          );
          
          const receipt = await tx.wait();
          const event = receipt?.logs.find((x: any) => x instanceof EventLog && x.eventName === "PostCreated") as EventLog;
          const postId = event ? Number(event.args[0]) : 0;
          postIds.push(postId);
          process.stdout.write(`Created post with ID: ${postId}\n`);
        } catch (error: any) {
          process.stdout.write(`Error creating post: ${error.message}\n`);
          throw error;
        }
      }
      
      // Get posts by user
      const userPosts = await postMinter.getPostsByUser(user1.address, 0, 10);
      process.stdout.write(`Retrieved ${userPosts.postIds.length} posts for user1\n`);
      
      // Verify results
      expect(Number(userPosts.postIds.length)).to.be.at.least(postCount);
      
      // Check if all created posts are included in the results
      for (let i = 0; i < postIds.length; i++) {
        // Convert all IDs to numbers for comparison
        const postIdsAsNumbers = userPosts.postIds.map((id: bigint) => Number(id));
        expect(postIdsAsNumbers).to.include(postIds[i]);
        
        // Verify each post creator is user1
        const post = await postMinter.getPost(postIds[i]);
        expect(post.creator).to.equal(user1.address);
      }
    });

    it("Should get post feed for user", async function () {
      process.stdout.write("\n=== Testing get post feed for user ===\n");
      
      // Make sure we have some posts in the tribe from different users
      process.stdout.write(`Creating posts for the feed from different users...\n`);
      
      // Create a post from user1
      const user1Metadata = createPostMetadata(100);
      const user1Tx = await postMinter.connect(user1).createPost(
        tribeId,
        user1Metadata,
        false,
        ethers.ZeroAddress,
        0
      );
      const user1Receipt = await user1Tx.wait();
      const user1Event = user1Receipt?.logs.find((x: any) => x instanceof EventLog && x.eventName === "PostCreated") as EventLog;
      const user1PostId = user1Event ? Number(user1Event.args[0]) : 0;
      process.stdout.write(`Created post from user1 with ID: ${user1PostId}\n`);
      
      // Create a post from user2
      const user2Metadata = createPostMetadata(200);
      const user2Tx = await postMinter.connect(user2).createPost(
        tribeId,
        user2Metadata,
        false,
        ethers.ZeroAddress,
        0
      );
      const user2Receipt = await user2Tx.wait();
      const user2Event = user2Receipt?.logs.find((x: any) => x instanceof EventLog && x.eventName === "PostCreated") as EventLog;
      const user2PostId = user2Event ? Number(user2Event.args[0]) : 0;
      process.stdout.write(`Created post from user2 with ID: ${user2PostId}\n`);
      
      // Get feed for user1
      const feed = await postMinter.getFeedForUser(user1.address, 0, 10);
      process.stdout.write(`Retrieved ${feed.postIds.length} posts in feed for user1\n`);
      
      // Verify feed includes both posts since user1 is a member of the tribe
      expect(Number(feed.postIds.length)).to.be.at.least(2);
      
      // Convert feed post IDs to numbers for comparison
      const feedPostIdsAsNumbers = feed.postIds.map((id: bigint) => Number(id));
      
      // Check if both posts are in the feed
      expect(feedPostIdsAsNumbers).to.include(user1PostId);
      expect(feedPostIdsAsNumbers).to.include(user2PostId);
      
      // Log feed contents for debugging
      process.stdout.write(`Feed post IDs: ${feedPostIdsAsNumbers.join(', ')}\n`);
      process.stdout.write(`Expected post IDs: ${user1PostId}, ${user2PostId}\n`);
    });
  });
}); 