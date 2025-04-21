import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { CollectibleController, PointSystem, RoleManager, TribeController } from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { EventLog, Log } from "ethers";

describe("Concurrency & Scalability Tests", function () {
  let roleManager: RoleManager;
  let tribeController: TribeController;
  let pointSystem: PointSystem;
  let collectibleController: CollectibleController;
  let owner: SignerWithAddress;
  let users: SignerWithAddress[];
  let tribeId: number;

  beforeEach(async function () {
    [owner, ...users] = await ethers.getSigners();
    
    // Deploy RoleManager
    const RoleManager = await ethers.getContractFactory("RoleManager");
        roleManager = await upgrades.deployProxy(RoleManager, [], { kind: 'uups' });
    await roleManager.waitForDeployment();

    // Deploy TribeController
    const TribeController = await ethers.getContractFactory("TribeController");
        tribeController = await upgrades.deployProxy(TribeController, [roleManager.target], { kind: 'uups' });
    await tribeController.waitForDeployment();

    // Deploy PointSystem
    const PointSystem = await ethers.getContractFactory("PointSystem");
    pointSystem = await upgrades.deployProxy(PointSystem, [
            await roleManager.getAddress(),
            await tribeController.getAddress()
        ], { 
            kind: 'uups',
            unsafeAllow: ['constructor'] 
        });
    await pointSystem.waitForDeployment();

    // Deploy CollectibleController with required arguments
    const CollectibleController = await ethers.getContractFactory("CollectibleController");
    collectibleController = await upgrades.deployProxy(CollectibleController, [
            await roleManager.getAddress(),
            await tribeController.getAddress(),
            await pointSystem.getAddress()
        ], { 
            kind: 'uups',
            unsafeAllow: ['constructor'] 
        });
    await collectibleController.waitForDeployment();

    // Create a test tribe with owner as admin
    await tribeController.createTribe(
      "Test Tribe",
      "ipfs://metadata",
      [], // No additional admins
      0, // PUBLIC
      0, // No entry fee
      [] // No NFT requirements
    );
    tribeId = 0;

    // Add test users as members
    for (const user of users.slice(0, 5)) {
      await tribeController.connect(user).joinTribe(tribeId);
    }
  });

  describe("High-Demand Collectible Drop", function () {
    let collectibleId: number;

    beforeEach(async function () {
      // Create a test collectible
      const tx = await collectibleController.createCollectible(
        tribeId,
        "Test Collectible",
        "TEST",
        "ipfs://test",
        100n,
        ethers.parseEther("0.1"),
        0n
      );
      const receipt = await tx.wait();
      const event = receipt?.logs.find((log: Log | EventLog): log is EventLog => 
        log instanceof EventLog && log.eventName === "CollectibleCreated"
      );
      collectibleId = event ? Number(event.args[0]) : 0;
    });

    it("Should handle concurrent claiming from multiple users", async function () {
      // Create array of claim promises from users
      const claimPromises = users.slice(0, 5).map(user =>
        collectibleController.connect(user).claimCollectible(
          tribeId,
          collectibleId,
          { value: ethers.parseEther("0.1") }
        )
      );

      // Execute all claims concurrently
      const results = await Promise.allSettled(claimPromises);

      // All claims should succeed
      const successfulClaims = results.filter(r => r.status === "fulfilled").length;
      expect(successfulClaims).to.equal(5);

      // Verify balances
      for (const user of users.slice(0, 5)) {
        expect(await collectibleController.balanceOf(user.address, collectibleId)).to.equal(1n);
      }
    });

    it("Should handle supply limits correctly", async function () {
      // Create limited supply collectible
      const tx = await collectibleController.createCollectible(
        tribeId,
        "Limited Collectible",
        "LTD",
        "ipfs://limited",
        3n, // Only 3 available
        ethers.parseEther("0.1"),
        0n
      );
      const receipt = await tx.wait();
      const event = receipt?.logs.find((log: Log | EventLog): log is EventLog => 
        log instanceof EventLog && log.eventName === "CollectibleCreated"
      );
      const limitedCollectibleId = event ? Number(event.args[0]) : 0;

      // Try to claim with more users than supply
      const claimPromises = users.slice(0, 5).map(user =>
        collectibleController.connect(user).claimCollectible(
          tribeId,
          limitedCollectibleId,
          { value: ethers.parseEther("0.1") }
        )
      );

      const results = await Promise.allSettled(claimPromises);

      // Only 3 claims should succeed
      const successfulClaims = results.filter(r => r.status === "fulfilled").length;
      expect(successfulClaims).to.equal(3);

      // Failed claims should be due to supply limit
      const failedClaims = results.filter(r => r.status === "rejected");
      for (const claim of failedClaims) {
        expect(claim.status).to.equal("rejected");
        if (claim.status === "rejected") {
          expect(claim.reason.message).to.include("Supply limit reached");
        }
      }
    });
  });
}); 
