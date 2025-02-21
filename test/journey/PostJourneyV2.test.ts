import { expect } from "chai";
import { ethers } from "hardhat";
import { PostMinter, RoleManager, TribeController, CollectibleController } from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { EventLog } from "ethers";

describe("Post Journey V2", function () {
    // Contract instances
    let postMinter: PostMinter;
    let roleManager: RoleManager;
    let tribeController: TribeController;
    let collectibleController: CollectibleController;
    let pointSystem: any;

    // User accounts
    let owner: SignerWithAddress;
    let admin: SignerWithAddress;
    let contentCreator: SignerWithAddress;
    let moderator: SignerWithAddress;
    let regularUser1: SignerWithAddress;
    let regularUser2: SignerWithAddress;
    let bannedUser: SignerWithAddress;

    // Test data
    let tribeId: number;
    let publicPostId: number;
    let gatedPostId: number;
    let collectibleId: number;

    before(async function () {
        // Get signers
        [owner, admin, contentCreator, moderator, regularUser1, regularUser2, bannedUser] = await ethers.getSigners();

        // Deploy contracts
        const RoleManager = await ethers.getContractFactory("RoleManager");
        roleManager = await RoleManager.deploy();
        await roleManager.waitForDeployment();

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

        const CollectibleController = await ethers.getContractFactory("CollectibleController");
        collectibleController = await CollectibleController.deploy(
            await roleManager.getAddress(),
            await tribeController.getAddress(),
            await pointSystem.getAddress()
        );
        await collectibleController.waitForDeployment();

        const PostMinter = await ethers.getContractFactory("PostMinter");
        postMinter = await PostMinter.deploy(
            await roleManager.getAddress(),
            await tribeController.getAddress(),
            await collectibleController.getAddress()
        );
        await postMinter.waitForDeployment();

        // Setup roles
        await roleManager.grantRole(ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE")), admin.address);
        await roleManager.grantRole(ethers.keccak256(ethers.toUtf8Bytes("MODERATOR_ROLE")), moderator.address);
        await roleManager.grantRole(ethers.keccak256(ethers.toUtf8Bytes("CONTENT_CREATOR_ROLE")), contentCreator.address);

        // Create test tribe
        const tx = await tribeController.connect(admin).createTribe(
            "Test Tribe",
            JSON.stringify({ name: "Test Tribe", description: "A test tribe" }),
            [admin.address, moderator.address],
            0, // PUBLIC
            0, // No entry fee
            [] // No NFT requirements
        );
        const receipt = await tx.wait();
        const event = receipt?.logs.find(
            x => x instanceof EventLog && x.eventName === "TribeCreated"
        ) as EventLog;
        tribeId = event ? Number(event.args[0]) : 0;

        // Add members to tribe
        await tribeController.connect(contentCreator).joinTribe(tribeId);
        await tribeController.connect(regularUser1).joinTribe(tribeId);
        await tribeController.connect(regularUser2).joinTribe(tribeId);
        await tribeController.connect(bannedUser).joinTribe(tribeId);

        // Ban user
        await tribeController.connect(admin).banMember(tribeId, bannedUser.address);

        // Create test collectible
        const collectibleTx = await collectibleController.connect(admin).createCollectible(
            tribeId,
            "Test Collectible",
            "TEST",
            "ipfs://test",
            100,
            ethers.parseEther("0.1"),
            0
        );
        const collectibleReceipt = await collectibleTx.wait();
        const collectibleEvent = collectibleReceipt?.logs.find(
            x => x instanceof EventLog && x.eventName === "CollectibleCreated"
        ) as EventLog;
        collectibleId = collectibleEvent ? Number(collectibleEvent.args[0]) : 0;
    });

    describe("Content Creator Journey", function () {
        it("Should create different types of posts", async function () {
            // 1. Public Text Post
            const publicPost = {
                type: "TEXT",
                title: "Public Announcement",
                content: "This is a public post",
                tags: ["announcement", "public"],
                createdAt: Math.floor(Date.now() / 1000)
            };

            const publicTx = await postMinter.connect(contentCreator).createPost(
                tribeId,
                JSON.stringify(publicPost),
                false,
                ethers.ZeroAddress,
                0
            );
            expect(publicTx).to.emit(postMinter, "PostCreated");
            const publicEvent = (await publicTx.wait())?.logs.find(
                x => x instanceof EventLog && x.eventName === "PostCreated"
            ) as EventLog;
            publicPostId = publicEvent ? Number(publicEvent.args[0]) : 0;

            // Wait for rate limit
            await ethers.provider.send("evm_increaseTime", [61]); // 61 seconds
            await ethers.provider.send("evm_mine", []);

            // 2. Gated Post
            const gatedPost = {
                type: "PREMIUM",
                title: "Premium Content",
                content: "This is for collectible holders only",
                tags: ["premium", "exclusive"],
                createdAt: Math.floor(Date.now() / 1000)
            };

            const gatedTx = await postMinter.connect(contentCreator).createPost(
                tribeId,
                JSON.stringify(gatedPost),
                true,
                await collectibleController.getAddress(),
                collectibleId
            );
            expect(gatedTx).to.emit(postMinter, "PostCreated");

            // Wait for rate limit
            await ethers.provider.send("evm_increaseTime", [61]); // 61 seconds
            await ethers.provider.send("evm_mine", []);

            // 3. Rich Media Post
            const richMediaPost = {
                type: "RICH_MEDIA",
                title: "Media Showcase",
                content: "Check out these media files",
                mediaContent: {
                    images: ["ipfs://Qm..."],
                    videos: ["ipfs://Qm..."]
                },
                createdAt: Math.floor(Date.now() / 1000)
            };

            await postMinter.connect(contentCreator).createPost(
                tribeId,
                JSON.stringify(richMediaPost),
                false,
                ethers.ZeroAddress,
                0
            );
        });

        it("Should handle post interactions", async function () {
            // Wait for rate limit before creating test post
            await ethers.provider.send("evm_increaseTime", [61]); // 61 seconds
            await ethers.provider.send("evm_mine", []);

            // Create test post
            const testPost = {
                type: "TEXT",
                title: "Test Post",
                content: "This is a test post",
                createdAt: Math.floor(Date.now() / 1000)
            };

            const tx = await postMinter.connect(contentCreator).createPost(
                tribeId,
                JSON.stringify(testPost),
                false,
                ethers.ZeroAddress,
                0
            );
            const event = (await tx.wait())?.logs.find(
                x => x instanceof EventLog && x.eventName === "PostCreated"
            ) as EventLog;
            const postId = event ? Number(event.args[0]) : 0;

            // Wait for rate limit before interactions
            await ethers.provider.send("evm_increaseTime", [61]); // 61 seconds
            await ethers.provider.send("evm_mine", []);

            // Like post
            await postMinter.connect(regularUser1).interactWithPost(postId, 0); // LIKE

            // Wait for rate limit
            await ethers.provider.send("evm_increaseTime", [61]); // 61 seconds
            await ethers.provider.send("evm_mine", []);

            // Comment on post
            await postMinter.connect(regularUser2).interactWithPost(postId, 1); // COMMENT
        });

        it("Should handle post reporting", async function () {
            // Wait for rate limit before creating test post
            await ethers.provider.send("evm_increaseTime", [61]); // 61 seconds
            await ethers.provider.send("evm_mine", []);

            // Create test post
            const testPost = {
                type: "TEXT",
                title: "Test Post",
                content: "This is a test post",
                createdAt: Math.floor(Date.now() / 1000)
            };

            const tx = await postMinter.connect(contentCreator).createPost(
                tribeId,
                JSON.stringify(testPost),
                false,
                ethers.ZeroAddress,
                0
            );
            const event = (await tx.wait())?.logs.find(
                x => x instanceof EventLog && x.eventName === "PostCreated"
            ) as EventLog;
            const postId = event ? Number(event.args[0]) : 0;

            // Wait for rate limit before reporting
            await ethers.provider.send("evm_increaseTime", [61]); // 61 seconds
            await ethers.provider.send("evm_mine", []);

            // Report post
            await postMinter.connect(regularUser1).reportPost(postId, "Inappropriate content");
        });

        it("Should handle post deletion", async function () {
            // Wait for rate limit before creating test post
            await ethers.provider.send("evm_increaseTime", [61]); // 61 seconds
            await ethers.provider.send("evm_mine", []);

            // Create test post
            const testPost = {
                type: "TEXT",
                title: "To be deleted",
                content: "This post will be deleted",
                createdAt: Math.floor(Date.now() / 1000)
            };

            const tx = await postMinter.connect(regularUser1).createPost(
                tribeId,
                JSON.stringify(testPost),
                false,
                ethers.ZeroAddress,
                0
            );
            const deleteEvent = (await tx.wait())?.logs.find(
                x => x instanceof EventLog && x.eventName === "PostCreated"
            ) as EventLog;
            const postId = deleteEvent ? Number(deleteEvent.args[0]) : 0;

            // Wait for rate limit before deletion
            await ethers.provider.send("evm_increaseTime", [61]); // 61 seconds
            await ethers.provider.send("evm_mine", []);

            // Delete post
            await postMinter.connect(regularUser1).deletePost(postId);
        });
    });

    describe("Moderation Journey", function () {
        it("Should handle post reporting", async function () {
            // User reports post
            await postMinter.connect(regularUser2).reportPost(
                publicPostId,
                "Inappropriate content"
            );

            // Same user cannot report twice
            await expect(
                postMinter.connect(regularUser2).reportPost(publicPostId, "Spam")
            ).to.be.revertedWith("Already reported");
        });

        it("Should handle post deletion", async function () {
            // Create test post
            const testPost = {
                type: "TEXT",
                title: "To be deleted",
                content: "This post will be deleted",
                createdAt: Math.floor(Date.now() / 1000)
            };

            const tx = await postMinter.connect(regularUser1).createPost(
                tribeId,
                JSON.stringify(testPost),
                false,
                ethers.ZeroAddress,
                0
            );
            const deleteEvent = (await tx.wait())?.logs.find(
                x => x instanceof EventLog && x.eventName === "PostCreated"
            ) as EventLog;
            const postId = deleteEvent ? Number(deleteEvent.args[0]) : 0;

            // Only post creator can delete
            await expect(
                postMinter.connect(regularUser2).deletePost(postId)
            ).to.be.revertedWith("Not post creator");

            // Creator can delete
            await postMinter.connect(regularUser1).deletePost(postId);

            // Cannot interact with deleted post
            await expect(
                postMinter.connect(regularUser2).interactWithPost(postId, 0)
            ).to.be.revertedWith("Post deleted");
        });
    });

    describe("Feed Management", function () {
        beforeEach(async function () {
            // Deploy fresh contracts
            const RoleManager = await ethers.getContractFactory("RoleManager");
            roleManager = await RoleManager.deploy();
            await roleManager.waitForDeployment();

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

            const CollectibleController = await ethers.getContractFactory("CollectibleController");
            collectibleController = await CollectibleController.deploy(
                await roleManager.getAddress(),
                await tribeController.getAddress(),
                await pointSystem.getAddress()
            );
            await collectibleController.waitForDeployment();

            const PostMinter = await ethers.getContractFactory("PostMinter");
            postMinter = await PostMinter.deploy(
                await roleManager.getAddress(),
                await tribeController.getAddress(),
                await collectibleController.getAddress()
            );
            await postMinter.waitForDeployment();

            // Setup roles
            await roleManager.grantRole(ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE")), admin.address);
            await roleManager.grantRole(ethers.keccak256(ethers.toUtf8Bytes("MODERATOR_ROLE")), moderator.address);
            await roleManager.grantRole(ethers.keccak256(ethers.toUtf8Bytes("CONTENT_CREATOR_ROLE")), contentCreator.address);

            // Create test tribe
            const tx = await tribeController.connect(admin).createTribe(
                "Test Tribe",
                JSON.stringify({ name: "Test Tribe", description: "A test tribe" }),
                [admin.address, moderator.address],
                0, // PUBLIC
                0, // No entry fee
                [] // No NFT requirements
            );
            const receipt = await tx.wait();
            const event = receipt?.logs.find(
                x => x instanceof EventLog && x.eventName === "TribeCreated"
            ) as EventLog;
            tribeId = event ? Number(event.args[0]) : 0;

            // Add members to tribe
            await tribeController.connect(contentCreator).joinTribe(tribeId);
            await tribeController.connect(regularUser1).joinTribe(tribeId);
            await tribeController.connect(regularUser2).joinTribe(tribeId);

            // Create multiple posts with delays and increasing timestamps
            let timestamp = Math.floor(Date.now() / 1000);
            for (let i = 0; i < 5; i++) {
                await postMinter.connect(contentCreator).createPost(
                    tribeId,
                    JSON.stringify({
                        type: "TEXT",
                        title: `Post ${i}`,
                        content: `Content ${i}`,
                        createdAt: timestamp + i * 100 // Ensure increasing timestamps
                    }),
                    false,
                    ethers.ZeroAddress,
                    0
                );
                // Wait for rate limit
                await ethers.provider.send("evm_increaseTime", [61]); // 61 seconds
                await ethers.provider.send("evm_mine", []);
            }
        });

        it("Should retrieve paginated tribe feed", async function () {
            const [postIds, total] = await postMinter.getPostsByTribe(tribeId, 0, 3);
            expect(postIds.length).to.equal(3);
            expect(total).to.equal(5);
        });

        it("Should retrieve user-specific feed", async function () {
            const [postIds, total] = await postMinter.getPostsByUser(contentCreator.address, 0, 10);
            expect(total).to.equal(5); // Only the posts we created in beforeEach

            // Verify posts are in chronological order
            for (let i = 0; i < postIds.length - 1; i++) {
                const post1 = await postMinter.getPost(postIds[i]);
                const post2 = await postMinter.getPost(postIds[i + 1]);
                const metadata1 = JSON.parse(post1.metadata);
                const metadata2 = JSON.parse(post2.metadata);
                expect(Number(metadata1.createdAt)).to.be.lt(Number(metadata2.createdAt));
            }
        });
    });

    describe("Error Cases", function () {
        it("Should handle invalid metadata", async function () {
            // Empty metadata
            await expect(
                postMinter.connect(regularUser1).createPost(
                    tribeId,
                    "",
                    false,
                    ethers.ZeroAddress,
                    0
                )
            ).to.be.revertedWith("Invalid metadata format");

            // Invalid JSON
            await expect(
                postMinter.connect(regularUser1).createPost(
                    tribeId,
                    "not json",
                    false,
                    ethers.ZeroAddress,
                    0
                )
            ).to.be.revertedWith("Invalid metadata format");

            // Missing required fields
            await expect(
                postMinter.connect(regularUser1).createPost(
                    tribeId,
                    JSON.stringify({ title: "Test" }), // Missing content
                    false,
                    ethers.ZeroAddress,
                    0
                )
            ).to.be.revertedWith("Invalid metadata format");
        });

        it("Should handle permission errors", async function () {
            const validMetadata = {
                type: "TEXT",
                title: "Test Post",
                content: "Test Content",
                createdAt: Math.floor(Date.now() / 1000)
            };

            // Banned user cannot post
            await expect(
                postMinter.connect(bannedUser).createPost(
                    tribeId,
                    JSON.stringify(validMetadata),
                    false,
                    ethers.ZeroAddress,
                    0
                )
            ).to.be.revertedWith("Not a tribe member");

            // Non-member cannot post
            const nonMember = owner;
            await expect(
                postMinter.connect(nonMember).createPost(
                    tribeId,
                    JSON.stringify(validMetadata),
                    false,
                    ethers.ZeroAddress,
                    0
                )
            ).to.be.revertedWith("Not a tribe member");
        });

        it("Should handle rate limiting", async function () {
            const validMetadata = {
                type: "TEXT",
                title: "Test Post",
                content: "Test Content",
                createdAt: Math.floor(Date.now() / 1000)
            };

            // Create first post
            await postMinter.connect(regularUser1).createPost(
                tribeId,
                JSON.stringify(validMetadata),
                false,
                ethers.ZeroAddress,
                0
            );

            // Try to create another post immediately
            await expect(
                postMinter.connect(regularUser1).createPost(
                    tribeId,
                    JSON.stringify(validMetadata),
                    false,
                    ethers.ZeroAddress,
                    0
                )
            ).to.be.revertedWith("Please wait before posting again");

            // Wait for cooldown
            await ethers.provider.send("evm_increaseTime", [61]); // 61 seconds
            await ethers.provider.send("evm_mine", []);

            // Should be able to post again
            await postMinter.connect(regularUser1).createPost(
                tribeId,
                JSON.stringify(validMetadata),
                false,
                ethers.ZeroAddress,
                0
            );
        });
    });
}); 