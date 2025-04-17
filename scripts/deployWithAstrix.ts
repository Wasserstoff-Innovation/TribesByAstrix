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
  
  // Deploy Astrix Token (new)
  const initialSupply = ethers.parseEther("100000000"); // 100 million tokens
  const AstrixToken = await ethers.getContractFactory("AstrixToken");
  const astrixToken = await AstrixToken.deploy(initialSupply, deployer.address);
  await astrixToken.waitForDeployment();
  console.log("AstrixToken deployed to:", await astrixToken.getAddress());

  // Deploy Token Dispenser (new)
  const TokenDispenser = await ethers.getContractFactory("TokenDispenser");
  const tokenDispenser = await TokenDispenser.deploy(await astrixToken.getAddress(), deployer.address);
  await tokenDispenser.waitForDeployment();
  console.log("TokenDispenser deployed to:", await tokenDispenser.getAddress());

  // Deploy AstrixPointSystem (new)
  const AstrixPointSystem = await ethers.getContractFactory("AstrixPointSystem");
  const astrixPointSystem = await AstrixPointSystem.deploy(
    await roleManager.getAddress(),
    await tribeController.getAddress(),
    await astrixToken.getAddress(),
    await tokenDispenser.getAddress()
  );
  await astrixPointSystem.waitForDeployment();
  console.log("AstrixPointSystem deployed to:", await astrixPointSystem.getAddress());

  // For backward compatibility, also deploy the original PointSystem
  const PointSystem = await ethers.getContractFactory("PointSystem");
  const pointSystem = await PointSystem.deploy(
    await roleManager.getAddress(),
    await tribeController.getAddress()
  );
  await pointSystem.waitForDeployment();
  console.log("PointSystem (legacy) deployed to:", await pointSystem.getAddress());

  // Deploy CollectibleController
  const CollectibleController = await ethers.getContractFactory("CollectibleController");
  const collectibleController = await CollectibleController.deploy(
    await roleManager.getAddress(),
    await tribeController.getAddress(),
    await astrixPointSystem.getAddress() // Use the new AstrixPointSystem
  );
  await collectibleController.waitForDeployment();
  console.log("CollectibleController deployed to:", await collectibleController.getAddress());

  // Deploy PostFeedManager
  const PostFeedManager = await ethers.getContractFactory("PostFeedManager");
  const postFeedManager = await PostFeedManager.deploy(await tribeController.getAddress());
  await postFeedManager.waitForDeployment();
  console.log("PostFeedManager deployed to:", await postFeedManager.getAddress());

  // Deploy PostMinter
  const PostMinter = await ethers.getContractFactory("PostMinter");
  const postMinter = await PostMinter.deploy(
    await roleManager.getAddress(),
    await tribeController.getAddress(),
    await collectibleController.getAddress(),
    await postFeedManager.getAddress()
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

  // Grant admin role to PostMinter in PostFeedManager
  await postFeedManager.grantRole(await postFeedManager.DEFAULT_ADMIN_ROLE(), await postMinter.getAddress());

  // Setup for Astrix Token system (new)
  // Grant spender role to AstrixPointSystem in TokenDispenser
  await tokenDispenser.grantSpenderRole(await astrixPointSystem.getAddress());
  
  // Transfer some tokens to the token dispenser for testing
  await astrixToken.transfer(await tokenDispenser.getAddress(), ethers.parseEther("1000000"));

  console.log("\nContract Addresses:");
  console.log("===================");
  console.log(`RoleManager: ${await roleManager.getAddress()}`);
  console.log(`ProfileNFTMinter: ${await profileNFTMinter.getAddress()}`);
  console.log(`TribeController: ${await tribeController.getAddress()}`);
  console.log(`AstrixToken: ${await astrixToken.getAddress()}`);
  console.log(`TokenDispenser: ${await tokenDispenser.getAddress()}`);
  console.log(`AstrixPointSystem: ${await astrixPointSystem.getAddress()}`);
  console.log(`PointSystem (legacy): ${await pointSystem.getAddress()}`);
  console.log(`CollectibleController: ${await collectibleController.getAddress()}`);
  console.log(`PostFeedManager: ${await postFeedManager.getAddress()}`);
  console.log(`PostMinter: ${await postMinter.getAddress()}`);
  console.log(`Voting: ${await voting.getAddress()}`);
  console.log(`CommunityPoints: ${await communityPoints.getAddress()}`);
  console.log(`EventController: ${await eventController.getAddress()}`);
  console.log(`SuperCommunityController: ${await superCommunityController.getAddress()}`);

  console.log("\nAstrix Token Configuration:");
  console.log("==========================");
  console.log(`Total Supply: ${ethers.formatEther(await astrixToken.totalSupply())} ASTRX`);
  console.log(`Deployer Balance: ${ethers.formatEther(await astrixToken.balanceOf(deployer.address))} ASTRX`);
  console.log(`TokenDispenser Balance: ${ethers.formatEther(await astrixToken.balanceOf(await tokenDispenser.getAddress()))} ASTRX`);

  console.log("\nDeployment Verification:");
  console.log("=======================");
  console.log("1. Role Setup:");
  console.log("   - Deployer has ORGANIZER_ROLE");
  console.log("   - ProfileNFTMinter authorized as FAN_ASSIGNER");
  console.log("   - AstrixPointSystem authorized as spender in TokenDispenser");
  console.log("2. Token Setup:");
  console.log("   - Astrix tokens minted to deployer");
  console.log("   - Some tokens transferred to dispenser for testing");
  console.log("3. Contract Initialization:");
  console.log("   - All contracts deployed and initialized");
  console.log("   - Deployer set as points verifier");
  console.log("4. Network Details:");
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