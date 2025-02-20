import { expect } from "chai";
import { ethers } from "hardhat";
import { EventLog } from "ethers";
import {
    RoleManager,
    TribeController,
    PostMinter,
    CollectibleController,
    PointSystem
} from "../../typechain-types";

describe("Fundraiser Journey V2", function () {
    let roleManager: RoleManager;
    let tribeController: TribeController;
    let postMinter: PostMinter;
    let collectibleController: CollectibleController;
    let pointSystem: PointSystem;

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

        // Deploy contracts
        const RoleManager = await ethers.getContractFactory("RoleManager");
        roleManager = await RoleManager.deploy();
        await roleManager.waitForDeployment();

        const TribeController = await ethers.getContractFactory("TribeController");
        tribeController = await TribeController.deploy(roleManager.target);
        await tribeController.waitForDeployment();

        const PointSystem = await ethers.getContractFactory("PointSystem");
        pointSystem = await PointSystem.deploy(roleManager.target, tribeController.target);
        await pointSystem.waitForDeployment();

        const CollectibleController = await ethers.getContractFactory("CollectibleController");
        collectibleController = await CollectibleController.deploy(
            roleManager.target,
            tribeController.target,
            pointSystem.target
        );
        await collectibleController.waitForDeployment();

        const PostMinter = await ethers.getContractFactory("PostMinter");
        postMinter = await PostMinter.deploy(
            roleManager.target,
            tribeController.target,
            collectibleController.target
        );
        await postMinter.waitForDeployment();

        // Setup roles
        await roleManager.grantRole(ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE")), admin.address);
        await roleManager.grantRole(ethers.keccak256(ethers.toUtf8Bytes("MODERATOR_ROLE")), moderator.address);
        await roleManager.grantRole(ethers.keccak256(ethers.toUtf8Bytes("CREATOR_ROLE")), fundraiserCreator.address);

        // Create test tribe
        const tx = await tribeController.connect(admin).createTribe(
            "Fundraiser Test Tribe",
            JSON.stringify({ name: "Fundraiser Test Tribe", description: "A tribe for testing fundraisers" }),
            [admin.address, moderator.address, fundraiserCreator.address],
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
        await tribeController.connect(fundraiserCreator).joinTribe(tribeId);
        await tribeController.connect(contributor1).joinTribe(tribeId);
        await tribeController.connect(contributor2).joinTribe(tribeId);
        await tribeController.connect(bannedMember).joinTribe(tribeId);

        // Ban member
        await tribeController.connect(admin).banMember(tribeId, bannedMember.address);
    });

    describe("Fundraiser Creation Scenarios", function () {
        beforeEach(async function () {
            // Wait for rate limit cooldown before each test
            await ethers.provider.send("evm_increaseTime", [61]); // 61 seconds
            await ethers.provider.send("evm_mine", []);
        });

        it("Should create a standard fundraiser", async function () {
            const fundraiser = {
                title: "Community Garden Project",
                content: "Creating a sustainable garden for our local community",
                type: "FUNDRAISER",
                fundraiserDetails: {
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

            const tx = await postMinter.connect(fundraiserCreator).createPost(
                tribeId,
                JSON.stringify(replaceBigInts(fundraiser)),
                false,
                ethers.ZeroAddress,
                0
            );

            await expect(tx).to.emit(postMinter, "PostCreated");

            const postId = 0;
            const post = await postMinter.getPost(postId);
            const postData = JSON.parse(post.metadata);
            expect(postData.type).to.equal("FUNDRAISER");
            expect(postData.fundraiserDetails.target).to.equal(ethers.parseEther("1000").toString());
        });

        it("Should create fundraiser with multiple currencies", async function () {
            const currencies = ["ETH", "USDC", "TRIBE_TOKEN"];
            
            for (let i = 0; i < currencies.length; i++) {
                const currency = currencies[i];
                const fundraiser = {
                    title: `${currency} Fundraiser`,
                    content: `Testing ${currency} fundraising`,
                    type: "FUNDRAISER",
                    fundraiserDetails: {
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

                const tx = await postMinter.connect(fundraiserCreator).createPost(
                    tribeId,
                    JSON.stringify(replaceBigInts(fundraiser)),
                    false,
                    ethers.ZeroAddress,
                    0
                );

                await expect(tx).to.emit(postMinter, "PostCreated");
            }
        });

        it("Should create fundraiser with flexible durations", async function () {
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
                    type: "FUNDRAISER",
                    fundraiserDetails: {
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

                const tx = await postMinter.connect(fundraiserCreator).createPost(
                    tribeId,
                    JSON.stringify(replaceBigInts(fundraiser)),
                    false,
                    ethers.ZeroAddress,
                    0
                );

                await expect(tx).to.emit(postMinter, "PostCreated");
            }
        });

        it("Should handle different slab configurations", async function () {
            const slabConfigs = [
                // Minimal slabs
                [{ name: "Single", amount: ethers.parseEther("100") }],
                // Standard tiers
                [
                    { name: "Bronze", amount: ethers.parseEther("50") },
                    { name: "Silver", amount: ethers.parseEther("100") },
                    { name: "Gold", amount: ethers.parseEther("200") }
                ],
                // Extended tiers
                [
                    { name: "Early Bird", amount: ethers.parseEther("25") },
                    { name: "Bronze", amount: ethers.parseEther("50") },
                    { name: "Silver", amount: ethers.parseEther("100") },
                    { name: "Gold", amount: ethers.parseEther("200") },
                    { name: "Platinum", amount: ethers.parseEther("500") }
                ]
            ];

            for (let i = 0; i < slabConfigs.length; i++) {
                const slabs = slabConfigs[i];
                const fundraiser = {
                    title: `${slabs.length}-tier Fundraiser`,
                    content: "Testing different tier configurations",
                    type: "FUNDRAISER",
                    fundraiserDetails: {
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

                const tx = await postMinter.connect(fundraiserCreator).createPost(
                    tribeId,
                    JSON.stringify(replaceBigInts(fundraiser)),
                    false,
                    ethers.ZeroAddress,
                    0
                );

                await expect(tx).to.emit(postMinter, "PostCreated");
            }
        });
    });

    describe("Contribution Scenarios", function () {
        let fundraiserPostId: number;
        let fundraiserData: any;

        beforeEach(async function () {
            // Wait for any previous rate limits
            await ethers.provider.send("evm_increaseTime", [61]); // 61 seconds
            await ethers.provider.send("evm_mine", []);

            // Create a test fundraiser
            fundraiserData = {
                title: "Test Fundraiser",
                content: "Fundraiser for testing contributions",
                type: "FUNDRAISER",
                fundraiserDetails: {
                    target: ethers.parseEther("1000"),
                    currency: "ETH",
                    startDate: Math.floor(Date.now()/1000) + 60,
                    duration: 30 * 24 * 60 * 60,
                    slabs: [
                        { name: "Bronze", amount: ethers.parseEther("50") },
                        { name: "Silver", amount: ethers.parseEther("100") },
                        { name: "Gold", amount: ethers.parseEther("200") }
                    ],
                    contributions: {} // Initialize empty contributions tracking
                },
                createdAt: Math.floor(Date.now()/1000)
            };

            const tx = await postMinter.connect(fundraiserCreator).createPost(
                tribeId,
                JSON.stringify(replaceBigInts(fundraiserData)),
                false,
                ethers.ZeroAddress,
                0
            );

            const receipt = await tx.wait();
            const event = receipt?.logs.find(
                x => x instanceof EventLog && x.eventName === "PostCreated"
            ) as EventLog;
            fundraiserPostId = event ? Number(event.args[0]) : 0;

            // Wait for fundraiser to start
            await ethers.provider.send("evm_increaseTime", [61]);
            await ethers.provider.send("evm_mine", []);
        });

        it("Should simulate contribution through interaction", async function () {
            // Simulate contribution by interacting with post
            await postMinter.connect(contributor1).interactWithPost(
                fundraiserPostId,
                0 // LIKE type to simulate contribution
            );

            // Verify interaction was recorded
            const interactionCount = await postMinter.getInteractionCount(fundraiserPostId, 0);
            expect(interactionCount).to.equal(1);

            // Get post data to verify metadata
            const post = await postMinter.getPost(fundraiserPostId);
            expect(post.creator).to.equal(fundraiserCreator.address);
            expect(post.tribeId).to.equal(tribeId);
        });

        it("Should track multiple interactions", async function () {
            // Multiple users interacting
            const contributors = [contributor1, contributor2];
            
            for (const contributor of contributors) {
                await postMinter.connect(contributor).interactWithPost(
                    fundraiserPostId,
                    0 // LIKE type to simulate contribution
                );
            }

            // Verify total interactions
            const interactionCount = await postMinter.getInteractionCount(fundraiserPostId, 0);
            expect(interactionCount).to.equal(2);
        });

        it("Should prevent banned members from interacting", async function () {
            await expect(
                postMinter.connect(bannedMember).interactWithPost(
                    fundraiserPostId,
                    0 // LIKE type
                )
            ).to.be.revertedWith("Cannot view post");
        });

        it("Should prevent interactions with deleted fundraiser", async function () {
            // Delete the fundraiser post
            await postMinter.connect(fundraiserCreator).deletePost(fundraiserPostId);

            // Attempt to interact
            await expect(
                postMinter.connect(contributor1).interactWithPost(
                    fundraiserPostId,
                    0 // LIKE type
                )
            ).to.be.revertedWith("Post deleted");
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