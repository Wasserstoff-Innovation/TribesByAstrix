import { ethers, upgrades } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { EventLog } from "ethers";
import {
  RoleManager,
  TribeController,
  AstrixToken,
  TokenDispenser,
  PointSystem,
  CollectibleController,
  PostFeedManager,
  PostMinterProxy,
  PostCreationManager,
  PostEncryptionManager,
  PostInteractionManager,
  PostQueryManager,
  PostMinter
} from "../../typechain-types";

/**
 * Interface for deployed contract suite
 */
export interface DeployedContracts {
  roleManager: RoleManager;
  tribeController: TribeController;
  astrixToken: AstrixToken;
  tokenDispenser: TokenDispenser;
  pointSystem: PointSystem;
  collectibleController: CollectibleController;
  postFeedManager: PostFeedManager;
  postMinter: PostMinter;
  creationManager?: PostCreationManager;
  encryptionManager?: PostEncryptionManager;
  interactionManager?: PostInteractionManager;
  queryManager?: PostQueryManager;
}

/**
 * Deployment result with contracts and signers
 */
export interface DeploymentResult {
  contracts: DeployedContracts;
  signers: {
    owner: SignerWithAddress;
    admin: SignerWithAddress;
    contentCreator: SignerWithAddress;
    moderator: SignerWithAddress;
    regularUser1: SignerWithAddress;
    regularUser2: SignerWithAddress;
    bannedUser: SignerWithAddress;
  };
}

/**
 * Setup roles for testing
 */
export async function setupRoles(
  roleManager: RoleManager, 
  postMinter: PostMinter,
  admin: SignerWithAddress,
  contentCreator: SignerWithAddress,
  moderator: SignerWithAddress,
  owner: SignerWithAddress,
  regularUser1: SignerWithAddress,
  regularUser2: SignerWithAddress
) {
  const ADMIN_ROLE = await roleManager.DEFAULT_ADMIN_ROLE();
  const ORGANIZER_ROLE = await roleManager.ORGANIZER_ROLE();
  const ARTIST_ROLE = await roleManager.ARTIST_ROLE();
  const MODERATOR_ROLE = await roleManager.MODERATOR_ROLE();
  
  // Grant roles
  await roleManager.grantRole(ADMIN_ROLE, admin.address);
  await roleManager.grantRole(ORGANIZER_ROLE, admin.address);
  await roleManager.grantRole(ARTIST_ROLE, contentCreator.address);
  await roleManager.grantRole(MODERATOR_ROLE, moderator.address);
  
  // For testing purposes, grant some roles to regular users
  await roleManager.grantRole(ARTIST_ROLE, regularUser1.address);
  
  // Setup rate limit bypass for testing
  const postMinterAddress = await postMinter.getAddress();
  
  console.log("Setting up roles for PostMinter tests");
  
  // Get the individual manager contracts if they exist
  try {
    const creationManagerAddress = await postMinter.creationManager();
    const encryptionManagerAddress = await postMinter.encryptionManager();
    const interactionManagerAddress = await postMinter.interactionManager();
    const queryManagerAddress = await postMinter.queryManager();
    
    if (creationManagerAddress && creationManagerAddress !== ethers.ZeroAddress) {
      const creationManager = await ethers.getContractAt("PostCreationManager", creationManagerAddress);
      const RATE_LIMIT_MANAGER_ROLE = await creationManager.RATE_LIMIT_MANAGER_ROLE();
      const DEFAULT_ADMIN_ROLE = await creationManager.DEFAULT_ADMIN_ROLE();
      
      // Grant rate limit management to admin for testing
      await creationManager.grantRole(RATE_LIMIT_MANAGER_ROLE, admin.address);
      await creationManager.grantRole(DEFAULT_ADMIN_ROLE, admin.address);
      
      // Grant roles to test users for direct manager contract testing
      console.log("Granting test roles to users in creation manager");
      await creationManager.grantRole(DEFAULT_ADMIN_ROLE, regularUser1.address);
      await creationManager.grantRole(DEFAULT_ADMIN_ROLE, regularUser2.address);
      await creationManager.grantRole(DEFAULT_ADMIN_ROLE, contentCreator.address);
      await creationManager.grantRole(RATE_LIMIT_MANAGER_ROLE, regularUser1.address);
      await creationManager.grantRole(RATE_LIMIT_MANAGER_ROLE, regularUser2.address);
      await creationManager.grantRole(RATE_LIMIT_MANAGER_ROLE, contentCreator.address);
    }
    
    if (encryptionManagerAddress && encryptionManagerAddress !== ethers.ZeroAddress) {
      const encryptionManager = await ethers.getContractAt("PostEncryptionManager", encryptionManagerAddress);
      const DEFAULT_ADMIN_ROLE = await encryptionManager.DEFAULT_ADMIN_ROLE();
      console.log("Granting test roles to users in encryption manager");
      await encryptionManager.grantRole(DEFAULT_ADMIN_ROLE, regularUser1.address);
      await encryptionManager.grantRole(DEFAULT_ADMIN_ROLE, regularUser2.address);
      await encryptionManager.grantRole(DEFAULT_ADMIN_ROLE, contentCreator.address);
    }
    
    if (interactionManagerAddress && interactionManagerAddress !== ethers.ZeroAddress) {
      const interactionManager = await ethers.getContractAt("PostInteractionManager", interactionManagerAddress);
      const DEFAULT_ADMIN_ROLE = await interactionManager.DEFAULT_ADMIN_ROLE();
      console.log("Granting test roles to users in interaction manager");
      await interactionManager.grantRole(DEFAULT_ADMIN_ROLE, regularUser1.address);
      await interactionManager.grantRole(DEFAULT_ADMIN_ROLE, regularUser2.address);
      await interactionManager.grantRole(DEFAULT_ADMIN_ROLE, contentCreator.address);
    }
    
    if (queryManagerAddress && queryManagerAddress !== ethers.ZeroAddress) {
      const queryManager = await ethers.getContractAt("PostQueryManager", queryManagerAddress);
      const DEFAULT_ADMIN_ROLE = await queryManager.DEFAULT_ADMIN_ROLE();
      console.log("Granting test roles to users in query manager");
      await queryManager.grantRole(DEFAULT_ADMIN_ROLE, regularUser1.address);
      await queryManager.grantRole(DEFAULT_ADMIN_ROLE, regularUser2.address);
      await queryManager.grantRole(DEFAULT_ADMIN_ROLE, contentCreator.address);
    }
  } catch (error) {
    console.warn("Error setting up manager contract roles:", error);
  }
}

/**
 * Deploy all contracts for testing
 */
export async function deployContracts(): Promise<DeploymentResult> {
  // Get signers
  const [owner, admin, contentCreator, moderator, regularUser1, regularUser2, bannedUser] = await ethers.getSigners();
  
  console.log("Deploying contracts for testing");
  
  // Deploy RoleManager
  const RoleManager = await ethers.getContractFactory("RoleManager");
  const roleManager = await upgrades.deployProxy(RoleManager, [], { kind: 'uups' });
  await roleManager.waitForDeployment();
  const roleManagerAddress = await roleManager.getAddress();
  console.log("RoleManager deployed at:", roleManagerAddress);

  // Deploy TribeController
  const TribeController = await ethers.getContractFactory("TribeController");
  const tribeController = await upgrades.deployProxy(TribeController, [roleManagerAddress], { kind: 'uups' });
  await tribeController.waitForDeployment();
  const tribeControllerAddress = await tribeController.getAddress();
  console.log("TribeController deployed at:", tribeControllerAddress);

  // Deploy AstrixToken
  const initialSupply = ethers.parseEther("100000000"); // 100 million tokens
  const AstrixToken = await ethers.getContractFactory("AstrixToken");
  const astrixToken = await upgrades.deployProxy(AstrixToken, [initialSupply, owner.address], { kind: 'uups' });
  await astrixToken.waitForDeployment();
  const astrixTokenAddress = await astrixToken.getAddress();
  console.log("AstrixToken deployed at:", astrixTokenAddress);

  // Deploy TokenDispenser
  const TokenDispenser = await ethers.getContractFactory("TokenDispenser");
  const tokenDispenser = await upgrades.deployProxy(TokenDispenser, [astrixTokenAddress, owner.address], { kind: 'uups' });
  await tokenDispenser.waitForDeployment();
  const tokenDispenserAddress = await tokenDispenser.getAddress();
  console.log("TokenDispenser deployed at:", tokenDispenserAddress);

  // Deploy PointSystem with initialize
  const PointSystem = await ethers.getContractFactory("PointSystem");
  const pointSystem = await upgrades.deployProxy(PointSystem, 
    [roleManagerAddress, tribeControllerAddress], 
    { kind: 'uups' }
  );
  await pointSystem.waitForDeployment();
  const pointSystemAddress = await pointSystem.getAddress();
  console.log("PointSystem deployed at:", pointSystemAddress);

  // Deploy CollectibleController
  const CollectibleController = await ethers.getContractFactory("CollectibleController");
  const collectibleController = await upgrades.deployProxy(CollectibleController, [
    roleManagerAddress,
    tribeControllerAddress,
    pointSystemAddress
  ], { kind: 'uups', unsafeAllow: ['constructor'] });
  await collectibleController.waitForDeployment();
  const collectibleControllerAddress = await collectibleController.getAddress();
  console.log("CollectibleController deployed at:", collectibleControllerAddress);

  // Deploy PostFeedManager
  const PostFeedManager = await ethers.getContractFactory("PostFeedManager");
  const postFeedManager = await PostFeedManager.deploy(tribeControllerAddress);
  await postFeedManager.waitForDeployment();
  const postFeedManagerAddress = await postFeedManager.getAddress();
  console.log("PostFeedManager deployed at:", postFeedManagerAddress);

  // Grant SPENDER_ROLE to PointSystem in TokenDispenser
  const SPENDER_ROLE = await tokenDispenser.SPENDER_ROLE();
  await tokenDispenser.grantRole(SPENDER_ROLE, pointSystemAddress);

  console.log("Deploying PostMinter system...");
  
  // Deploy the manager contracts first
  const PostCreationManager = await ethers.getContractFactory("PostCreationManager");
  const creationManager = await upgrades.deployProxy(PostCreationManager, [
    roleManagerAddress,
    tribeControllerAddress,
    collectibleControllerAddress,
    postFeedManagerAddress
  ], { 
    kind: 'uups',
    unsafeAllow: ['constructor'] 
  });
  await creationManager.waitForDeployment();
  const creationManagerAddress = await creationManager.getAddress();
  console.log("PostCreationManager deployed at:", creationManagerAddress);
  
  const PostEncryptionManager = await ethers.getContractFactory("PostEncryptionManager");
  const encryptionManager = await upgrades.deployProxy(PostEncryptionManager, [
    roleManagerAddress,
    tribeControllerAddress,
    collectibleControllerAddress,
    postFeedManagerAddress
  ], { 
    kind: 'uups',
    unsafeAllow: ['constructor'] 
  });
  await encryptionManager.waitForDeployment();
  const encryptionManagerAddress = await encryptionManager.getAddress();
  console.log("PostEncryptionManager deployed at:", encryptionManagerAddress);
  
  const PostInteractionManager = await ethers.getContractFactory("PostInteractionManager");
  const interactionManager = await upgrades.deployProxy(PostInteractionManager, [
    roleManagerAddress,
    tribeControllerAddress,
    collectibleControllerAddress,
    postFeedManagerAddress
  ], { 
    kind: 'uups',
    unsafeAllow: ['constructor'] 
  });
  await interactionManager.waitForDeployment();
  const interactionManagerAddress = await interactionManager.getAddress();
  console.log("PostInteractionManager deployed at:", interactionManagerAddress);
  
  const PostQueryManager = await ethers.getContractFactory("PostQueryManager");
  const queryManager = await upgrades.deployProxy(PostQueryManager, [
    roleManagerAddress,
    tribeControllerAddress,
    collectibleControllerAddress,
    postFeedManagerAddress
  ], { 
    kind: 'uups',
    unsafeAllow: ['constructor'] 
  });
  await queryManager.waitForDeployment();
  const queryManagerAddress = await queryManager.getAddress();
  console.log("PostQueryManager deployed at:", queryManagerAddress);
  
  // Deploy PostMinter (PostMinterProxy) with all 8 parameters
  const PostMinter = await ethers.getContractFactory("PostMinterProxy");
  const postMinter = await upgrades.deployProxy(PostMinter, [
    roleManagerAddress,
    tribeControllerAddress,
    collectibleControllerAddress,
    postFeedManagerAddress,
    creationManagerAddress,
    encryptionManagerAddress,
    interactionManagerAddress,
    queryManagerAddress
  ], { 
    kind: 'uups',
    unsafeAllow: ['constructor'] 
  });
  await postMinter.waitForDeployment();
  const postMinterAddress = await postMinter.getAddress();
  console.log("PostMinterProxy deployed at:", postMinterAddress);
  
  // Grant permissions to PostMinterProxy in PostFeedManager
  const ADMIN_ROLE = await postFeedManager.DEFAULT_ADMIN_ROLE();
  await postFeedManager.grantRole(ADMIN_ROLE, postMinterAddress);
  console.log("Granted admin rights to PostMinterProxy in PostFeedManager");
  
  // Also grant rights to individual managers in the feed manager
  await postFeedManager.grantRole(ADMIN_ROLE, creationManagerAddress);
  await postFeedManager.grantRole(ADMIN_ROLE, encryptionManagerAddress);
  await postFeedManager.grantRole(ADMIN_ROLE, interactionManagerAddress);
  await postFeedManager.grantRole(ADMIN_ROLE, queryManagerAddress);
  console.log("Granted admin rights to all managers in PostFeedManager");
  
  // Create a test tribe for reuse in tests
  console.log("Creating a test tribe for all tests to use");
  const tribeTx = await tribeController.connect(admin).createTribe(
    "Default Test Tribe",
    JSON.stringify({ name: "Default Test Tribe", description: "A default test tribe for all tests" }),
    [admin.address, moderator.address, contentCreator.address, regularUser1.address, regularUser2.address],
    0, // PUBLIC
    0, // No entry fee
    [] // No NFT requirements
  );
  const tribeReceipt = await tribeTx.wait();
  // Extract tribe ID from the event
  const tribeCreatedEvent = tribeReceipt?.logs.find(
    x => x instanceof EventLog && x.eventName === "TribeCreated"
  ) as EventLog;
  const defaultTribeId = tribeCreatedEvent ? Number(tribeCreatedEvent.args[0]) : 0;
  console.log(`Default tribe created with ID: ${defaultTribeId}`);
  
  // Ensure all test users are members of the tribe
  console.log("Ensuring test users are tribe members");
  // Admin is already a member from createTribe
  await tribeController.connect(contentCreator).joinTribe(defaultTribeId);
  await tribeController.connect(moderator).joinTribe(defaultTribeId);
  await tribeController.connect(regularUser1).joinTribe(defaultTribeId);
  await tribeController.connect(regularUser2).joinTribe(defaultTribeId);
  console.log("All test users added as tribe members");
  
  // Initialize result object
  const result: DeploymentResult = {
    contracts: {
      roleManager,
      tribeController,
      astrixToken,
      tokenDispenser,
      pointSystem,
      collectibleController,
      postFeedManager,
      postMinter: postMinter as unknown as PostMinter,
      creationManager,
      encryptionManager,
      interactionManager,
      queryManager
    },
    signers: {
      owner,
      admin,
      contentCreator,
      moderator,
      regularUser1,
      regularUser2,
      bannedUser
    }
  };
  
  // Setup roles
  await setupRoles(
    roleManager, 
    result.contracts.postMinter,
    admin, 
    contentCreator, 
    moderator, 
    owner, 
    regularUser1, 
    regularUser2
  );
  
  console.log("Contract deployment and setup completed");
  
  return result;
}

export default deployContracts; 