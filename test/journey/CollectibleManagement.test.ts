import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { CollectibleController, RoleManager, TribeController, PointSystem } from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { EventLog } from "ethers";
import { deployContracts } from "../util/deployContracts";

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
    let collectibleController: CollectibleController;
    let roleManager: RoleManager;
    let tribeController: TribeController;
    let pointSystem: PointSystem;
    let owner: SignerWithAddress;
    let admin: SignerWithAddress;
    let creator: SignerWithAddress;
    let user1: SignerWithAddress;
    let user2: SignerWithAddress;
    let tribeId: number;

    beforeEach(async function () {
        // Use the deployContracts utility to deploy all contracts consistently with proxies
        const deployment = await deployContracts();
        
        // Extract contracts
        roleManager = deployment.contracts.roleManager;
        tribeController = deployment.contracts.tribeController;
        pointSystem = deployment.contracts.pointSystem;
        collectibleController = deployment.contracts.collectibleController;
        
        // Extract signers
        [owner, admin, creator, , user1, user2] = await ethers.getSigners();

        // Create test tribe
        const tx = await tribeController.connect(creator).createTribe(
            "Test Tribe",
            JSON.stringify({ name: "Test Tribe", description: "A test tribe" }),
            [], // No additional admins
            0, // PUBLIC
            0, // No entry fee
            [] // No NFT requirements
        );
        const receipt = await tx.wait();
        const event = receipt?.logs.find(x => x instanceof EventLog && x.eventName === "TribeCreated") as EventLog;
        tribeId = event ? Number(event.args[0]) : 0;

        // Add members to tribe
        await tribeController.connect(user1).joinTribe(tribeId);
        await tribeController.connect(user2).joinTribe(tribeId);
    });

    it("Should create a free collectible", async function () {
        const tx = await collectibleController.connect(creator).createCollectible(
            tribeId,
            "Test NFT",
            "TEST",
            "ipfs://test",
            100, // maxSupply
            0, // free
            0 // no points required
        );

        const receipt = await tx.wait();
        const event = receipt?.logs.find(x => x instanceof EventLog && x.eventName === "CollectibleCreated") as EventLog;
        expect(event).to.not.be.undefined;

        const collectibleId = event ? Number(event.args[0]) : 0;
        const collectible = await collectibleController.getCollectible(collectibleId);
        expect(collectible.name).to.equal("Test NFT");
        expect(collectible.maxSupply).to.equal(100);
        expect(collectible.price).to.equal(0);
    });

    // Add more test cases as needed...
}); 