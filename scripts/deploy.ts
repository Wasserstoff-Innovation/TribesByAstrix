import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  async function logDeployment(contractName: string, contract: any) {
    const deployTx = contract.deploymentTransaction();
    const receipt = await deployTx.wait();
    
    console.log("\nContract deployment:", contractName);
    console.log("Contract address:   ", await contract.getAddress());
    console.log("Transaction:        ", deployTx.hash);
    console.log("From:               ", deployTx.from);
    console.log("Value:              ", `${ethers.formatEther(deployTx.value)} ETH`);
    console.log("Gas used:           ", receipt.gasUsed.toString(), "of", deployTx.gasLimit.toString());
    console.log("Block #:            ", receipt.blockNumber);
    console.log("Block hash:         ", receipt.blockHash);
    console.log("--------------------------------------------------");
  }

  // Deploy RoleManager first as it's required by other contracts
  const RoleManager = await ethers.getContractFactory("RoleManager");
  const roleManager = await RoleManager.deploy();
  await roleManager.waitForDeployment();
  await logDeployment("RoleManager", roleManager);

  // Deploy ProfileNFTMinter
  const ProfileNFTMinter = await ethers.getContractFactory("ProfileNFTMinter");
  const profileNFTMinter = await ProfileNFTMinter.deploy(await roleManager.getAddress());
  await profileNFTMinter.waitForDeployment();
  await logDeployment("ProfileNFTMinter", profileNFTMinter);

  // Deploy TribeController
  const TribeController = await ethers.getContractFactory("TribeController");
  const tribeController = await TribeController.deploy(await roleManager.getAddress());
  await tribeController.waitForDeployment();
  await logDeployment("TribeController", tribeController);

  // Deploy PointSystem
  const PointSystem = await ethers.getContractFactory("PointSystem");
  const pointSystem = await PointSystem.deploy(
    await roleManager.getAddress(),
    await tribeController.getAddress()
  );
  await pointSystem.waitForDeployment();
  await logDeployment("PointSystem", pointSystem);

  // Deploy CollectibleController
  const CollectibleController = await ethers.getContractFactory("CollectibleController");
  const collectibleController = await CollectibleController.deploy(
    await roleManager.getAddress(),
    await tribeController.getAddress(),
    await pointSystem.getAddress()
  );
  await collectibleController.waitForDeployment();
  await logDeployment("CollectibleController", collectibleController);

  // Deploy PostFeedManager
  const PostFeedManager = await ethers.getContractFactory("PostFeedManager");
  const postFeedManager = await PostFeedManager.deploy(await tribeController.getAddress());
  await postFeedManager.waitForDeployment();
  await logDeployment("PostFeedManager", postFeedManager);

  // Deploy PostMinter
  const PostMinter = await ethers.getContractFactory("PostMinter");
  const postMinter = await PostMinter.deploy(
    await roleManager.getAddress(),
    await tribeController.getAddress(),
    await collectibleController.getAddress()
  );
  await postMinter.waitForDeployment();
  await logDeployment("PostMinter", postMinter);

  // Deploy Voting
  const Voting = await ethers.getContractFactory("Voting");
  const voting = await Voting.deploy(await roleManager.getAddress(), await tribeController.getAddress());
  await voting.waitForDeployment();
  await logDeployment("Voting", voting);

  // Deploy CommunityPoints
  const CommunityPoints = await ethers.getContractFactory("CommunityPoints");
  const communityPoints = await CommunityPoints.deploy(
    await roleManager.getAddress(),
    deployer.address
  );
  await communityPoints.waitForDeployment();
  await logDeployment("CommunityPoints", communityPoints);

  // Deploy EventTickets
  const EventTickets = await ethers.getContractFactory("EventTickets");
  const eventTickets = await EventTickets.deploy();
  await eventTickets.waitForDeployment();
  await logDeployment("EventTickets", eventTickets);

  // Deploy SuperCommunityController
  const SuperCommunityController = await ethers.getContractFactory("SuperCommunityController");
  const superCommunityController = await SuperCommunityController.deploy(
    await roleManager.getAddress(),
    await tribeController.getAddress()
  );
  await superCommunityController.waitForDeployment();
  await logDeployment("SuperCommunityController", superCommunityController);

  // Deploy Analytics
  const Analytics = await ethers.getContractFactory("Analytics");
  const analytics = await Analytics.deploy(
    await tribeController.getAddress(),
    await pointSystem.getAddress(),
    await postMinter.getAddress()
  );
  await analytics.waitForDeployment();
  await logDeployment("Analytics", analytics);

  // Deploy ContentManager
  const ContentManager = await ethers.getContractFactory("ContentManager");
  const contentManager = await ContentManager.deploy(
    await roleManager.getAddress(),
    await tribeController.getAddress()
  );
  await contentManager.waitForDeployment();
  await logDeployment("ContentManager", contentManager);

  // Deploy ProjectController
  const ProjectController = await ethers.getContractFactory("ProjectController");
  const projectController = await ProjectController.deploy(
    await postMinter.getAddress(),
    await tribeController.getAddress()
  );
  await projectController.waitForDeployment();
  await logDeployment("ProjectController", projectController);

  // Setup initial roles
  const ORGANIZER_ROLE = await roleManager.ORGANIZER_ROLE();
  const FAN_ASSIGNER_ROLE = await roleManager.FAN_ASSIGNER_ROLE();
  const DEFAULT_ADMIN_ROLE = await postFeedManager.DEFAULT_ADMIN_ROLE();

  console.log("\nSetting up roles...");

  // Grant necessary roles
  const authorizeTx = await roleManager.authorizeFanAssigner(await profileNFTMinter.getAddress());
  const authorizeReceipt = await authorizeTx.wait();
  console.log("\nRole Transaction: authorizeFanAssigner");
  console.log("Transaction:     ", authorizeTx.hash);
  console.log("Gas used:       ", authorizeReceipt.gasUsed.toString(), "of", authorizeTx.gasLimit.toString());
  console.log("Block #:        ", authorizeReceipt.blockNumber);

  const grantOrgTx = await roleManager.grantRole(ORGANIZER_ROLE, deployer.address);
  const grantOrgReceipt = await grantOrgTx.wait();
  console.log("\nRole Transaction: grantRole ORGANIZER_ROLE");
  console.log("Transaction:     ", grantOrgTx.hash);
  console.log("Gas used:       ", grantOrgReceipt.gasUsed.toString(), "of", grantOrgTx.gasLimit.toString());
  console.log("Block #:        ", grantOrgReceipt.blockNumber);

  // Grant admin role to PostMinter in PostFeedManager
  const grantAdminTx = await postFeedManager.grantRole(DEFAULT_ADMIN_ROLE, await postMinter.getAddress());
  const grantAdminReceipt = await grantAdminTx.wait();
  console.log("\nRole Transaction: grantRole DEFAULT_ADMIN_ROLE");
  console.log("Transaction:     ", grantAdminTx.hash);
  console.log("Gas used:       ", grantAdminReceipt.gasUsed.toString(), "of", grantAdminTx.gasLimit.toString());
  console.log("Block #:        ", grantAdminReceipt.blockNumber);

  console.log("\nDeployment Summary:");
  console.log("===================");
  console.log("1. Role Setup:");
  console.log("   - Deployer has ORGANIZER_ROLE");
  console.log("   - ProfileNFTMinter authorized as FAN_ASSIGNER");
  console.log("2. Contract Initialization:");
  console.log("   - All contracts deployed and initialized");
  console.log("   - Deployer set as points verifier");
  console.log("3. Network Details:");
  console.log("   - Network: Local Hardhat Network");
  console.log("   - Chain ID: 31337");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 