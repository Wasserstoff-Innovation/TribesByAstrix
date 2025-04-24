import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { PostMinter, TribeController, CollectibleController, RoleManager, PostFeedManager } from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { EventLog } from "ethers";
import { deployContracts } from "../util/deployContracts";

describe("PostMinter Cooldown Test", function () {
    let postMinter: PostMinter;
    let tribeController: TribeController;
    let roleManager: RoleManager;
    let collectibleController: CollectibleController;
    let feedManager: PostFeedManager;
    let owner: SignerWithAddress;
    let creator: SignerWithAddress;
    let user1: SignerWithAddress;
    let user2: SignerWithAddress;
    let user3: SignerWithAddress;
    let tribeId: number;
    // Define variables for the individual manager contracts
    let creationManagerContract: any;

    const sampleMetadata = {
        title: "Test Post",
        content: "This is a test post content",
        attachments: [],
        tags: ["test", "content"]
    };

    beforeEach(async function () {
        // Deploy all contracts using the utility
        const deployment = await deployContracts();
        
        // Get deployed contracts
        roleManager = deployment.contracts.roleManager;
        tribeController = deployment.contracts.tribeController;
        collectibleController = deployment.contracts.collectibleController;
        feedManager = deployment.contracts.postFeedManager;
        postMinter = deployment.contracts.postMinter;
        
        // Get signers 
        owner = deployment.signers.owner;
        creator = deployment.signers.contentCreator;
        user1 = deployment.signers.regularUser1;
        user2 = deployment.signers.regularUser2;
        user3 = deployment.signers.bannedUser;
        
        // Get reference to the creation manager contract
        const creationManagerAddress = await postMinter.creationManager();
        creationManagerContract = await ethers.getContractAt("PostCreationManager", creationManagerAddress);

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
            (x: any) => x instanceof EventLog && x.eventName === "TribeCreated"
        ) as EventLog;
        tribeId = tribeEvent ? Number(tribeEvent.args[0]) : 0;

        // Add user3 to the tribe
        await tribeController.connect(user3).joinTribe(tribeId);
        
        // Verify membership status
        const user3Status = await tribeController.getMemberStatus(tribeId, user3.address);
        console.log(`User3 membership status: ${user3Status}`);
        
        // For testing cooldown specifically, we need to make sure user3 doesn't have the rate limit manager role
        // First, revoke any existing roles that might bypass rate limits
        const RATE_LIMIT_MANAGER_ROLE = await creationManagerContract.RATE_LIMIT_MANAGER_ROLE();
        if (await creationManagerContract.hasRole(RATE_LIMIT_MANAGER_ROLE, user3.address)) {
            await creationManagerContract.revokeRole(RATE_LIMIT_MANAGER_ROLE, user3.address);
            console.log("Revoked rate limit manager role from user3");
        }
        
        // Grant admin role to user3 so they can create posts, but not bypass rate limits
        const DEFAULT_ADMIN_ROLE = await creationManagerContract.DEFAULT_ADMIN_ROLE();
        await creationManagerContract.grantRole(DEFAULT_ADMIN_ROLE, user3.address);
        console.log("Granted admin role to user3");
        
        console.log("Setup complete");
    });

    it("Should enforce post creation cooldown", async function () {
        console.log("\nScenario: Testing post creation cooldown");

        // Step 1: Create first post
        console.log("Step 1: Creating first post");
        await creationManagerContract.connect(user3).createPost(
            tribeId,
            JSON.stringify(sampleMetadata),
            false,
            ethers.ZeroAddress,
            0
        );
        console.log("First post created");

        // Step 2: Attempt immediate second post
        console.log("\nStep 2: Attempting immediate second post");
        await expect(
            creationManagerContract.connect(user3).createPost(
                tribeId,
                JSON.stringify(sampleMetadata),
                false,
                ethers.ZeroAddress,
                0
            )
        ).to.be.revertedWithCustomError(creationManagerContract, "CooldownActive");
        console.log("Cooldown enforcement verified");
    });
}); 