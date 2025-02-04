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
    profileNFTMinter = await ProfileNFTMinter.deploy(MINT_FEE, await roleManager.getAddress());
    await profileNFTMinter.waitForDeployment();

    // Authorize ProfileNFTMinter to assign FAN_ROLE
    await roleManager.authorizeFanAssigner(await profileNFTMinter.getAddress());
  });

  describe("Journey 1.1: Create Profile NFT", function () {
    it("Should allow minting a profile NFT with sufficient fee", async function () {
      const username = "testuser";
      const avatarURI = "ipfs://QmTest";

      const tx = await profileNFTMinter.connect(user1).mintProfileNFT(
        username,
        avatarURI,
        { value: MINT_FEE }
      );

      // Wait for the transaction
      const receipt = await tx.wait();
      
      // Find the ProfileNFTMinted event (it's after the Transfer event)
      const mintEvent = receipt?.logs.find(
        log => log.topics[0] === ethers.id("ProfileNFTMinted(address,uint256,string)")
      );
      expect(mintEvent).to.not.be.undefined;
      expect(mintEvent?.topics[1]).to.equal(ethers.zeroPadValue(user1.address, 32)); // indexed user
      expect(mintEvent?.topics[2]).to.equal(ethers.zeroPadValue(ethers.toBeHex(0), 32)); // indexed tokenId

      // Check token ownership
      expect(await profileNFTMinter.ownerOf(0)).to.equal(user1.address);

      // Check metadata
      expect(await profileNFTMinter.profileMetadata(0, "username")).to.equal(username);
      expect(await profileNFTMinter.profileMetadata(0, "avatarURI")).to.equal(avatarURI);

      // Check that FAN_ROLE was assigned
      expect(await roleManager.hasRole(await roleManager.FAN_ROLE(), user1.address)).to.be.true;
    });

    it("Should revert when minting with insufficient fee", async function () {
      const insufficientFee = ethers.parseEther("0.005"); // 0.005 ETH

      await expect(
        profileNFTMinter.connect(user1).mintProfileNFT(
          "testuser",
          "ipfs://QmTest",
          { value: insufficientFee }
        )
      ).to.be.revertedWith("Insufficient fee");
    });

    it("Should increment tokenId after each mint", async function () {
      // First mint
      await profileNFTMinter.connect(user1).mintProfileNFT(
        "user1",
        "ipfs://QmTest1",
        { value: MINT_FEE }
      );

      // Second mint
      await profileNFTMinter.connect(user2).mintProfileNFT(
        "user2",
        "ipfs://QmTest2",
        { value: MINT_FEE }
      );

      expect(await profileNFTMinter.nextTokenId()).to.equal(2);

      // Check that both users got FAN_ROLE
      expect(await roleManager.hasRole(await roleManager.FAN_ROLE(), user1.address)).to.be.true;
      expect(await roleManager.hasRole(await roleManager.FAN_ROLE(), user2.address)).to.be.true;
    });
  });

  describe("Journey 1.2: Update Profile Metadata", function () {
    beforeEach(async function () {
      // Mint a profile NFT for testing updates
      await profileNFTMinter.connect(user1).mintProfileNFT(
        "testuser",
        "ipfs://QmTest",
        { value: MINT_FEE }
      );
    });

    it("Should allow owner to update profile metadata", async function () {
      const tokenId = 0;
      const key = "bio";
      const value = "Test bio";

      const tx = await profileNFTMinter.connect(user1).setProfileMetadata(
        tokenId,
        key,
        value
      );

      const receipt = await tx.wait();
      
      // Check event
      const event = receipt?.logs[0];
      expect(event?.topics[1]).to.equal(ethers.zeroPadValue(ethers.toBeHex(tokenId), 32)); // indexed tokenId

      // Check updated metadata
      expect(await profileNFTMinter.profileMetadata(tokenId, key)).to.equal(value);
    });

    it("Should revert when non-owner tries to update metadata", async function () {
      await expect(
        profileNFTMinter.connect(user2).setProfileMetadata(
          0,
          "bio",
          "Unauthorized update"
        )
      ).to.be.revertedWith("Not token owner");
    });

    it("Should allow updating multiple metadata fields", async function () {
      const tokenId = 0;
      const updates = [
        { key: "bio", value: "Test bio" },
        { key: "twitter", value: "@testuser" },
        { key: "website", value: "https://test.com" }
      ];

      for (const update of updates) {
        await profileNFTMinter.connect(user1).setProfileMetadata(
          tokenId,
          update.key,
          update.value
        );
        expect(await profileNFTMinter.profileMetadata(tokenId, update.key))
          .to.equal(update.value);
      }
    });
  });
}); 