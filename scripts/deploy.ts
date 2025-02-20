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
  const ProfileNFTMinter = await ethers.getContractFactory("ProfileNFTMinter");
  const profileNFTMinter = await ProfileNFTMinter.deploy(await roleManager.getAddress());
  await profileNFTMinter.waitForDeployment();
  console.log("ProfileNFTMinter deployed to:", await profileNFTMinter.getAddress());

  // Deploy TribeController
  const TribeController = await ethers.getContractFactory("TribeController");
  const tribeController = await TribeController.deploy(await roleManager.getAddress());
  await tribeController.waitForDeployment();
  console.log("TribeController deployed to:", await tribeController.getAddress());

  // Deploy CollectibleController
    const CollectibleController = await ethers.getContractFactory("CollectibleController");
    const collectibleController = await CollectibleController.deploy(
        await roleManager.getAddress(),
        await tribeController.getAddress(),
        await profileNFTMinter.getAddress()
   );
   await collectibleController.waitForDeployment();
   console.log("CollectibleController deployed to:", await collectibleController.getAddress());

  // Deploy PostMinter
  const PostMinter = await ethers.getContractFactory("PostMinter");
  const postMinter = await PostMinter.deploy(
    await roleManager.getAddress(),
    await tribeController.getAddress(),
    await profileNFTMinter.getAddress()
  );
  await postMinter.waitForDeployment();
  console.log("PostMinter deployed to:", await postMinter.getAddress());

  // Deploy Voting
  const Voting = await ethers.getContractFactory("Voting");
  const voting = await Voting.deploy();
  await voting.waitForDeployment();
  console.log("Voting deployed to:", await voting.getAddress());

  // Deploy CommunityPoints
  const CommunityPoints = await ethers.getContractFactory("CommunityPoints");
  const communityPoints = await CommunityPoints.deploy(
    await roleManager.getAddress(),
    deployer.address // Initially set deployer as verifier
  );
  await communityPoints.waitForDeployment();
  console.log("CommunityPoints deployed to:", await communityPoints.getAddress());

  // Deploy EventController
  const EventController = await ethers.getContractFactory("EventController");
  const eventController = await EventController.deploy(await roleManager.getAddress());
  await eventController.waitForDeployment();
  console.log("EventController deployed to:", await eventController.getAddress());

  // Deploy SuperCommunityController
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
  await roleManager.authorizeFanAssigner(await profileNFTMinter.getAddress());
  await roleManager.grantRole(ORGANIZER_ROLE, deployer.address);

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

  console.log("\nDeployment Verification:");
  console.log("=======================");
  console.log("1. Role Setup:");
  console.log("   - Deployer has ORGANIZER_ROLE");
  console.log("   - ProfileNFTMinter authorized as FAN_ASSIGNER");
  console.log("2. Contract Initialization:");
  console.log("   - All contracts deployed and initialized");
  console.log("   - Deployer set as points verifier");
  console.log("3. Network Details:");
  console.log("   - Network: Monad Devnet");
  console.log("   - Chain ID: 20143");
  console.log("   - Currency: DMON");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 