import { expect } from "chai";
import { ethers } from "hardhat";
import { PostMinter } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("PostMinter", function () {
  let postMinter: PostMinter;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  const TRIBE_ID = 1;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    
    const PostMinter = await ethers.getContractFactory("PostMinter");
    postMinter = await PostMinter.deploy();
    await postMinter.waitForDeployment();
  });

  describe("Journey 4.1: Create Post in Tribe", function () {
    it("Should allow creating a post", async function () {
      const content = "Test post content";

      const tx = await postMinter.connect(user1).createPost(TRIBE_ID, content);
      const receipt = await tx.wait();
      
      // Check event
      const event = receipt?.logs[0];
      expect(event?.topics[1]).to.equal(ethers.zeroPadValue(ethers.toBeHex(0), 32)); // indexed postId
      expect(event?.topics[2]).to.equal(ethers.zeroPadValue(ethers.toBeHex(TRIBE_ID), 32)); // indexed tribeId
      expect(event?.topics[3]).to.equal(ethers.zeroPadValue(user1.address, 32)); // indexed creator
    });

    it("Should increment postId after each post", async function () {
      // Create first post
      await postMinter.connect(user1).createPost(TRIBE_ID, "First post");

      // Create second post
      await postMinter.connect(user2).createPost(TRIBE_ID, "Second post");

      expect(await postMinter.nextPostId()).to.equal(2);
    });

    it("Should allow multiple posts from the same user", async function () {
      const posts = [
        "First post content",
        "Second post content",
        "Third post content"
      ];

      for (const content of posts) {
        const tx = await postMinter.connect(user1).createPost(TRIBE_ID, content);
        const receipt = await tx.wait();
        const event = receipt?.logs[0];
        expect(event?.topics[3]).to.equal(ethers.zeroPadValue(user1.address, 32)); // indexed creator
      }

      expect(await postMinter.nextPostId()).to.equal(posts.length);
    });
  });

  describe("Journey 4.2: Create Post Without Permission", function () {
    // Note: Current implementation doesn't have permission checks
    // These tests should be updated when permission logic is added
    
    it("Should track post creation order", async function () {
      // Create posts from different users
      await postMinter.connect(user1).createPost(TRIBE_ID, "Post from user1");
      await postMinter.connect(user2).createPost(TRIBE_ID, "Post from user2");
      await postMinter.connect(user1).createPost(TRIBE_ID, "Another post from user1");

      expect(await postMinter.nextPostId()).to.equal(3);
    });

    it("Should emit events with correct parameters", async function () {
      const content = "Test post with specific content";
      
      const tx = await postMinter.connect(user1).createPost(TRIBE_ID, content);
      const receipt = await tx.wait();
      
      const event = receipt?.logs[0];
      
      // Verify all indexed parameters
      expect(event?.topics[1]).to.equal(ethers.zeroPadValue(ethers.toBeHex(0), 32)); // postId
      expect(event?.topics[2]).to.equal(ethers.zeroPadValue(ethers.toBeHex(TRIBE_ID), 32)); // tribeId
      expect(event?.topics[3]).to.equal(ethers.zeroPadValue(user1.address, 32)); // creator
      
      // Verify content in event data
      const decodedData = ethers.AbiCoder.defaultAbiCoder().decode(
        ["string"],
        ethers.dataSlice(event?.data || "0x", 0)
      );
      expect(decodedData[0]).to.equal(content);
    });
  });
}); 