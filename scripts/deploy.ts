import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy RoleManager first as it's required by other contracts
  const RoleManager = await ethers.getContractFactory("RoleManager");
  const roleManager = await RoleManager.deploy();
  await roleManager.waitForDeployment();
  console.log("RoleManager deployed to:", await roleManager.getAddress());

  // Deploy ProfileNFTMinter
  const mintFee = ethers.parseEther("0.01"); // 0.01 ETH mint fee
  const ProfileNFTMinter = await ethers.getContractFactory("ProfileNFTMinter");
  const profileNFTMinter = await ProfileNFTMinter.deploy(mintFee, await roleManager.getAddress());
  await profileNFTMinter.waitForDeployment();
  console.log("ProfileNFTMinter deployed to:", await profileNFTMinter.getAddress());

  // Deploy TribeController
  const TribeController = await ethers.getContractFactory("TribeController");
  const tribeController = await TribeController.deploy();
  await tribeController.waitForDeployment();
  console.log("TribeController deployed to:", await tribeController.getAddress());

  // Deploy CollectibleController
  const CollectibleController = await ethers.getContractFactory("CollectibleController");
  const collectibleController = await CollectibleController.deploy();
  await collectibleController.waitForDeployment();
  console.log("CollectibleController deployed to:", await collectibleController.getAddress());

  // Deploy PostMinter
  const PostMinter = await ethers.getContractFactory("PostMinter");
  const postMinter = await PostMinter.deploy();
  await postMinter.waitForDeployment();
  console.log("PostMinter deployed to:", await postMinter.getAddress());

  // Deploy Voting
  const Voting = await ethers.getContractFactory("Voting");
  const voting = await Voting.deploy();
  await voting.waitForDeployment();
  console.log("Voting deployed to:", await voting.getAddress());

  // Deploy new contracts

  // 1. Deploy CommunityPoints
  const CommunityPoints = await ethers.getContractFactory("CommunityPoints");
  const communityPoints = await CommunityPoints.deploy(
    await roleManager.getAddress(),
    deployer.address // Initially set deployer as verifier
  );
  await communityPoints.waitForDeployment();
  console.log("CommunityPoints deployed to:", await communityPoints.getAddress());

  // 2. Deploy EventController
  const EventController = await ethers.getContractFactory("EventController");
  const eventController = await EventController.deploy(await roleManager.getAddress());
  await eventController.waitForDeployment();
  console.log("EventController deployed to:", await eventController.getAddress());

  // 3. Deploy SuperCommunityController
  const SuperCommunityController = await ethers.getContractFactory("SuperCommunityController");
  const superCommunityController = await SuperCommunityController.deploy(
    await roleManager.getAddress(),
    await tribeController.getAddress()
  );
  await superCommunityController.waitForDeployment();
  console.log("SuperCommunityController deployed to:", await superCommunityController.getAddress());

  // Setup initial roles
  const ORGANIZER_ROLE = await roleManager.ORGANIZER_ROLE();
  const FAN_ASSIGNER_ROLE = await roleManager.FAN_ASSIGNER_ROLE();

  // Grant necessary roles
  await roleManager.assignRole(await profileNFTMinter.getAddress(), FAN_ASSIGNER_ROLE);
  await roleManager.assignRole(deployer.address, ORGANIZER_ROLE);

  console.log("\nContract Addresses:");
  console.log("===================");
  console.log(`RoleManager: ${await roleManager.getAddress()}`);
  console.log(`ProfileNFTMinter: ${await profileNFTMinter.getAddress()}`);
  console.log(`TribeController: ${await tribeController.getAddress()}`);
  console.log(`CollectibleController: ${await collectibleController.getAddress()}`);
  console.log(`PostMinter: ${await postMinter.getAddress()}`);
  console.log(`Voting: ${await voting.getAddress()}`);
  console.log(`CommunityPoints: ${await communityPoints.getAddress()}`);
  console.log(`EventController: ${await eventController.getAddress()}`);
  console.log(`SuperCommunityController: ${await superCommunityController.getAddress()}`);

  console.log("\nInitial Setup Complete!");
  console.log("- Deployer has been granted ORGANIZER_ROLE");
  console.log("- ProfileNFTMinter has been granted FAN_ASSIGNER_ROLE");
  console.log("- Deployer is set as the initial points verifier");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 