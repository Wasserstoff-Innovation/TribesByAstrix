// test/UserJourney.test.ts
import { expect } from "chai";
import { ethers } from "hardhat";
import { TribeController, RoleManager } from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { EventLog } from "ethers";

// Import types from the interface
interface NFTRequirement {
    nftContract: string;
    nftType: number;
    isMandatory: boolean;
    minAmount: bigint;
    tokenIds: bigint[];
}

enum JoinType {
    PUBLIC,
    PRIVATE,
    INVITE_ONLY,
    NFT_GATED,
    MULTI_NFT,
    ANY_NFT,
    INVITE_CODE
}

enum MemberStatus {
    NONE,
    ACTIVE,
    PENDING,
    BANNED
}

describe("User Journey: Tribe Management", function () {
    let tribeController: TribeController;
    let roleManager: RoleManager;
    let owner: SignerWithAddress;
    let admin: SignerWithAddress;
    let user1: SignerWithAddress;
    let user2: SignerWithAddress;

    beforeEach(async function () {
        [owner, admin, user1, user2] = await ethers.getSigners();

        // Deploy RoleManager
        const RoleManager = await ethers.getContractFactory("RoleManager");
        roleManager = await RoleManager.deploy();
        await roleManager.waitForDeployment();

        // Deploy TribeController
        const TribeController = await ethers.getContractFactory("TribeController");
        tribeController = await TribeController.deploy(await roleManager.getAddress());
        await tribeController.waitForDeployment();

        // Setup roles
        await roleManager.grantRole(ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE")), admin.address);
    });

    describe("Scenario 1: Tribe Creation", function () {
        it("Should create a public tribe successfully", async function () {
            const tribeName = "Test Public Tribe";
            const metadata = JSON.stringify({
                name: tribeName,
                description: "A test public tribe"
            });

            const tx = await tribeController.connect(user1).createTribe(
                tribeName,
                metadata,
                [], // No additional admins
                0, // PUBLIC join type
                0, // No entry fee
                [] // No NFT requirements
            );

            const receipt = await tx.wait();
            const event = receipt?.logs.find(
                log => log.topics[0] === ethers.id("TribeCreated(uint256,address,string,uint8)")
            );

            expect(event).to.not.be.undefined;

            // Verify tribe admin
            expect(await tribeController.getTribeAdmin(0)).to.equal(user1.address);

            // Verify member status
            expect(await tribeController.getMemberStatus(0, user1.address)).to.equal(1); // ACTIVE
        });

        it("Should create a private tribe with entry fee", async function () {
            const tribeName = "Test Private Tribe";
            const metadata = JSON.stringify({
                name: tribeName,
                description: "A test private tribe"
            });
            const entryFee = ethers.parseEther("0.1");

            const tx = await tribeController.connect(user1).createTribe(
                tribeName,
                metadata,
                [], // No additional admins
                1, // PRIVATE join type
                entryFee,
                [] // No NFT requirements
            );

            const receipt = await tx.wait();
            const event = receipt?.logs.find(
                log => log.topics[0] === ethers.id("TribeCreated(uint256,address,string,uint8)")
            );

            expect(event).to.not.be.undefined;

            // Verify tribe admin
            expect(await tribeController.getTribeAdmin(0)).to.equal(user1.address);

            // Verify tribe config
            const config = await tribeController.getTribeConfigView(0);
            expect(config.joinType).to.equal(1); // PRIVATE
            expect(config.entryFee).to.equal(entryFee);
        });
    });

    describe("Scenario 2: Update Tribe", function () {
        let tribeId: number;

        beforeEach(async function () {
            // Create initial tribe
            const tx = await tribeController.connect(user1).createTribe(
                "Test Tribe",
                "ipfs://metadata",
                [], // No additional admins
                0, // PUBLIC
                0, // No entry fee
                [] // No NFT requirements
            );
            const receipt = await tx.wait();
            const event = receipt?.logs.find(
                x => x instanceof EventLog && x.eventName === "TribeCreated"
            ) as EventLog;
            tribeId = event ? Number(event.args[0]) : 0;
        });

        it("Should allow tribe admin to update tribe config", async function () {
            const newJoinType = 1; // PRIVATE
            const newEntryFee = ethers.parseEther("0.2");

            await expect(tribeController.connect(user1).updateTribeConfig(
                tribeId,
                newJoinType,
                newEntryFee,
                [] // No NFT requirements
            )).to.not.be.reverted;

            const config = await tribeController.getTribeConfigView(tribeId);
            expect(config.joinType).to.equal(newJoinType);
            expect(config.entryFee).to.equal(newEntryFee);
        });

        it("Should prevent non-admin from updating tribe config", async function () {
            await expect(tribeController.connect(user2).updateTribeConfig(
                tribeId,
                1,
                0,
                []
            )).to.be.revertedWith("Not tribe admin");
        });
    });

    describe("Scenario 3: Join a Tribe", function () {
        let publicTribeId: number;
        let privateTribeId: number;

        beforeEach(async function () {
            // Create public tribe
            const tx1 = await tribeController.connect(user1).createTribe(
                "Public Tribe",
                "ipfs://metadata",
                [], // No additional admins
                0, // PUBLIC
                0, // No entry fee
                [] // No NFT requirements
            );
            const receipt1 = await tx1.wait();
            const event1 = receipt1?.logs.find(
                x => x instanceof EventLog && x.eventName === "TribeCreated"
            ) as EventLog;
            publicTribeId = event1 ? Number(event1.args[0]) : 0;

            // Create private tribe
            const tx2 = await tribeController.connect(user1).createTribe(
                "Private Tribe",
                "ipfs://metadata",
                [], // No additional admins
                1, // PRIVATE
                ethers.parseEther("0.1"),
                [] // No NFT requirements
            );
            const receipt2 = await tx2.wait();
            const event2 = receipt2?.logs.find(
                x => x instanceof EventLog && x.eventName === "TribeCreated"
            ) as EventLog;
            privateTribeId = event2 ? Number(event2.args[0]) : 1;
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
                .to.equal(2); // PENDING
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
                .to.equal(0); // NONE

            // Check if entry fee was returned (approximately, accounting for gas costs)
            const finalBalance = await ethers.provider.getBalance(user2.address);
            expect(finalBalance).to.be.closeTo(initialBalance, ethers.parseEther("0.01"));
        });
    });
});