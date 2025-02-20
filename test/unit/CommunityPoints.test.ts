import { expect } from "chai";
import { ethers } from "hardhat";
import { CommunityPoints, RoleManager } from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("CommunityPoints", function () {
  let communityPoints: CommunityPoints;
  let roleManager: RoleManager;
  let owner: SignerWithAddress;
  let user: SignerWithAddress;
  let verifier: SignerWithAddress;

  beforeEach(async function () {
    [owner, user, verifier] = await ethers.getSigners();

    // Deploy RoleManager
    const RoleManager = await ethers.getContractFactory("RoleManager");
    roleManager = await RoleManager.deploy();
    await roleManager.waitForDeployment();

    // Grant DEFAULT_ADMIN_ROLE to owner
    const DEFAULT_ADMIN_ROLE = await roleManager.DEFAULT_ADMIN_ROLE();
    await roleManager.grantRole(DEFAULT_ADMIN_ROLE, owner.address);

    // Deploy CommunityPoints
    const CommunityPoints = await ethers.getContractFactory("CommunityPoints");
    communityPoints = await CommunityPoints.deploy(
      await roleManager.getAddress(),
      verifier.address
    );
    await communityPoints.waitForDeployment();
  });

  describe("Point Redemption", function () {
    it("Should allow point redemption with valid signature", async function () {
      const points = 100;
      const collectibleType = 1;

      // Create message hash
      const messageHash = ethers.solidityPackedKeccak256(
        ["address", "uint256", "uint256"],
        [user.address, points, collectibleType]
      );

      // Sign the message
      const signature = await verifier.signMessage(ethers.getBytes(messageHash));

      // Redeem points
      await expect(communityPoints.connect(user).redeemPoints(points, collectibleType, signature))
        .to.emit(communityPoints, "PointsRedeemed")
        .withArgs(user.address, points, collectibleType);
    });

    it("Should reject redemption with invalid signature", async function () {
      const points = 100;
      const collectibleType = 1;

      // Create message hash
      const messageHash = ethers.solidityPackedKeccak256(
        ["address", "uint256", "uint256"],
        [user.address, points, collectibleType]
      );

      // Sign with wrong signer
      const signature = await owner.signMessage(ethers.getBytes(messageHash));

      // Attempt to redeem points
      await expect(
        communityPoints.connect(user).redeemPoints(points, collectibleType, signature)
      ).to.be.revertedWith("Invalid signature");
    });

    it("Should prevent replay attacks", async function () {
      const points = 100;
      const collectibleType = 1;

      // Create message hash
      const messageHash = ethers.solidityPackedKeccak256(
        ["address", "uint256", "uint256"],
        [user.address, points, collectibleType]
      );

      // Sign the message
      const signature = await verifier.signMessage(ethers.getBytes(messageHash));

      // First redemption should succeed
      await communityPoints.connect(user).redeemPoints(points, collectibleType, signature);

      // Second attempt with same signature should fail
      await expect(
        communityPoints.connect(user).redeemPoints(points, collectibleType, signature)
      ).to.be.revertedWith("Signature already used");
    });
  });

  describe("Admin Functions", function () {
    it("Should allow admin to update verifier", async function () {
      const newVerifier = user.address;

      // First try without admin role - should fail
      await expect(
        communityPoints.connect(user).setVerifier(newVerifier)
      ).to.be.revertedWith("Not admin");

      // Grant admin role
      const DEFAULT_ADMIN_ROLE = await roleManager.DEFAULT_ADMIN_ROLE();
      await roleManager.grantRole(DEFAULT_ADMIN_ROLE, owner.address);

      // Now should succeed
      await expect(
        communityPoints.connect(owner).setVerifier(newVerifier)
      ).to.not.be.reverted;
      expect(await communityPoints.verifier()).to.equal(newVerifier);
    });

    it("Should prevent non-admin from updating verifier", async function () {
      await expect(
        communityPoints.connect(user).setVerifier(user.address)
      ).to.be.revertedWith("Not admin");
    });
  });
}); 