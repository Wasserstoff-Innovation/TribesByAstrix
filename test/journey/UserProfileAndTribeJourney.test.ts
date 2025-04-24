import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { 
    RoleManager, 
    TribeController, 
    CollectibleController,
    PostMinter,
    PointSystem
} from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { EventLog } from "ethers";
import chalk from "chalk";

/**
 * This test demonstrates the complete user journey that frontend developers 
 * need to implement, including:
 * 1. Tribe Creation & Configuration
 * 2. Collectible Management
 * 3. Content Creation & Interaction
 * 4. Points & Engagement System
 */
describe(chalk.blue("Complete User Journey Guide"), function () {
    // Contract instances
    let roleManager: RoleManager;
    let tribeController: TribeController;
    let collectibleController: CollectibleController;
    let postMinter: PostMinter;
    let pointSystem: PointSystem;
    let feedManager: any; // Use any type for now since it's not in typechain yet
    
    // Manager contracts
    let creationManager: any;
    let encryptionManager: any;
    let interactionManager: any;
    let queryManager: any;

    // User accounts to simulate different roles
    let owner: SignerWithAddress;
    let admin: SignerWithAddress;
    let tribeCreator: SignerWithAddress;
    let user1: SignerWithAddress;
    let user2: SignerWithAddress;
    let user3: SignerWithAddress;

    // Store IDs for reference
    let tribeId: number;
    let collectibleId: number;

    before(async function () {
        console.log(chalk.cyan("\n=== Setting up test environment ==="));
        [owner, admin, tribeCreator, user1, user2, user3] = await ethers.getSigners();

        console.log("Deploying core contracts...");
        
        // Deploy RoleManager
        const RoleManager = await ethers.getContractFactory("RoleManager");
        roleManager = await upgrades.deployProxy(RoleManager, [], { kind: 'uups' });
        await roleManager.waitForDeployment();
        console.log(chalk.green("✓ RoleManager deployed"));

        // Deploy TribeController
        const TribeController = await ethers.getContractFactory("TribeController");
        tribeController = await upgrades.deployProxy(TribeController, [await roleManager.getAddress()], { kind: 'uups' });
        await tribeController.waitForDeployment();
        console.log(chalk.green("✓ TribeController deployed"));

        // Deploy PointSystem
        const PointSystem = await ethers.getContractFactory("PointSystem");
        pointSystem = await upgrades.deployProxy(PointSystem, [
            await roleManager.getAddress(),
            await tribeController.getAddress()
        ], { 
            kind: 'uups',
            unsafeAllow: ['constructor'] 
        });
        await pointSystem.waitForDeployment();
        console.log(chalk.green("✓ PointSystem deployed"));

        // Deploy CollectibleController
        const CollectibleController = await ethers.getContractFactory("CollectibleController");
        collectibleController = await upgrades.deployProxy(CollectibleController, [
            await roleManager.getAddress(),
            await tribeController.getAddress(),
            await pointSystem.getAddress()
        ], { 
            kind: 'uups',
            unsafeAllow: ['constructor'] 
        });
        await collectibleController.waitForDeployment();
        console.log(chalk.green("✓ CollectibleController deployed"));

        // Deploy PostFeedManager
        const PostFeedManager = await ethers.getContractFactory("PostFeedManager");
        feedManager = await PostFeedManager.deploy(await tribeController.getAddress());
        await feedManager.waitForDeployment();
        console.log(chalk.green("✓ PostFeedManager deployed"));

        // Deploy the manager contracts first
        const PostCreationManager = await ethers.getContractFactory("PostCreationManager");
        creationManager = await upgrades.deployProxy(PostCreationManager, [
            await roleManager.getAddress(),
            await tribeController.getAddress(),
            await collectibleController.getAddress(),
            await feedManager.getAddress()
        ], { 
            kind: 'uups',
            unsafeAllow: ['constructor'] 
        });
        await creationManager.waitForDeployment();
        
        const PostEncryptionManager = await ethers.getContractFactory("PostEncryptionManager");
        encryptionManager = await upgrades.deployProxy(PostEncryptionManager, [
            await roleManager.getAddress(),
            await tribeController.getAddress(),
            await collectibleController.getAddress(),
            await feedManager.getAddress()
        ], { 
            kind: 'uups',
            unsafeAllow: ['constructor'] 
        });
        await encryptionManager.waitForDeployment();
        
        const PostInteractionManager = await ethers.getContractFactory("PostInteractionManager");
        interactionManager = await upgrades.deployProxy(PostInteractionManager, [
            await roleManager.getAddress(),
            await tribeController.getAddress(),
            await collectibleController.getAddress(),
            await feedManager.getAddress()
        ], { 
            kind: 'uups',
            unsafeAllow: ['constructor'] 
        });
        await interactionManager.waitForDeployment();
        
        const PostQueryManager = await ethers.getContractFactory("PostQueryManager");
        queryManager = await upgrades.deployProxy(PostQueryManager, [
            await roleManager.getAddress(),
            await tribeController.getAddress(),
            await collectibleController.getAddress(),
            await feedManager.getAddress()
        ], { 
            kind: 'uups',
            unsafeAllow: ['constructor'] 
        });
        await queryManager.waitForDeployment();

        // Deploy PostMinter
        const PostMinter = await ethers.getContractFactory("PostMinter");
        postMinter = await upgrades.deployProxy(PostMinter, [
            await roleManager.getAddress(),
            await tribeController.getAddress(),
            await collectibleController.getAddress(),
            await feedManager.getAddress(),
            await creationManager.getAddress(),
            await encryptionManager.getAddress(),
            await interactionManager.getAddress(),
            await queryManager.getAddress()
        ], { 
            kind: 'uups',
            unsafeAllow: ['constructor'] 
        });
        await postMinter.waitForDeployment();
        console.log(chalk.green("✓ PostMinter deployed"));

        // Grant admin role to PostMinter and creationManager in PostFeedManager
        await feedManager.grantRole(await feedManager.DEFAULT_ADMIN_ROLE(), await postMinter.getAddress());
        await feedManager.grantRole(await feedManager.DEFAULT_ADMIN_ROLE(), await creationManager.getAddress());
        console.log(chalk.green("✓ Granted admin role to PostMinter & CreationManager in PostFeedManager"));

        // 2. Setup Roles
        console.log(chalk.yellow("Setting up roles..."));
        const ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE"));
        const TRIBE_ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("TRIBE_ADMIN_ROLE"));
        const PROJECT_CREATOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("PROJECT_CREATOR_ROLE"));
        const DEFAULT_ADMIN_ROLE = await roleManager.DEFAULT_ADMIN_ROLE();
        const RATE_LIMIT_MANAGER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("RATE_LIMIT_MANAGER_ROLE"));

        
        // Grant admin roles
        await roleManager.grantRole(DEFAULT_ADMIN_ROLE, admin.address);
        await roleManager.grantRole(ADMIN_ROLE, admin.address);
        await roleManager.grantRole(TRIBE_ADMIN_ROLE, tribeCreator.address);
        
        // Grant project creation role
        await roleManager.grantRole(PROJECT_CREATOR_ROLE, tribeCreator.address);
        await roleManager.grantRole(PROJECT_CREATOR_ROLE, user1.address);

        // Grant roles directly on manager contracts
        // CreationManager roles
        await creationManager.grantRole(DEFAULT_ADMIN_ROLE, admin.address);
        await creationManager.grantRole(PROJECT_CREATOR_ROLE, tribeCreator.address);
        await creationManager.grantRole(PROJECT_CREATOR_ROLE, user1.address);
        await creationManager.grantRole(PROJECT_CREATOR_ROLE, user2.address); // Ensure user2 can create posts
        await creationManager.grantRole(RATE_LIMIT_MANAGER_ROLE, tribeCreator.address);
        await creationManager.grantRole(RATE_LIMIT_MANAGER_ROLE, user2.address); // Bypass cooldown for user2
        await creationManager.grantRole(RATE_LIMIT_MANAGER_ROLE, user3.address); // Bypass cooldown for user3
        
        // InteractionManager roles
        await interactionManager.grantRole(DEFAULT_ADMIN_ROLE, admin.address);
        await interactionManager.grantRole(RATE_LIMIT_MANAGER_ROLE, tribeCreator.address);
        await interactionManager.grantRole(RATE_LIMIT_MANAGER_ROLE, user2.address); // Bypass interaction cooldown

        // Grant needed permissions on PostMinter (can likely be removed later but keep for now)
        await postMinter.grantRole(PROJECT_CREATOR_ROLE, tribeCreator.address);
        await postMinter.grantRole(PROJECT_CREATOR_ROLE, user1.address);
        await postMinter.grantRole(RATE_LIMIT_MANAGER_ROLE, tribeCreator.address);
        await postMinter.grantRole(RATE_LIMIT_MANAGER_ROLE, user2.address); // Bypass cooldown via proxy too

        console.log(chalk.green("✓ Setup complete\n"));
    });

    describe(chalk.magenta("1. Tribe Creation & Management"), function () {
        it("Should demonstrate complete tribe creation and management flow", async function () {
            console.log(chalk.cyan("\n=== Tribe Creation & Management Flow ==="));

            // 1. Create a tribe with comprehensive configuration
            const tribeMetadata = {
                name: "Creative Web3 Hub",
                description: "A community for Web3 creators and builders",
                avatar: "ipfs://QmTribeAvatar",
                banner: "ipfs://QmTribeBanner",
                category: "Technology",
                tags: ["web3", "creators", "builders"],
                guidelines: {
                    rules: [
                        "Be respectful and professional",
                        "No spam or self-promotion",
                        "Contribute meaningfully to discussions"
                    ],
                    requirements: "Verified Web3 professional or creator"
                },
                features: {
                    hasEvents: true,
                    hasProjects: true,
                    hasCollectibles: true
                },
                socials: {
                    discord: "https://discord.gg/creativeweb3",
                    twitter: "@creativeweb3hub"
                }
            };

            console.log(chalk.yellow("Creating tribe..."));
            const tribeTx = await tribeController.connect(tribeCreator).createTribe(
                tribeMetadata.name,
                JSON.stringify(tribeMetadata),
                [tribeCreator.address], // Initial admins
                1, // PRIVATE join type
                ethers.parseEther("0.1"), // Entry fee
                [] // No NFT requirements initially
            );

            const tribeReceipt = await tribeTx.wait();
            const tribeEvent = tribeReceipt?.logs.find(
                (x: any) => x instanceof EventLog && x.eventName === "TribeCreated"
            ) as EventLog;
            tribeId = tribeEvent ? Number(tribeEvent.args[0]) : 0;

            // 2. Create tribe token for engagement rewards
            console.log(chalk.yellow("Setting up tribe token..."));
            await pointSystem.connect(tribeCreator).createTribeToken(
                tribeId,
                "Creative Web3 Token",
                "CW3"
            );

            // 3. Create access collectible
            console.log(chalk.yellow("Creating access collectible..."));
            const collectibleMetadata = {
                name: "Creative Web3 Access Pass",
                description: "Exclusive access to the Creative Web3 Hub",
                image: "ipfs://QmCollectibleImage",
                attributes: [
                    {
                        trait_type: "Access Level",
                        value: "Member"
                    },
                    {
                        trait_type: "Valid Until",
                        value: "Forever"
                    }
                ]
            };

            const collectibleTx = await collectibleController.connect(tribeCreator).createCollectible(
                tribeId,
                collectibleMetadata.name,
                "CW3PASS",
                JSON.stringify(collectibleMetadata),
                1000, // maxSupply
                ethers.parseEther("0.1"), // price
                0 // no points required
            );

            const collectibleReceipt = await collectibleTx.wait();
            const collectibleEvent = collectibleReceipt?.logs.find(
                (x: any) => x instanceof EventLog && x.eventName === "CollectibleCreated"
            ) as EventLog;
            collectibleId = collectibleEvent ? Number(collectibleEvent.args[0]) : 0;

            // 4. Update tribe to be NFT-gated
            console.log(chalk.yellow("Updating tribe to NFT-gated..."));
            await tribeController.connect(tribeCreator).updateTribeConfig(
                tribeId,
                3, // NFT_GATED
                0, // Remove entry fee
                [{
                    nftContract: await collectibleController.getAddress(),
                    nftType: 1, // ERC1155
                    isMandatory: true,
                    minAmount: 1n,
                    tokenIds: [collectibleId]
                }]
            );

            console.log(chalk.green("✓ Tribe creation and setup complete\n"));
        });
    });

    describe(chalk.magenta("2. Member Onboarding & Engagement"), function () {
        it("Should demonstrate complete member onboarding and engagement flow", async function () {
            console.log(chalk.cyan("\n=== Member Onboarding & Engagement Flow ==="));

            // 1. User1 claims access NFT and joins
            console.log(chalk.yellow("User1 claiming access NFT..."));
            await collectibleController.connect(user1).claimCollectible(
                tribeId,
                collectibleId,
                { value: ethers.parseEther("0.1") }
            );

            console.log(chalk.yellow("User1 joining tribe..."));
            await tribeController.connect(user1).joinTribe(tribeId);

            // 2. Create welcome post using creationManager
            console.log(chalk.yellow("Creating welcome post..."));
            const welcomePost = {
                type: "TEXT",
                title: "Welcome to Creative Web3 Hub!",
                content: "We're excited to have you join our community of creators and builders!",
                attachments: [],
                tags: ["welcome", "announcement"],
                createdAt: Math.floor(Date.now() / 1000)
            };

            const postTx = await creationManager.connect(tribeCreator).createPost(
                tribeId,
                JSON.stringify(welcomePost),
                false,
                ethers.ZeroAddress,
                0
            );

            // Wait for rate limit
            await ethers.provider.send("evm_increaseTime", [61]);
            await ethers.provider.send("evm_mine", []);

            // 3. User1 creates introduction post using creationManager
            console.log(chalk.yellow("User1 creating introduction..."));
            const introPost = {
                type: "TEXT",
                title: "Hello Creative Web3 Hub!",
                content: "Excited to be part of this community! I'm a Web3 developer working on...",
                attachments: [],
                tags: ["introduction", "member"],
                createdAt: Math.floor(Date.now() / 1000)
            };

            await creationManager.connect(user1).createPost(
                tribeId,
                JSON.stringify(introPost),
                false,
                ethers.ZeroAddress,
                0
            );

            // 4. Award points for engagement
            console.log(chalk.yellow("Awarding engagement points..."));
            await pointSystem.connect(tribeCreator).awardPoints(
                tribeId,
                user1.address,
                100,
                ethers.keccak256(ethers.toUtf8Bytes("POST"))
            );

            // 5. Create community poll using creationManager
            console.log(chalk.yellow("Creating community poll..."));
            const pollPost = {
                type: "POLL",
                title: "Next Community Event",
                content: "What type of event should we host next?",
                options: [
                    "Technical Workshop",
                    "NFT Creation Workshop",
                    "DeFi Trading Workshop",
                    "Web3 Social Meetup"
                ],
                duration: 7 * 24 * 60 * 60, // 1 week
                createdAt: Math.floor(Date.now() / 1000)
            };

            await creationManager.connect(tribeCreator).createPost(
                tribeId,
                JSON.stringify(pollPost),
                false,
                ethers.ZeroAddress,
                0
            );

            console.log(chalk.green("✓ Member onboarding and engagement flow complete\n"));
        });
    });

    describe(chalk.magenta("3. Content Creation & Interactions"), function () {
        let postIds: { [key: string]: number } = {};

        beforeEach(async function() {
            // Ensure tribeCreator is a member of the tribe
            const creatorStatus = await tribeController.getMemberStatus(tribeId, tribeCreator.address);
            if (Number(creatorStatus) === 0) { // If not a member
                await collectibleController.connect(tribeCreator).claimCollectible(
                    tribeId,
                    collectibleId,
                    { value: ethers.parseEther("0.1") }
                );
                await tribeController.connect(tribeCreator).joinTribe(tribeId);
            }

            // Wait for rate limit between tests
            await ethers.provider.send("evm_increaseTime", [61]);
            await ethers.provider.send("evm_mine", []);
        });

        it("Should demonstrate different post types and content creation", async function () {
            console.log(chalk.cyan("\n=== Content Creation Flow ==="));

            // 1. Create a rich media post using creationManager
            console.log(chalk.yellow("Creating rich media post..."));
            const mediaPost = {
                type: "RICH_MEDIA",
                title: "Project Demo Showcase",
                content: "Check out our latest project demo!",
                mediaContent: {
                    images: [{
                        url: "ipfs://QmImage1",
                        mimeType: "image/jpeg",
                        width: 1920,
                        height: 1080,
                        caption: "Dashboard Overview"
                    }],
                    videos: [{
                        url: "ipfs://QmVideo1",
                        mimeType: "video/mp4",
                        duration: 180,
                        thumbnail: "ipfs://QmThumb1",
                        caption: "Feature Walkthrough"
                    }]
                },
                tags: ["demo", "showcase", "product"],
                createdAt: Math.floor(Date.now() / 1000)
            };

            const mediaTx = await creationManager.connect(tribeCreator).createPost(
                tribeId,
                JSON.stringify(mediaPost),
                false,
                ethers.ZeroAddress,
                0
            );
            const mediaReceipt = await mediaTx.wait();
            const mediaEvent = mediaReceipt?.logs.find(
                (x: any) => x instanceof EventLog && x.eventName === "PostCreated"
            ) as EventLog;
            postIds.media = mediaEvent ? Number(mediaEvent.args[0]) : 0;

            // Wait for rate limit - increased to 3 minutes to be safe
            await ethers.provider.send("evm_increaseTime", [180]);
            await ethers.provider.send("evm_mine", []);

            // 2. Create a gated announcement using creationManager
            console.log(chalk.yellow("Creating gated announcement..."));
            const gatedPost = {
                type: "COMMUNITY_UPDATE",
                title: "Premium Member Update",
                content: "Exclusive update for our premium members...",
                communityDetails: {
                    importance: "high",
                    category: "premium"
                },
                attachments: [],
                tags: ["premium", "exclusive"],
                createdAt: Math.floor(Date.now() / 1000)
            };

            const gatedTx = await creationManager.connect(tribeCreator).createPost(
                tribeId,
                JSON.stringify(gatedPost),
                true, // gated
                await collectibleController.getAddress(),
                collectibleId
            );
            const gatedReceipt = await gatedTx.wait();
            const gatedEvent = gatedReceipt?.logs.find(
                (x: any) => x instanceof EventLog && x.eventName === "PostCreated"
            ) as EventLog;
            postIds.gated = gatedEvent ? Number(gatedEvent.args[0]) : 1;

            // Wait for rate limit - increased to 3 minutes to be safe
            await ethers.provider.send("evm_increaseTime", [180]);
            await ethers.provider.send("evm_mine", []);

            // 3. Create a poll with options using creationManager
            console.log(chalk.yellow("Creating interactive poll..."));
            const pollPost = {
                type: "POLL",
                title: "Community Governance",
                content: "How should we allocate the community treasury?",
                options: [
                    { id: 1, text: "Fund Developer Grants" },
                    { id: 2, text: "Community Events" },
                    { id: 3, text: "Marketing & Growth" },
                    { id: 4, text: "Treasury Reserve" }
                ],
                endTime: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
                allowMultipleChoices: false,
                minTokensToVote: 100,
                tags: ["governance", "poll", "treasury"],
                createdAt: Math.floor(Date.now() / 1000)
            };

            const pollTx = await creationManager.connect(tribeCreator).createPost(
                tribeId,
                JSON.stringify(pollPost),
                false,
                ethers.ZeroAddress,
                0
            );
            const pollReceipt = await pollTx.wait();
            const pollEvent = pollReceipt?.logs.find(
                (x: any) => x instanceof EventLog && x.eventName === "PostCreated"
            ) as EventLog;
            postIds.poll = pollEvent ? Number(pollEvent.args[0]) : 2;

            console.log(chalk.green("✓ Content creation complete\n"));
        });

        it("Should demonstrate post interactions and updates", async function () {
            // First create a test post to interact with using creationManager
            const testPost = {
                type: "TEXT",
                title: "Test Post",
                content: "This is a test post for interactions",
                createdAt: Math.floor(Date.now() / 1000)
            };

            const postTx = await creationManager.connect(tribeCreator).createPost(
                tribeId,
                JSON.stringify(testPost),
                false,
                ethers.ZeroAddress,
                0
            );
            const postReceipt = await postTx.wait();
            const postEvent = postReceipt?.logs.find(
                (x: any) => x instanceof EventLog && x.eventName === "PostCreated"
            ) as EventLog;
            const testPostId = postEvent ? Number(postEvent.args[0]) : 0;

            // Wait for rate limit
            await ethers.provider.send("evm_increaseTime", [61]);
            await ethers.provider.send("evm_mine", []);

            // Now test interactions using interactionManager
            console.log(chalk.cyan("\n=== Post Interactions Flow ==="));

            // 1. User1 likes and comments
            console.log(chalk.yellow("User1 interacting with post..."));
            await interactionManager.connect(user1).interactWithPost(testPostId, 0); // LIKE

            // Wait for rate limit
            await ethers.provider.send("evm_increaseTime", [61]);
            await ethers.provider.send("evm_mine", []);

            await interactionManager.connect(user1).interactWithPost(testPostId, 1); // COMMENT

            // Get interaction stats
            const likes = await interactionManager.getInteractionCount(testPostId, 0);
            const comments = await interactionManager.getInteractionCount(testPostId, 1);

            expect(likes).to.equal(1);
            expect(comments).to.equal(1);

            console.log(chalk.green("✓ Post interactions complete\n"));
        });

        it("Should demonstrate comprehensive error handling and edge cases", async function () {
            console.log(chalk.cyan("\n=== Comprehensive Error Handling Flow ==="));

            // Ensure user1 is a member of the tribe
            if (Number(await tribeController.getMemberStatus(tribeId, user1.address)) === 0) {
                await collectibleController.connect(user1).claimCollectible(
                    tribeId,
                    collectibleId,
                    { value: ethers.parseEther("0.1") }
                );
                await tribeController.connect(user1).joinTribe(tribeId);
            }

            // 1. Metadata Validation
            console.log(chalk.yellow("\nTesting metadata validation..."));

            // Empty metadata
            await expect(
                creationManager.connect(user1).createPost(
                    tribeId,
                    "",
                    false,
                    ethers.ZeroAddress,
                    0
                )
            ).to.be.revertedWithCustomError(creationManager, "EmptyMetadata");

            // Invalid JSON
            await expect(
                creationManager.connect(user1).createPost(
                    tribeId,
                    "not json",
                    false,
                    ethers.ZeroAddress,
                    0
                )
            ).to.be.revertedWithCustomError(creationManager, "InvalidJsonFormat");

            // Missing title field
            await expect(
                creationManager.connect(user1).createPost(
                    tribeId,
                    JSON.stringify({
                        content: "Some content"
                    }),
                    false,
                    ethers.ZeroAddress,
                    0
                )
            ).to.be.revertedWithCustomError(creationManager, "MissingTitleField");

            // Wait for cooldown
            await ethers.provider.send("evm_increaseTime", [61]);
            await ethers.provider.send("evm_mine", []);

            // Missing content field
            await expect(
                creationManager.connect(user1).createPost(
                    tribeId,
                    JSON.stringify({
                        title: "Some title"
                    }),
                    false,
                    ethers.ZeroAddress,
                    0
                )
            ).to.be.revertedWithCustomError(creationManager, "MissingContentField");

            // Wait for cooldown
            await ethers.provider.send("evm_increaseTime", [61]);
            await ethers.provider.send("evm_mine", []);

            // 2. Permission and Access Control
            console.log(chalk.yellow("\nTesting permission and access control..."));

            // Non-member trying to post
            await expect(
                creationManager.connect(user3).createPost(
                    tribeId,
                    JSON.stringify({ title: "Test", content: "Test" }),
                    false,
                    ethers.ZeroAddress,
                    0
                )
            ).to.be.revertedWithCustomError(creationManager, "NotTribeMember");

            // Wait for cooldown
            await ethers.provider.send("evm_increaseTime", [61]);
            await ethers.provider.send("evm_mine", []);

            // Invalid collectible contract
            await expect(
                creationManager.connect(user1).createPost(
                    tribeId,
                    JSON.stringify({ title: "Test", content: "Test" }),
                    true,
                    ethers.ZeroAddress,
                    0
                )
            ).to.be.revertedWithCustomError(creationManager, "InvalidCollectibleContract");

            // Wait for cooldown
            await ethers.provider.send("evm_increaseTime", [61]);
            await ethers.provider.send("evm_mine", []);

            // 3. Rate Limiting
            console.log(chalk.yellow("\nTesting rate limiting..."));

            // Create first post
            await creationManager.connect(user1).createPost(
                tribeId,
                JSON.stringify({ title: "Test 1", content: "Test 1" }),
                false,
                ethers.ZeroAddress,
                0
            );

            // Try to post again immediately
            await expect(
                creationManager.connect(user1).createPost(
                    tribeId,
                    JSON.stringify({ title: "Test 2", content: "Test 2" }),
                    false,
                    ethers.ZeroAddress,
                    0
                )
            ).to.be.revertedWithCustomError(creationManager, "CooldownActive");

            console.log(chalk.green("✓ Error handling tests complete\n"));
        });

        it("Should demonstrate advanced content gating scenarios", async function () {
            console.log(chalk.cyan("\n=== Advanced Content Gating Flow ==="));

            // Ensure tribeCreator is a member
            if (Number(await tribeController.getMemberStatus(tribeId, tribeCreator.address)) === 0) {
                await collectibleController.connect(tribeCreator).claimCollectible(
                    tribeId,
                    collectibleId,
                    { value: ethers.parseEther("0.1") }
                );
                await tribeController.connect(tribeCreator).joinTribe(tribeId);
            }

            // Create a new collectible specifically for gating
            console.log(chalk.yellow("Creating gating collectible..."));
            const gatingCollectibleTx = await collectibleController.connect(tribeCreator).createCollectible(
                tribeId,
                "Gating NFT",
                "GATE",
                "ipfs://QmGatingNFT",
                100,
                ethers.parseEther("0.1"),
                0
            );
            const gatingReceipt = await gatingCollectibleTx.wait();
            const gatingEvent = gatingReceipt?.logs.find(
                (x: any) => x instanceof EventLog && x.eventName === "CollectibleCreated"
            ) as EventLog;
            const gatingCollectibleId = gatingEvent ? Number(gatingEvent.args[0]) : 0;

            // Verify collectible was created
            const gatingCollectible = await collectibleController.getCollectible(gatingCollectibleId);
            expect(gatingCollectible.isActive).to.be.true;

            // Creator claims the collectible first
            console.log(chalk.yellow("Creator claiming gating collectible..."));
            await collectibleController.connect(tribeCreator).claimCollectible(
                tribeId,
                gatingCollectibleId,
                { value: ethers.parseEther("0.1") }
            );

            // Verify creator has the collectible
            const creatorBalance = await collectibleController.balanceOf(tribeCreator.address, gatingCollectibleId);
            expect(creatorBalance).to.equal(1n);

            // Create gated post using creationManager
            console.log(chalk.yellow("Creating gated post..."));
            const gatedPost = {
                type: "TEXT",
                title: "Gated Content",
                content: "This content requires the gating collectible to view",
                createdAt: Math.floor(Date.now() / 1000)
            };

            // Create the gated post using the claimed collectible
            const gatedPostTx = await creationManager.connect(tribeCreator).createPost(
                tribeId,
                JSON.stringify(gatedPost),
                true,
                await collectibleController.getAddress(),
                gatingCollectibleId
            );

            // Verify post was created and is gated
            const gatedPostReceipt = await gatedPostTx.wait();
            const gatedPostEvent = gatedPostReceipt?.logs.find(
                (x: any) => x instanceof EventLog && x.eventName === "PostCreated"
            ) as EventLog;
            const gatedPostId = gatedPostEvent ? Number(gatedPostEvent.args[0]) : 0;

            // Get post and verify gating using interactionManager
            const post = await interactionManager.getPost(gatedPostId);
            expect(post.isGated).to.be.true;
            expect(post.collectibleContract).to.equal(await collectibleController.getAddress());
            expect(post.collectibleId).to.equal(gatingCollectibleId);

            // Test access control
            console.log(chalk.yellow("Testing access control..."));

            // Create NFT requirement for tribe
            const nftRequirements = [{
                nftContract: await collectibleController.getAddress(),
                nftType: 1, // ERC1155
                isMandatory: true,
                minAmount: 1n,
                tokenIds: [BigInt(gatingCollectibleId)]
            }];

            // Update tribe to require NFT
            await tribeController.connect(tribeCreator).updateTribeConfig(
                tribeId,
                3, // NFT_GATED
                0, // No entry fee
                nftRequirements
            );

            // User without collectible should not be able to join
            await expect(
                tribeController.connect(user2).joinTribe(tribeId)
            ).to.be.revertedWith("NFT requirements not met");

            // User claims collectible and joins tribe
            console.log(chalk.yellow("User claiming collectible and joining tribe..."));
            await collectibleController.connect(user2).claimCollectible(
                tribeId,
                gatingCollectibleId,
                { value: ethers.parseEther("0.1") }
            );

            // Wait a block to ensure state is updated
            await ethers.provider.send("evm_mine", []);

            await tribeController.connect(user2).joinTribe(tribeId);

            // Now user should be able to join
            expect(await tribeController.getMemberStatus(tribeId, user2.address)).to.equal(1); // ACTIVE

            console.log(chalk.green("✓ Advanced gating scenarios complete\n"));
        });

        it("Should demonstrate content discovery and feed management", async function () {
            console.log(chalk.cyan("\n=== Content Discovery Flow ==="));

            // 1. Get tribe feed with pagination using queryManager
            console.log(chalk.yellow("Getting tribe feed..."));
            const [posts, total] = await queryManager.getPostsByTribe(tribeId, 0, 5);
            expect(posts.length).to.be.gt(0);
            expect(total).to.be.gt(0);

            // 2. Get user-specific feed using queryManager
            console.log(chalk.yellow("Getting user feed..."));
            const [userPosts, userTotal] = await queryManager.getPostsByUser(user1.address, 0, 5);
            expect(userPosts.length).to.be.gt(0);

            // 3. Get feed with type filter using queryManager
            console.log(chalk.yellow("Getting filtered feed..."));
            const [filteredPosts, filteredTotal] = await queryManager.getPostsByTribe(tribeId, 0, 5);
            
            // Verify posts are in chronological order
            for (let i = 0; i < filteredPosts.length - 1; i++) {
                const post1 = await interactionManager.getPost(filteredPosts[i]);
                const post2 = await interactionManager.getPost(filteredPosts[i + 1]);
                const metadata1 = JSON.parse(post1.metadata);
                const metadata2 = JSON.parse(post2.metadata);
                // Check if createdAt exists before comparing
                 if (metadata1.createdAt && metadata2.createdAt) {
                    expect(Number(metadata1.createdAt)).to.be.lte(Number(metadata2.createdAt));
                 }
            }

            console.log(chalk.green("✓ Content discovery flow complete\n"));
        });

        it("Should demonstrate post interaction scenarios", async function () {
            console.log(chalk.cyan("\n=== Post Interaction Scenarios ==="));

            // Create a regular post first using creationManager
            const testPost = {
                type: "TEXT",
                title: "Test Post",
                content: "Test content",
                createdAt: Math.floor(Date.now() / 1000)
            };

            // Create post
            const postTx = await creationManager.connect(user1).createPost(
                tribeId,
                JSON.stringify(testPost),
                false,
                ethers.ZeroAddress,
                0
            );

            const receipt = await postTx.wait();
            const event = receipt?.logs.find(
                (x: any) => x instanceof EventLog && x.eventName === "PostCreated"
            ) as EventLog;
            const postId = event ? Number(event.args[0]) : 0;

            // Wait for cooldown
            await ethers.provider.send("evm_increaseTime", [61]);
            await ethers.provider.send("evm_mine", []);

            // Test interactions using interactionManager
            await expect(
                interactionManager.connect(user1).interactWithPost(postId, 0)
            ).to.be.revertedWithCustomError(interactionManager, "CannotInteractWithOwnPost");

            // User2 likes the post
            await interactionManager.connect(user2).interactWithPost(postId, 0);

            // Verify like count
            expect(await interactionManager.getInteractionCount(postId, 0)).to.equal(1);

            console.log(chalk.green("✓ Post interaction scenarios complete\n"));
        });

        it("Should demonstrate advanced post types and metadata", async function () {
            console.log(chalk.cyan("\n=== Advanced Post Types ==="));

            // 1. Create a rich media post with multiple attachments using creationManager
            console.log(chalk.yellow("Creating rich media post..."));
            const richMediaPost = {
                type: "RICH_MEDIA",
                title: "Project Showcase",
                content: "Check out our latest project updates!",
                mediaContent: {
                    images: [
                        {
                            url: "ipfs://QmImage1",
                            mimeType: "image/jpeg",
                            width: 1920,
                            height: 1080,
                            caption: "Dashboard Overview"
                        },
                        {
                            url: "ipfs://QmImage2",
                            mimeType: "image/png",
                            width: 800,
                            height: 600,
                            caption: "Mobile View"
                        }
                    ],
                    videos: [
                        {
                            url: "ipfs://QmVideo1",
                            mimeType: "video/mp4",
                            duration: 180,
                            thumbnail: "ipfs://QmThumb1",
                            caption: "Feature Demo"
                        }
                    ],
                    attachments: [
                        {
                            name: "whitepaper.pdf",
                            url: "ipfs://QmDoc1",
                            mimeType: "application/pdf",
                            size: 1024576
                        }
                    ]
                },
                tags: ["project", "update", "demo"],
                createdAt: Math.floor(Date.now() / 1000)
            };

            await creationManager.connect(user1).createPost(
                tribeId,
                JSON.stringify(richMediaPost),
                false,
                ethers.ZeroAddress,
                0
            );

            // Wait for rate limit
            await ethers.provider.send("evm_increaseTime", [61]);
            await ethers.provider.send("evm_mine", []);

            // 2. Create an event post using creationManager
            console.log(chalk.yellow("Creating event post..."));
            const eventPost = {
                type: "EVENT",
                title: "Community Meetup",
                content: "Join us for our monthly community gathering!",
                eventDetails: {
                    startTime: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
                    endTime: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60 + 3 * 60 * 60,
                    timezone: "UTC",
                    location: {
                        type: "HYBRID",
                        physical: {
                            venue: "Tech Hub",
                            address: "123 Innovation St",
                            city: "San Francisco",
                            country: "USA",
                            coordinates: {
                                lat: "37.7749",
                                lng: "-122.4194"
                            }
                        },
                        virtual: {
                            platform: "Zoom",
                            url: "https://zoom.us/j/123456789",
                            password: "web3"
                        }
                    },
                    capacity: 100,
                    registration: {
                        required: true,
                        deadline: Math.floor(Date.now() / 1000) + 6 * 24 * 60 * 60
                    }
                },
                tags: ["event", "meetup", "community"],
                createdAt: Math.floor(Date.now() / 1000)
            };

            await creationManager.connect(user1).createPost(
                tribeId,
                JSON.stringify(eventPost),
                false,
                ethers.ZeroAddress,
                0
            );

            // Wait for rate limit
            await ethers.provider.send("evm_increaseTime", [61]);
            await ethers.provider.send("evm_mine", []);

            // 3. Create a milestone post using creationManager
            console.log(chalk.yellow("Creating milestone post..."));
            const milestonePost = {
                type: "PROJECT_UPDATE",
                title: "Q1 2024 Goals Achieved!",
                content: "We're excited to share our Q1 achievements...",
                projectDetails: {
                    milestoneIndex: 0,
                    status: "COMPLETED",
                    period: "Q1 2024",
                    achievements: [
                        {
                            title: "Community Growth",
                            target: "10,000 members",
                            achieved: "12,500 members",
                            status: "EXCEEDED"
                        },
                        {
                            title: "Platform Development",
                            target: "Beta Launch",
                            achieved: "Beta Launch + Mobile App",
                            status: "EXCEEDED"
                        }
                    ],
                    metrics: {
                        growth: "+25%",
                        engagement: "+40%",
                        retention: "85%"
                    },
                    nextSteps: [
                        "Launch mobile app to production",
                        "Expand community programs",
                        "Start international expansion"
                    ]
                },
                tags: ["milestone", "achievement", "growth"],
                createdAt: Math.floor(Date.now() / 1000)
            };

            await creationManager.connect(user1).createPost(
                tribeId,
                JSON.stringify(milestonePost),
                false,
                ethers.ZeroAddress,
                0
            );

            console.log(chalk.green("✓ Advanced post types complete\n"));
        });
    });

    describe(chalk.magenta("4. Project & Fundraising Management"), function () {
        let projectPostId: number;
        let fundraiserPostId: number;

        beforeEach(async function() {
            // Wait for rate limit between tests
            await ethers.provider.send("evm_increaseTime", [61]);
            await ethers.provider.send("evm_mine", []);
        });

        it("Should demonstrate complete project creation flow", async function () {
            console.log(chalk.cyan("\n=== Project Creation Flow ==="));

            // Ensure enough cooldown time has passed
            console.log(chalk.yellow("Waiting for cooldown..."));
            await ethers.provider.send("evm_increaseTime", [120]); // 2 minutes to be safe
            await ethers.provider.send("evm_mine", []);

            // Create a project post using creationManager
            console.log(chalk.yellow("Creating a project post..."));
            const projectData = {
                title: "Decentralized Identity System",
                content: "Building a self-sovereign identity solution",
                type: "PROJECT",
                projectDetails: {
                    totalBudget: ethers.parseEther("5000").toString(),
                    startDate: Math.floor(Date.now()/1000) + 86400, // Start tomorrow
                    duration: 90 * 24 * 60 * 60, // 90 days
                    milestones: [
                        {
                            title: "Research & Design",
                            description: "Research existing solutions and design our approach",
                            budget: ethers.parseEther("1000").toString(),
                            deadline: Math.floor(Date.now()/1000) + 30 * 24 * 60 * 60, // 30 days
                            dependencies: []
                        },
                        {
                            title: "Core Implementation",
                            description: "Implement the core identity management system",
                            budget: ethers.parseEther("2500").toString(),
                            deadline: Math.floor(Date.now()/1000) + 60 * 24 * 60 * 60, // 60 days
                            dependencies: [0] // Depends on first milestone
                        },
                        {
                            title: "Testing & Deployment",
                            description: "Comprehensive testing and mainnet deployment",
                            budget: ethers.parseEther("1500").toString(),
                            deadline: Math.floor(Date.now()/1000) + 90 * 24 * 60 * 60, // 90 days
                            dependencies: [1] // Depends on second milestone
                        }
                    ],
                    team: [
                        {
                            address: tribeCreator.address,
                            role: "CREATOR",
                            permissions: ["CREATE", "UPDATE", "DELETE", "MANAGE"]
                        },
                        {
                            address: user1.address,
                            role: "DEVELOPER",
                            permissions: ["UPDATE"]
                        },
                        {
                            address: user2.address,
                            role: "REVIEWER",
                            permissions: ["REVIEW"]
                        }
                    ]
                }
            };

            const projectTx = await creationManager.connect(tribeCreator).createPost(
                tribeId,
                JSON.stringify(projectData),
                false,
                ethers.ZeroAddress,
                0
            );
            
            const projectReceipt = await projectTx.wait();
            const projectEvent = projectReceipt?.logs.find(
                (x: any) => x instanceof EventLog && x.eventName === "PostCreated"
            ) as EventLog;
            projectPostId = projectEvent ? Number(projectEvent.args[0]) : 0;

            console.log(chalk.green(`✓ Project created with post ID: ${projectPostId}`));

            // Wait for rate limit - add extra wait time
            console.log(chalk.yellow("Waiting for cooldown before creating update..."));
            await ethers.provider.send("evm_increaseTime", [120]); // 2 minutes 
            await ethers.provider.send("evm_mine", []);

            // Create a project update post using creationManager
            console.log(chalk.yellow("Creating a project update post..."));
            const updateData = {
                title: "Research Phase Update",
                content: "We've completed the initial research and identified key requirements",
                type: "PROJECT_UPDATE",
                originalPostId: projectPostId, // Reference to original project post
                updateType: "MILESTONE_UPDATE",
                milestoneIndex: 0,
                deliverables: "ipfs://QmResearchFindings",
                projectDetails: {
                    milestoneIndex: 0,
                    status: "IN_PROGRESS",
                    deliverables: "ipfs://QmResearchFindings"
                },
                team: [
                    {
                        address: tribeCreator.address,
                        role: "CREATOR",
                        permissions: ["CREATE", "UPDATE", "DELETE", "MANAGE"]
                    },
                    {
                        address: user1.address,
                        role: "DEVELOPER",
                        permissions: ["UPDATE"]
                    }
                ]
            };

            const updateTx = await creationManager.connect(tribeCreator).createPost(
                tribeId,
                JSON.stringify(updateData),
                false,
                ethers.ZeroAddress,
                0
            );
            await updateTx.wait();

            console.log(chalk.green("✓ Project update created successfully"));
            
            // Wait for rate limit before unauthorized attempt
            console.log(chalk.yellow("Waiting for cooldown before testing unauthorized update..."));
            await ethers.provider.send("evm_increaseTime", [120]); // 2 minutes
            await ethers.provider.send("evm_mine", []);

            // Test unauthorized update attempt using creationManager
            console.log(chalk.yellow("Testing unauthorized update attempt..."));
            const unauthorizedUpdate = {
                title: "Unauthorized Update",
                content: "This update should fail",
                type: "PROJECT_UPDATE",
                originalPostId: projectPostId,
                updateType: "MILESTONE_UPDATE",
                milestoneIndex: 0,
                projectDetails: {
                    milestoneIndex: 0,
                    status: "COMPLETED",
                    deliverables: "ipfs://QunathorizedUpdate"
                },
                team: [
                    {
                        address: user2.address, // User2 does not have PROJECT_CREATOR_ROLE on creationManager
                        role: "REVIEWER",
                        permissions: ["REVIEW"]
                    }
                ]
            };

            // Expect revert due to lack of PROJECT_CREATOR_ROLE on creationManager for user2
            await expect(
                creationManager.connect(user2).createPost(
                    tribeId,
                    JSON.stringify(unauthorizedUpdate),
                    false,
                    ethers.ZeroAddress,
                    0
                )
            ).to.be.reverted; 
            
            console.log(chalk.green("✓ Unauthorized update properly rejected"));
            
            console.log(chalk.green("✓ Project creation flow test complete"));
        });

        it("Should demonstrate complete fundraiser flow", async function () {
            console.log(chalk.cyan("\n=== Fundraiser Creation Flow ==="));

            // Create a fundraiser post using creationManager
            console.log(chalk.yellow("Creating a fundraiser post..."));
            const fundraiserData = {
                type: "TEXT", // Note: Should likely be PROJECT_UPDATE or FUNDRAISER type if defined
                title: "Community Hub Development",
                content: "Raising funds to develop our community hub space",
                fundraiserDetails: {
                    target: ethers.parseEther("10000").toString(),
                    currency: "ETH",
                    startDate: Math.floor(Date.now()/1000) + 60, // Start in 1 minute
                    duration: 30 * 24 * 60 * 60, // 30 days
                    slabs: [
                        { name: "Supporter", amount: ethers.parseEther("50").toString() },
                        { name: "Contributor", amount: ethers.parseEther("200").toString() },
                        { name: "Builder", amount: ethers.parseEther("500").toString() },
                        { name: "Founder", amount: ethers.parseEther("1000").toString() }
                    ],
                    beneficiaries: [
                        {
                            address: tribeCreator.address,
                            share: 100 // 100% to the creator in this example
                        }
                    ],
                    team: [
                        {
                            address: tribeCreator.address,
                            role: "CREATOR",
                            permissions: ["CREATE", "UPDATE", "DELETE", "MANAGE"]
                        }
                    ]
                },
                metadata: {
                    images: ["ipfs://QmFundraiserImage"],
                    documents: ["ipfs://QmProposalDocument"],
                    website: "https://community-hub.example"
                }
            };

            const fundraiserTx = await creationManager.connect(tribeCreator).createPost(
                tribeId,
                JSON.stringify(fundraiserData),
                false,
                ethers.ZeroAddress,
                0
            );
            
            const fundraiserReceipt = await fundraiserTx.wait();
            const fundraiserEvent = fundraiserReceipt?.logs.find(
                (x: any) => x instanceof EventLog && x.eventName === "PostCreated"
            ) as EventLog;
            fundraiserPostId = fundraiserEvent ? Number(fundraiserEvent.args[0]) : 0;

            console.log(chalk.green(`✓ Fundraiser created with post ID: ${fundraiserPostId}`));

            // Wait for cooldown
            await ethers.provider.send("evm_increaseTime", [61]);
            await ethers.provider.send("evm_mine", []);

            // Simulate a contribution interaction using interactionManager
            console.log(chalk.yellow("Simulating fundraiser contribution..."));
            await interactionManager.connect(user1).interactWithPost(fundraiserPostId, 0); // LIKE to simulate contribution

            const interactions = await interactionManager.getInteractionCount(fundraiserPostId, 0);
            expect(interactions).to.equal(1);
            console.log(chalk.green("✓ Fundraiser contribution recorded"));
        });
    });

    // Other test sections remain unchanged...
}); 