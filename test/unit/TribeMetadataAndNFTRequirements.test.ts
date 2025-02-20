import { expect } from "chai";
import { ethers } from "hardhat";
import { TribeController, RoleManager, ContentManager, PointSystem, CollectibleController } from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { EventLog } from "ethers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import "@nomicfoundation/hardhat-chai-matchers";

// Import console for logging
const hre = require("hardhat");
const { console } = hre;

describe("Tribe Metadata and NFT Requirements", function () {
  let tribeController: TribeController;
  let roleManager: RoleManager;
  let contentManager: ContentManager;
  let pointSystem: PointSystem;
  let collectibleController: CollectibleController;
  let owner: SignerWithAddress;
  let creator: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let users: SignerWithAddress[];

  const sampleMetadata = {
    id: 'monad-defi',
    name: 'Monad DeFi',
    description: 'Discussion about DeFi protocols and development on Monad',
    avatar: '/monad-white.svg',
    coverImage: '/monad-banner.png',
    privacy: 'public',
    memberCount: 0,
    onlineCount: 0,
    isVerified: true,
    topics: [
      {
        id: 'defi-dev',
        name: 'DeFi Development',
        description: 'DeFi protocol development and integration',
        postCount: 0
      },
      {
        id: 'trading',
        name: 'Trading',
        description: 'Trading strategies and market analysis',
        postCount: 0
      }
    ],
    members: [],
    createdAt: new Date().toISOString()
  };

  beforeEach(async function () {
    process.stdout.write("\n=== Setting up test environment ===\n");
    [owner, creator, user1, user2, ...users] = await ethers.getSigners();
    process.stdout.write("Signers initialized\n");

    try {
      // Deploy RoleManager
      process.stdout.write("Deploying RoleManager...\n");
      const RoleManager = await ethers.getContractFactory("RoleManager");
      roleManager = await RoleManager.deploy();
      await roleManager.waitForDeployment();
      process.stdout.write(`RoleManager deployed at: ${await roleManager.getAddress()}\n`);

      // Deploy TribeController
      process.stdout.write("Deploying TribeController...\n");
      const TribeController = await ethers.getContractFactory("TribeController");
      tribeController = await TribeController.deploy(await roleManager.getAddress());
      await tribeController.waitForDeployment();
      process.stdout.write(`TribeController deployed at: ${await tribeController.getAddress()}\n`);

      // Deploy ContentManager
      process.stdout.write("Deploying ContentManager...\n");
      const ContentManager = await ethers.getContractFactory("ContentManager");
      contentManager = await ContentManager.deploy(
        await roleManager.getAddress(),
        await tribeController.getAddress()
      );
      await contentManager.waitForDeployment();
      process.stdout.write("ContentManager deployed\n");

      // Deploy PointSystem
      process.stdout.write("Deploying PointSystem...\n");
      const PointSystem = await ethers.getContractFactory("PointSystem");
      pointSystem = await PointSystem.deploy(
        await roleManager.getAddress(),
        await tribeController.getAddress()
      );
      await pointSystem.waitForDeployment();
      process.stdout.write("PointSystem deployed\n");

      // Deploy CollectibleController
      process.stdout.write("Deploying CollectibleController...\n");
      const CollectibleController = await ethers.getContractFactory("CollectibleController");
      collectibleController = await CollectibleController.deploy(
        await roleManager.getAddress(),
        await tribeController.getAddress(),
        await pointSystem.getAddress()
      );
      await collectibleController.waitForDeployment();
      process.stdout.write("CollectibleController deployed\n");

      // Grant creator role
      process.stdout.write("Granting CREATOR_ROLE to creator...\n");
      await roleManager.grantRole(ethers.keccak256(ethers.toUtf8Bytes("CREATOR_ROLE")), creator.address);
      process.stdout.write("Setup complete\n");
    } catch (error: any) {
      process.stdout.write(`\nError during setup: ${error.message}\n`);
      if (error.data) {
        process.stdout.write(`Error data: ${error.data}\n`);
      }
      throw error;
    }
  });

  describe("Tribe Creation with Metadata", function () {
    it("Should create a tribe with detailed metadata", async function () {
      process.stdout.write("\n=== Testing tribe creation with metadata ===\n");
      try {
        const metadataIpfsHash = "ipfs://QmTribeMetadataHash";
        process.stdout.write("Creating tribe...\n");
        
        const tx = await tribeController.connect(creator).createTribe(
          sampleMetadata.name,
          metadataIpfsHash,
          [creator.address],
          0, // PUBLIC
          0, // No entry fee
          [] // Empty NFT requirements array
        );

        process.stdout.write("Waiting for transaction confirmation...\n");
        const receipt = await tx.wait();
        const event = receipt?.logs.find(x => x instanceof EventLog && x.eventName === "TribeCreated") as EventLog;
        const tribeId = event ? Number(event.args[0]) : 0;
        process.stdout.write("Tribe created with ID: " + tribeId + "\n");

        // Verify tribe creation
        process.stdout.write("Verifying tribe configuration...\n");
        const tribeConfig = await tribeController.getTribeConfigView(tribeId);
        expect(tribeConfig.joinType).to.equal(0); // PUBLIC
        expect(await tribeController.getTribeAdmin(tribeId)).to.equal(creator.address);
        process.stdout.write("Tribe verification complete\n");
      } catch (error) {
        console.error("Error in tribe creation test:", error);
        throw error;
      }
    });

    it("Should create a tribe with collectible requirement", async function () {
      process.stdout.write("\n=== Testing tribe creation with NFT requirement ===\n");
      try {
        const metadataIpfsHash = "ipfs://QmTribeMetadataHash";
        process.stdout.write("Creating initial tribe...\n");
        
        const tx = await tribeController.connect(creator).createTribe(
          sampleMetadata.name,
          metadataIpfsHash,
          [creator.address],
          3, // NFT_GATED
          0, // No entry fee
          [] // Empty NFT requirements array initially
        );

        process.stdout.write("Waiting for transaction confirmation...\n");
        const receipt = await tx.wait();
        const event = receipt?.logs.find(x => x instanceof EventLog && x.eventName === "TribeCreated") as EventLog;
        const tribeId = event ? Number(event.args[0]) : 0;
        process.stdout.write(`Initial tribe created with ID: ${tribeId}\n`);

        // Create collectible
        process.stdout.write("Creating collectible NFT...\n");
        const collectibleName = "Tribe Membership NFT";
        const collectibleSymbol = "TMN";
        const collectibleMetadata = "ipfs://QmCollectibleMetadata";
        const maxSupply = 100;
        const price = ethers.parseEther("0.1");
        const pointsRequired = 0;

        const createCollectibleTx = await collectibleController.connect(creator).createCollectible(
          tribeId,
          collectibleName,
          collectibleSymbol,
          collectibleMetadata,
          maxSupply,
          price,
          pointsRequired
        );
        const collectibleReceipt = await createCollectibleTx.wait();
        const collectibleEvent = collectibleReceipt?.logs.find(
          x => x instanceof EventLog && x.eventName === "CollectibleCreated"
        ) as EventLog;
        const collectibleId = collectibleEvent ? Number(collectibleEvent.args[0]) : 0;
        process.stdout.write(`Collectible created with ID: ${collectibleId}\n`);

        // Update tribe to require the NFT
        process.stdout.write("Updating tribe to require NFT...\n");
        const nftRequirement = {
          nftContract: await collectibleController.getAddress(),
          nftType: 1, // ERC1155
          isMandatory: true,
          minAmount: 1n,
          tokenIds: [collectibleId]
        };

        await tribeController.connect(creator).updateTribeConfig(
          tribeId,
          3, // NFT_GATED
          0, // No entry fee
          [nftRequirement]
        );
        process.stdout.write("Tribe updated to NFT_GATED\n");

        // User1 claims collectible
        process.stdout.write("User1 claiming collectible...\n");
        await collectibleController.connect(user1).claimCollectible(tribeId, collectibleId, {
          value: price
        });
        process.stdout.write("User1 claimed collectible\n");

        // User1 (with collectible) should be able to join
        process.stdout.write("Testing User1 joining tribe (should succeed)...\n");
        await expect(tribeController.connect(user1).joinTribe(tribeId))
          .to.emit(tribeController, "MembershipUpdated")
          .withArgs(tribeId, user1.address, 1);
        process.stdout.write("User1 successfully joined tribe\n");

        // User2 (without collectible) should not be able to join
        process.stdout.write("Testing User2 joining tribe (should fail)...\n");
        await expect(tribeController.connect(user2).joinTribe(tribeId))
          .to.be.revertedWith("NFT requirements not met");
        process.stdout.write("User2 correctly prevented from joining\n");
      } catch (error: any) {
        process.stdout.write(`\nError in NFT requirement test: ${error.message}\n`);
        if (error.data) {
          process.stdout.write(`Error data: ${JSON.stringify(error.data)}\n`);
        }
        throw error;
      }
    });
  });

  describe("Tribe Membership and Role Management", function () {
    let tribeId: number;
    let collectibleId: number;

    beforeEach(async function () {
      // Create tribe
      const tribeTx = await tribeController.connect(creator).createTribe(
        sampleMetadata.name,
        "ipfs://QmTribeMetadataHash",
        [creator.address],
        0, // PUBLIC
        0, // No entry fee
        [] // Empty NFT requirements array
      );
      const tribeReceipt = await tribeTx.wait();
      const tribeEvent = tribeReceipt?.logs.find(
        x => x instanceof EventLog && x.eventName === "TribeCreated"
      ) as EventLog;
      tribeId = tribeEvent ? Number(tribeEvent.args[0]) : 0;

      // Create collectible
      const createCollectibleTx = await collectibleController.connect(creator).createCollectible(
        tribeId,
        "Membership NFT",
        "MN",
        "ipfs://metadata",
        100,
        ethers.parseEther("0.1"),
        0
      );
      const collectibleReceipt = await createCollectibleTx.wait();
      const collectibleEvent = collectibleReceipt?.logs.find(
        x => x instanceof EventLog && x.eventName === "CollectibleCreated"
      ) as EventLog;
      collectibleId = collectibleEvent ? Number(collectibleEvent.args[0]) : 0;
    });

    it("Should track member roles and permissions", async function () {
      // User1 claims collectible and joins
      await collectibleController.connect(user1).claimCollectible(tribeId, collectibleId, {
        value: ethers.parseEther("0.1")
      });
      await tribeController.connect(user1).joinTribe(tribeId);

      // Creator assigns moderator role to user1
      await roleManager.grantRole(ethers.keccak256(ethers.toUtf8Bytes("MODERATOR_ROLE")), user1.address);

      // Verify roles
      expect(await roleManager.hasRole(ethers.keccak256(ethers.toUtf8Bytes("MODERATOR_ROLE")), user1.address))
        .to.be.true;
      expect(await tribeController.getMemberStatus(tribeId, user1.address))
        .to.equal(1); // ACTIVE
    });

    it("Should track tribe membership accurately", async function () {
      // Add multiple members
      for(let i = 0; i < 3; i++) {
        await collectibleController.connect(users[i]).claimCollectible(tribeId, collectibleId, {
          value: ethers.parseEther("0.1")
        });
        await tribeController.connect(users[i]).joinTribe(tribeId);
      }

      // Verify each member's status
      for(let i = 0; i < 3; i++) {
        expect(await tribeController.getMemberStatus(tribeId, users[i].address))
          .to.equal(1); // ACTIVE
      }
    });
  });

  describe("Tribe Metadata Loading and Updates", function () {
    let tribeId: number;

    beforeEach(async function () {
      const tx = await tribeController.connect(creator).createTribe(
        sampleMetadata.name,
        "ipfs://QmTribeMetadataHash",
        [creator.address],
        0, // PUBLIC
        0, // No entry fee
        [] // Empty NFT requirements array
      );
      const receipt = await tx.wait();
      const event = receipt?.logs.find(x => x instanceof EventLog && x.eventName === "TribeCreated") as EventLog;
      tribeId = event ? Number(event.args[0]) : 0;
    });

    it("Should load tribe metadata with member information", async function () {
      // Add some members
      await tribeController.connect(user1).joinTribe(tribeId);
      await tribeController.connect(user2).joinTribe(tribeId);

      // Get tribe configuration and member statuses
      const tribeConfig = await tribeController.getTribeConfigView(tribeId);
      const user1Status = await tribeController.getMemberStatus(tribeId, user1.address);
      const user2Status = await tribeController.getMemberStatus(tribeId, user2.address);

      // Verify tribe data
      expect(tribeConfig.joinType).to.equal(0); // PUBLIC
      expect(user1Status).to.equal(1); // ACTIVE
      expect(user2Status).to.equal(1); // ACTIVE
    });

    it("Should handle user membership queries efficiently", async function () {
      // Add multiple members
      const memberAdditions = await Promise.all(
        users.slice(0, 5).map(user => tribeController.connect(user).joinTribe(tribeId))
      );
      await Promise.all(memberAdditions.map(tx => tx.wait()));

      // Batch check membership status
      const membershipChecks = await Promise.all(
        users.slice(0, 5).map(user => tribeController.getMemberStatus(tribeId, user.address))
      );

      // Verify all added users are active members
      membershipChecks.forEach(status => {
        expect(status).to.equal(1); // ACTIVE
      });
    });
  });

  describe("Tribe Joining Scenarios", function () {
    let tribeId: number;
    let collectibleId: number;

    describe("NFT Gated Tribe", function () {
        beforeEach(async function () {
            // Create tribe initially as public
            const tribeTx = await tribeController.connect(creator).createTribe(
                "NFT Gated Tribe",
                "ipfs://metadata",
                [creator.address],
                0, // PUBLIC initially
                0,
                []
            );
            const tribeReceipt = await tribeTx.wait();
            const tribeEvent = tribeReceipt?.logs.find(
                x => x instanceof EventLog && x.eventName === "TribeCreated"
            ) as EventLog;
            tribeId = tribeEvent ? Number(tribeEvent.args[0]) : 0;

            // Create collectible
            const createCollectibleTx = await collectibleController.connect(creator).createCollectible(
                tribeId,
                "Access NFT",
                "ACCESS",
                "ipfs://metadata",
                100,
                ethers.parseEther("0.1"),
                0
            );
            const collectibleReceipt = await createCollectibleTx.wait();
            const collectibleEvent = collectibleReceipt?.logs.find(
                x => x instanceof EventLog && x.eventName === "CollectibleCreated"
            ) as EventLog;
            collectibleId = collectibleEvent ? Number(collectibleEvent.args[0]) : 0;
        });

        it("Should allow joining before NFT requirement is set", async function () {
            await expect(tribeController.connect(user1).joinTribe(tribeId))
                .to.emit(tribeController, "MembershipUpdated")
                .withArgs(tribeId, user1.address, 1); // ACTIVE
        });

        it("Should prevent joining after NFT requirement is set without NFT", async function () {
            // Update tribe to require NFT
            const nftRequirement = {
                nftContract: await collectibleController.getAddress(),
                nftType: 1, // ERC1155
                isMandatory: true,
                minAmount: 1n,
                tokenIds: [collectibleId]
            };

            await tribeController.connect(creator).updateTribeConfig(
                tribeId,
                3, // NFT_GATED
                0,
                [nftRequirement]
            );

            await expect(tribeController.connect(user1).joinTribe(tribeId))
                .to.be.revertedWith("NFT requirements not met");
        });

        it("Should allow joining after acquiring required NFT", async function () {
            // Update tribe to require NFT
            const nftRequirement = {
                nftContract: await collectibleController.getAddress(),
                nftType: 1, // ERC1155
                isMandatory: true,
                minAmount: 1n,
                tokenIds: [collectibleId]
            };

            await tribeController.connect(creator).updateTribeConfig(
                tribeId,
                3, // NFT_GATED
                0,
                [nftRequirement]
            );

            // User claims NFT
            await collectibleController.connect(user1).claimCollectible(tribeId, collectibleId, {
                value: ethers.parseEther("0.1")
            });

            // Should now be able to join
            await expect(tribeController.connect(user1).joinTribe(tribeId))
                .to.emit(tribeController, "MembershipUpdated")
                .withArgs(tribeId, user1.address, 1);
        });
    });

    describe("Invite Code Tribe", function () {
        let inviteCode: string;
        let inviteCodeBytes32: string;

        beforeEach(async function () {
            // Create invite-only tribe
            const tribeTx = await tribeController.connect(creator).createTribe(
                "Invite Only Tribe",
                "ipfs://metadata",
                [creator.address],
                6, // INVITE_CODE
                0,
                []
            );
            const tribeReceipt = await tribeTx.wait();
            const tribeEvent = tribeReceipt?.logs.find(
                x => x instanceof EventLog && x.eventName === "TribeCreated"
            ) as EventLog;
            tribeId = tribeEvent ? Number(tribeEvent.args[0]) : 0;

            // Create invite code
            inviteCode = "TEST123";
            inviteCodeBytes32 = ethers.keccak256(ethers.toUtf8Bytes(inviteCode));
            await tribeController.connect(creator).createInviteCode(
                tribeId,
                inviteCode,
                5, // maxUses
                0 // no expiry
            );
        });

        it("Should not allow direct joining without invite code", async function () {
            await expect(tribeController.connect(user1).joinTribe(tribeId))
                .to.be.revertedWith("Tribe not public or requires invite code");
        });

        it("Should allow joining with valid invite code", async function () {
            await expect(tribeController.connect(user1).joinTribeWithCode(tribeId, inviteCodeBytes32))
                .to.emit(tribeController, "MembershipUpdated")
                .withArgs(tribeId, user1.address, 1);
        });

        it("Should not allow joining with invalid invite code", async function () {
            const invalidCodeBytes32 = ethers.keccak256(ethers.toUtf8Bytes("INVALID"));
            await expect(tribeController.connect(user1).joinTribeWithCode(tribeId, invalidCodeBytes32))
                .to.be.revertedWith("Invalid invite code");
        });

        it("Should track invite code usage correctly", async function () {
            // Join with multiple users
            const testUsers = [user1, user2, ...users.slice(0, 1)]; // Get 3 users
            for (let i = 0; i < 3; i++) {
                await tribeController.connect(testUsers[i]).joinTribeWithCode(tribeId, inviteCodeBytes32);
            }

            // Check remaining uses
            const [valid, remainingUses] = await tribeController.getInviteCodeStatus(tribeId, inviteCode);
            expect(valid).to.be.true;
            expect(remainingUses).to.equal(2); // 5 max - 3 used = 2 remaining
        });

        it("Should handle invite code expiry correctly", async function () {
            // Create expiring invite code
            const expiringCode = "EXPIRE123";
            const expiringCodeBytes32 = ethers.keccak256(ethers.toUtf8Bytes(expiringCode));
            const now = Math.floor(Date.now() / 1000);
            await tribeController.connect(creator).createInviteCode(
                tribeId,
                expiringCode,
                5,
                now + 3600 // expires in 1 hour
            );

            // Should work before expiry
            await expect(tribeController.connect(user1).joinTribeWithCode(tribeId, expiringCodeBytes32))
                .to.emit(tribeController, "MembershipUpdated");
        });
    });

    describe("Private Tribe", function () {
        beforeEach(async function () {
            // Create private tribe
            const tribeTx = await tribeController.connect(creator).createTribe(
                "Private Tribe",
                "ipfs://metadata",
                [creator.address],
                1, // PRIVATE
                0,
                []
            );
            const tribeReceipt = await tribeTx.wait();
            const tribeEvent = tribeReceipt?.logs.find(
                x => x instanceof EventLog && x.eventName === "TribeCreated"
            ) as EventLog;
            tribeId = tribeEvent ? Number(tribeEvent.args[0]) : 0;
        });

        it("Should set member status to PENDING when requesting to join", async function () {
            await tribeController.connect(user1).requestToJoinTribe(tribeId);
            expect(await tribeController.getMemberStatus(tribeId, user1.address))
                .to.equal(2); // PENDING
        });

        it("Should allow admin to approve pending member", async function () {
            await tribeController.connect(user1).requestToJoinTribe(tribeId);
            await expect(tribeController.connect(creator).approveMember(tribeId, user1.address))
                .to.emit(tribeController, "MembershipUpdated")
                .withArgs(tribeId, user1.address, 1); // ACTIVE
        });

        it("Should allow admin to reject pending member", async function () {
            await tribeController.connect(user1).requestToJoinTribe(tribeId);
            await expect(tribeController.connect(creator).rejectMember(tribeId, user1.address))
                .to.emit(tribeController, "MembershipUpdated")
                .withArgs(tribeId, user1.address, 0); // NONE
        });

        it("Should not allow non-admin to approve/reject members", async function () {
            await tribeController.connect(user1).requestToJoinTribe(tribeId);
            await expect(tribeController.connect(user2).approveMember(tribeId, user1.address))
                .to.be.revertedWith("Not tribe admin");
            await expect(tribeController.connect(user2).rejectMember(tribeId, user1.address))
                .to.be.revertedWith("Not tribe admin");
        });
    });
  });

  describe("Tribe Role Management and Actions", function () {
    let tribeId: number;
    let moderator: SignerWithAddress;
    let regularMember: SignerWithAddress;
    let bannedMember: SignerWithAddress;
    let inviteCode: string;

    beforeEach(async function () {
        [moderator, regularMember, bannedMember] = users;

        // Create tribe as private initially
        const tribeTx = await tribeController.connect(creator).createTribe(
            "Role Test Tribe",
            "ipfs://metadata",
            [creator.address, moderator.address], // Add moderator to whitelist
            1, // PRIVATE
            0,
            []
        );
        const receipt = await tribeTx.wait();
        const event = receipt?.logs.find(x => x instanceof EventLog && x.eventName === "TribeCreated") as EventLog;
        tribeId = event ? Number(event.args[0]) : 0;

        // Grant moderator role
        await roleManager.grantRole(ethers.keccak256(ethers.toUtf8Bytes("MODERATOR_ROLE")), moderator.address);

        // Add regular member through approval process
        await tribeController.connect(regularMember).requestToJoinTribe(tribeId);
        await tribeController.connect(creator).approveMember(tribeId, regularMember.address);
    });

    describe("Role-based Access Control", function () {
        it("Should allow moderator to perform moderation actions", async function () {
            // Moderator should be able to approve new members
            await tribeController.connect(user1).requestToJoinTribe(tribeId);
            await expect(tribeController.connect(moderator).approveMember(tribeId, user1.address))
                .to.emit(tribeController, "MembershipUpdated")
                .withArgs(tribeId, user1.address, 1);
        });

        it("Should prevent regular members from performing admin actions", async function () {
            await tribeController.connect(user1).requestToJoinTribe(tribeId);
            await expect(tribeController.connect(regularMember).approveMember(tribeId, user1.address))
                .to.be.revertedWith("Not tribe admin");
        });
    });

    describe("Member Management", function () {
        it("Should handle member banning correctly", async function () {
            // Admin bans a member
            await expect(tribeController.connect(creator).banMember(tribeId, regularMember.address))
                .to.emit(tribeController, "MembershipUpdated")
                .withArgs(tribeId, regularMember.address, 3); // BANNED

            // Banned member should not be able to rejoin
            await expect(tribeController.connect(regularMember).requestToJoinTribe(tribeId))
                .to.be.revertedWith("User is banned");
        });

        it("Should handle member approval flow correctly", async function () {
            // New member requests to join
            await tribeController.connect(user1).requestToJoinTribe(tribeId);
            expect(await tribeController.getMemberStatus(tribeId, user1.address))
                .to.equal(2); // PENDING

            // Admin approves
            await tribeController.connect(creator).approveMember(tribeId, user1.address);
            expect(await tribeController.getMemberStatus(tribeId, user1.address))
                .to.equal(1); // ACTIVE
        });

        it("Should handle member rejection flow correctly", async function () {
            // New member requests to join
            await tribeController.connect(user1).requestToJoinTribe(tribeId);
            
            // Admin rejects
            await expect(tribeController.connect(creator).rejectMember(tribeId, user1.address))
                .to.emit(tribeController, "MembershipUpdated")
                .withArgs(tribeId, user1.address, 0); // NONE

            // Rejected member should be able to request again
            await expect(tribeController.connect(user1).requestToJoinTribe(tribeId))
                .to.not.be.reverted;
        });
    });

    describe("Invite Code Management", function () {
        beforeEach(async function () {
            // Change tribe to invite-only
            await tribeController.connect(creator).updateTribeConfig(
                tribeId,
                6, // INVITE_CODE
                0,
                []
            );
        });

        it("Should manage invite codes correctly", async function () {
            // Create invite code
            const inviteCode = "TEST123";
            const inviteCodeBytes32 = ethers.keccak256(ethers.toUtf8Bytes(inviteCode));
            await tribeController.connect(creator).createInviteCode(
                tribeId,
                inviteCode,
                3, // maxUses
                0 // no expiry
            );

            // Use invite code
            await expect(tribeController.connect(user1).joinTribeWithCode(tribeId, inviteCodeBytes32))
                .to.emit(tribeController, "MembershipUpdated")
                .withArgs(tribeId, user1.address, 1);

            // Check remaining uses
            const [valid, remainingUses] = await tribeController.getInviteCodeStatus(tribeId, inviteCode);
            expect(valid).to.be.true;
            expect(remainingUses).to.equal(2);
        });

        it("Should handle invite code revocation", async function () {
            // Create and then revoke invite code
            const inviteCode = "REVOKE123";
            const inviteCodeBytes32 = ethers.keccak256(ethers.toUtf8Bytes(inviteCode));
            await tribeController.connect(creator).createInviteCode(tribeId, inviteCode, 5, 0);
            await tribeController.connect(creator).revokeInviteCode(tribeId, inviteCode);

            // Attempt to use revoked code
            await expect(tribeController.connect(user1).joinTribeWithCode(tribeId, inviteCodeBytes32))
                .to.be.revertedWith("Invalid invite code");
        });

        it("Should enforce invite code usage limits", async function () {
            // Create invite code with 2 uses
            const inviteCode = "LIMITED123";
            const inviteCodeBytes32 = ethers.keccak256(ethers.toUtf8Bytes(inviteCode));
            await tribeController.connect(creator).createInviteCode(tribeId, inviteCode, 2, 0);

            // Use up the limit
            await tribeController.connect(user1).joinTribeWithCode(tribeId, inviteCodeBytes32);
            await tribeController.connect(user2).joinTribeWithCode(tribeId, inviteCodeBytes32);

            // Third attempt should fail
            await expect(tribeController.connect(users[2]).joinTribeWithCode(tribeId, inviteCodeBytes32))
                .to.be.revertedWith("Invite code expired");
        });
    });

    describe("Tribe Configuration Updates", function () {
        it("Should handle join type changes correctly", async function () {
            // Change from private to public
            await tribeController.connect(creator).updateTribeConfig(
                tribeId,
                0, // PUBLIC
                0,
                []
            );

            // Should allow direct joining
            await expect(tribeController.connect(user1).joinTribe(tribeId))
                .to.emit(tribeController, "MembershipUpdated")
                .withArgs(tribeId, user1.address, 1);
        });

        it("Should handle entry fee changes", async function () {
            // Set entry fee
            const entryFee = ethers.parseEther("0.1");
            await tribeController.connect(creator).updateTribeConfig(
                tribeId,
                1, // PRIVATE
                entryFee,
                []
            );

            // Attempt to join without fee
            await expect(tribeController.connect(user1).requestToJoinTribe(tribeId))
                .to.be.revertedWith("Insufficient entry fee");

            // Join with correct fee
            await expect(tribeController.connect(user1).requestToJoinTribe(tribeId, { value: entryFee }))
                .to.emit(tribeController, "MembershipUpdated")
                .withArgs(tribeId, user1.address, 2); // PENDING
        });
    });

    describe("Member Status Transitions", function () {
        it("Should handle all member status transitions correctly", async function () {
            // Request to join -> PENDING
            await tribeController.connect(user1).requestToJoinTribe(tribeId);
            expect(await tribeController.getMemberStatus(tribeId, user1.address))
                .to.equal(2); // PENDING

            // Approve -> ACTIVE
            await tribeController.connect(creator).approveMember(tribeId, user1.address);
            expect(await tribeController.getMemberStatus(tribeId, user1.address))
                .to.equal(1); // ACTIVE

            // Ban -> BANNED
            await tribeController.connect(creator).banMember(tribeId, user1.address);
            expect(await tribeController.getMemberStatus(tribeId, user1.address))
                .to.equal(3); // BANNED

            // Attempt to rejoin should fail
            await expect(tribeController.connect(user1).requestToJoinTribe(tribeId))
                .to.be.revertedWith("User is banned");
        });
    });
  });
}); 