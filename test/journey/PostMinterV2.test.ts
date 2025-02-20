import { expect } from "chai";
import { ethers } from "hardhat";
import { PostMinter, RoleManager, TribeController, CollectibleController } from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { EventLog } from "ethers";

describe("PostMinterV2", function () {
    let postMinter: PostMinter;
    let roleManager: RoleManager;
    let tribeController: TribeController;
    let collectibleController: CollectibleController;
    let owner: SignerWithAddress;
    let admin: SignerWithAddress;
    let user1: SignerWithAddress;
    let user2: SignerWithAddress;
    let tribeId: number;

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

        // Deploy CollectibleController
        const CollectibleController = await ethers.getContractFactory("CollectibleController");
        collectibleController = await CollectibleController.deploy(
            await roleManager.getAddress(),
            await tribeController.getAddress(),
            ethers.ZeroAddress // Point system address not needed for these tests
        );
        await collectibleController.waitForDeployment();

        // Deploy PostMinter
        const PostMinter = await ethers.getContractFactory("PostMinter");
        postMinter = await PostMinter.deploy(
            await roleManager.getAddress(),
            await tribeController.getAddress(),
            await collectibleController.getAddress()
        );
        await postMinter.waitForDeployment();

        // Create test tribe
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

            const tx = await postMinter.connect(user1).createPost(
                tribeId,
                JSON.stringify(metadata),
                false, // not gated
                ethers.ZeroAddress,
                0
            );

            expect(tx).to.emit(postMinter, "PostCreated");

            const postId = 0; // First post
            const post = await postMinter.getPost(postId);
            expect(post.creator).to.equal(user1.address);
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
                postMinter.connect(user1).createPost(
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

            await expect(
                postMinter.connect(user1).createPost(
                    tribeId,
                    JSON.stringify(metadata),
                    true, // gated
                    await collectibleController.getAddress(),
                    collectibleId
                )
            ).to.emit(postMinter, "PostCreated");

            const postId = 0;
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
            await postMinter.connect(user1).createPost(
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

            // Wait for rate limit
            await ethers.provider.send("evm_increaseTime", [61]); // 61 seconds
            await ethers.provider.send("evm_mine", []);

            // User2 purchases collectible
            await collectibleController.connect(user2).claimCollectible(
                tribeId,
                collectibleId,
                { value: ethers.parseEther("0.1") }
            );

            // Verify user2 can view post
            expect(await postMinter.canViewPost(0, user2.address)).to.be.true;
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
                postMinter.connect(user1).createEncryptedPost(
                    tribeId,
                    JSON.stringify(metadata),
                    encryptionKeyHash,
                    user1.address
                )
            ).to.emit(postMinter, "EncryptedPostCreated");
        });

        it("Should manage viewer access for encrypted posts", async function () {
            // Create encrypted post
            const encryptionKeyHash = ethers.keccak256(ethers.toUtf8Bytes("test_key"));
            await postMinter.connect(user1).createEncryptedPost(
                tribeId,
                JSON.stringify({ title: "Secret", content: "encrypted" }),
                encryptionKeyHash,
                user1.address
            );

            // Grant access to user2
            await postMinter.connect(user1).authorizeViewer(0, user2.address);

            // Verify access
            expect(await postMinter.canViewPost(0, user2.address)).to.be.true;
        });
    });

    describe("Post Interactions", function () {
        let postId: number;

        beforeEach(async function () {
            // Create a test post
            const tx = await postMinter.connect(user1).createPost(
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
            await postMinter.connect(user2).interactWithPost(
                postId,
                0 // LIKE
            );

            // Wait for rate limit
            await ethers.provider.send("evm_increaseTime", [61]); // 61 seconds
            await ethers.provider.send("evm_mine", []);

            // Comment on post
            await postMinter.connect(user2).interactWithPost(
                postId,
                1 // COMMENT
            );

            // Verify interaction counts
            expect(await postMinter.getInteractionCount(postId, 0)).to.equal(1); // Likes
            expect(await postMinter.getInteractionCount(postId, 1)).to.equal(1); // Comments
        });

        it("Should prevent self-likes", async function () {
            await expect(
                postMinter.connect(user1).interactWithPost(postId, 0)
            ).to.be.revertedWith("Cannot like own post");
        });
    });

    describe("Post Management", function () {
        it("Should allow post deletion by owner", async function () {
            // Create post
            await postMinter.connect(user1).createPost(
                tribeId,
                JSON.stringify({ title: "Test", content: "Content" }),
                false,
                ethers.ZeroAddress,
                0
            );

            // Delete post
            await expect(
                postMinter.connect(user1).deletePost(0)
            ).to.emit(postMinter, "PostDeleted");
        });

        it("Should handle post reporting", async function () {
            // Create post
            await postMinter.connect(user1).createPost(
                tribeId,
                JSON.stringify({ title: "Test", content: "Content" }),
                false,
                ethers.ZeroAddress,
                0
            );

            // Report post
            await expect(
                postMinter.connect(user2).reportPost(0, "Inappropriate content")
            ).to.emit(postMinter, "PostReported");
        });
    });

    describe("Feed Management", function () {
        beforeEach(async function () {
            // Create multiple posts with delays
            for (let i = 0; i < 5; i++) {
                await postMinter.connect(user1).createPost(
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
            const [postIds, total] = await postMinter.getPostsByTribe(tribeId, 0, 10);
            expect(total).to.equal(5);
            expect(postIds.length).to.equal(5);
        });

        it("Should get posts by user", async function () {
            const [postIds, total] = await postMinter.getPostsByUser(user1.address, 0, 10);
            expect(total).to.equal(5);
            expect(postIds.length).to.equal(5);
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
                const post = await postMinter.getPost(0);
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
            it("Should create a project update post with milestones", async function () {
                const metadata = {
                    type: "PROJECT_UPDATE",
                    title: "Q1 Project Progress",
                    content: "Detailed progress report...",
                    projectDetails: {
                        projectId: "PROJ-001",
                        phase: "development",
                        completionPercentage: 60,
                        milestones: [
                            {
                                title: "Planning",
                                status: "completed",
                                completedAt: Math.floor(Date.now() / 1000) - 86400
                            },
                            {
                                title: "Development",
                                status: "in_progress",
                                completedAt: null
                            }
                        ]
                    },
                    tags: ["project", "development", "update"]
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
                    type: "RESOURCE",
                    title: "Development Guidelines",
                    content: "Updated guidelines for contributors",
                    resourceDetails: {
                        category: "documentation",
                        version: "2.0.0",
                        attachments: [
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
                        ],
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
                const invalidMetadata = "not json";
                await expect(
                    postMinter.connect(user1).createPost(
                        tribeId,
                        invalidMetadata,
                        false,
                        ethers.ZeroAddress,
                        0
                    )
                ).to.be.revertedWith("Invalid metadata format");
            });

            it("Should validate required metadata fields", async function () {
                const incompleteMetadata = {
                    title: "Test" // Missing content
                };

                await expect(
                    postMinter.connect(user1).createPost(
                        tribeId,
                        JSON.stringify(incompleteMetadata),
                        false,
                        ethers.ZeroAddress,
                        0
                    )
                ).to.be.revertedWith("Invalid metadata format");
            });

            it("Should validate event post details", async function () {
                const eventMetadata = {
                    type: "EVENT",
                    title: "Event",
                    content: "Event content"
                    // Missing eventDetails
                };

                await expect(
                    postMinter.connect(user1).createPost(
                        tribeId,
                        JSON.stringify(eventMetadata),
                        false,
                        ethers.ZeroAddress,
                        0
                    )
                ).to.be.revertedWith("Invalid metadata format");
            });
        });

        describe("Post Updates", function () {
            let originalPostId: number;

            beforeEach(async function () {
                const metadata = {
                    type: "PROJECT_UPDATE",
                    title: "Initial Title",
                    content: "Initial content",
                    projectDetails: {
                        phase: "planning",
                        completionPercentage: 0
                    },
                    version: 1,
                    updatedAt: Math.floor(Date.now() / 1000)
                };

                const tx = await postMinter.connect(user1).createPost(
                    tribeId,
                    JSON.stringify(metadata),
                    false,
                    ethers.ZeroAddress,
                    0
                );
                const receipt = await tx.wait();
                const event = receipt?.logs.find(
                    x => x instanceof EventLog && x.eventName === "PostCreated"
                ) as EventLog;
                originalPostId = event ? Number(event.args[0]) : 0;

                // Wait for rate limit
                await ethers.provider.send("evm_increaseTime", [61]); // 61 seconds
                await ethers.provider.send("evm_mine", []);
            });

            it("Should create update post referencing original", async function () {
                const updatedMetadata = {
                    type: "PROJECT_UPDATE",
                    title: "Updated Title",
                    content: "Updated content",
                    projectDetails: {
                        phase: "development",
                        completionPercentage: 30
                    },
                    version: 2,
                    updatedAt: Math.floor(Date.now() / 1000),
                    originalPostId: originalPostId
                };

                // Create update post
                const tx = await postMinter.connect(user1).createPost(
                    tribeId,
                    JSON.stringify(updatedMetadata),
                    false,
                    ethers.ZeroAddress,
                    0
                );

                expect(tx).to.emit(postMinter, "PostCreated");

                // Verify update post
                const [posts] = await postMinter.getPostsByUser(user1.address, 1, 1);
                const updatePost = await postMinter.getPost(posts[0]);
                const parsedMetadata = JSON.parse(updatePost.metadata);
                expect(parsedMetadata.title).to.equal("Updated Title");
                expect(parsedMetadata.projectDetails.completionPercentage).to.equal(30);
                expect(parsedMetadata.originalPostId).to.equal(originalPostId);

                // Wait for rate limit
                await ethers.provider.send("evm_increaseTime", [61]); // 61 seconds
                await ethers.provider.send("evm_mine", []);
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
                    postMinter.connect(user1).createPost(
                        tribeId,
                        JSON.stringify(metadata),
                        false,
                        ethers.ZeroAddress,
                        0
                    )
                ).to.emit(postMinter, "PostCreated");
            });

            it("Should validate media content", async function () {
                const invalidMediaMetadata = {
                    type: "RICH_MEDIA",
                    title: "Invalid Media",
                    content: "Test content"
                    // Missing mediaContent
                };

                await expect(
                    postMinter.connect(user1).createPost(
                        tribeId,
                        JSON.stringify(invalidMediaMetadata),
                        false,
                        ethers.ZeroAddress,
                        0
                    )
                ).to.be.revertedWith("Invalid metadata format");
            });
        });
    });
}); 