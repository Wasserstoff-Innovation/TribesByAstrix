// test/UserJourney.test.ts
import { expect } from "chai";
import { ethers } from "hardhat";
import { TribeController, SuperCommunityController, RoleManager } from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("User Journey: Tribe Management", function () {
  let tribeController: TribeController;
  let superCommunityController: SuperCommunityController;
  let roleManager: RoleManager;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy RoleManager
    const RoleManager = await ethers.getContractFactory("RoleManager");
    roleManager = await RoleManager.deploy();
    await roleManager.waitForDeployment();

    // Deploy TribeController
    const TribeController = await ethers.getContractFactory("TribeController");
    tribeController = await TribeController.deploy(roleManager.target);
    await tribeController.waitForDeployment();

    // Deploy SuperCommunityController
    const SuperCommunityController = await ethers.getContractFactory("SuperCommunityController");
    superCommunityController = await SuperCommunityController.deploy(
      await roleManager.getAddress(),
      await tribeController.getAddress()
    );
    await superCommunityController.waitForDeployment();
  });

  describe("Scenario 1: Tribe Creation", function () {
    it("Should create a public tribe successfully", async function () {
      const tribeName = "Public Tribe";
      const tribeMetadata = "ipfs://metadata";
      const whitelist = [user1.address];
      const joinType = 0; // PUBLIC
      const entryFee = 0;
      const collectibleRequirement = ethers.ZeroAddress;

      await expect(tribeController.connect(user1).createTribe(
        tribeName,
        tribeMetadata,
        whitelist,
        joinType,
        entryFee,
        collectibleRequirement
      )).to.not.be.reverted;

      const tribeId = 0;
      
      // Verify tribe admin
      expect(await tribeController.getTribeAdmin(tribeId)).to.equal(user1.address);
      
      // Verify whitelist
      const storedWhitelist = await tribeController.getTribeWhitelist(tribeId);
      expect(storedWhitelist).to.deep.equal(whitelist);
      
      // Verify tribe config
      const config = await tribeController.getTribeConfigView(tribeId);
      expect(config.joinType).to.equal(joinType);
      expect(config.entryFee).to.equal(entryFee);
      expect(config.collectibleRequirements).to.deep.equal(collectibleRequirement);

      // Verify creator is active member
      expect(await tribeController.getMemberStatus(tribeId, user1.address)).to.equal(1); // ACTIVE
    });

    it("Should create a private tribe with entry fee", async function () {
      const tribeName = "Private Tribe";
      const tribeMetadata = "ipfs://metadata";
      const whitelist = [user1.address];
      const joinType = 1; // PRIVATE
      const entryFee = ethers.parseEther("0.1");
      const collectibleRequirement = ethers.ZeroAddress;

      await expect(tribeController.connect(user1).createTribe(
        tribeName,
        tribeMetadata,
        whitelist,
        joinType,
        entryFee,
        collectibleRequirement
      )).to.not.be.reverted;

      const tribeId = 0;
      
      // Verify tribe config
      const config = await tribeController.getTribeConfig(tribeId);
      expect(config.joinType).to.equal(joinType);
      expect(config.entryFee).to.equal(entryFee);
    });
  });

  describe("Scenario 2: Update Tribe", function () {
    let tribeId: number;

    beforeEach(async function () {
      // Create initial tribe
      await tribeController.connect(user1).createTribe(
        "Test Tribe",
        "ipfs://metadata",
        [user1.address],
        0, // PUBLIC
        0,
        ethers.ZeroAddress
      );
      tribeId = 0;
    });

    it("Should allow tribe admin to update joining criteria", async function () {
      const newJoinType = 1; // PRIVATE
      const newEntryFee = ethers.parseEther("0.2");
      const newCollectibleRequirement = ethers.ZeroAddress;

      await expect(tribeController.connect(user1).updateTribeJoiningCriteria(
        tribeId,
        newJoinType,
        newEntryFee,
        newCollectibleRequirement
      )).to.not.be.reverted;

      const config = await tribeController.getTribeConfigView(tribeId);
      expect(config.joinType).to.equal(newJoinType);
      expect(config.entryFee).to.equal(newEntryFee);
    });

    it("Should prevent non-admin from updating joining criteria", async function () {
      await expect(tribeController.connect(user2).updateTribeJoiningCriteria(
        tribeId,
        1,
        0,
        ethers.ZeroAddress
      )).to.be.revertedWith("Not tribe admin");
    });
  });

  describe("Scenario 3: Join a Tribe", function () {
    let publicTribeId: number;
    let privateTribeId: number;

    beforeEach(async function () {
      // Create public tribe
      await tribeController.connect(user1).createTribe(
        "Public Tribe",
        "ipfs://metadata",
        [user1.address],
        0, // PUBLIC
        0,
        ethers.ZeroAddress
      );
      publicTribeId = 0;

      // Create private tribe
      await tribeController.connect(user1).createTribe(
        "Private Tribe",
        "ipfs://metadata",
        [user1.address],
        1, // PRIVATE
        ethers.parseEther("0.1"),
        ethers.ZeroAddress
      );
      privateTribeId = 1;
    });

    it("Should allow instant join for public tribes", async function () {
      await expect(tribeController.connect(user2).joinTribe(publicTribeId))
        .to.not.be.reverted;
      
      expect(await tribeController.getMemberStatus(publicTribeId, user2.address))
        .to.equal(1); // ACTIVE
    });

    it("Should require approval for private tribes", async function () {
      await expect(tribeController.connect(user2).requestToJoinTribe(privateTribeId))
        .to.be.revertedWith("Insufficient entry fee");

      await expect(tribeController.connect(user2).requestToJoinTribe(privateTribeId, {
        value: ethers.parseEther("0.1")
      })).to.not.be.reverted;
      
      expect(await tribeController.getMemberStatus(privateTribeId, user2.address))
        .to.equal(0); // PENDING
    });

    it("Should allow admin to approve pending members", async function () {
      await tribeController.connect(user2).requestToJoinTribe(privateTribeId, {
        value: ethers.parseEther("0.1")
      });

      await expect(tribeController.connect(user1).approveMember(privateTribeId, user2.address))
        .to.not.be.reverted;
      
      expect(await tribeController.getMemberStatus(privateTribeId, user2.address))
        .to.equal(1); // ACTIVE
    });

    it("Should allow admin to reject pending members and return entry fee", async function () {
      const initialBalance = await ethers.provider.getBalance(user2.address);
      
      await tribeController.connect(user2).requestToJoinTribe(privateTribeId, {
        value: ethers.parseEther("0.1")
      });

      await expect(tribeController.connect(user1).rejectMember(privateTribeId, user2.address))
        .to.not.be.reverted;
      
      expect(await tribeController.getMemberStatus(privateTribeId, user2.address))
        .to.equal(2); // BANNED

      // Check if entry fee was returned (approximately, accounting for gas costs)
      const finalBalance = await ethers.provider.getBalance(user2.address);
      expect(finalBalance).to.be.closeTo(initialBalance, ethers.parseEther("0.01"));
    });
  });
});