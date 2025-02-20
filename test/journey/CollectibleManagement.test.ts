import { expect } from "chai";
import { ethers } from "hardhat";
import { TribeController, RoleManager, CollectibleController, PointSystem } from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { EventLog, Log } from "ethers";

interface CollectibleData {
    name: string;
    symbol: string;
    metadataURI: string;
    maxSupply: bigint;
    currentSupply: bigint;
    price: bigint;
    pointsRequired: bigint;
    isActive: boolean;
}

describe("Collectible Management Journey", function () {
    let tribeController: TribeController;
    let roleManager: RoleManager;
    let collectibleController: CollectibleController;
    let pointSystem: PointSystem;
    let owner: SignerWithAddress;
    let creator: SignerWithAddress;
    let moderator: SignerWithAddress;
    let users: SignerWithAddress[];
    let tribeId: number;

    beforeEach(async function () {
        [owner, creator, moderator, ...users] = await ethers.getSigners();

        // Deploy RoleManager
        const RoleManager = await ethers.getContractFactory("RoleManager");
        roleManager = await RoleManager.deploy();
        await roleManager.waitForDeployment();

        // Deploy TribeController
        const TribeController = await ethers.getContractFactory("TribeController");
        tribeController = await TribeController.deploy();
        await tribeController.waitForDeployment();

        // Deploy CollectibleController
        const CollectibleController = await ethers.getContractFactory("CollectibleController");
        collectibleController = await CollectibleController.deploy(
            await roleManager.getAddress(),
            await tribeController.getAddress()
        );
        await collectibleController.waitForDeployment();

        // Deploy PointSystem
        const PointSystem = await ethers.getContractFactory("PointSystem");
        pointSystem = await PointSystem.deploy(
            await roleManager.getAddress(),
            await tribeController.getAddress()
        );
        await pointSystem.waitForDeployment();

        // Set PointSystem in CollectibleController
        await collectibleController.setPointSystem(await pointSystem.getAddress());

        // Grant creator role
        await roleManager.grantRole(ethers.keccak256(ethers.toUtf8Bytes("CREATOR_ROLE")), creator.address);

        // Create a test tribe
        await tribeController.connect(creator).createTribe(
            "Test Community",
            "ipfs://metadata",
            [creator.address],
            0, // PUBLIC
            0,
            ethers.ZeroAddress
        );
        tribeId = 0;

        // Add users as members
        await tribeController.connect(users[0]).joinTribe(tribeId);
        await tribeController.connect(users[1]).joinTribe(tribeId);
    });

    describe("Scenario 10.1: Collectible Creation", function () {
        it("Should create a free collectible", async function () {
            const name = "Free Collectible";
            const symbol = "FREE";
            const metadataURI = "ipfs://collectible-metadata";
            const maxSupply = 100n;
            const price = 0n;
            const pointsRequired = 0n;

            // Create collectible
            const tx = await collectibleController.connect(creator).createCollectible(
                tribeId,
                name,
                symbol,
                metadataURI,
                maxSupply,
                price,
                pointsRequired
            );
            const receipt = await tx.wait();
            const event = receipt?.logs.find((log: Log | EventLog): log is EventLog => 
                log instanceof EventLog && log.eventName === "CollectibleCreated"
            );
            const collectibleId = event ? event.args[0] : 0n;

            // Verify collectible details
            const collectible = await collectibleController.getCollectible(collectibleId);
            expect(collectible.name).to.equal(name);
            expect(collectible.symbol).to.equal(symbol);
            expect(collectible.metadataURI).to.equal(metadataURI);
            expect(collectible.maxSupply).to.equal(maxSupply);
            expect(collectible.price).to.equal(price);
            expect(collectible.pointsRequired).to.equal(pointsRequired);
        });

        it("Should create a paid collectible", async function () {
            const name = "Premium Collectible";
            const symbol = "PREM";
            const metadataURI = "ipfs://premium-metadata";
            const maxSupply = 50n;
            const price = ethers.parseEther("0.1");
            const pointsRequired = 0n;

            // Create collectible
            const tx = await collectibleController.connect(creator).createCollectible(
                tribeId,
                name,
                symbol,
                metadataURI,
                maxSupply,
                price,
                pointsRequired
            );
            const receipt = await tx.wait();
            const event = receipt?.logs.find((log: Log | EventLog): log is EventLog => 
                log instanceof EventLog && log.eventName === "CollectibleCreated"
            );
            const collectibleId = event ? event.args[0] : 0n;

            // Verify collectible details
            const collectible = await collectibleController.getCollectible(collectibleId);
            expect(collectible.price).to.equal(price);
        });

        it("Should create a points-gated collectible", async function () {
            const name = "Points Collectible";
            const symbol = "PTS";
            const metadataURI = "ipfs://points-metadata";
            const maxSupply = 25n;
            const price = 0n;
            const pointsRequired = 100n;

            // Create collectible
            const tx = await collectibleController.connect(creator).createCollectible(
                tribeId,
                name,
                symbol,
                metadataURI,
                maxSupply,
                price,
                pointsRequired
            );
            const receipt = await tx.wait();
            const event = receipt?.logs.find((log: Log | EventLog): log is EventLog => 
                log instanceof EventLog && log.eventName === "CollectibleCreated"
            );
            const collectibleId = event ? event.args[0] : 0n;

            // Verify collectible details
            const collectible = await collectibleController.getCollectible(collectibleId);
            expect(collectible.pointsRequired).to.equal(pointsRequired);
        });
    });

    describe("Scenario 10.2: Collectible Distribution", function () {
        let freeCollectibleId: number;
        let paidCollectibleId: number;
        let pointsCollectibleId: number;

        beforeEach(async function () {
            // Create free collectible
            const freeTx = await collectibleController.connect(creator).createCollectible(
                tribeId,
                "Free Collectible",
                "FREE",
                "ipfs://free-metadata",
                100,
                0,
                0
            );
            const freeReceipt = await freeTx.wait();
            const freeEvent = freeReceipt?.logs.find(x => x instanceof EventLog && x.eventName === "CollectibleCreated") as EventLog;
            freeCollectibleId = freeEvent ? freeEvent.args[0] : 0;

            // Create paid collectible
            const paidTx = await collectibleController.connect(creator).createCollectible(
                tribeId,
                "Paid Collectible",
                "PAID",
                "ipfs://paid-metadata",
                50,
                ethers.parseEther("0.1"),
                0
            );
            const paidReceipt = await paidTx.wait();
            const paidEvent = paidReceipt?.logs.find(x => x instanceof EventLog && x.eventName === "CollectibleCreated") as EventLog;
            paidCollectibleId = paidEvent ? paidEvent.args[0] : 0;

            // Create points-gated collectible
            const pointsTx = await collectibleController.connect(creator).createCollectible(
                tribeId,
                "Points Collectible",
                "PTS",
                "ipfs://points-metadata",
                25,
                0,
                100
            );
            const pointsReceipt = await pointsTx.wait();
            const pointsEvent = pointsReceipt?.logs.find(x => x instanceof EventLog && x.eventName === "CollectibleCreated") as EventLog;
            pointsCollectibleId = pointsEvent ? pointsEvent.args[0] : 0;

            // Award points to user[0]
            await pointSystem.connect(creator).awardPoints(tribeId, users[0].address, 150, ethers.keccak256(ethers.toUtf8Bytes("ENGAGEMENT")));
        });

        it("Should claim free collectible", async function () {
            // User claims free collectible
            await expect(collectibleController.connect(users[0]).claimCollectible(tribeId, freeCollectibleId))
                .to.emit(collectibleController, "CollectibleClaimed")
                .withArgs(tribeId, freeCollectibleId, users[0].address);

            // Verify ownership
            expect(await collectibleController.balanceOf(users[0].address, freeCollectibleId)).to.equal(1);
        });

        it("Should purchase paid collectible", async function () {
            // User purchases paid collectible
            await expect(collectibleController.connect(users[0]).claimCollectible(tribeId, paidCollectibleId, {
                value: ethers.parseEther("0.1")
            }))
                .to.emit(collectibleController, "CollectibleClaimed")
                .withArgs(tribeId, paidCollectibleId, users[0].address);

            // Verify ownership
            expect(await collectibleController.balanceOf(users[0].address, paidCollectibleId)).to.equal(1);
        });

        it("Should claim points-gated collectible", async function () {
            // User claims points-gated collectible
            await expect(collectibleController.connect(users[0]).claimCollectible(tribeId, pointsCollectibleId))
                .to.emit(collectibleController, "CollectibleClaimed")
                .withArgs(tribeId, pointsCollectibleId, users[0].address);

            // Verify ownership
            expect(await collectibleController.balanceOf(users[0].address, pointsCollectibleId)).to.equal(1);
        });

        it("Should handle supply limits", async function () {
            // Create limited supply collectible
            const tx = await collectibleController.connect(creator).createCollectible(
                tribeId,
                "Limited Collectible",
                "LTD",
                "ipfs://limited-metadata",
                1, // Only 1 available
                0,
                0
            );
            const receipt = await tx.wait();
            const event = receipt?.logs.find(x => x instanceof EventLog && x.eventName === "CollectibleCreated") as EventLog;
            const limitedCollectibleId = event ? event.args[0] : 0;

            // First user claims successfully
            await collectibleController.connect(users[0]).claimCollectible(tribeId, limitedCollectibleId);

            // Second user's claim should fail
            await expect(collectibleController.connect(users[1]).claimCollectible(tribeId, limitedCollectibleId))
                .to.be.revertedWith("Supply limit reached");
        });

        it("Should handle insufficient points", async function () {
            // User without enough points tries to claim
            await expect(collectibleController.connect(users[1]).claimCollectible(tribeId, pointsCollectibleId))
                .to.be.revertedWith("Insufficient points");
        });

        it("Should handle insufficient payment", async function () {
            // User tries to claim paid collectible without enough payment
            await expect(collectibleController.connect(users[0]).claimCollectible(tribeId, paidCollectibleId, {
                value: ethers.parseEther("0.05") // Only half the required amount
            }))
                .to.be.revertedWith("Insufficient payment");
        });
    });
}); 