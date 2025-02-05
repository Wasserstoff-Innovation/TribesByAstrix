import { expect } from "chai";
import { ethers } from "hardhat";
import { SuperCommunityController, RoleManager, TribeController } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("SuperCommunityController", function () {
  let superCommunityController: SuperCommunityController;
  let roleManager: RoleManager;
  let tribeController: TribeController;
  let owner: SignerWithAddress;
  let organizer: SignerWithAddress;
  let user: SignerWithAddress;
  let tribeAdmin: SignerWithAddress;

  const COMMUNITY_NAME = "Test Super Community";
  const COMMUNITY_METADATA = "ipfs://QmTest";
  const TRIBE_NAME = "Test Tribe";
  const TRIBE_METADATA = "ipfs://QmTribeTest";

  beforeEach(async function () {
    [owner, organizer, user, tribeAdmin] = await ethers.getSigners();

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

    // Create a test tribe
    await tribeController.connect(tribeAdmin).createTribe(
      TRIBE_NAME,
      TRIBE_METADATA,
      [user.address] // whitelist
    );
  });

  describe("Super Community Creation", function () {
    it("Should allow organizer to create super community", async function () {
      await expect(
        superCommunityController
          .connect(organizer)
          .createSuperCommunity(COMMUNITY_NAME, COMMUNITY_METADATA, [0])
      )
        .to.emit(superCommunityController, "SuperCommunityCreated")
        .withArgs(0, COMMUNITY_NAME, organizer.address)
        .to.emit(superCommunityController, "TribeJoinedSuperCommunity")
        .withArgs(0, 0);

      const superComm = await superCommunityController.superCommunities(0);
      expect(superComm.name).to.equal(COMMUNITY_NAME);
      expect(superComm.metadata).to.equal(COMMUNITY_METADATA);
      expect(superComm.admin).to.equal(organizer.address);
      expect(superComm.active).to.be.true;

      const memberTribes = await superCommunityController.getSuperCommunityTribes(0);
      expect(memberTribes.length).to.equal(1);
      expect(memberTribes[0]).to.equal(0);
    });

    it("Should prevent non-organizer from creating super community", async function () {
      await expect(
        superCommunityController
          .connect(user)
          .createSuperCommunity(COMMUNITY_NAME, COMMUNITY_METADATA, [0])
      ).to.be.revertedWith("Not organizer");
    });
  });

  describe("Tribe Management", function () {
    beforeEach(async function () {
      // Create super community
      await superCommunityController
        .connect(organizer)
        .createSuperCommunity(COMMUNITY_NAME, COMMUNITY_METADATA, []);

      // Create another tribe
      await tribeController.connect(tribeAdmin).createTribe(
        "Second Tribe",
        TRIBE_METADATA,
        [user.address]
      );
    });

    it("Should allow admin to add tribe", async function () {
      await expect(
        superCommunityController.connect(organizer).addTribeToSuperCommunity(0, 1)
      )
        .to.emit(superCommunityController, "TribeJoinedSuperCommunity")
        .withArgs(0, 1);

      const memberTribes = await superCommunityController.getSuperCommunityTribes(0);
      expect(memberTribes.length).to.equal(1);
      expect(memberTribes[0]).to.equal(1);
    });

    it("Should prevent adding tribe to multiple super communities", async function () {
      // Add to first super community
      await superCommunityController.connect(organizer).addTribeToSuperCommunity(0, 1);

      // Create second super community
      await superCommunityController
        .connect(organizer)
        .createSuperCommunity("Second Community", COMMUNITY_METADATA, []);

      // Try to add same tribe to second super community
      await expect(
        superCommunityController.connect(organizer).addTribeToSuperCommunity(1, 1)
      ).to.be.revertedWith("Tribe already in super community");

      // Verify tribe is still in first super community
      const superComm1Tribes = await superCommunityController.getSuperCommunityTribes(0);
      expect(superComm1Tribes.map(t => Number(t))).to.include(1);
      expect(await superCommunityController.tribeInSuperCommunity(1)).to.be.true;
      expect(Number(await superCommunityController.tribeSuperCommunity(1))).to.equal(0);
    });

    it("Should allow admin to remove tribe", async function () {
      // First add a tribe
      await superCommunityController.connect(organizer).addTribeToSuperCommunity(0, 1);

      await expect(
        superCommunityController.connect(organizer).removeTribeFromSuperCommunity(0, 1)
      )
        .to.emit(superCommunityController, "TribeLeftSuperCommunity")
        .withArgs(0, 1);

      const memberTribes = await superCommunityController.getSuperCommunityTribes(0);
      expect(memberTribes.length).to.equal(0);
    });

    it("Should allow tribe admin to remove their tribe", async function () {
      // First add a tribe
      await superCommunityController.connect(organizer).addTribeToSuperCommunity(0, 1);

      await expect(
        superCommunityController.connect(tribeAdmin).removeTribeFromSuperCommunity(0, 1)
      )
        .to.emit(superCommunityController, "TribeLeftSuperCommunity")
        .withArgs(0, 1);
    });
  });

  describe("Membership Verification", function () {
    beforeEach(async function () {
      // Create super community with initial tribe
      await superCommunityController
        .connect(organizer)
        .createSuperCommunity(COMMUNITY_NAME, COMMUNITY_METADATA, [0]);
    });

    it("Should correctly verify member status", async function () {
      // User is in tribe 0's whitelist
      expect(await superCommunityController.isSuperCommunityMember(0, user.address))
        .to.be.true;

      // Owner is not in any tribe's whitelist
      expect(await superCommunityController.isSuperCommunityMember(0, owner.address))
        .to.be.false;
    });

    it("Should update member status when tribes change", async function () {
      // Create new tribe without user in whitelist
      await tribeController.connect(tribeAdmin).createTribe(
        "New Tribe",
        TRIBE_METADATA,
        [owner.address] // different whitelist
      );

      // Add new tribe to super community
      await superCommunityController.connect(organizer).addTribeToSuperCommunity(0, 1);

      // User should still be a member through first tribe
      expect(await superCommunityController.isSuperCommunityMember(0, user.address))
        .to.be.true;

      // Owner should now be a member through second tribe
      expect(await superCommunityController.isSuperCommunityMember(0, owner.address))
        .to.be.true;
    });
  });

  describe("Journey 6.1: Super Community Creation and Management", function () {
    let tribe1Id: number;
    let tribe2Id: number;

    beforeEach(async function () {
      // Create two tribes
      await tribeController.connect(tribeAdmin).createTribe(
        "Tribe 1",
        TRIBE_METADATA,
        [user.address]
      );
      tribe1Id = 0;

      await tribeController.connect(tribeAdmin).createTribe(
        "Tribe 2",
        TRIBE_METADATA,
        [user.address]
      );
      tribe2Id = 1;
    });

    it("Should create super community with initial tribes", async function () {
      const initialTribeIds = [tribe1Id, tribe2Id];
      
      await expect(superCommunityController.connect(organizer).createSuperCommunity(
        COMMUNITY_NAME,
        COMMUNITY_METADATA,
        initialTribeIds
      ))
        .to.emit(superCommunityController, "SuperCommunityCreated")
        .withArgs(0, COMMUNITY_NAME, organizer.address)
        .to.emit(superCommunityController, "TribeJoinedSuperCommunity")
        .withArgs(0, tribe1Id)
        .to.emit(superCommunityController, "TribeJoinedSuperCommunity")
        .withArgs(0, tribe2Id);

      // Verify super community data
      const superComm = await superCommunityController.superCommunities(0);
      expect(superComm.name).to.equal(COMMUNITY_NAME);
      expect(superComm.metadata).to.equal(COMMUNITY_METADATA);
      expect(superComm.admin).to.equal(organizer.address);
      expect(superComm.active).to.be.true;

      // Verify tribe mappings
      expect(await superCommunityController.tribeSuperCommunity(tribe1Id)).to.equal(0);
      expect(await superCommunityController.tribeSuperCommunity(tribe2Id)).to.equal(0);
    });

    it("Should prevent non-organizer from creating super community", async function () {
      await expect(
        superCommunityController.connect(user).createSuperCommunity(
          COMMUNITY_NAME,
          COMMUNITY_METADATA,
          []
        )
      ).to.be.revertedWith("Not organizer");
    });
  });

  describe("Journey 6.2: Adding and Removing Tribes", function () {
    let tribeId: number;
    let superCommunityId: number;

    beforeEach(async function () {
      // Create a tribe
      await tribeController.connect(tribeAdmin).createTribe(
        TRIBE_NAME,
        TRIBE_METADATA,
        [user.address]
      );
      tribeId = 0;

      // Create super community
      await superCommunityController.connect(organizer).createSuperCommunity(
        COMMUNITY_NAME,
        COMMUNITY_METADATA,
        [] // No initial tribes
      );
      superCommunityId = 0;
    });

    it("Should add tribe to super community", async function () {
      await expect(superCommunityController.connect(organizer).addTribeToSuperCommunity(superCommunityId, tribeId))
        .to.emit(superCommunityController, "TribeJoinedSuperCommunity")
        .withArgs(superCommunityId, tribeId);

      // Verify tribe is in super community
      const memberTribes = await superCommunityController.getSuperCommunityTribes(superCommunityId);
      expect(memberTribes.map(t => Number(t))).to.include(tribeId);
      expect(Number(await superCommunityController.tribeSuperCommunity(tribeId))).to.equal(superCommunityId);
    });

    it("Should prevent adding tribe to multiple super communities", async function () {
      // Add to first super community
      await superCommunityController.connect(organizer).addTribeToSuperCommunity(superCommunityId, tribeId);

      // Create second super community
      await superCommunityController.connect(organizer).createSuperCommunity(
        "Second Super Community",
        COMMUNITY_METADATA,
        [] // No initial tribes
      );

      // Attempt to add to second super community should fail
      await expect(
        superCommunityController.connect(organizer).addTribeToSuperCommunity(1, tribeId)
      ).to.be.revertedWith("Tribe already in super community");
    });

    it("Should allow admin to remove tribe", async function () {
      // First add the tribe
      await superCommunityController.connect(organizer).addTribeToSuperCommunity(superCommunityId, tribeId);

      // Then remove it
      await expect(superCommunityController.connect(organizer).removeTribeFromSuperCommunity(superCommunityId, tribeId))
        .to.emit(superCommunityController, "TribeLeftSuperCommunity")
        .withArgs(superCommunityId, tribeId);

      // Verify tribe is removed
      const memberTribes = await superCommunityController.getSuperCommunityTribes(superCommunityId);
      expect(memberTribes.map(t => Number(t))).to.not.include(tribeId);
      expect(Number(await superCommunityController.tribeSuperCommunity(tribeId))).to.equal(0);
    });

    it("Should allow tribe admin to remove their tribe", async function () {
      // First add the tribe
      await superCommunityController.connect(organizer).addTribeToSuperCommunity(superCommunityId, tribeId);

      // Then remove it as tribe admin
      await expect(superCommunityController.connect(tribeAdmin).removeTribeFromSuperCommunity(superCommunityId, tribeId))
        .to.emit(superCommunityController, "TribeLeftSuperCommunity")
        .withArgs(superCommunityId, tribeId);
    });

    it("Should prevent non-authorized users from removing tribe", async function () {
      // First add the tribe
      await superCommunityController.connect(organizer).addTribeToSuperCommunity(superCommunityId, tribeId);

      // Attempt removal by non-authorized user
      await expect(
        superCommunityController.connect(user).removeTribeFromSuperCommunity(superCommunityId, tribeId)
      ).to.be.revertedWith("Not authorized");
    });
  });

  describe("Journey 6.3: Super Community Updates", function () {
    let superCommunityId: number;

    beforeEach(async function () {
      // Create super community
      await superCommunityController.connect(organizer).createSuperCommunity(
        COMMUNITY_NAME,
        COMMUNITY_METADATA,
        [] // No initial tribes
      );
      superCommunityId = 0;
    });

    it("Should allow admin to update metadata", async function () {
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

    it("Should prevent non-admin from updating metadata", async function () {
      await expect(
        superCommunityController.connect(user).updateSuperCommunityMetadata(
          superCommunityId,
          "New Name",
          "New Metadata"
        )
      ).to.be.revertedWith("Not admin");
    });
  });
}); 