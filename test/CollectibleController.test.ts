import { expect } from "chai";
import { ethers } from "hardhat";
import { CollectibleController, RoleManager, TribeController, PointSystem } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { EventLog, Log } from "ethers";

describe("CollectibleController", function () {
  let collectibleController: CollectibleController;
  let roleManager: RoleManager;
  let tribeController: TribeController;
  let pointSystem: PointSystem;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let tribeId: number;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    
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

    // Deploy CollectibleController with required arguments
    const CollectibleController = await ethers.getContractFactory("CollectibleController");
    collectibleController = await CollectibleController.deploy(
      await roleManager.getAddress(),
      await tribeController.getAddress(),
      await pointSystem.getAddress()
    );
    await collectibleController.waitForDeployment();

    // Create a test tribe with user1 as admin
    await tribeController.connect(user1).createTribe(
      "Test Tribe",
      "ipfs://metadata",
      [user1.address],
      0, // PUBLIC
      0, // No entry fee
      [] // No NFT requirements
    );
    tribeId = 0;

    // Add user2 as member
    await tribeController.connect(user2).joinTribe(tribeId);
  });

  describe("Collectible Creation", function () {
    it("Should create a collectible successfully", async function () {
      const name = "Test Collectible";
      const symbol = "TEST";
      const metadataURI = "ipfs://test";
      const maxSupply = 100n;
      const price = ethers.parseEther("0.1");
      const pointsRequired = 50n;

      await expect(collectibleController.connect(user1).createCollectible(
        tribeId,
        name,
        symbol,
        metadataURI,
        maxSupply,
        price,
        pointsRequired
      )).to.emit(collectibleController, "CollectibleCreated");

      const collectibleId = 0;
      const collectible = await collectibleController.getCollectible(collectibleId);
      
      expect(collectible.name).to.equal(name);
      expect(collectible.symbol).to.equal(symbol);
      expect(collectible.metadataURI).to.equal(metadataURI);
      expect(collectible.maxSupply).to.equal(maxSupply);
      expect(collectible.price).to.equal(price);
      expect(collectible.pointsRequired).to.equal(pointsRequired);
    });
  });

  describe("Collectible Claiming", function () {
    let collectibleId: number;

    beforeEach(async function () {
      // Create a test collectible
      const tx = await collectibleController.connect(user1).createCollectible(
        tribeId,
        "Test Collectible",
        "TEST",
        "ipfs://test",
        100n,
        ethers.parseEther("0.1"),
        50n
      );
      const receipt = await tx.wait();
      const event = receipt?.logs.find((log: Log | EventLog): log is EventLog => 
        log instanceof EventLog && log.eventName === "CollectibleCreated"
      );
      collectibleId = event ? Number(event.args[0]) : 0;

      // Create tribe token
      await pointSystem.connect(user1).createTribeToken(
        tribeId,
        "Test Token",
        "TEST"
      );

      // Award points to user2
      await pointSystem.connect(user1).awardPoints(
        tribeId,
        user2.address,
        100n,
        ethers.keccak256(ethers.toUtf8Bytes("TEST"))
      );
    });

    it("Should allow claiming a collectible with correct payment", async function () {
      await expect(collectibleController.connect(user2).claimCollectible(
        tribeId,
        collectibleId,
        { value: ethers.parseEther("0.1") }
      )).to.emit(collectibleController, "CollectibleClaimed")
        .withArgs(tribeId, collectibleId, user2.address);

      expect(await collectibleController.balanceOf(user2.address, collectibleId)).to.equal(1n);
    });

    it("Should prevent claiming with insufficient payment", async function () {
      await expect(collectibleController.connect(user2).claimCollectible(
        tribeId,
        collectibleId,
        { value: ethers.parseEther("0.05") }
      )).to.be.revertedWith("Insufficient payment");
    });
  });
}); 