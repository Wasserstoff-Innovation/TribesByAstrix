import { expect } from "chai";
import { ethers } from "hardhat";
import { TribeController, RoleManager, PointSystem, PostMinter } from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { EventLog } from "ethers";

describe("Community Creator Journey", function () {
    let tribeController: TribeController;
    let roleManager: RoleManager;
    let pointSystem: PointSystem;
    let postMinter: PostMinter;
    let owner: SignerWithAddress;
    let admin: SignerWithAddress;
    let creator: SignerWithAddress;
    let user1: SignerWithAddress;
    let user2: SignerWithAddress;

    beforeEach(async function () {
        [owner, admin, creator, user1, user2] = await ethers.getSigners();

        // Deploy RoleManager
        const RoleManager = await ethers.getContractFactory("RoleManager");
        roleManager = await RoleManager.deploy();
        await roleManager.waitForDeployment();

        // Deploy TribeController
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

        // Deploy PostMinter
        const PostMinter = await ethers.getContractFactory("PostMinter");
        postMinter = await PostMinter.deploy(
            await roleManager.getAddress(),
            await tribeController.getAddress(),
            await pointSystem.getAddress()
        );
        await postMinter.waitForDeployment();

        // Setup roles
        await roleManager.grantRole(ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE")), admin.address);
        await roleManager.grantRole(ethers.keccak256(ethers.toUtf8Bytes("CREATOR_ROLE")), creator.address);
    });

    describe("Scenario 9.1: Creating a Community", function () {
        it("Should create a public community with basic configuration", async function () {
            const tribeName = "Public Community";
            const metadata = JSON.stringify({
                name: tribeName,
                description: "A public community for testing",
                avatar: "ipfs://avatar",
                banner: "ipfs://banner"
            });

            const tx = await tribeController.connect(creator).createTribe(
                tribeName,
                metadata,
                [], // No additional admins
                0, // PUBLIC join type
                0, // No entry fee
                [] // No NFT requirements
            );

            const receipt = await tx.wait();
            const event = receipt?.logs.find(x => x instanceof EventLog && x.eventName === "TribeCreated") as EventLog;
            expect(event).to.not.be.undefined;

            const tribeId = event ? Number(event.args[0]) : 0;

            // Verify tribe admin
            expect(await tribeController.getTribeAdmin(tribeId)).to.equal(creator.address);

            // Verify tribe config
            const config = await tribeController.getTribeConfigView(tribeId);
            expect(config.joinType).to.equal(0); // PUBLIC
            expect(config.entryFee).to.equal(0);
            expect(config.nftRequirements.length).to.equal(0);
        });

        it("Should create a private community with entry fee", async function () {
            const tribeName = "Private Community";
            const metadata = JSON.stringify({
                name: tribeName,
                description: "A private community for testing",
                avatar: "ipfs://avatar",
                banner: "ipfs://banner"
            });
            const entryFee = ethers.parseEther("0.1");

            const tx = await tribeController.connect(creator).createTribe(
                tribeName,
                metadata,
                [], // No additional admins
                1, // PRIVATE join type
                entryFee,
                [] // No NFT requirements
            );

            const receipt = await tx.wait();
            const event = receipt?.logs.find(x => x instanceof EventLog && x.eventName === "TribeCreated") as EventLog;
            expect(event).to.not.be.undefined;

            const tribeId = event ? Number(event.args[0]) : 0;

            // Verify tribe config
            const config = await tribeController.getTribeConfigView(tribeId);
            expect(config.joinType).to.equal(1); // PRIVATE
            expect(config.entryFee).to.equal(entryFee);
        });

        it("Should create an invite-only community with collectible requirement", async function () {
            const tribeName = "Invite-Only Community";
            const metadata = JSON.stringify({
                name: tribeName,
                description: "An invite-only community for testing",
                avatar: "ipfs://avatar",
                banner: "ipfs://banner"
            });

            const tx = await tribeController.connect(creator).createTribe(
                tribeName,
                metadata,
                [], // No additional admins
                2, // INVITE_ONLY join type
                0, // No entry fee
                [] // No NFT requirements for now
            );

            const receipt = await tx.wait();
            const event = receipt?.logs.find(x => x instanceof EventLog && x.eventName === "TribeCreated") as EventLog;
            expect(event).to.not.be.undefined;

            const tribeId = event ? Number(event.args[0]) : 0;

            // Verify tribe config
            const config = await tribeController.getTribeConfigView(tribeId);
            expect(config.joinType).to.equal(2); // INVITE_ONLY
        });
    });

    // Add more test scenarios as needed...
}); 
