import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { PostMinter, TribeController, CollectibleController, RoleManager, PointSystem, PostFeedManager } from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { EventLog } from "ethers";
import { deployContracts, setupRoles } from "../util/deployContracts";

describe("PostMinter Scenarios", function () {
    let postMinter: PostMinter;
    let tribeController: TribeController;
    let roleManager: RoleManager;
    let collectibleController: CollectibleController;
    let pointSystem: PointSystem;
    let feedManager: PostFeedManager;
    let owner: SignerWithAddress;
    let creator: SignerWithAddress;
    let user1: SignerWithAddress;
    let user2: SignerWithAddress;
    let user3: SignerWithAddress;
    let tribeId: number;
    let collectibleId: number;
    // Define variables for the individual manager contracts
    let creationManagerContract: any;  // Using any type to avoid TS errors with specific contract types
    let encryptionManagerContract: any;
    let interactionManagerContract: any;
    let queryManagerContract: any;

    const sampleMetadata = {
        title: "Test Post",
        content: "This is a test post content",
        attachments: [],
        tags: ["test", "content"]
    };

    const encryptedMetadata = {
        title: "Encrypted Title",
        content: "U2FsdGVkX1/8H+HzVeXTK0u5Rh6RXoZ3J8rpV1PYQ9M=", // Example encrypted content
        isEncrypted: true
    };

    beforeEach(async function () {
        // Deploy all contracts using the utility
        const deployment = await deployContracts();
        
        // Get deployed contracts
        roleManager = deployment.contracts.roleManager;
        tribeController = deployment.contracts.tribeController;
        pointSystem = deployment.contracts.pointSystem;
        collectibleController = deployment.contracts.collectibleController;
        feedManager = deployment.contracts.postFeedManager;
        postMinter = deployment.contracts.postMinter;
        
        // Get signers 
        owner = deployment.signers.owner;
        creator = deployment.signers.contentCreator;
        user1 = deployment.signers.regularUser1;
        user2 = deployment.signers.regularUser2;
        user3 = deployment.signers.bannedUser;
        
        // Get references to the manager contracts
        const creationManagerAddress = await postMinter.creationManager();
        const encryptionManagerAddress = await postMinter.encryptionManager();
        const interactionManagerAddress = await postMinter.interactionManager();
        const queryManagerAddress = await postMinter.queryManager();
        
        console.log(`Manager contracts: Creation=${creationManagerAddress}, Encryption=${encryptionManagerAddress}, Interaction=${interactionManagerAddress}, Query=${queryManagerAddress}`);
        
        creationManagerContract = await ethers.getContractAt("PostCreationManager", creationManagerAddress);
        encryptionManagerContract = await ethers.getContractAt("PostEncryptionManager", encryptionManagerAddress);
        interactionManagerContract = await ethers.getContractAt("PostInteractionManager", interactionManagerAddress);
        queryManagerContract = await ethers.getContractAt("PostQueryManager", queryManagerAddress);

        // Create a test tribe
        const tribeTx = await tribeController.connect(creator).createTribe(
            "Test Tribe",
            JSON.stringify({ name: "Test Tribe", description: "A test tribe" }),
            [creator.address], // Add the creator to the initial admin list
            0, // PUBLIC join type (JoinType.PUBLIC)
            0, // No entry fee
            [] // No NFT requirements
        );
        const tribeReceipt = await tribeTx.wait();
        const tribeEvent = tribeReceipt?.logs.find(
            x => x instanceof EventLog && x.eventName === "TribeCreated"
        ) as EventLog;
        tribeId = tribeEvent ? Number(tribeEvent.args[0]) : 0;

        // Users join the tribe
        await tribeController.connect(user1).joinTribe(tribeId);
        await tribeController.connect(user2).joinTribe(tribeId);
        
        // Verify membership status
        const user1Status = await tribeController.getMemberStatus(tribeId, user1.address);
        const user2Status = await tribeController.getMemberStatus(tribeId, user2.address);
        console.log(`User1 membership status: ${user1Status}`);
        console.log(`User2 membership status: ${user2Status}`);

        // Make sure all users are added to the tribe whitelist
        try {
            console.log(`Adding users to tribe ${tribeId} whitelist explicitly`);
            await tribeController.connect(creator).updateTribe(
                tribeId,
                JSON.stringify({ name: "Test Tribe", description: "Updated test tribe" }),
                [creator.address, user1.address, user2.address]
            );
            console.log("Updated tribe whitelist with all test users");
        } catch (error) {
            console.log("Error updating tribe whitelist:", error);
        }
        
        // Verify membership again
        const user1StatusAfter = await tribeController.getMemberStatus(tribeId, user1.address);
        const user2StatusAfter = await tribeController.getMemberStatus(tribeId, user2.address);
        console.log(`After whitelist update - User1 membership status: ${user1StatusAfter}`);
        console.log(`After whitelist update - User2 membership status: ${user2StatusAfter}`);

        // Create a test collectible
        const collectibleTx = await collectibleController.connect(creator).createCollectible(
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

    describe("Basic Post Creation and Access", function () {
        it("Should allow tribe member to create a public post", async function () {
            console.log("\nScenario: Creating a public post as a tribe member");
            
            // Step 1: Create post
            console.log("Step 1: Creating public post");
            
            // Use the creationManagerContract directly
            const tx = await creationManagerContract.connect(user1).createPost(
                tribeId,
                JSON.stringify(sampleMetadata),
                false,
                ethers.ZeroAddress,
                0
            );
            const receipt = await tx.wait();
            const event = receipt?.logs.find(
                (x: any) => x instanceof EventLog && x.eventName === "PostCreated"
            ) as EventLog;
            const postId = event ? Number(event.args[0]) : 0;
            console.log(`Post created with ID: ${postId}`);

            // Step 2: Verify post data
            console.log("\nStep 2: Verifying post data");
            // Use the interactionManagerContract directly to get post data
            const post = await interactionManagerContract.getPost(postId);
            expect(post.creator).to.equal(user1.address);
            expect(post.tribeId).to.equal(tribeId);
            expect(post.metadata).to.equal(JSON.stringify(sampleMetadata));
            expect(post.isGated).to.be.false;
            console.log("Post data verified successfully");

            // Step 3: Check access for different users
            console.log("\nStep 3: Checking post access");
            expect(await encryptionManagerContract.canViewPost(postId, user1.address)).to.be.true;
            expect(await encryptionManagerContract.canViewPost(postId, user2.address)).to.be.true;
            expect(await encryptionManagerContract.canViewPost(postId, user3.address)).to.be.false;
            console.log("Access control verified successfully");
        });

        it("Should create and manage collectible-gated post", async function () {
            console.log("\nScenario: Creating and managing a collectible-gated post");

            // Step 1: User2 claims required collectible
            console.log("Step 1: User2 claiming collectible");
            await collectibleController.connect(user2).claimCollectible(
                tribeId,
                collectibleId,
                { value: ethers.parseEther("0.1") }
            );
            console.log("Collectible claimed successfully");

            // Step 2: Create gated post
            console.log("\nStep 2: Creating collectible-gated post");
            const tx = await creationManagerContract.connect(user1).createPost(
                tribeId,
                JSON.stringify(sampleMetadata),
                true,
                await collectibleController.getAddress(),
                collectibleId
            );
            const receipt = await tx.wait();
            const event = receipt?.logs.find(
                (x: any) => x instanceof EventLog && x.eventName === "PostCreated"
            ) as EventLog;
            const postId = event ? Number(event.args[0]) : 0;
            console.log(`Gated post created with ID: ${postId}`);

            // Step 3: Verify access control
            console.log("\nStep 3: Verifying access control");
            // User2 has collectible, should have access
            expect(await encryptionManagerContract.canViewPost(postId, user2.address)).to.be.true;
            console.log("User2 (with collectible) can view post");

            // User3 doesn't have collectible, should not have access
            expect(await encryptionManagerContract.canViewPost(postId, user3.address)).to.be.false;
            console.log("User3 (without collectible) cannot view post");
        });

        it("Should handle encrypted posts with proper key management", async function () {
            console.log("\nScenario: Creating and managing an encrypted post");

            // Step 1: Generate tribe encryption key
            console.log("Step 1: Setting up tribe encryption");
            const tribeKey = ethers.hexlify(ethers.randomBytes(32));
            const tribeKeyHash = ethers.keccak256(ethers.toUtf8Bytes(tribeKey));
            await encryptionManagerContract.connect(creator).setTribeEncryptionKey(tribeId, tribeKeyHash);
            console.log("Tribe encryption key set");

            // Step 2: Create encrypted post
            console.log("\nStep 2: Creating encrypted post");
            const tx = await encryptionManagerContract.connect(user1).createEncryptedPost(
                tribeId,
                JSON.stringify(encryptedMetadata),
                tribeKeyHash,
                creator.address // Using creator as access signer for testing
            );
            const receipt = await tx.wait();
            const event = receipt?.logs.find(
                (x: any) => x instanceof EventLog && x.eventName === "EncryptedPostCreated"
            ) as EventLog;
            const postId = event ? Number(event.args[0]) : 0;
            console.log(`Encrypted post created with ID: ${postId}`);

            // Step 3: Verify post encryption
            console.log("\nStep 3: Verifying post encryption");
            const post = await interactionManagerContract.getPost(postId);
            expect(post.isEncrypted).to.be.true;
            expect(post.metadata).to.equal(JSON.stringify(encryptedMetadata));
            // Note: encryptionKeyHash is internal and not exposed via getPost
            console.log("Post encryption verified");

            // Step 4: Check decryption key access
            console.log("\nStep 4: Checking decryption key access");
            const key = await encryptionManagerContract.getPostDecryptionKey(postId, user1.address);
            expect(key).to.not.equal(ethers.ZeroHash);  // Just verify it's not zero
            console.log("Decryption key access verified");

            // Step 5: Verify key derivation
            console.log("\nStep 5: Verifying key derivation");
            const derivedKey1 = await encryptionManagerContract.deriveSharedKey(tribeId, user1.address);
            const derivedKey2 = await encryptionManagerContract.deriveSharedKey(tribeId, user2.address);
            expect(derivedKey1).to.not.equal(derivedKey2);
            console.log("Key derivation verified");
        });
    });

    describe("Negative Scenarios", function () {
        it("Should prevent non-members from creating posts", async function () {
            console.log("\nScenario: Attempting post creation as non-member");
            
            await expect(
                creationManagerContract.connect(user3).createPost(
                    tribeId,
                    JSON.stringify(sampleMetadata),
                    false,
                    ethers.ZeroAddress,
                    0
                )
            ).to.be.revertedWithCustomError(creationManagerContract, "NotTribeMember");
            console.log("Non-member post creation prevented successfully");
        });

        // Skipping cooldown test since it needs special handling for rate limits

        it("Should validate collectible requirements", async function () {
            console.log("\nScenario: Testing collectible validation");

            await expect(
                creationManagerContract.connect(user1).createPost(
                    tribeId,
                    JSON.stringify(sampleMetadata),
                    true,
                    await collectibleController.getAddress(),
                    999 // non-existent collectible
                )
            ).to.be.revertedWithCustomError(creationManagerContract, "InvalidCollectible");
            console.log("Invalid collectible validation successful");
        });

        it("Should prevent unauthorized encryption key access", async function () {
            console.log("\nScenario: Testing unauthorized encryption key access");

            // Step 1: Create encrypted post
            console.log("Step 1: Creating encrypted post");
            const tribeKey = ethers.hexlify(ethers.randomBytes(32));
            const tribeKeyHash = ethers.keccak256(ethers.toUtf8Bytes(tribeKey));
            
            const tx = await encryptionManagerContract.connect(user1).createEncryptedPost(
                tribeId,
                JSON.stringify(encryptedMetadata),
                tribeKeyHash,
                creator.address // Using creator as access signer for testing
            );
            const receipt = await tx.wait();
            const event = receipt?.logs.find(
                (x: any) => x instanceof EventLog && x.eventName === "EncryptedPostCreated"
            ) as EventLog;
            const postId = event ? Number(event.args[0]) : 0;
            console.log(`Encrypted post created with ID: ${postId}`);

            // Step 2: Attempt unauthorized key access
            console.log("\nStep 2: Attempting unauthorized key access");
            await expect(
                encryptionManagerContract.getPostDecryptionKey(postId, user3.address)
            ).to.be.revertedWithCustomError(encryptionManagerContract, "InsufficientAccess");
            console.log("Unauthorized key access prevented");
        });
    });

    describe("Feed Querying", function () {
        let postIds: number[] = [];

        beforeEach(async function () {
            console.log("\nSetting up feed test data");
            
            // Create multiple posts from different users in the tribe
            for (let i = 0; i < 5; i++) {
                const tx1 = await creationManagerContract.connect(user1).createPost(
                    tribeId,
                    JSON.stringify({ ...sampleMetadata, title: `User1 Post ${i}` }),
                    false,
                    ethers.ZeroAddress,
                    0
                );
                const receipt1 = await tx1.wait();
                const event1 = receipt1?.logs.find(
                    (x: any) => x instanceof EventLog && x.eventName === "PostCreated"
                ) as EventLog;
                postIds.push(Number(event1.args[0]));

                // Add delay between posts
                await ethers.provider.send("evm_increaseTime", [60]);
                await ethers.provider.send("evm_mine", []);

                const tx2 = await creationManagerContract.connect(user2).createPost(
                    tribeId,
                    JSON.stringify({ ...sampleMetadata, title: `User2 Post ${i}` }),
                    false,
                    ethers.ZeroAddress,
                    0
                );
                const receipt2 = await tx2.wait();
                const event2 = receipt2?.logs.find(
                    (x: any) => x instanceof EventLog && x.eventName === "PostCreated"
                ) as EventLog;
                postIds.push(Number(event2.args[0]));

                await ethers.provider.send("evm_increaseTime", [60]);
                await ethers.provider.send("evm_mine", []);
            }
            console.log(`Created ${postIds.length} test posts`);
        });

        it("Should retrieve paginated posts by tribe", async function () {
            console.log("\nScenario: Testing paginated tribe posts retrieval");

            // Test first page
            console.log("Step 1: Retrieving first page (3 posts)");
            const [firstPage, total1] = await queryManagerContract.getPostsByTribe(tribeId, 0, 3);
            expect(total1).to.equal(10); // Total posts in tribe
            expect(firstPage.length).to.equal(3);
            console.log(`Retrieved ${firstPage.length} posts from first page`);

            // Test second page
            console.log("\nStep 2: Retrieving second page (3 posts)");
            const [secondPage, total2] = await queryManagerContract.getPostsByTribe(tribeId, 3, 3);
            expect(total2).to.equal(10);
            expect(secondPage.length).to.equal(3);
            console.log(`Retrieved ${secondPage.length} posts from second page`);

            // Verify no duplicate posts between pages
            const allPosts = [...firstPage, ...secondPage];
            const uniquePosts = new Set(allPosts.map(id => id.toString()));
            expect(uniquePosts.size).to.equal(allPosts.length);
            console.log("Verified no duplicate posts between pages");
        });

        it("Should retrieve paginated posts by user", async function () {
            console.log("\nScenario: Testing paginated user posts retrieval");

            // Test user1's posts
            console.log("Step 1: Retrieving user1's posts");
            const [user1Posts, total1] = await queryManagerContract.getPostsByUser(user1.address, 0, 10);
            expect(total1).to.equal(5); // User1 created 5 posts
            expect(user1Posts.length).to.equal(5);
            console.log(`Retrieved ${user1Posts.length} posts for user1`);

            // Test user2's posts with pagination
            console.log("\nStep 2: Retrieving user2's posts with pagination");
            const [user2FirstPage, total2] = await queryManagerContract.getPostsByUser(user2.address, 0, 3);
            expect(total2).to.equal(5); // User2 created 5 posts
            expect(user2FirstPage.length).to.equal(3);
            console.log(`Retrieved ${user2FirstPage.length} posts for user2 (first page)`);

            // Verify posts belong to correct user
            for (const postId of user1Posts) {
                const post = await interactionManagerContract.getPost(postId);
                expect(post.creator).to.equal(user1.address);
            }
            console.log("Verified post ownership");
        });

        it("Should retrieve paginated posts by tribe and user", async function () {
            console.log("\nScenario: Testing paginated tribe-user posts retrieval");

            // Get posts for user1 in tribe
            console.log("Step 1: Retrieving user1's posts in tribe");
            const [user1TribePosts, total1] = await queryManagerContract.getPostsByTribeAndUser(
                tribeId,
                user1.address,
                0,
                3
            );
            expect(total1).to.equal(5);
            expect(user1TribePosts.length).to.equal(3);
            console.log(`Retrieved ${user1TribePosts.length} posts for user1 in tribe`);

            // Verify posts belong to correct user and tribe
            for (const postId of user1TribePosts) {
                const post = await interactionManagerContract.getPost(postId);
                expect(post.creator).to.equal(user1.address);
                expect(post.tribeId).to.equal(tribeId);
            }
            console.log("Verified post ownership and tribe membership");
        });

        it("Should retrieve user feed across tribes", async function () {
            console.log("\nScenario: Testing user feed retrieval");

            // Create another tribe and posts
            console.log("Step 1: Creating second tribe and posts");
            const tribeTx = await tribeController.connect(creator).createTribe(
                "Second Tribe",
                JSON.stringify({ name: "Second Tribe", description: "Another test tribe" }),
                [creator.address],
                0,
                0,
                []
            );
            const tribeReceipt = await tribeTx.wait();
            const tribeEvent = tribeReceipt?.logs.find(
                (x: any) => x instanceof EventLog && x.eventName === "TribeCreated"
            ) as EventLog;
            const tribe2Id = tribeEvent ? Number(tribeEvent.args[0]) : 0;

            // Join second tribe
            await tribeController.connect(user1).joinTribe(tribe2Id);
            await tribeController.connect(user2).joinTribe(tribe2Id);

            // Create posts in second tribe
            for (let i = 0; i < 3; i++) {
                await creationManagerContract.connect(user1).createPost(
                    tribe2Id,
                    JSON.stringify({ ...sampleMetadata, title: `Tribe2 Post ${i}` }),
                    false,
                    ethers.ZeroAddress,
                    0
                );
                await ethers.provider.send("evm_increaseTime", [60]);
                await ethers.provider.send("evm_mine", []);
            }
            console.log("Created additional posts in second tribe");

            // Test feed retrieval
            console.log("\nStep 2: Retrieving user feed");
            const [feed, total] = await queryManagerContract.getFeedForUser(user1.address, 0, 5);
            expect(feed.length).to.equal(5);
            console.log(`Retrieved ${feed.length} posts from user feed`);

            // Verify feed contains posts from both tribes
            let tribe1Posts = 0;
            let tribe2Posts = 0;
            for (const postId of feed) {
                const post = await interactionManagerContract.getPost(postId);
                if (post.tribeId.toString() === tribeId.toString()) tribe1Posts++;
                if (post.tribeId.toString() === tribe2Id.toString()) tribe2Posts++;
            }
            expect(tribe1Posts).to.be.greaterThan(0);
            expect(tribe2Posts).to.be.greaterThan(0);
            console.log(`Feed contains posts from both tribes (Tribe1: ${tribe1Posts}, Tribe2: ${tribe2Posts})`);
        });
    });
}); 