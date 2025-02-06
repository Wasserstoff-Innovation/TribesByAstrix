import { expect } from "chai";
import { ethers } from "hardhat";
import { ProfileNFTMinter, RoleManager } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("Profile Creation and Username Lookup", function () {
  let profileNFTMinter: ProfileNFTMinter;
  let roleManager: RoleManager;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  const TEST_USERNAME = "demousername";
  const TEST_METADATA = "ipfs://QmTest";

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    
    // Deploy RoleManager
    const RoleManager = await ethers.getContractFactory("RoleManager");
    roleManager = await RoleManager.deploy();
    await roleManager.waitForDeployment();

    // Deploy ProfileNFTMinter
    const ProfileNFTMinter = await ethers.getContractFactory("ProfileNFTMinter");
    profileNFTMinter = await ProfileNFTMinter.deploy(await roleManager.getAddress());
    await profileNFTMinter.waitForDeployment();

    // Authorize ProfileNFTMinter to assign FAN_ROLE
    await roleManager.authorizeFanAssigner(await profileNFTMinter.getAddress());
  });

  describe("Profile Creation and Lookup Flow", function () {
    it("Should lookup profile from address -> tokenId -> username", async function () {
      // 1. Create multiple profiles to ensure we're getting the correct one
      console.log("\nCreating test profiles...");
      
      // Create profile for user1
      const tx1 = await profileNFTMinter.connect(user1).createProfile(
        TEST_USERNAME,
        TEST_METADATA
      );
      const receipt1 = await tx1.wait();
      
      // Create profile for user2
      const tx2 = await profileNFTMinter.connect(user2).createProfile(
        "anotheruser",
        TEST_METADATA
      );
      const receipt2 = await tx2.wait();

      // 2. Start lookup flow from user1's address
      console.log("\nStarting lookup flow for address:", user1.address);

      // Get token balance for the address
      const balance = await profileNFTMinter.balanceOf(user1.address);
      console.log("Profile NFT balance:", Number(balance));
      expect(balance).to.equal(1n);

      // Find the token ID owned by this address
      let userTokenId: number | null = null;
      // In a real frontend scenario, you might want to handle multiple tokens
      for (let i = 0; i < 10; i++) { // Check first 10 tokens as example
        try {
          const owner = await profileNFTMinter.ownerOf(i);
          if (owner === user1.address) {
            userTokenId = i;
            break;
          }
        } catch (e) {
          // Token doesn't exist, continue searching
          continue;
        }
      }
      
      console.log("Found token ID:", userTokenId);
      expect(userTokenId).to.not.be.null;

      // 3. Get profile data using token ID
      const profile = await profileNFTMinter.getProfileByTokenId(userTokenId!);
      console.log("Profile found:", {
        username: profile.username,
        metadataURI: profile.metadataURI,
        owner: profile.owner
      });

      // 4. Verify all the connections
      expect(profile.owner).to.equal(user1.address);
      expect(profile.username).to.equal(TEST_USERNAME);
      
      // 5. Double-check by looking up token ID with username
      const verifyTokenId = await profileNFTMinter.getTokenIdByUsername(TEST_USERNAME);
      expect(Number(verifyTokenId)).to.equal(userTokenId);

      // 6. Verify this is the only profile for this user
      expect(await profileNFTMinter.balanceOf(user1.address)).to.equal(1n);
    });

    it("Should create profile and lookup by different methods", async function () {
      // 1. Create profile
      console.log("Creating profile with username:", TEST_USERNAME);
      const tx = await profileNFTMinter.connect(user1).createProfile(
        TEST_USERNAME,
        TEST_METADATA
      );
      const receipt = await tx.wait();
      
      // Get tokenId from event
      const createEvent = receipt?.logs.find(
        (log: any) => log.topics[0] === ethers.id("ProfileCreated(uint256,address,string)")
      );
      const tokenId = Number(createEvent?.topics[1]);
      console.log("Profile created with token ID:", tokenId);

      // 2. Lookup by token ID
      console.log("\nLooking up by token ID:", tokenId);
      const profileByTokenId = await profileNFTMinter.getProfileByTokenId(tokenId);
      console.log("Profile found by token ID:", {
        username: profileByTokenId.username,
        metadataURI: profileByTokenId.metadataURI,
        owner: profileByTokenId.owner
      });
      expect(profileByTokenId.username).to.equal(TEST_USERNAME);

      // 3. Lookup by username
      console.log("\nLooking up by username:", TEST_USERNAME);
      const tokenIdByUsername = await profileNFTMinter.getTokenIdByUsername(TEST_USERNAME);
      console.log("Token ID found by username:", Number(tokenIdByUsername));
      expect(Number(tokenIdByUsername)).to.equal(tokenId);

      // 4. Check username existence
      console.log("\nChecking username existence");
      const exists = await profileNFTMinter.usernameExists(TEST_USERNAME);
      console.log("Username exists:", exists);
      expect(exists).to.be.true;

      // 5. Verify ownership
      console.log("\nVerifying ownership");
      const owner = await profileNFTMinter.ownerOf(tokenId);
      console.log("Profile owner:", owner);
      expect(owner).to.equal(user1.address);
    });

    it("Should handle duplicate username attempts", async function () {
      // Create first profile
      await profileNFTMinter.connect(user1).createProfile(TEST_USERNAME, TEST_METADATA);

      // Try to create duplicate
      await expect(
        profileNFTMinter.connect(user2).createProfile(TEST_USERNAME, TEST_METADATA)
      ).to.be.revertedWith("Username already taken");
    });

    it("Should handle case sensitivity correctly", async function () {
      // Create profile with lowercase
      await profileNFTMinter.connect(user1).createProfile(TEST_USERNAME, TEST_METADATA);

      // Try with uppercase
      const upperUsername = TEST_USERNAME.toUpperCase();
      await expect(
        profileNFTMinter.connect(user2).createProfile(upperUsername, TEST_METADATA)
      ).to.be.revertedWith("Username already taken");
    });

    it("Should validate username format", async function () {
      // Test too short username
      await expect(
        profileNFTMinter.connect(user1).createProfile("ab", TEST_METADATA)
      ).to.be.revertedWith("Invalid username");

      // Test too long username
      await expect(
        profileNFTMinter.connect(user1).createProfile("a".repeat(33), TEST_METADATA)
      ).to.be.revertedWith("Invalid username");

      // Test invalid characters
      await expect(
        profileNFTMinter.connect(user1).createProfile("user@name", TEST_METADATA)
      ).to.be.revertedWith("Invalid username");
    });
  });
}); 