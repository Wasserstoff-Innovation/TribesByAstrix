import { expect } from "chai";
import { ethers } from "hardhat";
import { ProfileNFTMinter, RoleManager } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("ProfileNFTMinter", function () {
  let profileNFTMinter: ProfileNFTMinter;
  let roleManager: RoleManager;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  const MINT_FEE = ethers.parseEther("0.01"); // 0.01 ETH

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    
    // Deploy RoleManager first
    const RoleManager = await ethers.getContractFactory("RoleManager");
    roleManager = await RoleManager.deploy();
    await roleManager.waitForDeployment();

    // Deploy ProfileNFTMinter with RoleManager address
    const ProfileNFTMinter = await ethers.getContractFactory("ProfileNFTMinter");
    profileNFTMinter = await ProfileNFTMinter.deploy(await roleManager.getAddress());
    await profileNFTMinter.waitForDeployment();

    // Authorize ProfileNFTMinter to assign FAN_ROLE
    await roleManager.authorizeFanAssigner(await profileNFTMinter.getAddress());
  });

  describe("Profile Creation", function () {
    it("Should allow creating a profile", async function () {
      const username = "testuser";
      const metadataURI = "ipfs://QmTest";

      const tx = await profileNFTMinter.connect(user1).createProfile(
        username,
        metadataURI
      );

      // Wait for the transaction
      const receipt = await tx.wait();
      
      // Find the ProfileCreated event
      const createEvent = receipt?.logs.find(
        (log: any) => log.topics[0] === ethers.id("ProfileCreated(uint256,address,string)")
      );
      expect(createEvent).to.not.be.undefined;

      // Get the token ID from the event
      const tokenId = Number(createEvent?.topics[1]);

      // Check token ownership
      expect(await profileNFTMinter.ownerOf(tokenId)).to.equal(user1.address);

      // Get profile data
      const profileData = await profileNFTMinter.getProfileByTokenId(tokenId);
      expect(profileData.username).to.equal(username);
      expect(profileData.metadataURI).to.equal(metadataURI);
    });

    it("Should prevent duplicate usernames", async function () {
      const username = "testuser";
      const metadataURI = "ipfs://QmTest";

      // First creation should succeed
      await profileNFTMinter.connect(user1).createProfile(
        username,
        metadataURI
      );

      // Second creation with same username should fail
      await expect(
        profileNFTMinter.connect(user2).createProfile(
          username,
          metadataURI
        )
      ).to.be.revertedWith("Username already taken");
    });
  });

  describe("Profile Updates", function () {
    let tokenId: number;

    beforeEach(async function () {
      // Create a profile for testing updates
      const tx = await profileNFTMinter.connect(user1).createProfile(
        "testuser",
        "ipfs://QmTest"
      );
      const receipt = await tx.wait();
      const createEvent = receipt?.logs.find(
        (log: any) => log.topics[0] === ethers.id("ProfileCreated(uint256,address,string)")
      );
      tokenId = Number(createEvent?.topics[1]);
    });

    it("Should allow owner to update profile metadata", async function () {
      const newMetadataURI = "ipfs://QmNewTest";

      await expect(
        profileNFTMinter.connect(user1).updateProfileMetadata(
          tokenId,
          newMetadataURI
        )
      ).to.not.be.reverted;

      const profileData = await profileNFTMinter.getProfileByTokenId(tokenId);
      expect(profileData.metadataURI).to.equal(newMetadataURI);
    });

    it("Should prevent non-owner from updating metadata", async function () {
      await expect(
        profileNFTMinter.connect(user2).updateProfileMetadata(
          tokenId,
          "ipfs://QmUnauthorized"
        )
      ).to.be.revertedWith("Not token owner");
    });
  });

  describe("Username Management", function () {
    it("Should correctly track username availability", async function () {
      const username = "uniqueuser";
      const metadataURI = "ipfs://test";

      // Check availability before creation
      expect(await profileNFTMinter.usernameExists(username)).to.be.false;

      // Create profile
      await profileNFTMinter.connect(user1).createProfile(
        username,
        metadataURI
      );

      // Check availability after creation
      expect(await profileNFTMinter.usernameExists(username)).to.be.true;
    });

    it("Should handle username case sensitivity correctly", async function () {
      const username = "CamelCase";
      const similarUsername = "camelcase";
      const metadataURI = "ipfs://test";

      // Create with first username
      await profileNFTMinter.connect(user1).createProfile(
        username,
        metadataURI
      );

      // Try to create with similar username (different case)
      await expect(
        profileNFTMinter.connect(user2).createProfile(
          similarUsername,
          metadataURI
        )
      ).to.be.revertedWith("Username already taken");
    });

    it("Should validate username format", async function () {
      const metadataURI = "ipfs://test";

      // Empty username
      await expect(
        profileNFTMinter.connect(user1).createProfile(
          "",
          metadataURI
        )
      ).to.be.revertedWith("Invalid username");

      // Too short username
      await expect(
        profileNFTMinter.connect(user1).createProfile(
          "ab",
          metadataURI
        )
      ).to.be.revertedWith("Invalid username");

      // Too long username
      await expect(
        profileNFTMinter.connect(user1).createProfile(
          "a".repeat(33),
          metadataURI
        )
      ).to.be.revertedWith("Invalid username");

      // Invalid characters
      await expect(
        profileNFTMinter.connect(user1).createProfile(
          "user@name",
          metadataURI
        )
      ).to.be.revertedWith("Invalid username");
    });
  });

  describe("Profile NFT Read Operations", function () {
    it("Should return correct profile data", async function () {
      const username = "testuser";
      const metadataURI = "ipfs://test";

      // Create profile
      const tx = await profileNFTMinter.connect(user1).createProfile(
        username,
        metadataURI
      );
      const receipt = await tx.wait();
      const createEvent = receipt?.logs.find(
        (log: any) => log.topics[0] === ethers.id("ProfileCreated(uint256,address,string)")
      );
      const tokenId = Number(createEvent?.topics[1]);

      // Get profile data
      const profileData = await profileNFTMinter.getProfileByTokenId(tokenId);
      expect(profileData.username).to.equal(username);
      expect(profileData.metadataURI).to.equal(metadataURI);
      expect(profileData.owner).to.equal(user1.address);
    });

    it("Should return correct token ID by username", async function () {
      const username = "testuser";
      const metadataURI = "ipfs://test";

      // Create profile
      const tx = await profileNFTMinter.connect(user1).createProfile(
        username,
        metadataURI
      );
      const receipt = await tx.wait();
      const createEvent = receipt?.logs.find(
        (log: any) => log.topics[0] === ethers.id("ProfileCreated(uint256,address,string)")
      );
      const expectedTokenId = Number(createEvent?.topics[1]);

      // Get token ID by username
      const tokenId = await profileNFTMinter.getTokenIdByUsername(username);
      expect(Number(tokenId)).to.equal(expectedTokenId);
    });

    it("Should handle queries for non-existent profiles", async function () {
      // Query non-existent username
      await expect(
        profileNFTMinter.getTokenIdByUsername("nonexistent")
      ).to.be.revertedWith("Username does not exist");

      // Query non-existent token ID
      await expect(
        profileNFTMinter.getProfileByTokenId(999)
      ).to.be.revertedWithCustomError(profileNFTMinter, "ERC721NonexistentToken");
    });
  });
}); 