import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { EventLog } from "ethers";
import {
    RoleManager,
    TribeController,
    PostMinter,
    CollectibleController,
    PointSystem
} from "../../typechain-types";
import { deployContracts } from "../../test/util/deployContracts";

describe("Fundraiser Journey V2", function () {
    let roleManager: RoleManager;
    let tribeController: TribeController;
    let postMinter: PostMinter;
    let collectibleController: CollectibleController;
    let pointSystem: PointSystem;
    let feedManager: any;
    let creationManager: any;
    let encryptionManager: any;
    let interactionManager: any;
    let queryManager: any;

    let admin: any;
    let moderator: any;
    let fundraiserCreator: any;
    let contributor1: any;
    let contributor2: any;
    let nonMember: any;
    let bannedMember: any;
    let tribeId: number;

    // Helper function to convert BigInt to string in JSON
    function replaceBigInts(obj: any): any {
        if (typeof obj !== 'object' || obj === null) return obj;
        if (typeof obj === 'bigint') return obj.toString();
        
        if (Array.isArray(obj)) {
            return obj.map(item => replaceBigInts(item));
        }
        
        const newObj: any = {};
        for (const key in obj) {
            const value = obj[key];
            if (typeof value === 'bigint') {
                newObj[key] = value.toString();
            } else if (typeof value === 'object' && value !== null) {
                newObj[key] = replaceBigInts(value);
            } else {
                newObj[key] = value;
            }
        }
        return newObj;
    }

    before(async function () {
        [admin, moderator, fundraiserCreator, contributor1, contributor2, nonMember, bannedMember] = await ethers.getSigners();

        // Use the deployContracts utility to deploy all contracts consistently
        const deployment = await deployContracts();
        
        // Extract contracts
        roleManager = deployment.contracts.roleManager;
        tribeController = deployment.contracts.tribeController;
        pointSystem = deployment.contracts.pointSystem;
        collectibleController = deployment.contracts.collectibleController;
        postMinter = deployment.contracts.postMinter;
        feedManager = deployment.contracts.postFeedManager;
        
        // Get references to all manager contracts
        console.log("Getting references to manager contracts");
        const creationManagerAddress = await postMinter.creationManager();
        const encryptionManagerAddress = await postMinter.encryptionManager();
        const interactionManagerAddress = await postMinter.interactionManager();
        const queryManagerAddress = await postMinter.queryManager();
        
        // Get contract instances
        creationManager = await ethers.getContractAt("PostCreationManager", creationManagerAddress);
        encryptionManager = await ethers.getContractAt("PostEncryptionManager", encryptionManagerAddress);
        interactionManager = await ethers.getContractAt("PostInteractionManager", interactionManagerAddress);
        queryManager = await ethers.getContractAt("PostQueryManager", queryManagerAddress);
        
        // Define common roles
        const CREATOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("CREATOR_ROLE"));
        const PROJECT_CREATOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("PROJECT_CREATOR_ROLE"));
        const MODERATOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MODERATOR_ROLE"));
        const RATE_LIMIT_MANAGER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("RATE_LIMIT_MANAGER_ROLE"));
        const DEFAULT_ADMIN_ROLE = await roleManager.DEFAULT_ADMIN_ROLE();
        
        // Grant roles on the RoleManager
        console.log("Setting up roles on RoleManager");
        await roleManager.grantRole(DEFAULT_ADMIN_ROLE, admin.address);
        await roleManager.grantRole(CREATOR_ROLE, fundraiserCreator.address);
        await roleManager.grantRole(PROJECT_CREATOR_ROLE, fundraiserCreator.address);
        await roleManager.grantRole(MODERATOR_ROLE, moderator.address);
        
        // Grant roles on PostMinter
        console.log("Setting up roles on PostMinter");
        await postMinter.grantRole(DEFAULT_ADMIN_ROLE, admin.address);
        await postMinter.grantRole(PROJECT_CREATOR_ROLE, fundraiserCreator.address);
        await postMinter.grantRole(RATE_LIMIT_MANAGER_ROLE, fundraiserCreator.address);
        await postMinter.grantRole(RATE_LIMIT_MANAGER_ROLE, contributor1.address);
        await postMinter.grantRole(RATE_LIMIT_MANAGER_ROLE, contributor2.address);
        
        // Grant direct access to CreationManager
        console.log("Setting up direct access on CreationManager");
        await creationManager.grantRole(DEFAULT_ADMIN_ROLE, admin.address);
        await creationManager.grantRole(DEFAULT_ADMIN_ROLE, fundraiserCreator.address);
        await creationManager.grantRole(PROJECT_CREATOR_ROLE, fundraiserCreator.address);
        await creationManager.grantRole(RATE_LIMIT_MANAGER_ROLE, fundraiserCreator.address);
        await creationManager.grantRole(RATE_LIMIT_MANAGER_ROLE, contributor1.address);
        await creationManager.grantRole(RATE_LIMIT_MANAGER_ROLE, contributor2.address);
        
        // Grant access to other managers
        console.log("Setting up roles on other managers");
        await encryptionManager.grantRole(DEFAULT_ADMIN_ROLE, admin.address);
        await encryptionManager.grantRole(DEFAULT_ADMIN_ROLE, fundraiserCreator.address);
        await encryptionManager.grantRole(RATE_LIMIT_MANAGER_ROLE, fundraiserCreator.address);
        
        await interactionManager.grantRole(DEFAULT_ADMIN_ROLE, admin.address);
        await interactionManager.grantRole(DEFAULT_ADMIN_ROLE, fundraiserCreator.address);
        await interactionManager.grantRole(RATE_LIMIT_MANAGER_ROLE, fundraiserCreator.address);
        
        await queryManager.grantRole(DEFAULT_ADMIN_ROLE, admin.address);
        await queryManager.grantRole(DEFAULT_ADMIN_ROLE, fundraiserCreator.address);
        await queryManager.grantRole(RATE_LIMIT_MANAGER_ROLE, fundraiserCreator.address);
        
        // Create a new tribe specifically for fundraiser tests
        console.log("Creating a new tribe for fundraiser tests");
        const tribeTx = await tribeController.connect(admin).createTribe(
            "Fundraiser Test Tribe", 
            JSON.stringify({name: "Fundraiser Test Tribe", description: "A tribe for testing fundraisers"}),
            [admin.address, fundraiserCreator.address], // Include fundraiserCreator as admin explicitly 
            0, // PUBLIC
            0, // No entry fee
            []  // No NFT requirements
        );
        const tribeReceipt = await tribeTx.wait();
        const tribeEvent = tribeReceipt?.logs.find(
            (x: any) => x instanceof EventLog && x.eventName === "TribeCreated"
        ) as EventLog;
        tribeId = tribeEvent ? Number(tribeEvent.args[0]) : 1; // Should be 1 since deployContracts creates tribe 0
        
        console.log(`Created fundraiser test tribe with ID: ${tribeId}`);
        
        // Make all users join the tribe explicitly
        console.log("Adding all test users to the tribe");
        
        // Helper function to join tribe if not already a member
        async function ensureTribeMembership(user: any, name: string) {
            const status = Number(await tribeController.getMemberStatus(tribeId, user.address));
            console.log(`${name} initial membership status: ${status}`);
            if (status !== 1) { // 1 = ACTIVE
                console.log(`${name} joining tribe...`);
                await tribeController.connect(user).joinTribe(tribeId);
                const newStatus = Number(await tribeController.getMemberStatus(tribeId, user.address));
                console.log(`${name} new membership status: ${newStatus}`);
                if (newStatus !== 1) {
                    throw new Error(`Failed to make ${name} join tribe, status: ${newStatus}`);
                }
            }
        }
        
        // Ensure all users are members
        await ensureTribeMembership(admin, "Admin");
        await ensureTribeMembership(moderator, "Moderator");
        await ensureTribeMembership(fundraiserCreator, "FundraiserCreator");
        await ensureTribeMembership(contributor1, "Contributor1");
        await ensureTribeMembership(contributor2, "Contributor2");
        
        // Also make the admin a moderator in the tribe
        console.log("Granting MODERATOR_ROLE to moderator");
        await roleManager.grantRole(MODERATOR_ROLE, moderator.address);
        
        // Grant admin role to fundraiserCreator on PostFeedManager
        console.log("Granting admin role to fundraiserCreator on feedManager");
        await feedManager.grantRole(await feedManager.DEFAULT_ADMIN_ROLE(), fundraiserCreator.address);
        
        // Verify memberships are correct before proceeding
        console.log("Verifying final tribe membership status");
        const adminStatus = Number(await tribeController.getMemberStatus(tribeId, admin.address));
        const fundraiserStatus = Number(await tribeController.getMemberStatus(tribeId, fundraiserCreator.address));
        const contributor1Status = Number(await tribeController.getMemberStatus(tribeId, contributor1.address));
        const contributor2Status = Number(await tribeController.getMemberStatus(tribeId, contributor2.address));
        
        if (adminStatus !== 1 || fundraiserStatus !== 1 || contributor1Status !== 1 || contributor2Status !== 1) {
            throw new Error("Not all users are properly set up as tribe members");
        }
        
        console.log("All users successfully added to the tribe");
                
        // Join the default tribe created by deployContracts
        console.log("Ensuring membership in default tribe (ID 0)");
        async function ensureDefaultTribeMembership(user: any, name: string) {
            const status = Number(await tribeController.getMemberStatus(0, user.address));
            if (status !== 1) {
                console.log(`${name} joining default tribe...`);
                await tribeController.connect(user).joinTribe(0);
            }
        }
        
        await ensureDefaultTribeMembership(admin, "Admin");
        await ensureDefaultTribeMembership(fundraiserCreator, "FundraiserCreator");
        await ensureDefaultTribeMembership(contributor1, "Contributor1");
        await ensureDefaultTribeMembership(contributor2, "Contributor2");
        
        // Wait for cooldowns
        await ethers.provider.send("evm_increaseTime", [61]);
        await ethers.provider.send("evm_mine", []);
        
        console.log("Tribe setup completed successfully");
    });

    describe("Fundraiser Creation Scenarios", function () {
        beforeEach(async function () {
            // Wait for rate limit cooldown before each test
            await ethers.provider.send("evm_increaseTime", [61]); // 61 seconds
            await ethers.provider.send("evm_mine", []);
        });

        it("Should create a standard fundraiser", async function () {
            console.log(`Debug: About to create fundraiser with tribeId ${tribeId}`);
            
            // Double-check tribe membership
            const fundraiserCreatorStatus = Number(await tribeController.getMemberStatus(tribeId, fundraiserCreator.address));
            console.log(`Debug: FundraiserCreator membership status: ${fundraiserCreatorStatus} for tribeId ${tribeId}`);
            expect(fundraiserCreatorStatus).to.equal(1, "FundraiserCreator should be an active tribe member");
            
            // Check if it's also a member of the default tribe (0)
            const defaultTribeStatus = Number(await tribeController.getMemberStatus(0, fundraiserCreator.address));
            console.log(`Debug: FundraiserCreator status in default tribe (0): ${defaultTribeStatus}`);
            
            // Let the test user join the default tribe as well
            if (defaultTribeStatus !== 1) {
                console.log(`Debug: Joining default tribe (0) as fallback`);
                await tribeController.connect(fundraiserCreator).joinTribe(0);
            }
            
            // Use consistent tribe IDs throughout the test - use 0 (default tribe) everywhere
            const testTribeId = 0;
            console.log(`Debug: Will use testTribeId ${testTribeId} for all tests going forward`);
            
            // Check membership in the test tribe
            const testTribeStatus = Number(await tribeController.getMemberStatus(testTribeId, fundraiserCreator.address));
            console.log(`Debug: FundraiserCreator status in testTribeId ${testTribeId}: ${testTribeStatus}`);
            
            // Verify fundraiserCreator has necessary roles on creationManager
            const hasRole = await creationManager.hasRole(
                ethers.keccak256(ethers.toUtf8Bytes("PROJECT_CREATOR_ROLE")), 
                fundraiserCreator.address
            );
            console.log(`Debug: FundraiserCreator has PROJECT_CREATOR_ROLE: ${hasRole}`);
            
            const fundraiser = {
                title: "Community Garden Project",
                content: "Creating a sustainable garden for our local community",
                type: "PROJECT_UPDATE",
                projectDetails: {
                    projectType: "FUNDRAISER",
                    target: ethers.parseEther("1000"),
                    currency: "ETH",
                    startDate: Math.floor(Date.now()/1000) + 60,
                    duration: 30 * 24 * 60 * 60,
                    slabs: [
                        { name: "Bronze", amount: ethers.parseEther("50") },
                        { name: "Silver", amount: ethers.parseEther("100") },
                        { name: "Gold", amount: ethers.parseEther("200") }
                    ]
                },
                metadata: {
                    images: ["ipfs://garden-plans"],
                    documents: ["ipfs://proposal-doc"],
                    website: "https://community-garden.example"
                },
                createdAt: Math.floor(Date.now()/1000)
            };

            try {
                // Try with the consistent test tribe ID - use creationManager directly
                console.log(`Debug: Creating post using testTribeId ${testTribeId} with creationManager directly`);
                const tx = await creationManager.connect(fundraiserCreator).createPost(
                    testTribeId,
                    JSON.stringify(replaceBigInts(fundraiser)),
                    false,
                    ethers.ZeroAddress,
                    0
                );

                await tx.wait();
                console.log("Post created successfully");
                
                const post = await interactionManager.getPost(0);
                const postData = JSON.parse(post.metadata);
                expect(postData.type).to.equal("PROJECT_UPDATE");
                
            } catch (err: any) {
                console.log(`Failed to create post: ${err.message}`);
                throw err;
            }
        });

        it("Should create fundraiser with multiple currencies", async function () {
            // Use the default tribe ID
            const testTribeId = 0;
            const currencies = ["ETH", "USDC", "TRIBE_TOKEN"];
            
            for (let i = 0; i < currencies.length; i++) {
                const currency = currencies[i];
                const fundraiser = {
                    title: `${currency} Fundraiser`,
                    content: `Testing ${currency} fundraising`,
                    type: "PROJECT_UPDATE",
                    projectDetails: {
                        projectType: "FUNDRAISER",
                        target: ethers.parseEther("1000"),
                        currency: currency,
                        startDate: Math.floor(Date.now()/1000) + 60,
                        duration: 30 * 24 * 60 * 60,
                        slabs: [
                            { name: "Basic", amount: ethers.parseEther("100") }
                        ]
                    },
                    createdAt: Math.floor(Date.now()/1000)
                };

                // Wait for rate limit cooldown before each post
                if (i > 0) {
                    await ethers.provider.send("evm_increaseTime", [61]); // 61 seconds
                    await ethers.provider.send("evm_mine", []);
                }

                // Use creationManager directly
                const tx = await creationManager.connect(fundraiserCreator).createPost(
                    testTribeId,
                    JSON.stringify(replaceBigInts(fundraiser)),
                    false,
                    ethers.ZeroAddress,
                    0
                );

                await tx.wait();
                console.log(`Created ${currency} fundraiser`);
            }
        });

        it("Should create fundraiser with flexible durations", async function () {
            // Use the default tribe ID
            const testTribeId = 0;
            const durations = [
                7 * 24 * 60 * 60,   // 1 week
                30 * 24 * 60 * 60,  // 1 month
                90 * 24 * 60 * 60   // 3 months
            ];

            for (let i = 0; i < durations.length; i++) {
                const duration = durations[i];
                const fundraiser = {
                    title: `${duration/(24*60*60)}-day Fundraiser`,
                    content: "Testing different durations",
                    type: "PROJECT_UPDATE",
                    projectDetails: {
                        projectType: "FUNDRAISER",
                        target: ethers.parseEther("1000"),
                        currency: "ETH",
                        startDate: Math.floor(Date.now()/1000) + 60,
                        duration: duration,
                        slabs: [
                            { name: "Basic", amount: ethers.parseEther("100") }
                        ]
                    },
                    createdAt: Math.floor(Date.now()/1000)
                };

                // Wait for rate limit cooldown before each post
                if (i > 0) {
                    await ethers.provider.send("evm_increaseTime", [61]); // 61 seconds
                    await ethers.provider.send("evm_mine", []);
                }

                // Use creationManager directly
                const tx = await creationManager.connect(fundraiserCreator).createPost(
                    testTribeId,
                    JSON.stringify(replaceBigInts(fundraiser)),
                    false,
                    ethers.ZeroAddress,
                    0
                );

                await tx.wait();
                console.log(`Created ${duration/(24*60*60)}-day fundraiser`);
            }
        });

        it("Should handle different slab configurations", async function () {
            // Use the default tribe ID
            const testTribeId = 0;
            const slabConfigs = [
                // Single tier
                [{ name: "Basic", amount: ethers.parseEther("10") }],
                
                // Multiple tiers
                [
                    { name: "Basic", amount: ethers.parseEther("10") },
                    { name: "Premium", amount: ethers.parseEther("50") },
                    { name: "Gold", amount: ethers.parseEther("100") }
                ],
                
                // Many tiers
                [
                    { name: "Tier 1", amount: ethers.parseEther("1") },
                    { name: "Tier 2", amount: ethers.parseEther("5") },
                    { name: "Tier 3", amount: ethers.parseEther("10") },
                    { name: "Tier 4", amount: ethers.parseEther("20") },
                    { name: "Tier 5", amount: ethers.parseEther("50") }
                ]
            ];

            for (let i = 0; i < slabConfigs.length; i++) {
                const slabs = slabConfigs[i];
                const fundraiser = {
                    title: `Slab Config Test ${i+1}`,
                    content: "Testing different slab configurations",
                    type: "PROJECT_UPDATE",
                    projectDetails: {
                        projectType: "FUNDRAISER",
                        target: ethers.parseEther("1000"),
                        currency: "ETH",
                        startDate: Math.floor(Date.now()/1000) + 60,
                        duration: 30 * 24 * 60 * 60,
                        slabs: slabs
                    },
                    createdAt: Math.floor(Date.now()/1000)
                };

                // Wait for rate limit cooldown before each post
                if (i > 0) {
                    await ethers.provider.send("evm_increaseTime", [61]); // 61 seconds
                    await ethers.provider.send("evm_mine", []);
                }

                // Use creationManager directly
                const tx = await creationManager.connect(fundraiserCreator).createPost(
                    testTribeId,
                    JSON.stringify(replaceBigInts(fundraiser)),
                    false,
                    ethers.ZeroAddress,
                    0
                );

                await tx.wait();
                console.log(`Created slab config test ${i+1}`);
            }
        });
    });

    describe("Contribution Scenarios", function () {
        let fundraiserId: number;

        beforeEach(async function () {
            // Use the default tribe ID
            const testTribeId = 0;
            
            // Create a new fundraiser for each test
            const fundraiser = {
                title: "Contribution Test Fundraiser",
                content: "Testing contributions to fundraisers",
                type: "PROJECT_UPDATE",
                projectDetails: {
                    projectType: "FUNDRAISER",
                    target: ethers.parseEther("1000"),
                    currency: "ETH",
                    startDate: Math.floor(Date.now()/1000) + 10, // Start soon
                    duration: 30 * 24 * 60 * 60,
                    slabs: [
                        { name: "Basic", amount: ethers.parseEther("50") },
                        { name: "Premium", amount: ethers.parseEther("100") }
                    ]
                },
                createdAt: Math.floor(Date.now()/1000)
            };

            // Use creationManager directly
            const tx = await creationManager.connect(fundraiserCreator).createPost(
                testTribeId,
                JSON.stringify(replaceBigInts(fundraiser)),
                false,
                ethers.ZeroAddress,
                0
            );

            const receipt = await tx.wait();
            const event = receipt?.logs.find(
                (x: any) => x instanceof EventLog && x.eventName === "PostCreated"
            ) as EventLog;
            fundraiserId = event ? Number(event.args[0]) : 0;
            console.log(`Created test fundraiser with ID: ${fundraiserId}`);

            // Fast forward time to start the fundraiser
            await ethers.provider.send("evm_increaseTime", [15]); // 15 seconds
            await ethers.provider.send("evm_mine", []);
        });

        it("Should simulate contribution through interaction", async function () {
            // Use interactionManager directly
            await interactionManager.connect(contributor1).interactWithPost(fundraiserId, 0); // LIKE
            await interactionManager.connect(contributor2).interactWithPost(fundraiserId, 0); // LIKE
            
            const likeCount = await interactionManager.getInteractionCount(fundraiserId, 0);
            expect(likeCount).to.equal(2);
        });

        it("Should ensure users can't interact with their own fundraiser", async function () {
            await expect(
                interactionManager.connect(fundraiserCreator).interactWithPost(fundraiserId, 0) // LIKE
            ).to.be.revertedWithCustomError(interactionManager, "CannotInteractWithOwnPost");
        });

        it("Should prevent interactions with deleted fundraiser", async function () {
            // Wait for cooldown
            await ethers.provider.send("evm_increaseTime", [61]);
            await ethers.provider.send("evm_mine", []);

            // Use the default tribe ID
            const testTribeId = 0;
            
            // Create a new fundraiser post
            const fundraiser = {
                title: "Test Fundraiser",
                content: "Fundraiser for testing deletion",
                type: "PROJECT_UPDATE",
                projectDetails: {
                    projectType: "FUNDRAISER",
                    target: ethers.parseEther("1000"),
                    currency: "ETH",
                    startDate: Math.floor(Date.now()/1000) + 60,
                    duration: 30 * 24 * 60 * 60,
                    slabs: [{ name: "Basic", amount: ethers.parseEther("100") }]
                },
                createdAt: Math.floor(Date.now()/1000)
            };

            // Use creationManager directly
            const tx = await creationManager.connect(fundraiserCreator).createPost(
                testTribeId,
                JSON.stringify(replaceBigInts(fundraiser)),
                false,
                ethers.ZeroAddress,
                0
            );
            const receipt = await tx.wait();
            const event = receipt?.logs.find(
                (x: any) => x instanceof EventLog && x.eventName === "PostCreated"
            ) as EventLog;
            const postId = event ? Number(event.args[0]) : 0;
            console.log(`Created test fundraiser for deletion with ID: ${postId}`);

            // Wait for cooldown before deletion
            await ethers.provider.send("evm_increaseTime", [61]);
            await ethers.provider.send("evm_mine", []);

            // Delete the fundraiser post using creationManager directly
            await creationManager.connect(fundraiserCreator).deletePost(postId);
            await ethers.provider.send("evm_mine", []);

            // Wait for cooldown before interaction
            await ethers.provider.send("evm_increaseTime", [61]);
            await ethers.provider.send("evm_mine", []);

            // Try to interact with deleted post using interactionManager directly
            await expect(
                interactionManager.connect(contributor1).interactWithPost(postId, 0) // LIKE
            ).to.be.revertedWithCustomError(interactionManager, "PostDeleted");
        });
    });

    describe("Frontend Validation Rules", function () {
        /* These tests document the validation rules that should be implemented in the frontend:
         * 1. Date validations:
         *    - Start date must be in the future
         *    - Duration must be between 1 week and 3 months
         * 2. Amount validations:
         *    - Target amount must be > 0
         *    - Target amount must be reasonable (platform-specific max)
         * 3. Slab validations:
         *    - At least one slab required
         *    - Slab amounts must be in ascending order
         *    - No duplicate slab names
         *    - Slab amounts must be > 0
         * 4. Currency validations:
         *    - Currency must be from supported list
         *    - If token, must be valid contract address
         */
    });
}); 