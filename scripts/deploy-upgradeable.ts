import { ethers, upgrades } from "hardhat";

interface ContractInfo {
  proxy: string;
  implementation?: string;
}

interface DeploymentData {
  network: string;
  date: string;
  contracts: Record<string, ContractInfo>;
}

async function main() {
  const [deployer] = await ethers.getSigners();
  
  // Deploy RoleManager with proxy
  const RoleManager = await ethers.getContractFactory("RoleManager");
  const roleManager = await upgrades.deployProxy(RoleManager, [], { kind: 'uups' });
  await roleManager.waitForDeployment();
  const roleManagerAddress = await roleManager.getAddress();

  // Deploy TribeController with proxy
  const TribeController = await ethers.getContractFactory("TribeController");
  const tribeController = await upgrades.deployProxy(TribeController, [roleManagerAddress], { kind: 'uups' });
  await tribeController.waitForDeployment();
  const tribeControllerAddress = await tribeController.getAddress();

  // Deploy AstrixToken with proxy
  const initialSupply = ethers.parseEther("100000000"); // 100 million tokens initial supply
  const AstrixToken = await ethers.getContractFactory("AstrixToken");
  const astrixToken = await upgrades.deployProxy(AstrixToken, [initialSupply, deployer.address], { kind: 'uups' });
  await astrixToken.waitForDeployment();
  const astrixTokenAddress = await astrixToken.getAddress();

  // Deploy TokenDispenser with proxy
  const TokenDispenser = await ethers.getContractFactory("TokenDispenser");
  const tokenDispenser = await upgrades.deployProxy(TokenDispenser, [astrixTokenAddress, deployer.address], { kind: 'uups' });
  await tokenDispenser.waitForDeployment();
  const tokenDispenserAddress = await tokenDispenser.getAddress();

  // Deploy PointSystem (upgrade to upgradeable)
  const PointSystem = await ethers.getContractFactory("PointSystem");
  const pointSystem = await upgrades.deployProxy(PointSystem, [
    roleManagerAddress,
    tribeControllerAddress
  ], { kind: 'uups', unsafeAllow: ['constructor'] });
  await pointSystem.waitForDeployment();
  const pointSystemAddress = await pointSystem.getAddress();

  // Deploy CollectibleController as upgradeable
  const CollectibleController = await ethers.getContractFactory("CollectibleController");
  const collectibleController = await upgrades.deployProxy(CollectibleController, [
    roleManagerAddress,
    tribeControllerAddress,
    pointSystemAddress
  ], { kind: 'uups', unsafeAllow: ['constructor'] });
  await collectibleController.waitForDeployment();
  const collectibleControllerAddress = await collectibleController.getAddress();

  // Deploy PostFeedManager (upgrade to upgradeable)
  const PostFeedManager = await ethers.getContractFactory("PostFeedManager");
  const postFeedManager = await upgrades.deployProxy(PostFeedManager, [
    tribeControllerAddress
  ], { kind: 'uups', unsafeAllow: ['constructor'] });
  await postFeedManager.waitForDeployment();
  const postFeedManagerAddress = await postFeedManager.getAddress();

  // Deploy PostMinter with proxy
  const PostMinter = await ethers.getContractFactory("PostMinter");
  const postMinter = await upgrades.deployProxy(PostMinter, [
    roleManagerAddress,
    tribeControllerAddress,
    collectibleControllerAddress,
    postFeedManagerAddress
  ], { kind: 'uups' });
  await postMinter.waitForDeployment();
  const postMinterAddress = await postMinter.getAddress();

  // Deploy additional contracts as upgradeable
  // Voting
  const Voting = await ethers.getContractFactory("Voting");
  const voting = await upgrades.deployProxy(Voting, [], { kind: 'uups', unsafeAllow: ['constructor'] });
  await voting.waitForDeployment();
  const votingAddress = await voting.getAddress();

  // CommunityPoints
  const CommunityPoints = await ethers.getContractFactory("CommunityPoints");
  const communityPoints = await upgrades.deployProxy(CommunityPoints, [
    roleManagerAddress,
    deployer.address // Initially set deployer as verifier
  ], { kind: 'uups', unsafeAllow: ['constructor'] });
  await communityPoints.waitForDeployment();
  const communityPointsAddress = await communityPoints.getAddress();

  // EventController
  const EventController = await ethers.getContractFactory("EventController");
  const eventController = await upgrades.deployProxy(EventController, [
    roleManagerAddress
  ], { kind: 'uups', unsafeAllow: ['constructor'] });
  await eventController.waitForDeployment();
  const eventControllerAddress = await eventController.getAddress();

  // ProfileNFTMinter
  const ProfileNFTMinter = await ethers.getContractFactory("ProfileNFTMinter");
  const profileNFTMinter = await upgrades.deployProxy(ProfileNFTMinter, [
    roleManagerAddress
  ], { kind: 'uups', unsafeAllow: ['constructor'] });
  await profileNFTMinter.waitForDeployment();
  const profileNFTMinterAddress = await profileNFTMinter.getAddress();

  // SuperCommunityController
  const SuperCommunityController = await ethers.getContractFactory("SuperCommunityController");
  const superCommunityController = await upgrades.deployProxy(SuperCommunityController, [
    roleManagerAddress,
    tribeControllerAddress
  ], { kind: 'uups', unsafeAllow: ['constructor'] });
  await superCommunityController.waitForDeployment();
  const superCommunityControllerAddress = await superCommunityController.getAddress();

  // Setup initial roles
  const ORGANIZER_ROLE = await roleManager.ORGANIZER_ROLE();
  const FAN_ASSIGNER_ROLE = await roleManager.FAN_ASSIGNER_ROLE();

  // Grant necessary roles
  await roleManager.authorizeFanAssigner(profileNFTMinterAddress);
  await roleManager.assignRole(deployer.address, ORGANIZER_ROLE);

  // Grant admin role to PostMinter in PostFeedManager
  await postFeedManager.grantRole(await postFeedManager.DEFAULT_ADMIN_ROLE(), postMinterAddress);

  // Create contract address map for deployment file
  const deploymentData: DeploymentData = {
    network: process.env.HARDHAT_NETWORK || 'hardhat',
    date: new Date().toISOString(),
    contracts: {
      RoleManager: { proxy: roleManagerAddress },
      TribeController: { proxy: tribeControllerAddress },
      AstrixToken: { proxy: astrixTokenAddress },
      TokenDispenser: { proxy: tokenDispenserAddress },
      PointSystem: { proxy: pointSystemAddress },
      CollectibleController: { proxy: collectibleControllerAddress },
      PostFeedManager: { proxy: postFeedManagerAddress },
      PostMinter: { proxy: postMinterAddress },
      Voting: { proxy: votingAddress },
      CommunityPoints: { proxy: communityPointsAddress },
      EventController: { proxy: eventControllerAddress },
      ProfileNFTMinter: { proxy: profileNFTMinterAddress },
      SuperCommunityController: { proxy: superCommunityControllerAddress }
    }
  };

  // Get implementation addresses
  for (const [name, data] of Object.entries(deploymentData.contracts)) {
    const proxyAddress = data.proxy;
    try {
      const implAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);
      deploymentData.contracts[name] = {
        ...data,
        implementation: implAddress
      };
    } catch (error) {
      console.error(`Failed to get implementation address for ${name}`);
    }
  }

  console.log("\nDeployment Complete");
  return deploymentData;
}

// Export for use in post-deployment scripts
module.exports = { deployContracts: main };

// Execute if run directly
if (require.main === module) {
  main()
    .then((deploymentData) => {
      console.log("Deployment Summary:");
      console.log(JSON.stringify(deploymentData, null, 2));
      process.exit(0);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
} 