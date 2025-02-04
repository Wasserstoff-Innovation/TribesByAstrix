import { expect } from "chai";
import { ethers } from "hardhat";
import { TribeController } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("TribeController", function () {
  let tribeController: TribeController;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let user3: SignerWithAddress;

  beforeEach(async function () {
    [owner, user1, user2, user3] = await ethers.getSigners();
    
    const TribeController = await ethers.getContractFactory("TribeController");
    tribeController = await TribeController.deploy();
    await tribeController.waitForDeployment();
  });

  describe("Journey 2.1: Create Tribe", function () {
    it("Should allow creating a new tribe", async function () {
      const tribeName = "Test Tribe";
      const tribeMetadata = "ipfs://QmTribeMetadata";
      const whitelist = [user1.address, user2.address];

      const tx = await tribeController.connect(user1).createTribe(
        tribeName,
        tribeMetadata,
        whitelist
      );

      const receipt = await tx.wait();
      
      // Check event
      const event = receipt?.logs[0];
      expect(event?.topics[1]).to.equal(ethers.zeroPadValue(ethers.toBeHex(0), 32)); // indexed tribeId
      expect(event?.topics[2]).to.equal(ethers.zeroPadValue(user1.address, 32)); // indexed creator

      // Check tribe data
      const tribe = await tribeController.tribes(0);
      expect(tribe.name).to.equal(tribeName);
      expect(tribe.metadata).to.equal(tribeMetadata);
      expect(tribe.admin).to.equal(user1.address);

      // Check whitelist
      const storedWhitelist = await tribeController.getTribeWhitelist(0);
      expect(storedWhitelist).to.deep.equal(whitelist);

      // Check whitelist status
      expect(await tribeController.isAddressWhitelisted(0, user1.address)).to.be.true;
      expect(await tribeController.isAddressWhitelisted(0, user2.address)).to.be.true;
      expect(await tribeController.isAddressWhitelisted(0, user3.address)).to.be.false;
    });

    it("Should increment tribeId after each creation", async function () {
      // Create first tribe
      await tribeController.connect(user1).createTribe(
        "Tribe 1",
        "ipfs://metadata1",
        [user1.address]
      );

      // Create second tribe
      await tribeController.connect(user2).createTribe(
        "Tribe 2",
        "ipfs://metadata2",
        [user2.address]
      );

      expect(await tribeController.nextTribeId()).to.equal(2);
    });
  });

  describe("Journey 2.2: Update Tribe Metadata", function () {
    beforeEach(async function () {
      // Create a tribe for testing updates
      await tribeController.connect(user1).createTribe(
        "Test Tribe",
        "ipfs://QmInitialMetadata",
        [user1.address, user2.address]
      );
    });

    it("Should allow admin to update tribe metadata and whitelist", async function () {
      const tribeId = 0;
      const newMetadata = "ipfs://QmUpdatedMetadata";
      const newWhitelist = [user1.address, user2.address, user3.address];

      const tx = await tribeController.connect(user1).updateTribe(
        tribeId,
        newMetadata,
        newWhitelist
      );

      const receipt = await tx.wait();
      
      // Check events
      const updateEvent = receipt?.logs[0];
      const whitelistEvent = receipt?.logs[1];
      expect(updateEvent?.topics[1]).to.equal(ethers.zeroPadValue(ethers.toBeHex(tribeId), 32)); // indexed tribeId

      // Check updated tribe data
      const tribe = await tribeController.tribes(tribeId);
      expect(tribe.metadata).to.equal(newMetadata);

      // Check updated whitelist
      const storedWhitelist = await tribeController.getTribeWhitelist(tribeId);
      expect(storedWhitelist).to.deep.equal(newWhitelist);

      // Check whitelist status
      expect(await tribeController.isAddressWhitelisted(tribeId, user1.address)).to.be.true;
      expect(await tribeController.isAddressWhitelisted(tribeId, user2.address)).to.be.true;
      expect(await tribeController.isAddressWhitelisted(tribeId, user3.address)).to.be.true;
    });

    it("Should revert when non-admin tries to update tribe", async function () {
      await expect(
        tribeController.connect(user2).updateTribe(
          0,
          "ipfs://QmUnauthorizedUpdate",
          [user2.address]
        )
      ).to.be.revertedWith("Not tribe admin");
    });
  });

  describe("Journey 2.3: Check Whitelist Permissions", function () {
    beforeEach(async function () {
      // Create a tribe with specific whitelist
      await tribeController.connect(user1).createTribe(
        "Whitelisted Tribe",
        "ipfs://QmMetadata",
        [user1.address, user2.address]
      );
    });

    it("Should correctly report whitelist status", async function () {
      // Check whitelisted users
      expect(await tribeController.isAddressWhitelisted(0, user1.address)).to.be.true;
      expect(await tribeController.isAddressWhitelisted(0, user2.address)).to.be.true;
      
      // Check non-whitelisted user
      expect(await tribeController.isAddressWhitelisted(0, user3.address)).to.be.false;
    });

    it("Should allow admin to update whitelist", async function () {
      const newWhitelist = [user1.address, user3.address]; // Remove user2, add user3
      
      await tribeController.connect(user1).updateTribe(
        0,
        "ipfs://QmMetadata",
        newWhitelist
      );

      // Check updated whitelist
      const storedWhitelist = await tribeController.getTribeWhitelist(0);
      expect(storedWhitelist).to.deep.equal(newWhitelist);

      // Verify whitelist status
      expect(await tribeController.isAddressWhitelisted(0, user1.address)).to.be.true;
      expect(await tribeController.isAddressWhitelisted(0, user2.address)).to.be.false;
      expect(await tribeController.isAddressWhitelisted(0, user3.address)).to.be.true;
    });
  });
}); 