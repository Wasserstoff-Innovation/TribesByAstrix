import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { CollectibleController, RoleManager, TribeController, PointSystem } from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { EventLog } from "ethers";
import chalk from "chalk";

describe(chalk.blue("NFT Controller Unit Tests"), function () {
    let collectibleController: CollectibleController;
    let roleManager: RoleManager;
    let tribeController: TribeController;
    let pointSystem: PointSystem;
    let owner: SignerWithAddress;
    let admin: SignerWithAddress;
    let creator: SignerWithAddress;
    let user1: SignerWithAddress;
    let user2: SignerWithAddress;
    let maliciousUser: SignerWithAddress;
    let tribeId: number;

    beforeEach(async function () {
        console.log(chalk.cyan("\nSetting up test environment..."));
        [owner, admin, creator, user1, user2, maliciousUser] = await ethers.getSigners();

        // Deploy contracts
        const RoleManager = await ethers.getContractFactory("RoleManager");
        roleManager = await upgrades.deployProxy(RoleManager, [], { kind: 'uups' });
        await roleManager.waitForDeployment();
        console.log(chalk.green("✓ RoleManager deployed"));

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

        // Setup roles
        await roleManager.grantRole(ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE")), admin.address);
        await roleManager.grantRole(ethers.keccak256(ethers.toUtf8Bytes("CREATOR_ROLE")), creator.address);
        console.log(chalk.green("✓ Roles configured"));

        // Create test tribe
        const tx = await tribeController.connect(creator).createTribe(
            "Test Tribe",
            JSON.stringify({ name: "Test Tribe", description: "A test tribe" }),
            [creator.address],
            0, // PUBLIC
            0, // No entry fee
            [] // No NFT requirements
        );
        const receipt = await tx.wait();
        const event = receipt?.logs.find(
            x => x instanceof EventLog && x.eventName === "TribeCreated"
        ) as EventLog;
        tribeId = event ? Number(event.args[0]) : 0;
        console.log(chalk.green("✓ Test tribe created"));

        // Add members to tribe
        await tribeController.connect(user1).joinTribe(tribeId);
        await tribeController.connect(user2).joinTribe(tribeId);
        console.log(chalk.green("✓ Test members added"));
    });

    describe(chalk.yellow("Collectible Creation"), function () {
        it("✓ Should allow tribe admin to create a collectible", async function () {
            const tx = await collectibleController.connect(creator).createCollectible(
                tribeId,
                "Test NFT",
                "TEST",
                "ipfs://test",
                100,
                ethers.parseEther("0.1"),
                0
            );

            await expect(tx)
                .to.emit(collectibleController, "CollectibleCreated")
                .withArgs(0, tribeId, "Test NFT", 100);

            const collectible = await collectibleController.getCollectible(0);
            expect(collectible.name).to.equal("Test NFT");
            expect(collectible.maxSupply).to.equal(100);
            expect(collectible.price).to.equal(ethers.parseEther("0.1"));
        });

        it("✗ Should prevent non-admin from creating collectible", async function () {
            await expect(
                collectibleController.connect(user1).createCollectible(
                    tribeId,
                    "Test NFT",
                    "TEST",
                    "ipfs://test",
                    100,
                    ethers.parseEther("0.1"),
                    0
                )
            ).to.be.revertedWith("Not tribe admin");
        });

        it("✗ Should prevent creating collectible with invalid parameters", async function () {
            // Test with zero max supply
            await expect(
                collectibleController.connect(creator).createCollectible(
                    tribeId,
                    "Test NFT",
                    "TEST",
                    "ipfs://test",
                    0, // Invalid max supply
                    ethers.parseEther("0.1"),
                    0
                )
            ).to.be.revertedWith("Invalid supply");

            // Test with empty name
            await expect(
                collectibleController.connect(creator).createCollectible(
                    tribeId,
                    "", // Empty name
                    "TEST",
                    "ipfs://test",
                    100,
                    ethers.parseEther("0.1"),
                    0
                )
            ).to.be.revertedWith("Invalid name");

            // Test with empty symbol
            await expect(
                collectibleController.connect(creator).createCollectible(
                    tribeId,
                    "Test NFT",
                    "", // Empty symbol
                    "ipfs://test",
                    100,
                    ethers.parseEther("0.1"),
                    0
                )
            ).to.be.revertedWith("Invalid symbol");

            // Test with empty metadata URI
            await expect(
                collectibleController.connect(creator).createCollectible(
                    tribeId,
                    "Test NFT",
                    "TEST",
                    "", // Empty metadata URI
                    100,
                    ethers.parseEther("0.1"),
                    0
                )
            ).to.be.revertedWith("Invalid metadata URI");
        });
    });

    describe(chalk.yellow("Collectible Claiming"), function () {
        let collectibleId: number;

        beforeEach(async function () {
            const tx = await collectibleController.connect(creator).createCollectible(
                tribeId,
                "Test NFT",
                "TEST",
                "ipfs://test",
                100,
                ethers.parseEther("0.1"),
                50 // Points required
            );
            const receipt = await tx.wait();
            const event = receipt?.logs.find(
                x => x instanceof EventLog && x.eventName === "CollectibleCreated"
            ) as EventLog;
            collectibleId = event ? Number(event.args[0]) : 0;

            // Create tribe token
            await pointSystem.connect(creator).createTribeToken(
                tribeId,
                "Test Token",
                "TEST"
            );

            // Award points to user1
            await pointSystem.connect(creator).awardPoints(
                tribeId,
                user1.address,
                100,
                ethers.keccak256(ethers.toUtf8Bytes("TEST"))
            );
        });

        it("✓ Should allow claiming with correct payment and points", async function () {
            await expect(
                collectibleController.connect(user1).claimCollectible(
                    tribeId,
                    collectibleId,
                    { value: ethers.parseEther("0.1") }
                )
            ).to.emit(collectibleController, "CollectibleClaimed")
             .withArgs(tribeId, collectibleId, user1.address);

            expect(await collectibleController.balanceOf(user1.address, collectibleId))
                .to.equal(1);
        });

        it("✗ Should prevent claiming with insufficient payment", async function () {
            await expect(
                collectibleController.connect(user1).claimCollectible(
                    tribeId,
                    collectibleId,
                    { value: ethers.parseEther("0.05") }
                )
            ).to.be.revertedWith("Insufficient payment");
        });

        it("✗ Should prevent claiming with insufficient points", async function () {
            await expect(
                collectibleController.connect(user2).claimCollectible(
                    tribeId,
                    collectibleId,
                    { value: ethers.parseEther("0.1") }
                )
            ).to.be.revertedWith("Insufficient points");
        });

        it("✗ Should prevent claiming beyond max supply", async function () {
            // Create collectible with max supply 1
            const tx = await collectibleController.connect(creator).createCollectible(
                tribeId,
                "Limited NFT",
                "LTD",
                "ipfs://test",
                1, // Max supply 1
                ethers.parseEther("0.1"),
                0
            );
            const receipt = await tx.wait();
            const event = receipt?.logs.find(
                x => x instanceof EventLog && x.eventName === "CollectibleCreated"
            ) as EventLog;
            const limitedCollectibleId = event ? Number(event.args[0]) : 0;

            // First claim should succeed
            await collectibleController.connect(user1).claimCollectible(
                tribeId,
                limitedCollectibleId,
                { value: ethers.parseEther("0.1") }
            );

            // Second claim should fail
            await expect(
                collectibleController.connect(user2).claimCollectible(
                    tribeId,
                    limitedCollectibleId,
                    { value: ethers.parseEther("0.1") }
                )
            ).to.be.revertedWith("Supply limit reached");
        });
    });

    describe(chalk.yellow("Collectible Management"), function () {
        let collectibleId: number;

        beforeEach(async function () {
            const tx = await collectibleController.connect(creator).createCollectible(
                tribeId,
                "Test NFT",
                "TEST",
                "ipfs://test",
                100,
                ethers.parseEther("0.1"),
                0
            );
            const receipt = await tx.wait();
            const event = receipt?.logs.find(
                x => x instanceof EventLog && x.eventName === "CollectibleCreated"
            ) as EventLog;
            collectibleId = event ? Number(event.args[0]) : 0;
        });

        it("✓ Should allow admin to deactivate collectible", async function () {
            await expect(
                collectibleController.connect(creator).deactivateCollectible(tribeId, collectibleId)
            ).to.emit(collectibleController, "CollectibleDeactivated")
             .withArgs(collectibleId);

            const collectible = await collectibleController.getCollectible(collectibleId);
            expect(collectible.isActive).to.be.false;
        });

        it("✗ Should prevent non-admin from deactivating collectible", async function () {
            await expect(
                collectibleController.connect(user1).deactivateCollectible(tribeId, collectibleId)
            ).to.be.revertedWith("Not tribe admin");
        });

        it("✗ Should prevent claiming deactivated collectible", async function () {
            // Deactivate collectible
            await collectibleController.connect(creator).deactivateCollectible(tribeId, collectibleId);

            // Try to claim
            await expect(
                collectibleController.connect(user1).claimCollectible(
                    tribeId,
                    collectibleId,
                    { value: ethers.parseEther("0.1") }
                )
            ).to.be.revertedWith("Collectible not active");
        });
    });

    describe(chalk.yellow("Direct NFT Interactions"), function () {
        it("✗ Should prevent direct NFT minting", async function () {
            // Try to mint directly using ERC1155 mint function
            const ABI = ["function mint(address to, uint256 id, uint256 amount, bytes memory data)"];
            const iface = new ethers.Interface(ABI);
            const data = iface.encodeFunctionData("mint", [
                user1.address,
                0,
                1,
                "0x"
            ]);

            await expect(
                maliciousUser.sendTransaction({
                    to: await collectibleController.getAddress(),
                    data: data
                })
            ).to.be.reverted;
        });

        it("✗ Should prevent unauthorized transfers", async function () {
            // Create and claim a collectible
            const tx = await collectibleController.connect(creator).createCollectible(
                tribeId,
                "Test NFT",
                "TEST",
                "ipfs://test",
                100,
                ethers.parseEther("0.1"),
                0
            );
            const receipt = await tx.wait();
            const event = receipt?.logs.find(
                x => x instanceof EventLog && x.eventName === "CollectibleCreated"
            ) as EventLog;
            const collectibleId = event ? Number(event.args[0]) : 0;

            await collectibleController.connect(user1).claimCollectible(
                tribeId,
                collectibleId,
                { value: ethers.parseEther("0.1") }
            );

            // Try to transfer without approval
            await expect(
                collectibleController.connect(maliciousUser).safeTransferFrom(
                    user1.address,
                    user2.address,
                    collectibleId,
                    1,
                    "0x"
                )
            ).to.be.reverted;
        });
    });
}); 