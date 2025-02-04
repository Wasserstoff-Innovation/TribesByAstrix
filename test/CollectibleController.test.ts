import { expect } from "chai";
import { ethers } from "hardhat";
import { CollectibleController } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("CollectibleController", function () {
  let collectibleController: CollectibleController;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  const COLLECTIBLE_TYPE = 1;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    
    const CollectibleController = await ethers.getContractFactory("CollectibleController");
    collectibleController = await CollectibleController.deploy();
    await collectibleController.waitForDeployment();
  });

  describe("Journey 3.1: Mint Collectible (Whitelisted)", function () {
    beforeEach(async function () {
      // Add user1 to whitelist for testing
      await collectibleController.setWhitelistStatus(COLLECTIBLE_TYPE, user1.address, true);
    });

    it("Should allow whitelisted user to mint collectible", async function () {
      const tx = await collectibleController.connect(user1).mintCollectible(COLLECTIBLE_TYPE);
      const receipt = await tx.wait();
      
      // Check event
      const event = receipt?.logs[0];
      expect(event?.topics[1]).to.equal(ethers.zeroPadValue(user1.address, 32)); // indexed user
      // collectibleType and tokenId are not indexed, so they are in the data field
    });
  });

  describe("Journey 3.2: Mint Collectible (Not Whitelisted)", function () {
    it("Should revert when non-whitelisted user tries to mint", async function () {
      await expect(
        collectibleController.connect(user2).mintCollectible(COLLECTIBLE_TYPE)
      ).to.be.revertedWith("Preconditions not met");
    });

    it("Should verify preconditions correctly", async function () {
      // Check non-whitelisted user
      expect(await collectibleController.verifyPreconditionsForPurchase(user2.address, COLLECTIBLE_TYPE))
        .to.be.false;

      // Add user1 to whitelist and check again
      await collectibleController.setWhitelistStatus(COLLECTIBLE_TYPE, user1.address, true);
      expect(await collectibleController.verifyPreconditionsForPurchase(user1.address, COLLECTIBLE_TYPE))
        .to.be.true;
    });
  });

  describe("Journey 3.3: Verify Access & Generate Session Key", function () {
    it("Should generate unique session keys", async function () {
      const nftContract = "0x1234567890123456789012345678901234567890";
      const tokenId = 1;
      const signature = ethers.randomBytes(32);

      const tx = await collectibleController.verifyAccessAndGenerateSessionKey(
        user1.address,
        nftContract,
        tokenId,
        signature
      );

      const receipt = await tx.wait();
      
      // Check event
      const event = receipt?.logs[0];
      expect(event?.topics[1]).to.equal(ethers.zeroPadValue(user1.address, 32)); // indexed user

      // Generate the same key for comparison
      const expectedKey = ethers.keccak256(
        ethers.solidityPacked(
          ["address", "address", "uint256", "bytes"],
          [user1.address, nftContract, tokenId, signature]
        )
      );

      // Extract session key from event
      const sessionKey = event?.topics[2];
      expect(sessionKey).to.equal(expectedKey);
    });

    it("Should generate different keys for different parameters", async function () {
      const nftContract = "0x1234567890123456789012345678901234567890";
      const tokenId = 1;
      const signature1 = ethers.randomBytes(32);
      const signature2 = ethers.randomBytes(32);

      // Generate first key
      const tx1 = await collectibleController.verifyAccessAndGenerateSessionKey(
        user1.address,
        nftContract,
        tokenId,
        signature1
      );
      const receipt1 = await tx1.wait();
      const sessionKey1 = receipt1?.logs[0].topics[2];

      // Generate second key with different signature
      const tx2 = await collectibleController.verifyAccessAndGenerateSessionKey(
        user1.address,
        nftContract,
        tokenId,
        signature2
      );
      const receipt2 = await tx2.wait();
      const sessionKey2 = receipt2?.logs[0].topics[2];

      // Keys should be different
      expect(sessionKey1).to.not.equal(sessionKey2);
    });

    it("Should emit WhitelistUpdated event", async function () {
      const tx = await collectibleController.setWhitelistStatus(COLLECTIBLE_TYPE, user1.address, true);
      const receipt = await tx.wait();
      
      const event = receipt?.logs[0];
      expect(event?.topics[1]).to.equal(ethers.zeroPadValue(ethers.toBeHex(COLLECTIBLE_TYPE), 32)); // indexed collectibleType
      expect(event?.topics[2]).to.equal(ethers.zeroPadValue(user1.address, 32)); // indexed user
    });
  });
}); 