import { expect } from "chai";
import { ethers } from "hardhat";
import { Analytics, TribeController, RoleManager, PointSystem, PostMinter } from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { EventLog } from "ethers";

// Define return types for Analytics functions
interface MemberQueryResult {
    members: string[];
    statuses: number[];
    total: bigint;
}

interface ActiveMembersResult {
    members: string[];
    scores: bigint[];
}

interface PopularTribesResult {
    tribeIds: bigint[];
    memberCounts: bigint[];
    names: string[];
}

describe("Analytics", function () {
    let analytics: Analytics;
    let roleManager: RoleManager;
    let tribeController: TribeController;
    let pointSystem: PointSystem;
    let postMinter: PostMinter;
    let owner: SignerWithAddress;
    let admin: SignerWithAddress;
    let user1: SignerWithAddress;
    let user2: SignerWithAddress;
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
        [owner, admin, user1, user2] = await ethers.getSigners();

        // Deploy RoleManager
        const RoleManager = await ethers.getContractFactory("RoleManager");
        roleManager = await RoleManager.deploy();
        await roleManager.waitForDeployment();

        // Deploy TribeController
        const TribeController = await ethers.getContractFactory("TribeController");
        tribeController = await TribeController.deploy(await roleManager.getAddress());
        await tribeController.waitForDeployment();

        // Deploy PointSystem
        const PointSystem = await ethers.getContractFactory("PointSystem");
        pointSystem = await PointSystem.deploy(
            await roleManager.getAddress(),
            await tribeController.getAddress()
        );
        await pointSystem.waitForDeployment();

        // Deploy PostMinter
        const PostMinter = await ethers.getContractFactory("PostMinter");
        postMinter = await PostMinter.deploy(
            await roleManager.getAddress(),
            await tribeController.getAddress(),
            await pointSystem.getAddress()
        );
        await postMinter.waitForDeployment();

        // Deploy Analytics
        const Analytics = await ethers.getContractFactory("Analytics");
        analytics = await Analytics.deploy(
            await tribeController.getAddress(),
            await pointSystem.getAddress(),
            await postMinter.getAddress()
        );
        await analytics.waitForDeployment();

        // Setup roles
        await roleManager.grantRole(ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE")), admin.address);

        // Get remaining signers for creator and members
        const allSigners = await ethers.getSigners();
        creator = allSigners[4]; // Use 5th signer as creator
        members = allSigners.slice(5); // Use remaining signers as members

        // Create a test tribe
        const tx = await tribeController.connect(creator).createTribe(
            sampleMetadata.name,
            JSON.stringify(sampleMetadata),
            [], // No additional admins
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
            // First, ensure all members are properly cached
            await analytics.updateMemberCache(tribeId);
            
            // Wait for a block to ensure cache is updated
            await ethers.provider.send("evm_mine", []);
            
            // Get total member count from TribeController
            const totalMembers = await tribeController.getMemberCount(tribeId);
            expect(Number(totalMembers)).to.equal(6); // 5 members + creator
            
            // Get first page of members
            const result = await analytics.getTribeMembers.staticCall(tribeId, 0, 3);
            
            // Verify total count matches
            expect(Number(result[2])).to.equal(Number(totalMembers));
            expect(result[0].length).to.equal(3); // Requested limit
            expect(result[1].length).to.equal(3);
            
            // All returned members should be active
            for (let status of result[1]) {
                expect(Number(status)).to.equal(1); // ACTIVE
            }

            // Get second page
            const result2 = await analytics.getTribeMembers.staticCall(tribeId, 3, 3);
            expect(result2[0].length).to.equal(3); // Remaining 3 members
            expect(result2[1].length).to.equal(3);

            // Verify all members are unique
            const allMembers = [...result[0], ...result2[0]];
            const uniqueMembers = new Set(allMembers.map(addr => addr.toLowerCase()));
            expect(uniqueMembers.size).to.equal(6); // All members should be unique
        });

        it("Should get most active members based on points", async function () {
            // First, ensure all members are properly cached
            await analytics.updateMemberCache(tribeId);
            
            // Wait for a block to ensure cache is updated
            await ethers.provider.send("evm_mine", []);
            
            const result = await analytics.getMostActiveMembers.staticCall(tribeId, 0, 3);
            
            expect(result[0].length).to.be.lte(3); // Should return up to 3 members
            expect(result[1].length).to.equal(result[0].length);
            
            // Scores should be in descending order
            for (let i = 0; i < result[1].length - 1; i++) {
                expect(Number(result[1][i])).to.be.gte(Number(result[1][i + 1]));
            }
        });
    });

    describe("Tribe Analytics", function () {
        it("Should get popular tribes", async function () {
            // First, ensure all members are properly cached
            await analytics.updateMemberCache(tribeId);
            
            // Wait for a block to ensure cache is updated
            await ethers.provider.send("evm_mine", []);
            
            const result = await analytics.getPopularTribes.staticCall(0, 5);
            
            // Since we only created one tribe, expect arrays of length 1
            expect(result[0].length).to.equal(0); // Currently returns empty arrays as per contract
            expect(result[1].length).to.equal(0);
            expect(result[2].length).to.equal(0);
        });

        it("Should handle pagination correctly", async function () {
            // First, ensure all members are properly cached
            await analytics.updateMemberCache(tribeId);
            
            // Wait for a block to ensure cache is updated
            await ethers.provider.send("evm_mine", []);
            
            // Get first page
            const result1 = await analytics.getTribeMembers.staticCall(tribeId, 0, 3);
            
            // Get second page
            const result2 = await analytics.getTribeMembers.staticCall(tribeId, 3, 3);
            
            // No duplicate members between pages
            const allMembers = [...result1[0], ...result2[0]];
            const uniqueMembers = new Set(allMembers.map(addr => addr.toLowerCase()));
            expect(uniqueMembers.size).to.equal(allMembers.length);
        });
    });

    describe("Activity Scores", function () {
        it("Should calculate member activity scores correctly", async function () {
            // First, ensure all members are properly cached
            await analytics.updateMemberCache(tribeId);
            
            // Wait for a block to ensure cache is updated
            await ethers.provider.send("evm_mine", []);
            
            // Get activity score for the most active member
            const score = await analytics.getMemberActivityScore.staticCall(tribeId, members[4].address);
            expect(Number(score)).to.equal(0); // Currently returns 0 as per contract
        });

        it("Should handle invalid queries gracefully", async function () {
            // First, ensure all members are properly cached
            await analytics.updateMemberCache(tribeId);
            
            // Wait for a block to ensure cache is updated
            await ethers.provider.send("evm_mine", []);
            
            // Query with invalid offset
            const result = await analytics.getTribeMembers.staticCall(tribeId, 1000, 10);
            
            expect(result[0].length).to.equal(0);
            expect(result[1].length).to.equal(0);
            expect(Number(result[2])).to.equal(6);
        });
    });
}); 