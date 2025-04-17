import { expect } from "chai";
import { ethers } from "hardhat";
import { PointSystem, RoleManager, TribeController, CollectibleController } from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { EventLog } from "ethers";

describe("PointSystem", function () {
    let pointSystem: PointSystem;
    let roleManager: RoleManager;
    let tribeController: TribeController;
    let collectibleController: CollectibleController;
    let owner: SignerWithAddress;
    let admin: SignerWithAddress;
    let user1: SignerWithAddress;
    let user2: SignerWithAddress;
    let tribeId: number;

    const POST_ACTION = ethers.keccak256(ethers.toUtf8Bytes("POST"));
    const COMMENT_ACTION = ethers.keccak256(ethers.toUtf8Bytes("COMMENT"));
    const LIKE_ACTION = ethers.keccak256(ethers.toUtf8Bytes("LIKE"));

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

        // Deploy CollectibleController
        const CollectibleController = await ethers.getContractFactory("CollectibleController");
        collectibleController = await CollectibleController.deploy(
            await roleManager.getAddress(),
            await tribeController.getAddress(),
            await pointSystem.getAddress()
        );
        await collectibleController.waitForDeployment();

        // Create a test tribe
        const tx = await tribeController.connect(admin).createTribe(
            "Test Tribe",
            JSON.stringify({ name: "Test Tribe", description: "A test tribe" }),
            [admin.address],
            0, // PUBLIC
            0, // No entry fee
            [] // No NFT requirements
        );
        const receipt = await tx.wait();
        const event = receipt?.logs.find(
            x => x instanceof EventLog && x.eventName === "TribeCreated"
        ) as EventLog;
        tribeId = event ? Number(event.args[0]) : 0;

        // Add users to tribe
        await tribeController.connect(user1).joinTribe(tribeId);
        await tribeController.connect(user2).joinTribe(tribeId);

        // Create tribe token
        await pointSystem.connect(admin).createTribeToken(
            tribeId,
            "Test Points",
            "TP"
        );

        // Set action points
        await pointSystem.connect(admin).setActionPoints(tribeId, POST_ACTION, 100);
        await pointSystem.connect(admin).setActionPoints(tribeId, COMMENT_ACTION, 50);
        await pointSystem.connect(admin).setActionPoints(tribeId, LIKE_ACTION, 10);
    });

    describe("Point System Basic Operations", function () {
        it("Should award points for actions correctly", async function () {
            // Award points for a post
            await pointSystem.connect(admin).recordAction(tribeId, user1.address, POST_ACTION);
            expect(await pointSystem.getMemberPoints(tribeId, user1.address)).to.equal(100);

            // Award points for a comment
            await pointSystem.connect(admin).recordAction(tribeId, user1.address, COMMENT_ACTION);
            expect(await pointSystem.getMemberPoints(tribeId, user1.address)).to.equal(150);

            // Award points for a like
            await pointSystem.connect(admin).recordAction(tribeId, user1.address, LIKE_ACTION);
            expect(await pointSystem.getMemberPoints(tribeId, user1.address)).to.equal(160);
        });

        it("Should track action counts correctly", async function () {
            await pointSystem.connect(admin).recordAction(tribeId, user1.address, POST_ACTION);
            await pointSystem.connect(admin).recordAction(tribeId, user1.address, POST_ACTION);
            
            expect(await pointSystem.getActionCount(tribeId, user1.address, POST_ACTION)).to.equal(2);
        });

        it("Should allow manual point awards by admin", async function () {
            await pointSystem.connect(admin).awardPoints(
                tribeId,
                user1.address,
                500,
                ethers.keccak256(ethers.toUtf8Bytes("CUSTOM"))
            );
            expect(await pointSystem.getMemberPoints(tribeId, user1.address)).to.equal(500);
        });
    });

    describe("Point System Negative Tests", function () {
        it("Should prevent non-admin from awarding points", async function () {
            await expect(
                pointSystem.connect(user1).awardPoints(
                    tribeId,
                    user2.address,
                    100,
                    POST_ACTION
                )
            ).to.be.revertedWith("Not tribe admin");
        });

        it("Should prevent awarding points to non-members", async function () {
            const nonMember = owner; // Owner hasn't joined the tribe
            await expect(
                pointSystem.connect(admin).awardPoints(
                    tribeId,
                    nonMember.address,
                    100,
                    POST_ACTION
                )
            ).to.be.revertedWith("Not an active member");
        });

        it("Should prevent deducting more points than available", async function () {
            // Award 100 points
            await pointSystem.connect(admin).awardPoints(
                tribeId,
                user1.address,
                100,
                POST_ACTION
            );

            // Try to deduct 200 points
            await expect(
                pointSystem.connect(admin).deductPoints(
                    tribeId,
                    user1.address,
                    200,
                    "Test deduction"
                )
            ).to.be.revertedWith("Insufficient points");
        });
    });

    describe("Point System Integration with Collectibles", function () {
        let collectibleId: number;

        beforeEach(async function () {
            // Create a collectible with point requirement
            const tx = await collectibleController.connect(admin).createCollectible(
                tribeId,
                "Test Collectible",
                "TEST",
                "ipfs://test",
                100,
                ethers.parseEther("0.1"),
                150 // Requires 150 points
            );
            const receipt = await tx.wait();
            const event = receipt?.logs.find(
                x => x instanceof EventLog && x.eventName === "CollectibleCreated"
            ) as EventLog;
            collectibleId = event ? Number(event.args[0]) : 0;
        });

        it("Should allow claiming collectible with sufficient points", async function () {
            // Award enough points
            await pointSystem.connect(admin).awardPoints(
                tribeId,
                user1.address,
                200,
                POST_ACTION
            );

            // Claim collectible
            await expect(
                collectibleController.connect(user1).claimCollectible(
                    tribeId,
                    collectibleId,
                    { value: ethers.parseEther("0.1") }
                )
            ).to.emit(collectibleController, "CollectibleClaimed");
        });

        it("Should prevent claiming collectible without sufficient points", async function () {
            // Award insufficient points
            await pointSystem.connect(admin).awardPoints(
                tribeId,
                user1.address,
                100, // Less than required 150
                POST_ACTION
            );

            // Try to claim collectible
            await expect(
                collectibleController.connect(user1).claimCollectible(
                    tribeId,
                    collectibleId,
                    { value: ethers.parseEther("0.1") }
                )
            ).to.be.revertedWith("Insufficient points");
        });
    });

    describe("Point System Analytics", function () {
        it("Should return top members correctly", async function () {
            // Award different amounts of points to users
            await pointSystem.connect(admin).awardPoints(tribeId, user1.address, 500, POST_ACTION);
            await pointSystem.connect(admin).awardPoints(tribeId, user2.address, 300, POST_ACTION);
            await pointSystem.connect(admin).awardPoints(tribeId, admin.address, 100, POST_ACTION);

            const [members, points] = await pointSystem.getTopMembers(tribeId, 3);
            
            expect(members[0]).to.equal(user1.address);
            expect(points[0]).to.equal(500);
            expect(members[1]).to.equal(user2.address);
            expect(points[1]).to.equal(300);
        });
    });

    describe("User Flow Scenarios", function () {
        beforeEach(async function () {
            // Set up point values for different actions
            await pointSystem.connect(admin).setActionPoints(tribeId, POST_ACTION, 100);      // 100 points per post
            await pointSystem.connect(admin).setActionPoints(tribeId, COMMENT_ACTION, 20);    // 20 points per comment
            await pointSystem.connect(admin).setActionPoints(tribeId, LIKE_ACTION, 5);        // 5 points per like
            
            console.log("Point values set up:");
            console.log("- Post: 100 points");
            console.log("- Comment: 20 points");
            console.log("- Like: 5 points");
        });

        it("Should track user engagement points correctly", async function () {
            console.log("\nScenario: User engagement points tracking");
            
            // User1 creates a post
            console.log("\nStep 1: User1 creates a post");
            await pointSystem.connect(admin).recordAction(tribeId, user1.address, POST_ACTION);
            let user1Points = await pointSystem.getMemberPoints(tribeId, user1.address);
            expect(user1Points).to.equal(100);
            console.log(`User1 points after posting: ${user1Points}`);

            // User2 likes User1's post and comments
            console.log("\nStep 2: User2 likes and comments on User1's post");
            await pointSystem.connect(admin).recordAction(tribeId, user2.address, LIKE_ACTION);
            await pointSystem.connect(admin).recordAction(tribeId, user2.address, COMMENT_ACTION);
            let user2Points = await pointSystem.getMemberPoints(tribeId, user2.address);
            expect(user2Points).to.equal(25); // 5 (like) + 20 (comment)
            console.log(`User2 points after like and comment: ${user2Points}`);

            // User1 creates another post and gets likes
            console.log("\nStep 3: User1 creates another post and receives likes");
            await pointSystem.connect(admin).recordAction(tribeId, user1.address, POST_ACTION);
            await pointSystem.connect(admin).recordAction(tribeId, user2.address, LIKE_ACTION);
            user1Points = await pointSystem.getMemberPoints(tribeId, user1.address);
            user2Points = await pointSystem.getMemberPoints(tribeId, user2.address);
            expect(user1Points).to.equal(200); // 100 + 100 (two posts)
            expect(user2Points).to.equal(30);  // 25 + 5 (additional like)
            console.log(`User1 points after second post: ${user1Points}`);
            console.log(`User2 points after second like: ${user2Points}`);
        });

        it("Should track milestone achievements", async function () {
            console.log("\nScenario: User milestone achievements");
            
            // Track post milestones
            console.log("\nStep 1: Tracking post milestones");
            for (let i = 0; i < 5; i++) {
                await pointSystem.connect(admin).recordAction(tribeId, user1.address, POST_ACTION);
                const points = await pointSystem.getMemberPoints(tribeId, user1.address);
                const posts = await pointSystem.getActionCount(tribeId, user1.address, POST_ACTION);
                console.log(`User1 after ${posts} posts: ${points} points`);
            }

            // Verify final state
            const finalPoints = await pointSystem.getMemberPoints(tribeId, user1.address);
            const postCount = await pointSystem.getActionCount(tribeId, user1.address, POST_ACTION);
            expect(finalPoints).to.equal(500); // 5 posts * 100 points
            expect(postCount).to.equal(5);
            console.log(`Final state - Posts: ${postCount}, Points: ${finalPoints}`);
        });

        it("Should handle community engagement scenario", async function () {
            console.log("\nScenario: Community engagement simulation");
            
            // User1 and User2 engage in discussion
            console.log("\nStep 1: Users engaging in discussion");
            
            // User1 creates initial post
            await pointSystem.connect(admin).recordAction(tribeId, user1.address, POST_ACTION);
            
            // User2 comments and likes
            await pointSystem.connect(admin).recordAction(tribeId, user2.address, COMMENT_ACTION);
            await pointSystem.connect(admin).recordAction(tribeId, user2.address, LIKE_ACTION);
            
            // User1 responds with comment
            await pointSystem.connect(admin).recordAction(tribeId, user1.address, COMMENT_ACTION);
            
            // Check engagement metrics
            const user1Points = await pointSystem.getMemberPoints(tribeId, user1.address);
            const user2Points = await pointSystem.getMemberPoints(tribeId, user2.address);
            const user1Comments = await pointSystem.getActionCount(tribeId, user1.address, COMMENT_ACTION);
            const user2Comments = await pointSystem.getActionCount(tribeId, user2.address, COMMENT_ACTION);
            
            expect(user1Points).to.equal(120); // 100 (post) + 20 (comment)
            expect(user2Points).to.equal(25);  // 20 (comment) + 5 (like)
            expect(user1Comments).to.equal(1);
            expect(user2Comments).to.equal(1);
            
            console.log(`User1 final state - Points: ${user1Points}, Comments: ${user1Comments}`);
            console.log(`User2 final state - Points: ${user2Points}, Comments: ${user2Comments}`);
        });

        it("Should handle point redemption scenario", async function () {
            console.log("\nScenario: Point redemption flow");
            
            // Award initial points through actions
            console.log("\nStep 1: Building up points");
            // 3 posts (300 points)
            for (let i = 0; i < 3; i++) {
                await pointSystem.connect(admin).recordAction(tribeId, user1.address, POST_ACTION);
            }
            // 5 comments (100 points)
            for (let i = 0; i < 5; i++) {
                await pointSystem.connect(admin).recordAction(tribeId, user1.address, COMMENT_ACTION);
            }
            // 10 likes (50 points)
            for (let i = 0; i < 10; i++) {
                await pointSystem.connect(admin).recordAction(tribeId, user1.address, LIKE_ACTION);
            }

            const initialPoints = await pointSystem.getMemberPoints(tribeId, user1.address);
            expect(initialPoints).to.equal(450); // 300 + 100 + 50
            console.log(`Initial points accumulated: ${initialPoints}`);

            // Get tribe token address
            const tribeToken = await pointSystem.tribeTokens(tribeId);
            const tribeTokenContract = await ethers.getContractAt("contracts/PointSystem.sol:TribePoints", tribeToken);

            // Approve point system to spend points
            console.log("\nStep 2: Approving point deduction");
            await (tribeTokenContract as any).connect(user1).approve(
                await pointSystem.getAddress(),
                ethers.MaxUint256 // Approve maximum amount
            );

            // Simulate point redemption
            console.log("\nStep 3: Redeeming points");
            const redeemAmount = 200;
            await pointSystem.connect(admin).deductPoints(
                tribeId,
                user1.address,
                redeemAmount,
                "Reward redemption"
            );

            const finalPoints = await pointSystem.getMemberPoints(tribeId, user1.address);
            expect(finalPoints).to.equal(250); // 450 - 200
            console.log(`Points after redemption: ${finalPoints}`);
        });
    });
}); 