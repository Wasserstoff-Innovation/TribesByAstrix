import { expect } from "chai";
import { ethers } from "hardhat";
import { Analytics, TribeController, RoleManager, PointSystem } from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { EventLog } from "ethers";

describe("Analytics", function () {
    let analytics: Analytics;
    let tribeController: TribeController;
    let roleManager: RoleManager;
    let pointSystem: PointSystem;
    let owner: SignerWithAddress;
    let creator: SignerWithAddress;
    let members: SignerWithAddress[];
    let tribeId: number;

    const sampleMetadata = {
        name: 'Test Tribe',
        description: 'A test tribe for analytics',
        avatar: '/test.svg',
        coverImage: '/test-banner.png'
    };

    beforeEach(async function () {
        [owner, creator, ...members] = await ethers.getSigners();

        // Deploy RoleManager first
        const RoleManager = await ethers.getContractFactory("RoleManager");
        roleManager = await RoleManager.deploy();
        await roleManager.waitForDeployment();

        // Deploy TribeController with RoleManager address
        const TribeController = await ethers.getContractFactory("TribeController");
        tribeController = await TribeController.deploy(await roleManager.getAddress());
        await tribeController.waitForDeployment();

        // Deploy PointSystem with RoleManager and TribeController addresses
        const PointSystem = await ethers.getContractFactory("PointSystem");
        pointSystem = await PointSystem.deploy(
            await roleManager.getAddress(),
            await tribeController.getAddress()
        );
        await pointSystem.waitForDeployment();

        // Deploy Analytics with TribeController and PointSystem addresses
        const Analytics = await ethers.getContractFactory("Analytics");
        analytics = await Analytics.deploy(
            await tribeController.getAddress(),
            await pointSystem.getAddress()
        );
        await analytics.waitForDeployment();

        // Grant creator role
        await roleManager.grantRole(ethers.keccak256(ethers.toUtf8Bytes("CREATOR_ROLE")), creator.address);

        // Create a test tribe
        const tx = await tribeController.connect(creator).createTribe(
            sampleMetadata.name,
            JSON.stringify(sampleMetadata),
            [creator.address],
            0, // PUBLIC
            0, // No entry fee
            [] // No NFT requirements
        );
        const receipt = await tx.wait();
        const event = receipt?.logs.find(x => x instanceof EventLog && x.eventName === "TribeCreated") as EventLog;
        tribeId = event ? Number(event.args[0]) : 0;

        // Add some members to the tribe
        for (let i = 0; i < 5; i++) {
            await tribeController.connect(members[i]).joinTribe(tribeId);
            // Add some points with action type
            await pointSystem.connect(creator).awardPoints(
                tribeId, 
                members[i].address, 
                (i + 1) * 100,
                ethers.encodeBytes32String("CUSTOM")
            );
        }
    });

    describe("Member Queries", function () {
        it("Should get paginated list of tribe members", async function () {
            await analytics.updateMemberCache(tribeId);
            const [memberList, statuses, total] = await analytics.getTribeMembers(tribeId, 0, 3);
            
            expect(total).to.equal(6); // 5 members + creator
            expect(memberList.length).to.equal(3); // Requested limit
            expect(statuses.length).to.equal(3);
            
            // All returned members should be active
            for (let status of statuses) {
                expect(status).to.equal(1); // ACTIVE
            }
        });

        it("Should get most active members based on points", async function () {
            await analytics.updateMemberCache(tribeId);
            const [activeMembers, scores] = await analytics.getMostActiveMembers(tribeId, 0, 3);
            
            expect(activeMembers.length).to.equal(3);
            expect(scores.length).to.equal(3);
            
            // Scores should be in descending order
            for (let i = 0; i < scores.length - 1; i++) {
                expect(scores[i]).to.be.gte(scores[i + 1]);
            }
        });
    });

    describe("Tribe Analytics", function () {
        it("Should get popular tribes", async function () {
            const [tribeIds, memberCounts, names] = await analytics.getPopularTribes(0, 5);
            
            expect(tribeIds.length).to.equal(5);
            expect(memberCounts.length).to.equal(5);
            expect(names.length).to.equal(5);
        });

        it("Should handle pagination correctly", async function () {
            await analytics.updateMemberCache(tribeId);
            
            // Get first page
            const [members1] = await analytics.getTribeMembers(tribeId, 0, 3);
            // Get second page
            const [members2] = await analytics.getTribeMembers(tribeId, 3, 3);
            
            // No duplicate members between pages
            const allMembers = [...members1, ...members2];
            const uniqueMembers = new Set(allMembers);
            expect(uniqueMembers.size).to.equal(allMembers.length);
        });
    });

    describe("Activity Scores", function () {
        it("Should calculate member activity scores correctly", async function () {
            // Get activity score for the most active member
            const score = await analytics.getMemberActivityScore(tribeId, members[4].address);
            expect(score).to.equal(500); // 5 * 100 points
        });

        it("Should handle invalid queries gracefully", async function () {
            // Query with invalid offset
            const [members, statuses, total] = await analytics.getTribeMembers(tribeId, 1000, 10);
            expect(members.length).to.equal(0);
            expect(statuses.length).to.equal(0);
            expect(total).to.equal(6);
        });
    });
}); 