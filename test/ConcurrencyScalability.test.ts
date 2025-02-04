import { expect } from "chai";
import { ethers } from "hardhat";
import { CollectibleController, RoleManager } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("Concurrency & Scalability Tests", function () {
  let collectibleController: CollectibleController;
  let roleManager: RoleManager;
  let owner: SignerWithAddress;
  let users: SignerWithAddress[];
  const COLLECTIBLE_TYPE = 1;

  beforeEach(async function () {
    [owner, ...users] = await ethers.getSigners();
    
    // Deploy RoleManager
    const RoleManager = await ethers.getContractFactory("RoleManager");
    roleManager = await RoleManager.deploy();
    await roleManager.waitForDeployment();

    // Deploy CollectibleController
    const CollectibleController = await ethers.getContractFactory("CollectibleController");
    collectibleController = await CollectibleController.deploy();
    await collectibleController.waitForDeployment();

    // Whitelist test users
    for (const user of users.slice(0, 5)) {
      await collectibleController.setWhitelistStatus(COLLECTIBLE_TYPE, user.address, true);
    }
  });

  describe("Journey 7.1: High-Demand Collectible Drop", function () {
    it("Should handle concurrent minting from whitelisted users", async function () {
      // Create array of mint promises from whitelisted users
      const mintPromises = users.slice(0, 5).map(user =>
        collectibleController.connect(user).mintCollectible(COLLECTIBLE_TYPE)
      );

      // Execute all mints concurrently
      const results = await Promise.allSettled(mintPromises);

      // All mints should succeed since users are whitelisted
      const successfulMints = results.filter(r => r.status === "fulfilled").length;
      expect(successfulMints).to.equal(5);

      // Verify events were emitted
      for (const result of results) {
        if (result.status === "fulfilled") {
          const receipt = await result.value.wait();
          const event = receipt?.logs[0];
          expect(event?.topics[0]).to.equal(ethers.id("CollectibleMinted(address,uint256,uint256)"));
        }
      }
    });

    it("Should prevent non-whitelisted users from minting", async function () {
      // Try to mint with non-whitelisted user
      const nonWhitelistedUser = users[5];
      await expect(
        collectibleController.connect(nonWhitelistedUser).mintCollectible(COLLECTIBLE_TYPE)
      ).to.be.revertedWith("Preconditions not met");
    });

    it("Should handle rapid sequential minting", async function () {
      // Perform sequential mints from different whitelisted users
      for (const user of users.slice(0, 5)) {
        await expect(
          collectibleController.connect(user).mintCollectible(COLLECTIBLE_TYPE)
        ).to.not.be.reverted;
      }
    });
  });

  describe("Journey 7.2: Whitelist Management", function () {
    it("Should handle multiple whitelist updates", async function () {
      const updatePromises = users.slice(5, 10).map(user =>
        collectibleController.setWhitelistStatus(COLLECTIBLE_TYPE, user.address, true)
      );

      // Execute all updates concurrently
      await Promise.all(updatePromises);

      // Verify all users are whitelisted
      for (const user of users.slice(5, 10)) {
        expect(await collectibleController.collectibleWhitelist(COLLECTIBLE_TYPE, user.address)).to.be.true;
      }
    });

    it("Should handle whitelist status changes", async function () {
      const user = users[0];
      
      // Toggle whitelist status multiple times
      await collectibleController.setWhitelistStatus(COLLECTIBLE_TYPE, user.address, false);
      expect(await collectibleController.collectibleWhitelist(COLLECTIBLE_TYPE, user.address)).to.be.false;

      await collectibleController.setWhitelistStatus(COLLECTIBLE_TYPE, user.address, true);
      expect(await collectibleController.collectibleWhitelist(COLLECTIBLE_TYPE, user.address)).to.be.true;

      await collectibleController.setWhitelistStatus(COLLECTIBLE_TYPE, user.address, false);
      expect(await collectibleController.collectibleWhitelist(COLLECTIBLE_TYPE, user.address)).to.be.false;
    });

    it("Should emit WhitelistUpdated events", async function () {
      const user = users[0];
      
      await expect(collectibleController.setWhitelistStatus(COLLECTIBLE_TYPE, user.address, false))
        .to.emit(collectibleController, "WhitelistUpdated")
        .withArgs(COLLECTIBLE_TYPE, user.address, false);

      await expect(collectibleController.setWhitelistStatus(COLLECTIBLE_TYPE, user.address, true))
        .to.emit(collectibleController, "WhitelistUpdated")
        .withArgs(COLLECTIBLE_TYPE, user.address, true);
    });
  });
}); 
