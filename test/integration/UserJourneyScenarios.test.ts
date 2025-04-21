import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { ProfileNFTMinter, RoleManager } from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { EventLog } from "ethers";

describe("User Journey Scenarios", function () {
    let profileNFTMinter: ProfileNFTMinter;
    let roleManager: RoleManager;
    let owner: SignerWithAddress;
    let user1: SignerWithAddress;
    let user2: SignerWithAddress;

    beforeEach(async function () {
        [owner, user1, user2] = await ethers.getSigners();
        
        // Deploy RoleManager
        const RoleManager = await ethers.getContractFactory("RoleManager");
        roleManager = await upgrades.deployProxy(RoleManager, [], { kind: 'uups' });
        await roleManager.waitForDeployment();

        // Deploy ProfileNFTMinter
        const ProfileNFTMinter = await ethers.getContractFactory("ProfileNFTMinter");
        profileNFTMinter = await ProfileNFTMinter.deploy(await roleManager.getAddress());
        await profileNFTMinter.waitForDeployment();

        // Authorize ProfileNFTMinter to assign FAN_ROLE
        await roleManager.authorizeFanAssigner(await profileNFTMinter.getAddress());
    });

    describe("Signup Journey", function () {
        it("Should complete full signup process", async function () {
            const username = "cryptouser";
            const initialMetadata = {
                avatar: "ipfs://QmInitialAvatar",
                bio: "Web3 enthusiast",
                twitter: "@cryptouser",
                discord: "cryptouser#1234"
            };
            const initialMetadataURI = "ipfs://QmInitialMetadata";

            // Step 1: Check if username is available
            console.log("\nStep 1: Checking username availability");
            const isUsernameTaken = await profileNFTMinter.usernameExists(username);
            expect(isUsernameTaken).to.be.false;
            console.log(`Username '${username}' is available`);

            // Step 2: Create profile with initial metadata
            console.log("\nStep 2: Creating profile");
            const createTx = await profileNFTMinter.connect(user1).createProfile(
                username,
                initialMetadataURI
            );
            const createReceipt = await createTx.wait();
            const createEvent = createReceipt?.logs.find(
                x => x instanceof EventLog && x.eventName === "ProfileCreated"
            ) as EventLog;
            const tokenId = createEvent ? Number(createEvent.args[0]) : 0;
            console.log(`Profile created with token ID: ${tokenId}`);

            // Step 3: Verify profile creation
            console.log("\nStep 3: Verifying profile data");
            const profile = await profileNFTMinter.getProfileByTokenId(tokenId);
            expect(profile.username).to.equal(username);
            expect(profile.metadataURI).to.equal(initialMetadataURI);
            expect(profile.owner).to.equal(user1.address);
            console.log("Profile data verified successfully");

            // Step 4: Update profile metadata one by one
            console.log("\nStep 4: Updating profile metadata");
            
            // Update avatar
            const newAvatarURI = "ipfs://QmNewAvatar";
            await profileNFTMinter.connect(user1).updateProfileMetadata(tokenId, newAvatarURI);
            console.log("Avatar updated");

            // Update bio
            const newBioURI = "ipfs://QmNewBio";
            await profileNFTMinter.connect(user1).updateProfileMetadata(tokenId, newBioURI);
            console.log("Bio updated");

            // Verify final metadata
            const updatedProfile = await profileNFTMinter.getProfileByTokenId(tokenId);
            expect(updatedProfile.metadataURI).to.equal(newBioURI);
            console.log("Profile updates verified");
        });

        it("Should handle duplicate username signup attempt", async function () {
            const username = "uniqueuser";
            const metadataURI = "ipfs://QmTest";

            // First user signup
            await profileNFTMinter.connect(user1).createProfile(username, metadataURI);

            // Second user trying same username
            await expect(
                profileNFTMinter.connect(user2).createProfile(username, metadataURI)
            ).to.be.revertedWith("Username already taken");
        });
    });

    describe("Login Journey", function () {
        let userTokenId: number;
        const username = "loginuser";
        const metadataURI = "ipfs://QmLoginTest";

        beforeEach(async function () {
            // Create a profile for testing login flow
            const tx = await profileNFTMinter.connect(user1).createProfile(username, metadataURI);
            const receipt = await tx.wait();
            const createEvent = receipt?.logs.find(
                x => x instanceof EventLog && x.eventName === "ProfileCreated"
            ) as EventLog;
            userTokenId = createEvent ? Number(createEvent.args[0]) : 0;
        });

        it("Should complete full login process", async function () {
            // Step 1: Check if address has any NFTs
            console.log("\nStep 1: Checking NFT balance");
            const balance = await profileNFTMinter.balanceOf(user1.address);
            expect(balance).to.equal(1n);
            console.log(`User has ${balance.toString()} profile NFT(s)`);

            // Step 2: Get token ID for the address
            console.log("\nStep 2: Getting token ID by username");
            const tokenId = await profileNFTMinter.getTokenIdByUsername(username);
            expect(tokenId).to.equal(userTokenId);
            console.log(`Found token ID: ${tokenId}`);

            // Step 3: Get profile metadata
            console.log("\nStep 3: Fetching profile metadata");
            const profile = await profileNFTMinter.getProfileByTokenId(tokenId);
            expect(profile.username).to.equal(username);
            expect(profile.metadataURI).to.equal(metadataURI);
            expect(profile.owner).to.equal(user1.address);
            console.log("Profile metadata retrieved successfully");

            // Step 4: Verify ownership
            console.log("\nStep 4: Verifying ownership");
            const isOwner = await profileNFTMinter.ownerOf(tokenId);
            expect(isOwner).to.equal(user1.address);
            console.log("Ownership verified");
        });

        it("Should handle login with non-existent profile", async function () {
            const nonExistentUsername = "nonexistent";
            
            // Try to get token ID for non-existent username
            await expect(
                profileNFTMinter.getTokenIdByUsername(nonExistentUsername)
            ).to.be.revertedWith("Username does not exist");
        });

        it("Should handle login with transferred profile", async function () {
            // Transfer profile to user2
            await profileNFTMinter.connect(user1).transferFrom(user1.address, user2.address, userTokenId);

            // Verify new ownership
            const profile = await profileNFTMinter.getProfileByTokenId(userTokenId);
            expect(profile.owner).to.equal(user2.address);
            expect(await profileNFTMinter.ownerOf(userTokenId)).to.equal(user2.address);
        });
    });
}); 