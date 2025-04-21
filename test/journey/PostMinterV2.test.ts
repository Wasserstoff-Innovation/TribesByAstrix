import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { PostMinter, TribeController, CollectibleController, RoleManager, PointSystem, PostFeedManager } from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { EventLog } from "ethers";
import { deployContracts, setupRoles } from "../util/deployContracts";

// Helper function to handle BigInt serialization
function replaceBigInts(obj: any): any {
    if (obj === null || obj === undefined) {
        return obj;
    }

    if (typeof obj === 'bigint') {
        return obj.toString();
    }

    if (Array.isArray(obj)) {
        return obj.map(replaceBigInts);
    }

    if (typeof obj === 'object') {
        const result: any = {};
        for (const key in obj) {
            result[key] = replaceBigInts(obj[key]);
        }
        return result;
    }

    return obj;
}

describe("PostMinterV2", function () {
    let postMinter: PostMinter;
    let tribeController: TribeController;
    let roleManager: RoleManager;
    let collectibleController: CollectibleController;
    let pointSystem: PointSystem;
    let feedManager: PostFeedManager;
    let owner: SignerWithAddress;
    let admin: SignerWithAddress;
    let regularUser1: SignerWithAddress;
    let regularUser2: SignerWithAddress;
    let moderator: SignerWithAddress;
    let contentCreator: SignerWithAddress;
    let bannedUser: SignerWithAddress;
    let tribeId: number;

    before(async function () {
        // Deploy all contracts and get signers
        const deployment = await deployContracts();
        
        // Assign contracts
        roleManager = deployment.contracts.roleManager;
        tribeController = deployment.contracts.tribeController;
        pointSystem = deployment.contracts.pointSystem;
        collectibleController = deployment.contracts.collectibleController;
        feedManager = deployment.contracts.feedManager;
        postMinter = deployment.contracts.postMinter;
        
        // Assign signers
        owner = deployment.signers.owner;
        admin = deployment.signers.admin;
        contentCreator = deployment.signers.contentCreator;
        moderator = deployment.signers.moderator;
        regularUser1 = deployment.signers.regularUser1;
        regularUser2 = deployment.signers.regularUser2;
        bannedUser = deployment.signers.bannedUser;
        
        // Setup roles
        await setupRoles(roleManager, postMinter, admin, contentCreator, moderator, owner, regularUser1, regularUser2);
        
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
        await tribeController.connect(regularUser1).joinTribe(tribeId);
        await tribeController.connect(regularUser2).joinTribe(tribeId);
        await tribeController.connect(contentCreator).joinTribe(tribeId);
    });

    describe("Basic Post Creation", function () {
        it("Should create a basic public post", async function () {
            const metadata = {
                title: "Technical Update",
                content: "Latest development progress...",
                attachments: [],
                tags: ["update", "development"],
                createdAt: Math.floor(Date.now() / 1000)
            };

            const tx = await postMinter.connect(regularUser1).createPost(
                tribeId,
                JSON.stringify(metadata),
                false, // not gated
                ethers.ZeroAddress,
                0
            );

            expect(tx).to.emit(postMinter, "PostCreated");

            const postId = 0; // First post
            const post = await postMinter.getPost(postId);
            expect(post.creator).to.equal(regularUser1.address);
            expect(post.tribeId).to.equal(tribeId);
            expect(post.isGated).to.be.false;

            // Wait for rate limit
            await ethers.provider.send("evm_increaseTime", [61]); // 61 seconds
            await ethers.provider.send("evm_mine", []);
        });

        it("Should create a post with attachments", async function () {
            const metadata = {
                title: "Media Post",
                content: "Check out these images",
                attachments: [
                    "ipfs://Qm...",
                    "ipfs://Qm..."
                ],
                tags: ["media"],
                createdAt: Math.floor(Date.now() / 1000)
            };

            await expect(
                postMinter.connect(regularUser1).createPost(
                    tribeId,
                    JSON.stringify(metadata),
                    false,
                    ethers.ZeroAddress,
                    0
                )
            ).to.emit(postMinter, "PostCreated");

            // Wait for rate limit
            await ethers.provider.send("evm_increaseTime", [61]); // 61 seconds
            await ethers.provider.send("evm_mine", []);
        });
    });

    describe("Gated Post Creation", function () {
        let collectibleId: number;

        beforeEach(async function () {
            // Create a test collectible
            const tx = await collectibleController.connect(admin).createCollectible(
                tribeId,
                "Test Collectible",
                "TEST",
                "ipfs://test",
                100,
                ethers.parseEther("0.1"),
                0 // No points required
            );
            const receipt = await tx.wait();
            const event = receipt?.logs.find(
                x => x instanceof EventLog && x.eventName === "CollectibleCreated"
            ) as EventLog;
            collectibleId = event ? Number(event.args[0]) : 0;

            // Wait for rate limit
            await ethers.provider.send("evm_increaseTime", [61]); // 61 seconds
            await ethers.provider.send("evm_mine", []);
        });

        it("Should create a collectible-gated post", async function () {
            const metadata = {
                title: "Premium Content",
                content: "This is exclusive content",
                attachments: [],
                tags: ["premium"],
                createdAt: Math.floor(Date.now() / 1000)
            };

            const tx = await postMinter.connect(regularUser1).createPost(
                tribeId,
                JSON.stringify(metadata),
                true, // gated
                await collectibleController.getAddress(),
                collectibleId
            );

            await expect(tx).to.emit(postMinter, "PostCreated");
            
            // Get post ID from event
            const receipt = await tx.wait();
            const event = receipt?.logs.find(
                x => x instanceof EventLog && x.eventName === "PostCreated"
            ) as EventLog;
            const postId = event ? Number(event.args[0]) : 0;

            const post = await postMinter.getPost(postId);
            expect(post.isGated).to.be.true;
            expect(post.collectibleContract).to.equal(await collectibleController.getAddress());
            expect(post.collectibleId).to.equal(collectibleId);

            // Wait for rate limit
            await ethers.provider.send("evm_increaseTime", [61]); // 61 seconds
            await ethers.provider.send("evm_mine", []);
        });

        it("Should allow viewing gated post with collectible", async function () {
            // Create gated post
            const tx = await postMinter.connect(regularUser1).createPost(
                tribeId,
                JSON.stringify({ 
                    title: "Gated", 
                    content: "Secret",
                    createdAt: Math.floor(Date.now() / 1000)
                }),
                true,
                await collectibleController.getAddress(),
                collectibleId
            );

            // Get post ID from event
            const receipt = await tx.wait();
            const event = receipt?.logs.find(
                x => x instanceof EventLog && x.eventName === "PostCreated"
            ) as EventLog;
            const postId = event ? Number(event.args[0]) : 0;

            // Wait for rate limit
            await ethers.provider.send("evm_increaseTime", [61]); // 61 seconds
            await ethers.provider.send("evm_mine", []);

            // User2 purchases collectible
            await collectibleController.connect(regularUser2).claimCollectible(
                tribeId,
                collectibleId,
                { value: ethers.parseEther("0.1") }
            );

            // Verify user2 can view post
            expect(await postMinter.canViewPost(postId, regularUser2.address)).to.be.true;
        });
    });

    describe("Encrypted Posts", function () {
        it("Should create an encrypted post", async function () {
            const metadata = {
                title: "Encrypted Update",
                content: "encrypted_content_here",
                attachments: []
            };

            const encryptionKeyHash = ethers.keccak256(ethers.toUtf8Bytes("test_key"));

            await expect(
                postMinter.connect(regularUser1).createEncryptedPost(
                    tribeId,
                    JSON.stringify(metadata),
                    encryptionKeyHash,
                    regularUser1.address
                )
            ).to.emit(postMinter, "EncryptedPostCreated");
        });

        it("Should manage viewer access for encrypted posts", async function () {
            // Create encrypted post
            const encryptionKeyHash = ethers.keccak256(ethers.toUtf8Bytes("test_key"));
            await postMinter.connect(regularUser1).createEncryptedPost(
                tribeId,
                JSON.stringify({ title: "Secret", content: "encrypted" }),
                encryptionKeyHash,
                regularUser1.address
            );

            // Grant access to user2
            await postMinter.connect(regularUser1).authorizeViewer(0, regularUser2.address);

            // Verify access
            expect(await postMinter.canViewPost(0, regularUser2.address)).to.be.true;
        });
    });

    describe("Post Interactions", function () {
        let postId: number;

        beforeEach(async function () {
            // Create a test post
            const tx = await postMinter.connect(regularUser1).createPost(
                tribeId,
                JSON.stringify({ 
                    title: "Test", 
                    content: "Content",
                    createdAt: Math.floor(Date.now() / 1000)
                }),
                false,
                ethers.ZeroAddress,
                0
            );
            const receipt = await tx.wait();
            const event = receipt?.logs.find(
                x => x instanceof EventLog && x.eventName === "PostCreated"
            ) as EventLog;
            postId = event ? Number(event.args[0]) : 0;

            // Wait for rate limit
            await ethers.provider.send("evm_increaseTime", [61]); // 61 seconds
            await ethers.provider.send("evm_mine", []);
        });

        it("Should track post interactions", async function () {
            // Like post
            await postMinter.connect(regularUser2).interactWithPost(
                postId,
                0 // LIKE
            );

            // Wait for rate limit
            await ethers.provider.send("evm_increaseTime", [61]); // 61 seconds
            await ethers.provider.send("evm_mine", []);

            // Comment on post
            await postMinter.connect(regularUser2).interactWithPost(
                postId,
                1 // COMMENT
            );

            // Verify interaction counts
            expect(await postMinter.getInteractionCount(postId, 0)).to.equal(1); // Likes
            expect(await postMinter.getInteractionCount(postId, 1)).to.equal(1); // Comments
        });

        it("Should prevent self-likes", async function () {
            await expect(
                postMinter.connect(regularUser1).interactWithPost(postId, 0) // LIKE
            ).to.be.revertedWithCustomError(postMinter, "CannotInteractWithOwnPost");
        });
    });

    describe("Post Management", function () {
        it("Should allow post deletion by owner", async function () {
            // Create post
            await postMinter.connect(regularUser1).createPost(
                tribeId,
                JSON.stringify({ title: "Test", content: "Content" }),
                false,
                ethers.ZeroAddress,
                0
            );

            // Delete post
            await expect(
                postMinter.connect(regularUser1).deletePost(0)
            ).to.emit(postMinter, "PostDeleted");
        });

        it("Should handle post reporting", async function () {
            // Create fresh post specifically for reporting
            await ethers.provider.send("evm_increaseTime", [61]); // 61 seconds
            await ethers.provider.send("evm_mine", []);
            
            const tx = await postMinter.connect(regularUser1).createPost(
                tribeId,
                JSON.stringify({ 
                    title: "Post to report", 
                    content: "Content that will be reported"
                }),
                false,
                ethers.ZeroAddress,
                0
            );

            // Get post ID from event
            const receipt = await tx.wait();
            const event = receipt?.logs.find(
                x => x instanceof EventLog && x.eventName === "PostCreated"
            ) as EventLog;
            const postId = event ? Number(event.args[0]) : 0;

            // Report post
            await expect(
                postMinter.connect(regularUser2).reportPost(postId, "Inappropriate content")
            ).to.emit(postMinter, "PostReported");
        });
    });

    describe("Feed Management", function () {
        beforeEach(async function () {
            // Create multiple posts with delays
            for (let i = 0; i < 5; i++) {
                await postMinter.connect(regularUser1).createPost(
                    tribeId,
                    JSON.stringify({ title: `Post ${i}`, content: `Content ${i}` }),
                    false,
                    ethers.ZeroAddress,
                    0
                );
                // Add delay between posts
                await ethers.provider.send("evm_increaseTime", [61]); // 61 seconds
                await ethers.provider.send("evm_mine", []);
            }
        });

        it("Should get posts by tribe", async function () {
            const [postIds, total] = await postMinter.getPostsByTribe(tribeId, 0, 20);
            // There could be posts from previous tests, so we just verify we get something back
            expect(total).to.be.greaterThanOrEqual(5);
            expect(postIds.length).to.be.greaterThanOrEqual(5);
        });

        it("Should get posts by user", async function () {
            const [postIds, total] = await postMinter.getPostsByUser(regularUser1.address, 0, 20);
            // There could be posts from previous tests, so we just verify we get something back
            expect(total).to.be.greaterThanOrEqual(5);
            expect(postIds.length).to.be.greaterThanOrEqual(5);
        });

        it("Should handle pagination correctly", async function () {
            const [postIds1] = await postMinter.getPostsByTribe(tribeId, 0, 2);
            const [postIds2] = await postMinter.getPostsByTribe(tribeId, 2, 2);
            
            expect(postIds1.length).to.equal(2);
            expect(postIds2.length).to.equal(2);
            expect(postIds1[0]).to.not.equal(postIds2[0]);
        });
    });

    describe("Post Types and Metadata", function () {
        describe("Community Update Posts", function () {
            it("Should create a community update post", async function () {
                const metadata = {
                    type: "COMMUNITY_UPDATE",
                    title: "Weekly Update",
                    content: "Here's what's new in our community...",
                    summary: "Weekly progress report",
                    category: "announcement",
                    priority: "high",
                    pinned: true,
                    communityDetails: {
                        updateType: "weekly",
                        impactLevel: "high",
                        affectedGroups: ["all-members", "contributors"]
                    },
                    tags: ["update", "weekly", "community"]
                };

                const tx = await postMinter.connect(admin).createPost(
                    tribeId,
                    JSON.stringify(metadata),
                    false,
                    ethers.ZeroAddress,
                    0
                );

                expect(tx).to.emit(postMinter, "PostCreated");
                
                // Wait for tx to be mined
                const receipt = await tx.wait();
                const event = receipt?.logs.find(
                    x => x instanceof EventLog && x.eventName === "PostCreated"
                ) as EventLog;
                const postId = event ? Number(event.args[0]) : 0;
                
                const post = await postMinter.getPost(postId);
                const parsedMetadata = JSON.parse(post.metadata);
                expect(parsedMetadata.type).to.equal("COMMUNITY_UPDATE");
                expect(parsedMetadata.pinned).to.be.true;
            });
        });

        describe("Event Posts", function () {
            it("Should create an event post with location and time", async function () {
                const eventTime = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60; // 1 week from now
                const metadata = {
                    type: "EVENT",
                    title: "Community Meetup",
                    content: "Join us for our monthly meetup!",
                    eventDetails: {
                        startTime: eventTime,
                        endTime: eventTime + 3 * 60 * 60, // 3 hours duration
                        timezone: "UTC",
                        location: {
                            type: "HYBRID",
                            physical: "Tech Hub, 123 Main St",
                            virtual: "https://meet.tribe.com/monthly"
                        },
                        maxAttendees: 100,
                        currentAttendees: 0
                    },
                    rsvpEnabled: true,
                    tags: ["event", "meetup", "community"]
                };

                await expect(
                    postMinter.connect(admin).createPost(
                        tribeId,
                        JSON.stringify(metadata),
                        false,
                        ethers.ZeroAddress,
                        0
                    )
                ).to.emit(postMinter, "PostCreated");
            });
        });

        describe("Project Posts", function () {
            beforeEach(async function () {
                // Wait for rate limit
                await ethers.provider.send("evm_increaseTime", [61]); // 61 seconds
                await ethers.provider.send("evm_mine", []);
                
                // Forcefully grant roles directly every time to ensure test passes
                const PROJECT_CREATOR_ROLE = await postMinter.PROJECT_CREATOR_ROLE();
                const RATE_LIMIT_MANAGER_ROLE = await postMinter.RATE_LIMIT_MANAGER_ROLE();
                await postMinter.connect(admin).grantRole(PROJECT_CREATOR_ROLE, regularUser1.address);
                await postMinter.connect(admin).grantRole(RATE_LIMIT_MANAGER_ROLE, regularUser1.address);
                
                // Verify the roles were actually granted
                expect(await postMinter.hasRole(PROJECT_CREATOR_ROLE, regularUser1.address))
                    .to.be.true, "PROJECT_CREATOR_ROLE was not granted";
                expect(await postMinter.hasRole(RATE_LIMIT_MANAGER_ROLE, regularUser1.address))
                    .to.be.true, "RATE_LIMIT_MANAGER_ROLE was not granted";
            });

            it("Should prevent unauthorized project creation", async function () {
                // Wait for cooldown
                await ethers.provider.send("evm_increaseTime", [61]);
                await ethers.provider.send("evm_mine", []);

                // Make sure moderator is a tribe member
                if ((await tribeController.getMemberStatus(tribeId, moderator.address)).toString() !== "1") {
                    await tribeController.connect(moderator).joinTribe(tribeId);
                }

                // Try to create project without proper role
                // We don't need to grant PROJECT_CREATOR_ROLE to moderator
                const projectData = {
                    title: "Unauthorized Project",
                    content: "Should fail",
                    type: "PROJECT",
                    projectDetails: {
                        category: "DEVELOPMENT",
                        requestedAmount: ethers.parseEther("1000"),
                        duration: 30 * 24 * 60 * 60,
                        milestones: [],
                        team: [
                            {
                                address: moderator.address,
                                role: "CREATOR",
                                permissions: ["UPDATE"]
                            }
                        ],
                        status: "PROPOSED"
                    }
                };

                // Should fail because moderator doesn't have PROJECT_CREATOR_ROLE
                await expect(
                    postMinter.connect(moderator).createPost(
                        tribeId,
                        JSON.stringify(replaceBigInts(projectData)),
                        false,
                        ethers.ZeroAddress,
                        0
                    )
                ).to.be.revertedWithCustomError(postMinter, "InsufficientAccess()");
            });
        });

        describe("Poll Posts", function () {
            it("Should create a poll post with options", async function () {
                const metadata = {
                    type: "POLL",
                    title: "Community Feature Vote",
                    content: "Which feature should we build next?",
                    pollDetails: {
                        options: [
                            { id: 1, text: "Enhanced Analytics" },
                            { id: 2, text: "Mobile App" },
                            { id: 3, text: "Integration Tools" }
                        ],
                        endTime: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
                        allowMultipleChoices: false,
                        requireVerification: true
                    },
                    tags: ["poll", "community", "voting"]
                };

                await expect(
                    postMinter.connect(admin).createPost(
                        tribeId,
                        JSON.stringify(metadata),
                        false,
                        ethers.ZeroAddress,
                        0
                    )
                ).to.emit(postMinter, "PostCreated");
            });
        });

        describe("Resource Posts", function () {
            it("Should create a resource post with attachments", async function () {
                const metadata = {
                    type: "RICH_MEDIA",
                    title: "Development Guidelines",
                    content: "Updated guidelines for contributors",
                    mediaContent: {
                        documents: [
                            {
                                name: "guidelines.pdf",
                                url: "ipfs://Qm...",
                                mimeType: "application/pdf",
                                size: 1024576
                            },
                            {
                                name: "examples.zip",
                                url: "ipfs://Qm...",
                                mimeType: "application/zip",
                                size: 2048576
                            }
                        ]
                    },
                    resourceDetails: {
                        category: "documentation",
                        version: "2.0.0",
                        lastUpdated: Math.floor(Date.now() / 1000)
                    },
                    tags: ["resource", "documentation", "guidelines"]
                };

                await expect(
                    postMinter.connect(admin).createPost(
                        tribeId,
                        JSON.stringify(metadata),
                        false,
                        ethers.ZeroAddress,
                        0
                    )
                ).to.emit(postMinter, "PostCreated");
            });
        });

        describe("Metadata Validation", function () {
            it("Should reject invalid metadata format", async function () {
                await expect(
                    postMinter.connect(regularUser1).createPost(
                        tribeId,
                        "not json",
                        false,
                        ethers.ZeroAddress,
                        0
                    )
                ).to.be.revertedWithCustomError(postMinter, "InvalidJsonFormat");
            });

            it("Should validate required metadata fields", async function () {
                await expect(
                    postMinter.connect(regularUser1).createPost(
                        tribeId,
                        JSON.stringify({ content: "Missing title" }),
                        false,
                        ethers.ZeroAddress,
                        0
                    )
                ).to.be.revertedWithCustomError(postMinter, "MissingTitleField");
            });

            it("Should validate event post details", async function () {
                // Wait for cooldown
                await ethers.provider.send("evm_increaseTime", [61]);
                await ethers.provider.send("evm_mine", []);

                // Missing event details
                await expect(
                    postMinter.connect(regularUser1).createPost(
                        tribeId,
                        JSON.stringify({
                            title: "Event Post",
                            content: "Event description",
                            type: "EVENT"
                        }),
                        false,
                        ethers.ZeroAddress,
                        0
                    )
                ).to.be.revertedWithCustomError(postMinter, "InvalidPostType");
            });

            it("Should validate media content", async function () {
                // Wait for cooldown
                await ethers.provider.send("evm_increaseTime", [61]);
                await ethers.provider.send("evm_mine", []);

                // Missing media content
                await expect(
                    postMinter.connect(regularUser1).createPost(
                        tribeId,
                        JSON.stringify({
                            title: "Media Post",
                            content: "Media description",
                            type: "RICH_MEDIA"
                        }),
                        false,
                        ethers.ZeroAddress,
                        0
                    )
                ).to.be.revertedWithCustomError(postMinter, "InvalidPostType");
            });
        });

        describe("Rich Media Posts", function () {
            it("Should create a post with multiple media types", async function () {
                const metadata = {
                    title: "Project Demo",
                    content: "Check out our latest demo!",
                    mediaContent: {
                        images: [
                            {
                                url: "ipfs://Qm...",
                                mimeType: "image/jpeg",
                                width: 1920,
                                height: 1080
                            }
                        ],
                        videos: [
                            {
                                url: "ipfs://Qm...",
                                mimeType: "video/mp4",
                                duration: 180,
                                thumbnail: "ipfs://Qm..."
                            }
                        ],
                        audio: [
                            {
                                url: "ipfs://Qm...",
                                mimeType: "audio/mpeg",
                                duration: 120
                            }
                        ]
                    },
                    tags: ["demo", "media", "project"]
                };

                await expect(
                    postMinter.connect(regularUser1).createPost(
                        tribeId,
                        JSON.stringify(metadata),
                        false,
                        ethers.ZeroAddress,
                        0
                    )
                ).to.emit(postMinter, "PostCreated");
            });
        });
    });
}); 