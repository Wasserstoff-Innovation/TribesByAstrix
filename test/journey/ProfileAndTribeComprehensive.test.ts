import { expect } from "chai";
import { ethers } from "hardhat";
import { 
    RoleManager, 
    TribeController, 
    CollectibleController,
    PostMinter,
    ProfileNFTMinter,
    PointSystem
} from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { EventLog } from "ethers";
import chalk from "chalk";

/**
 * This test demonstrates comprehensive user profiles, tribes, and posts interactions
 * with both positive and negative flows:
 * 1. Profile Creation & Validation
 * 2. Tribe Management
 * 3. Combined User Journeys
 */
describe(chalk.blue("User Profile & Tribe Comprehensive Flows"), function () {
    // Contract instances
    let roleManager: RoleManager;
    let tribeController: TribeController;
    let collectibleController: CollectibleController;
    let postMinter: PostMinter;
    let profileNFTMinter: ProfileNFTMinter;
    let pointSystem: PointSystem;
    let feedManager: any; // Use any type for now since it's not in typechain yet

    // User accounts to simulate different roles
    let owner: SignerWithAddress;
    let admin: SignerWithAddress;
    let creator: SignerWithAddress;
    let user1: SignerWithAddress;
    let user2: SignerWithAddress;
    let user3: SignerWithAddress;

    // Store IDs for reference
    let tribeId: number;
    let collectibleId: number;
    let user1ProfileId: number;
    let user2ProfileId: number;

    // Constants for role hashes
    const DEFAULT_ADMIN_ROLE = ethers.ZeroHash;
    const ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE"));
    const MODERATOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MODERATOR_ROLE"));
    const PROJECT_CREATOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("PROJECT_CREATOR_ROLE"));

    beforeEach(async function () {
        // Get signers for different user roles
        [owner, admin, creator, user1, user2, user3] = await ethers.getSigners();

        // Deploy RoleManager
        const RoleManager = await ethers.getContractFactory("RoleManager");
        roleManager = await RoleManager.deploy();
        await roleManager.waitForDeployment();
        console.log(chalk.green("✓ RoleManager deployed"));

        // Deploy ProfileNFTMinter
        const ProfileNFTMinter = await ethers.getContractFactory("ProfileNFTMinter");
        profileNFTMinter = await ProfileNFTMinter.deploy(await roleManager.getAddress());
        await profileNFTMinter.waitForDeployment();
        console.log(chalk.green("✓ ProfileNFTMinter deployed"));

        // Deploy TribeController
        const TribeController = await ethers.getContractFactory("TribeController");
        tribeController = await TribeController.deploy(await roleManager.getAddress());
        await tribeController.waitForDeployment();
        console.log(chalk.green("✓ TribeController deployed"));

        // Deploy PointSystem
        const PointSystem = await ethers.getContractFactory("PointSystem");
        pointSystem = await PointSystem.deploy(
            await roleManager.getAddress(),
            await tribeController.getAddress()
        );
        await pointSystem.waitForDeployment();
        console.log(chalk.green("✓ PointSystem deployed"));

        // Deploy CollectibleController
        const CollectibleController = await ethers.getContractFactory("CollectibleController");
        collectibleController = await CollectibleController.deploy(
            await roleManager.getAddress(),
            await tribeController.getAddress(),
            await pointSystem.getAddress()
        );
        await collectibleController.waitForDeployment();
        console.log(chalk.green("✓ CollectibleController deployed"));

        // Deploy PostFeedManager
        const PostFeedManager = await ethers.getContractFactory("PostFeedManager");
        feedManager = await PostFeedManager.deploy(await tribeController.getAddress());
        await feedManager.waitForDeployment();
        console.log(chalk.green("✓ PostFeedManager deployed"));

        // Deploy PostMinter
        const PostMinter = await ethers.getContractFactory("PostMinter");
        postMinter = await PostMinter.deploy(
            await roleManager.getAddress(),
            await tribeController.getAddress(),
            await collectibleController.getAddress(),
            await feedManager.getAddress()
        );
        await postMinter.waitForDeployment();
        console.log(chalk.green("✓ PostMinter deployed"));

        // Grant admin role to PostMinter in PostFeedManager
        await feedManager.grantRole(await feedManager.DEFAULT_ADMIN_ROLE(), await postMinter.getAddress());
        console.log(chalk.green("✓ Permissions configured"));

        // Setup roles
        await roleManager.grantRole(ADMIN_ROLE, admin.address);
        await roleManager.grantRole(MODERATOR_ROLE, creator.address);
        await roleManager.grantRole(PROJECT_CREATOR_ROLE, creator.address);
        console.log(chalk.green("✓ Roles assigned"));
    });

    describe(chalk.magenta("1. Profile Creation & Validation"), function () {
        it("Should create a valid user profile", async function () {
            console.log(chalk.cyan("\n=== User Profile Creation Flow ==="));
            
            // Create profile for user1
            console.log(chalk.yellow("Creating profile for user1..."));
            const user1Metadata = {
                name: "John Doe",
                bio: "Blockchain developer and enthusiast",
                avatar: "ipfs://QmUser1Avatar",
                links: {
                    twitter: "@john_doe_web3",
                    github: "johndoe-web3"
                }
            };

            const tx = await profileNFTMinter.connect(user1).createProfile(
                "johndoe",
                JSON.stringify(user1Metadata)
            );

            const receipt = await tx.wait();
            const event = receipt?.logs.find(
                x => x instanceof EventLog && x.eventName === "ProfileCreated"
            ) as EventLog;
            
            user1ProfileId = event ? Number(event.args[0]) : 0;
            
            console.log(chalk.green(`✓ Profile created with ID: ${user1ProfileId}`));

            // Verify profile data
            const profileData = await profileNFTMinter.getProfileByTokenId(user1ProfileId);
            expect(profileData[0]).to.equal("johndoe"); // username
            expect(profileData[2]).to.equal(user1.address); // owner

            // Verify token ownership
            expect(await profileNFTMinter.ownerOf(user1ProfileId)).to.equal(user1.address);
        });

        it("Should prevent creating a profile with duplicate username", async function () {
            console.log(chalk.cyan("\n=== Duplicate Username Prevention ==="));
            
            // First create a profile with 'testuser' username
            console.log(chalk.yellow("Creating first profile with 'testuser' username..."));
            const metadata = {
                name: "Test User",
                bio: "Original test user"
            };

            await profileNFTMinter.connect(user1).createProfile(
                "testuser",
                JSON.stringify(metadata)
            );

            // Attempt to create another profile with the same username
            console.log(chalk.yellow("Attempting to create second profile with same username..."));
            const metadata2 = {
                name: "Another Test User",
                bio: "Duplicate username attempt"
            };

            await expect(
                profileNFTMinter.connect(user2).createProfile(
                    "testuser",
                    JSON.stringify(metadata2)
                )
            ).to.be.revertedWith("Username already taken");
            
            console.log(chalk.green("✓ Duplicate username properly rejected"));
        });

        it("Should validate username format requirements", async function () {
            console.log(chalk.cyan("\n=== Username Format Validation ==="));
            
            console.log(chalk.yellow("Testing various invalid usernames..."));
            
            // Test too short username
            await expect(
                profileNFTMinter.connect(user1).createProfile(
                    "ab", // Too short (less than 3 chars)
                    JSON.stringify({name: "Test User"})
                )
            ).to.be.revertedWith("Invalid username");
            
            // Test too long username
            const longUsername = "thisusernameiswaytooooooooooooooooooolong";
            await expect(
                profileNFTMinter.connect(user1).createProfile(
                    longUsername, // Too long (more than 32 chars)
                    JSON.stringify({name: "Test User"})
                )
            ).to.be.revertedWith("Invalid username");
            
            // Test invalid characters
            await expect(
                profileNFTMinter.connect(user1).createProfile(
                    "user@name", // Contains @
                    JSON.stringify({name: "Test User"})
                )
            ).to.be.revertedWith("Invalid username");
            
            // Test valid username with allowed special chars
            const validTx = await profileNFTMinter.connect(user1).createProfile(
                "valid_user-123",
                JSON.stringify({name: "Valid User"})
            );
            const validReceipt = await validTx.wait();
            
            console.log(chalk.green("✓ Username validation properly enforced"));
        });

        it("Should allow user to update their profile metadata", async function () {
            console.log(chalk.cyan("\n=== Profile Metadata Update ==="));
            
            // First create a profile
            console.log(chalk.yellow("Creating initial profile..."));
            const initialMetadata = {
                name: "Initial Name",
                bio: "Initial bio"
            };

            const tx = await profileNFTMinter.connect(user1).createProfile(
                "updateuser",
                JSON.stringify(initialMetadata)
            );

            const receipt = await tx.wait();
            const event = receipt?.logs.find(
                x => x instanceof EventLog && x.eventName === "ProfileCreated"
            ) as EventLog;
            
            const profileId = event ? Number(event.args[0]) : 0;
            
            // Now update the profile metadata
            console.log(chalk.yellow("Updating profile metadata..."));
            const updatedMetadata = {
                name: "Updated Name",
                bio: "Updated bio with more information",
                avatar: "ipfs://QmNewAvatar",
                banner: "ipfs://QmNewBanner",
                links: {
                    twitter: "@updated_handle",
                    website: "https://example.com"
                }
            };

            await profileNFTMinter.connect(user1).updateProfileMetadata(
                profileId,
                JSON.stringify(updatedMetadata)
            );
            
            // Verify the update
            const profileData = await profileNFTMinter.getProfileByTokenId(profileId);
            expect(profileData[1]).to.include("Updated Name"); // The tokenURI should contain the updated metadata
            
            console.log(chalk.green("✓ Profile metadata successfully updated"));
        });

        it("Should prevent unauthorized metadata updates", async function () {
            console.log(chalk.cyan("\n=== Unauthorized Update Prevention ==="));
            
            // First create a profile for user1
            console.log(chalk.yellow("Creating profile owned by user1..."));
            const metadata = {
                name: "User One",
                bio: "Profile owner"
            };

            const tx = await profileNFTMinter.connect(user1).createProfile(
                "userone",
                JSON.stringify(metadata)
            );

            const receipt = await tx.wait();
            const event = receipt?.logs.find(
                x => x instanceof EventLog && x.eventName === "ProfileCreated"
            ) as EventLog;
            
            const profileId = event ? Number(event.args[0]) : 0;
            
            // Attempt to update from user2 (not the owner)
            console.log(chalk.yellow("Attempting unauthorized update from user2..."));
            const updatedMetadata = {
                name: "Hacked Name",
                bio: "This update should fail"
            };

            await expect(
                profileNFTMinter.connect(user2).updateProfileMetadata(
                    profileId,
                    JSON.stringify(updatedMetadata)
                )
            ).to.be.revertedWith("Not token owner");
            
            console.log(chalk.green("✓ Unauthorized update properly rejected"));
        });
    });

    describe(chalk.magenta("2. Tribe Management"), function () {
        it("Should create different types of tribes", async function () {
            console.log(chalk.cyan("\n=== Tribe Creation with Different Join Types ==="));
            
            // 1. Create a public tribe
            console.log(chalk.yellow("Creating public tribe..."));
            const publicTribeMetadata = {
                name: "Public Community",
                description: "A public tribe anyone can join",
                avatar: "ipfs://QmPublicAvatar",
                banner: "ipfs://QmPublicBanner",
                category: "General"
            };

            const publicTx = await tribeController.connect(creator).createTribe(
                "Public Community",
                JSON.stringify(publicTribeMetadata),
                [creator.address], // Admin
                0, // PUBLIC
                0, // No entry fee
                [] // No NFT requirements
            );

            const publicReceipt = await publicTx.wait();
            const publicEvent = publicReceipt?.logs.find(
                x => x instanceof EventLog && x.eventName === "TribeCreated"
            ) as EventLog;
            
            const publicTribeId = publicEvent ? Number(publicEvent.args[0]) : 0;
            
            // Verify tribe config
            const publicConfig = await tribeController.getTribeConfigView(publicTribeId);
            expect(publicConfig.joinType).to.equal(0); // PUBLIC
            
            // 2. Create a private tribe
            console.log(chalk.yellow("Creating private tribe..."));
            const privateTribeMetadata = {
                name: "Private Community",
                description: "A private tribe requiring approval",
                avatar: "ipfs://QmPrivateAvatar",
                category: "Exclusive"
            };

            const privateTx = await tribeController.connect(creator).createTribe(
                "Private Community",
                JSON.stringify(privateTribeMetadata),
                [creator.address], // Admin
                1, // PRIVATE
                ethers.parseEther("0.1"), // Entry fee
                [] // No NFT requirements
            );

            const privateReceipt = await privateTx.wait();
            const privateEvent = privateReceipt?.logs.find(
                x => x instanceof EventLog && x.eventName === "TribeCreated"
            ) as EventLog;
            
            const privateTribeId = privateEvent ? Number(privateEvent.args[0]) : 0;
            
            // Verify tribe config
            const privateConfig = await tribeController.getTribeConfigView(privateTribeId);
            expect(privateConfig.joinType).to.equal(1); // PRIVATE
            expect(privateConfig.entryFee).to.equal(ethers.parseEther("0.1"));
            
            // 3. Create an invite-only tribe
            console.log(chalk.yellow("Creating invite-only tribe..."));
            const inviteTribeMetadata = {
                name: "Invite Only Community",
                description: "A tribe requiring invitation",
                category: "Exclusive"
            };

            const inviteTx = await tribeController.connect(creator).createTribe(
                "Invite Only Community",
                JSON.stringify(inviteTribeMetadata),
                [creator.address], // Admin
                2, // INVITE_ONLY
                0, // No entry fee
                [] // No NFT requirements
            );

            const inviteReceipt = await inviteTx.wait();
            const inviteEvent = inviteReceipt?.logs.find(
                x => x instanceof EventLog && x.eventName === "TribeCreated"
            ) as EventLog;
            
            const inviteTribeId = inviteEvent ? Number(inviteEvent.args[0]) : 0;
            
            // Verify tribe config
            const inviteConfig = await tribeController.getTribeConfigView(inviteTribeId);
            expect(inviteConfig.joinType).to.equal(2); // INVITE_ONLY
            
            console.log(chalk.green("✓ Successfully created tribes with different join types"));
            
            // Save public tribe ID for other tests
            tribeId = publicTribeId;
        });

        it("Should allow updating tribe configuration", async function () {
            console.log(chalk.cyan("\n=== Tribe Configuration Update ==="));
            
            // First create a tribe
            console.log(chalk.yellow("Creating initial public tribe..."));
            const initialMetadata = {
                name: "Update Test Tribe",
                description: "A tribe for testing updates"
            };

            const createTx = await tribeController.connect(creator).createTribe(
                "Update Test Tribe",
                JSON.stringify(initialMetadata),
                [creator.address], // Admin
                0, // PUBLIC
                0, // No entry fee
                [] // No NFT requirements
            );

            const createReceipt = await createTx.wait();
            const createEvent = createReceipt?.logs.find(
                x => x instanceof EventLog && x.eventName === "TribeCreated"
            ) as EventLog;
            
            const updateTribeId = createEvent ? Number(createEvent.args[0]) : 0;
            
            // Update the tribe to be private with entry fee
            console.log(chalk.yellow("Updating tribe to be private with entry fee..."));
            await tribeController.connect(creator).updateTribeConfig(
                updateTribeId,
                1, // PRIVATE
                ethers.parseEther("0.05"), // Entry fee
                [] // No NFT requirements
            );
            
            // Verify the update
            const updatedConfig = await tribeController.getTribeConfigView(updateTribeId);
            expect(updatedConfig.joinType).to.equal(1); // PRIVATE
            expect(updatedConfig.entryFee).to.equal(ethers.parseEther("0.05"));
            
            // Update the tribe metadata
            console.log(chalk.yellow("Updating tribe metadata..."));
            const updatedMetadata = {
                name: "Updated Tribe",
                description: "This tribe has been updated",
                avatar: "ipfs://QmUpdatedAvatar",
                guidelines: "New guidelines for the tribe"
            };
            
            await tribeController.connect(creator).updateTribe(
                updateTribeId,
                JSON.stringify(updatedMetadata),
                [creator.address, admin.address] // Updated whitelist
            );
            
            console.log(chalk.green("✓ Tribe configuration successfully updated"));
        });

        it("Should handle different tribe joining flows", async function () {
            console.log(chalk.cyan("\n=== Tribe Joining Flows ==="));
            
            // Create different tribes for testing joining flows
            // 1. Public tribe
            console.log(chalk.yellow("Setting up public tribe..."));
            const publicTribeTx = await tribeController.connect(creator).createTribe(
                "Join Test - Public",
                JSON.stringify({name: "Join Test - Public"}),
                [creator.address],
                0, // PUBLIC
                0, // No fee
                []
            );
            
            const publicTribeReceipt = await publicTribeTx.wait();
            const publicTribeEvent = publicTribeReceipt?.logs.find(
                x => x instanceof EventLog && x.eventName === "TribeCreated"
            ) as EventLog;
            
            const publicTribeId = publicTribeEvent ? Number(publicTribeEvent.args[0]) : 0;
            
            // 2. Private tribe
            console.log(chalk.yellow("Setting up private tribe..."));
            const privateTribeTx = await tribeController.connect(creator).createTribe(
                "Join Test - Private",
                JSON.stringify({name: "Join Test - Private"}),
                [creator.address],
                1, // PRIVATE
                ethers.parseEther("0.1"), // Entry fee
                []
            );
            
            const privateTribeReceipt = await privateTribeTx.wait();
            const privateTribeEvent = privateTribeReceipt?.logs.find(
                x => x instanceof EventLog && x.eventName === "TribeCreated"
            ) as EventLog;
            
            const privateTribeId = privateTribeEvent ? Number(privateTribeEvent.args[0]) : 0;
            
            // 3. Invite code tribe
            console.log(chalk.yellow("Setting up invite code tribe..."));
            const inviteCodeTribeTx = await tribeController.connect(creator).createTribe(
                "Join Test - Invite Code",
                JSON.stringify({name: "Join Test - Invite Code"}),
                [creator.address],
                6, // INVITE_CODE
                0, // No fee
                []
            );
            
            const inviteCodeTribeReceipt = await inviteCodeTribeTx.wait();
            const inviteCodeTribeEvent = inviteCodeTribeReceipt?.logs.find(
                x => x instanceof EventLog && x.eventName === "TribeCreated"
            ) as EventLog;
            
            const inviteCodeTribeId = inviteCodeTribeEvent ? Number(inviteCodeTribeEvent.args[0]) : 0;
            
            // Create invite code
            console.log(chalk.yellow("Creating invite code..."));
            const inviteCode = "TEST123";
            await tribeController.connect(creator).createInviteCode(
                inviteCodeTribeId,
                inviteCode,
                5, // Max 5 uses
                Math.floor(Date.now()/1000) + 86400 // 1 day expiry
            );
            
            // Test joining flows
            // 1. Public tribe - direct join
            console.log(chalk.yellow("User1 joining public tribe..."));
            await tribeController.connect(user1).joinTribe(publicTribeId);
            
            expect(await tribeController.getMemberStatus(publicTribeId, user1.address))
                .to.equal(1); // ACTIVE
            
            // 2. Private tribe - request, then approval
            console.log(chalk.yellow("User1 requesting to join private tribe..."));
            await tribeController.connect(user1).requestToJoinTribe(
                privateTribeId, 
                { value: ethers.parseEther("0.1") }
            );
            
            expect(await tribeController.getMemberStatus(privateTribeId, user1.address))
                .to.equal(2); // PENDING
            
            console.log(chalk.yellow("Creator approving user1 for private tribe..."));
            await tribeController.connect(creator).approveMember(privateTribeId, user1.address);
            
            expect(await tribeController.getMemberStatus(privateTribeId, user1.address))
                .to.equal(1); // ACTIVE
                
            // 3. Invite code tribe - join with code
            console.log(chalk.yellow("User1 joining invite code tribe with code..."));
            const codeHash = ethers.keccak256(ethers.toUtf8Bytes(inviteCode));
            await tribeController.connect(user1).joinTribeWithCode(inviteCodeTribeId, codeHash);
            
            expect(await tribeController.getMemberStatus(inviteCodeTribeId, user1.address))
                .to.equal(1); // ACTIVE
            
            console.log(chalk.green("✓ Successfully tested different joining flows"));
        });

        it("Should properly enforce access control in tribe management", async function () {
            console.log(chalk.cyan("\n=== Tribe Management Access Control ==="));
            
            // Create test tribe
            console.log(chalk.yellow("Creating test tribe..."));
            const testTribeTx = await tribeController.connect(creator).createTribe(
                "Access Control Test",
                JSON.stringify({name: "Access Control Test"}),
                [creator.address],
                0, // PUBLIC
                0, // No fee
                []
            );
            
            const testTribeReceipt = await testTribeTx.wait();
            const testTribeEvent = testTribeReceipt?.logs.find(
                x => x instanceof EventLog && x.eventName === "TribeCreated"
            ) as EventLog;
            
            const testTribeId = testTribeEvent ? Number(testTribeEvent.args[0]) : 0;
            
            // Add some members
            await tribeController.connect(user1).joinTribe(testTribeId);
            await tribeController.connect(user2).joinTribe(testTribeId);
            
            // Test ban member (only admin should be able to)
            console.log(chalk.yellow("Testing member banning permissions..."));
            
            // User1 (non-admin) attempting to ban user2 should fail
            await expect(
                tribeController.connect(user1).banMember(testTribeId, user2.address)
            ).to.be.revertedWith("Not tribe admin");
            
            // Creator (admin) should be able to ban
            await tribeController.connect(creator).banMember(testTribeId, user2.address);
            expect(await tribeController.getMemberStatus(testTribeId, user2.address))
                .to.equal(3); // BANNED
            
            // Test updating configuration (only admin)
            console.log(chalk.yellow("Testing tribe configuration update permissions..."));
            
            // User1 (non-admin) attempting to update config should fail
            await expect(
                tribeController.connect(user1).updateTribeConfig(
                    testTribeId,
                    1, // PRIVATE
                    0,
                    []
                )
            ).to.be.revertedWith("Not tribe admin");
            
            // Admin should be able to update
            await tribeController.connect(creator).updateTribeConfig(
                testTribeId,
                1, // PRIVATE
                0,
                []
            );
            
            const updatedConfig = await tribeController.getTribeConfigView(testTribeId);
            expect(updatedConfig.joinType).to.equal(1); // PRIVATE
            
            console.log(chalk.green("✓ Tribe management access control properly enforced"));
        });
    });

    describe(chalk.magenta("3. Combined User Journeys"), function () {
        it("Should demonstrate complete user onboarding flow", async function () {
            console.log(chalk.cyan("\n=== Complete User Onboarding Journey ==="));
            
            // 1. User creates profile
            console.log(chalk.yellow("User2 creating profile..."));
            const profileMetadata = {
                name: "Alice Johnson",
                bio: "Web3 enthusiast and developer",
                avatar: "ipfs://QmAliceAvatar",
                banner: "ipfs://QmAliceBanner"
            };
            
            const profileTx = await profileNFTMinter.connect(user2).createProfile(
                "alice_johnson",
                JSON.stringify(profileMetadata)
            );
            
            const profileReceipt = await profileTx.wait();
            const profileEvent = profileReceipt?.logs.find(
                x => x instanceof EventLog && x.eventName === "ProfileCreated"
            ) as EventLog;
            
            user2ProfileId = profileEvent ? Number(profileEvent.args[0]) : 0;
            console.log(chalk.green(`✓ Profile created with ID: ${user2ProfileId}`));
            
            // 2. User creates a tribe
            console.log(chalk.yellow("User2 creating a tribe..."));
            const tribeMetadata = {
                name: "Alice's Web3 Community",
                description: "A community for Web3 enthusiasts and developers",
                avatar: "ipfs://QmTribeAvatar",
                category: "Technology",
                tags: ["web3", "development", "community"]
            };
            
            const tribeTx = await tribeController.connect(user2).createTribe(
                tribeMetadata.name,
                JSON.stringify(tribeMetadata),
                [user2.address], // Admin
                0, // PUBLIC
                0, // No fee
                []
            );
            
            const tribeReceipt = await tribeTx.wait();
            const tribeEvent = tribeReceipt?.logs.find(
                x => x instanceof EventLog && x.eventName === "TribeCreated"
            ) as EventLog;
            
            const aliceTribeId = tribeEvent ? Number(tribeEvent.args[0]) : 0;
            console.log(chalk.green(`✓ Tribe created with ID: ${aliceTribeId}`));
            
            // 3. User creates a welcome post
            console.log(chalk.yellow("User2 creating welcome post..."));
            const welcomePost = {
                type: "TEXT",
                title: "Welcome to Alice's Web3 Community!",
                content: "I'm excited to build this community together with all of you. Let's share ideas and learn from each other!",
                tags: ["welcome", "introduction"]
            };
            
            const postTx = await postMinter.connect(user2).createPost(
                aliceTribeId,
                JSON.stringify(welcomePost),
                false,
                ethers.ZeroAddress,
                0
            );
            
            const postReceipt = await postTx.wait();
            const postEvent = postReceipt?.logs.find(
                x => x instanceof EventLog && x.eventName === "PostCreated"
            ) as EventLog;
            
            const welcomePostId = postEvent ? Number(postEvent.args[0]) : 0;
            console.log(chalk.green(`✓ Welcome post created with ID: ${welcomePostId}`));
            
            // 4. Another user joins the tribe
            console.log(chalk.yellow("User1 joining Alice's tribe..."));
            await tribeController.connect(user1).joinTribe(aliceTribeId);
            
            expect(await tribeController.getMemberStatus(aliceTribeId, user1.address))
                .to.equal(1); // ACTIVE
            console.log(chalk.green("✓ User1 successfully joined the tribe"));
            
            // 5. User creates a collectible for the tribe
            console.log(chalk.yellow("User2 creating tribe collectible..."));
            const collectibleMetadata = {
                name: "Community Membership Badge",
                description: "Official member of Alice's Web3 Community",
                image: "ipfs://QmCollectibleImage"
            };
            
            const collectibleTx = await collectibleController.connect(user2).createCollectible(
                aliceTribeId,
                "Membership Badge",
                "BADGE",
                JSON.stringify(collectibleMetadata),
                100, // maxSupply
                0, // free
                0 // no points required
            );
            
            const collectibleReceipt = await collectibleTx.wait();
            const collectibleEvent = collectibleReceipt?.logs.find(
                x => x instanceof EventLog && x.eventName === "CollectibleCreated"
            ) as EventLog;
            
            const badgeId = collectibleEvent ? Number(collectibleEvent.args[0]) : 0;
            console.log(chalk.green(`✓ Collectible created with ID: ${badgeId}`));
            
            // 6. User responds to welcome post
            console.log(chalk.yellow("User1 interacting with welcome post..."));
            
            // Wait for rate limit
            await ethers.provider.send("evm_increaseTime", [61]);
            await ethers.provider.send("evm_mine", []);
            
            await postMinter.connect(user1).interactWithPost(welcomePostId, 0); // LIKE
            
            // Get like count
            const likes = await postMinter.getInteractionCount(welcomePostId, 0);
            expect(likes).to.equal(1);
            console.log(chalk.green("✓ Post interaction recorded"));
            
            console.log(chalk.green("\n✓ Complete user onboarding journey successfully demonstrated"));
        });

        it("Should handle error cases across the user journey", async function () {
            console.log(chalk.cyan("\n=== Error Handling Throughout User Journey ==="));
            
            // Create necessary test environment
            console.log(chalk.yellow("Setting up test environment..."));
            
            // 1. Create a profile for error testing
            console.log(chalk.yellow("Creating test profile..."));
            const profileTx = await profileNFTMinter.connect(user3).createProfile(
                "error_test_user",
                JSON.stringify({
                    name: "Error Test User",
                    bio: "Profile for testing error flows"
                })
            );
            
            const profileReceipt = await profileTx.wait();
            const profileEvent = profileReceipt?.logs.find(
                x => x instanceof EventLog && x.eventName === "ProfileCreated"
            ) as EventLog;
            
            const errorProfileId = profileEvent ? Number(profileEvent.args[0]) : 0;
            
            // 2. Create a tribe for error testing
            console.log(chalk.yellow("Creating test tribe..."));
            const tribeTx = await tribeController.connect(user3).createTribe(
                "Error Test Tribe",
                JSON.stringify({
                    name: "Error Test Tribe",
                    description: "A tribe for testing error cases"
                }),
                [user3.address],
                0, // PUBLIC
                0, // No fee
                []
            );
            
            const tribeReceipt = await tribeTx.wait();
            const tribeEvent = tribeReceipt?.logs.find(
                x => x instanceof EventLog && x.eventName === "TribeCreated"
            ) as EventLog;
            
            const errorTribeId = tribeEvent ? Number(tribeEvent.args[0]) : 0;
            
            // Test error scenarios in order of user journey
            
            // 1. Profile errors
            console.log(chalk.yellow("\nTesting profile error scenarios..."));
            
            // Attempt to update someone else's profile
            await expect(
                profileNFTMinter.connect(user1).updateProfileMetadata(
                    errorProfileId,
                    JSON.stringify({name: "Hacked name"})
                )
            ).to.be.revertedWith("Not token owner");
            console.log(chalk.green("✓ Unauthorized profile update properly rejected"));
            
            // 2. Tribe membership errors
            console.log(chalk.yellow("\nTesting tribe membership error scenarios..."));
            
            // Convert test tribe to private
            await tribeController.connect(user3).updateTribeConfig(
                errorTribeId,
                1, // PRIVATE
                ethers.parseEther("0.1"), // Entry fee
                []
            );
            
            // Attempt to join without payment
            await expect(
                tribeController.connect(user1).requestToJoinTribe(errorTribeId)
            ).to.be.revertedWith("Insufficient entry fee");
            console.log(chalk.green("✓ Missing entry fee properly rejected"));
            
            // Proper join request with payment
            await tribeController.connect(user1).requestToJoinTribe(
                errorTribeId,
                { value: ethers.parseEther("0.1") }
            );
            
            // First approve the member (change from PENDING to ACTIVE)
            await tribeController.connect(user3).approveMember(errorTribeId, user1.address);
            
            // Now ban the active member
            await tribeController.connect(user3).banMember(errorTribeId, user1.address);
            
            // Attempt to join after being banned
            await expect(
                tribeController.connect(user1).requestToJoinTribe(
                    errorTribeId,
                    { value: ethers.parseEther("0.1") }
                )
            ).to.be.revertedWith("User is banned");
            console.log(chalk.green("✓ Banned user properly rejected"));
            
            // 3. Post creation errors
            console.log(chalk.yellow("\nTesting post creation error scenarios..."));
            
            // Attempt to create post in tribe user isn't a member of
            await expect(
                postMinter.connect(user2).createPost(
                    errorTribeId,
                    JSON.stringify({
                        title: "Test",
                        content: "Content"
                    }),
                    false,
                    ethers.ZeroAddress,
                    0
                )
            ).to.be.revertedWithCustomError(postMinter, "NotTribeMember");
            console.log(chalk.green("✓ Non-member post creation properly rejected"));
            
            // User3 creates a post 
            const postTx = await postMinter.connect(user3).createPost(
                errorTribeId,
                JSON.stringify({
                    title: "Test Post",
                    content: "This is a test post"
                }),
                false,
                ethers.ZeroAddress,
                0
            );
            
            const postReceipt = await postTx.wait();
            const postEvent = postReceipt?.logs.find(
                x => x instanceof EventLog && x.eventName === "PostCreated"
            ) as EventLog;
            
            const errorPostId = postEvent ? Number(postEvent.args[0]) : 0;
            
            // Attempt to create post again immediately (cooldown)
            await expect(
                postMinter.connect(user3).createPost(
                    errorTribeId,
                    JSON.stringify({
                        title: "Second Post",
                        content: "This should fail"
                    }),
                    false,
                    ethers.ZeroAddress,
                    0
                )
            ).to.be.revertedWithCustomError(postMinter, "CooldownActive");
            console.log(chalk.green("✓ Post cooldown properly enforced"));
            
            console.log(chalk.green("\n✓ Error handling throughout user journey successfully demonstrated"));
        });
    });
}); 