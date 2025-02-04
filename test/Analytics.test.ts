import { expect } from "chai";
import { ethers } from "hardhat";
import { SuperCommunityController, TribeController, RoleManager } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("Analytics & Insights Tests", function () {
  let superCommunityController: SuperCommunityController;
  let tribeController: TribeController;
  let roleManager: RoleManager;
  let owner: SignerWithAddress;
  let organizer: SignerWithAddress;
  let users: SignerWithAddress[];

  const COMMUNITY_NAME = "Test Super Community";
  const COMMUNITY_METADATA = "ipfs://QmTest";
  const TRIBE_NAME = "Test Tribe";
  const TRIBE_METADATA = "ipfs://QmTribeTest";

  beforeEach(async function () {
    [owner, organizer, ...users] = await ethers.getSigners();

    // Deploy RoleManager
    const RoleManager = await ethers.getContractFactory("RoleManager");
    roleManager = await RoleManager.deploy();
    await roleManager.waitForDeployment();

    // Deploy TribeController
    const TribeController = await ethers.getContractFactory("TribeController");
    tribeController = await TribeController.deploy();
    await tribeController.waitForDeployment();

    // Deploy SuperCommunityController
    const SuperCommunityController = await ethers.getContractFactory("SuperCommunityController");
    superCommunityController = await SuperCommunityController.deploy(
      await roleManager.getAddress(),
      await tribeController.getAddress()
    );
    await superCommunityController.waitForDeployment();

    // Grant organizer role
    const ORGANIZER_ROLE = await roleManager.ORGANIZER_ROLE();
    await roleManager.grantRole(ORGANIZER_ROLE, organizer.address);
  });

  describe("Journey 8.1: Super Community Analytics", function () {
    let superCommunityId: number;
    let tribeIds: number[];

    beforeEach(async function () {
      // Create multiple tribes
      tribeIds = await Promise.all(
        users.slice(0, 3).map(async (user, index) => {
          await tribeController.connect(user).createTribe(
            `Tribe ${index}`,
            TRIBE_METADATA,
            [user.address]
          );
          return index;
        })
      );

      // Create super community with these tribes
      await superCommunityController.connect(organizer).createSuperCommunity(
        COMMUNITY_NAME,
        COMMUNITY_METADATA,
        tribeIds
      );
      superCommunityId = 0;
    });

    it("Should track all member tribes", async function () {
      const memberTribes = await superCommunityController.getSuperCommunityTribes(superCommunityId);
      expect(memberTribes.length).to.equal(tribeIds.length);
      
      for (const tribeId of tribeIds) {
        // Convert BigNumber to number for comparison
        const tribeIdNum = Number(tribeId);
        expect(memberTribes.map(t => Number(t))).to.include(tribeIdNum);
        expect(Number(await superCommunityController.tribeSuperCommunity(tribeId))).to.equal(superCommunityId);
      }
    });

    it("Should track tribe additions and removals", async function () {
      // Create a new tribe
      await tribeController.connect(users[3]).createTribe(
        "New Tribe",
        TRIBE_METADATA,
        [users[3].address]
      );
      const newTribeId = tribeIds.length;

      // Add to super community
      await expect(superCommunityController.connect(organizer).addTribeToSuperCommunity(superCommunityId, newTribeId))
        .to.emit(superCommunityController, "TribeJoinedSuperCommunity")
        .withArgs(superCommunityId, newTribeId);

      // Verify addition
      let memberTribes = await superCommunityController.getSuperCommunityTribes(superCommunityId);
      expect(memberTribes.map(t => Number(t))).to.include(newTribeId);

      // Remove from super community
      await expect(superCommunityController.connect(organizer).removeTribeFromSuperCommunity(superCommunityId, newTribeId))
        .to.emit(superCommunityController, "TribeLeftSuperCommunity")
        .withArgs(superCommunityId, newTribeId);

      // Verify removal
      memberTribes = await superCommunityController.getSuperCommunityTribes(superCommunityId);
      expect(memberTribes.map(t => Number(t))).to.not.include(newTribeId);
    });

    it("Should maintain accurate tribe-to-community mapping", async function () {
      // Create two super communities
      await superCommunityController.connect(organizer).createSuperCommunity(
        "Second Community",
        COMMUNITY_METADATA,
        []
      );

      // Create a new tribe
      await tribeController.connect(users[3]).createTribe(
        "Test Tribe",
        TRIBE_METADATA,
        [users[3].address]
      );
      const newTribeId = tribeIds.length;

      // Add to first super community
      await superCommunityController.connect(organizer).addTribeToSuperCommunity(0, newTribeId);
      expect(Number(await superCommunityController.tribeSuperCommunity(newTribeId))).to.equal(0);

      // Try to add to second super community (should fail)
      await expect(
        superCommunityController.connect(organizer).addTribeToSuperCommunity(1, newTribeId)
      ).to.be.revertedWith("Tribe already in super community");

      // Remove from first super community
      await superCommunityController.connect(organizer).removeTribeFromSuperCommunity(0, newTribeId);
      expect(Number(await superCommunityController.tribeSuperCommunity(newTribeId))).to.equal(0);

      // Now should be able to add to second super community
      await superCommunityController.connect(organizer).addTribeToSuperCommunity(1, newTribeId);
      expect(Number(await superCommunityController.tribeSuperCommunity(newTribeId))).to.equal(1);
    });
  });

  describe("Journey 8.2: Super Community Metadata", function () {
    let superCommunityId: number;

    beforeEach(async function () {
      // Create super community
      await superCommunityController.connect(organizer).createSuperCommunity(
        COMMUNITY_NAME,
        COMMUNITY_METADATA,
        []
      );
      superCommunityId = 0;
    });

    it("Should track metadata updates", async function () {
      const newName = "Updated Community";
      const newMetadata = "ipfs://QmNewTest";

      await superCommunityController.connect(organizer).updateSuperCommunityMetadata(
        superCommunityId,
        newName,
        newMetadata
      );

      const superComm = await superCommunityController.superCommunities(superCommunityId);
      expect(superComm.name).to.equal(newName);
      expect(superComm.metadata).to.equal(newMetadata);
    });

    it("Should maintain admin access control", async function () {
      // Non-admin should not be able to update metadata
      await expect(
        superCommunityController.connect(users[0]).updateSuperCommunityMetadata(
          superCommunityId,
          "New Name",
          "New Metadata"
        )
      ).to.be.revertedWith("Not admin");

      // Original admin should still be able to update
      await expect(
        superCommunityController.connect(organizer).updateSuperCommunityMetadata(
          superCommunityId,
          "Admin Update",
          "Admin Metadata"
        )
      ).to.not.be.reverted;
    });
  });
}); 