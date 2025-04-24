import { ethers, upgrades, network } from "hardhat";
import { Contract } from "ethers";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

// --- Interfaces ---
interface ContractDeploymentInfo {
  address: string;
  implementation?: string;
  abi: any;
}

interface ModularPostMinterDeploymentInfo {
  proxy: ContractDeploymentInfo;
  managers: {
    creation: ContractDeploymentInfo;
    encryption: ContractDeploymentInfo;
    interaction: ContractDeploymentInfo;
    query: ContractDeploymentInfo;
  };
}

interface ContractsData {
    RoleManager?: ContractDeploymentInfo;
    TribeController?: ContractDeploymentInfo;
    AstrixToken?: ContractDeploymentInfo;
    TokenDispenser?: ContractDeploymentInfo;
    PointSystem?: ContractDeploymentInfo;
    CollectibleController?: ContractDeploymentInfo;
    PostFeedManager?: { address: string; abi: any; };
    ProfileNFTMinter?: { address: string; abi: any; };
    EventController?: { address: string; abi: any; };
    PostMinter?: ContractDeploymentInfo;
    ModularPostMinter?: ModularPostMinterDeploymentInfo;
}

interface DeploymentData {
  network: string;
  chainId: number;
  date: string;
  contracts: ContractsData;
}

// --- Helper Functions ---

async function deployUpgradeableContract(contractName: string, args: any[] = [], options: object = { kind: 'uups' }): Promise<Contract> {
  console.log(`Deploying ${contractName}...`);
  const ContractFactory = await ethers.getContractFactory(contractName);
  const contract = await upgrades.deployProxy(ContractFactory, args, options);
  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();
  console.log(`   ${contractName} deployed to proxy: ${contractAddress}`);
  return contract as Contract;
}

async function deployNonUpgradeableContract(contractName: string, args: any[] = []): Promise<Contract> {
  console.log(`Deploying ${contractName}...`);
  const ContractFactory = await ethers.getContractFactory(contractName);
  const contract = await ContractFactory.deploy(...args);
  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();
  console.log(`   ${contractName} deployed to: ${contractAddress}`);
  return contract as Contract;
}

async function saveContractInfo(
  targetObject: any, 
  contractName: string,
  contract: Contract,
  isUpgradeable: boolean
): Promise<void> {
  const address = await contract.getAddress();
  let implementationAddress: string | undefined = undefined;
  
  if (isUpgradeable) {
    try {
      implementationAddress = await upgrades.erc1967.getImplementationAddress(address);
      console.log(`   Implementation address for ${contractName}: ${implementationAddress}`);
    } catch (error) {
      console.warn(`   Could not get implementation address for ${contractName}. It might not be an upgradeable proxy.`);
    }
  }

  targetObject[contractName] = { 
    address: address,
    implementation: implementationAddress,
    abi: JSON.parse(contract.interface.formatJson())
  };
}

async function saveModularPostMinterInfo(
    contractsObject: ContractsData,
    proxyContract: Contract,
    managers: { creation: Contract; encryption: Contract; interaction: Contract; query: Contract; }
): Promise<void> {
    const proxyInfoContainer: { proxy?: ContractDeploymentInfo } = {};
    const managersInfo: ModularPostMinterDeploymentInfo['managers'] = {
        creation: {} as ContractDeploymentInfo,
        encryption: {} as ContractDeploymentInfo,
        interaction: {} as ContractDeploymentInfo,
        query: {} as ContractDeploymentInfo,
    };
    const tempCreation: any = {};
    const tempEncryption: any = {};
    const tempInteraction: any = {};
    const tempQuery: any = {};

    await saveContractInfo(proxyInfoContainer, "proxy", proxyContract, true);
    await saveContractInfo(tempCreation, "creation", managers.creation, true);
    await saveContractInfo(tempEncryption, "encryption", managers.encryption, true);
    await saveContractInfo(tempInteraction, "interaction", managers.interaction, true);
    await saveContractInfo(tempQuery, "query", managers.query, true);

    managersInfo.creation = tempCreation.creation;
    managersInfo.encryption = tempEncryption.encryption;
    managersInfo.interaction = tempInteraction.interaction;
    managersInfo.query = tempQuery.query;

    const modularInfo: ModularPostMinterDeploymentInfo = {
        proxy: proxyInfoContainer.proxy!,
        managers: managersInfo
    };

    contractsObject.ModularPostMinter = modularInfo;
    contractsObject.PostMinter = modularInfo.proxy;
}

function saveDeploymentData(deploymentData: DeploymentData): void {
    const deploymentsDir = path.join(__dirname, "..", "deployments");
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }
    const networkName = deploymentData.network;
    const dateStr = new Date().toISOString().split('T')[0];
    const timestamp = Date.now();
    const filePathDate = path.join(deploymentsDir, `${networkName}-${dateStr}-${timestamp}.json`);
    fs.writeFileSync(filePathDate, JSON.stringify(deploymentData, null, 2));
    console.log(`\nDeployment data saved to: ${filePathDate}`);
    const latestFilePath = path.join(deploymentsDir, `${networkName}-latest.json`);
    fs.writeFileSync(latestFilePath, JSON.stringify(deploymentData, null, 2));
    console.log(`Updated latest deployment file: ${latestFilePath}`);
}

// --- Main Deployment Function ---

async function deployAllContracts(skipPostMinter: boolean = false) {
  console.log(`\n🚀 Starting Unified Deployment on ${network.name}...`);
  const [deployer] = await ethers.getSigners();
  console.log(`   Deployer: ${deployer.address}`);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`   Balance: ${ethers.formatEther(balance)} ETH`);

  if (balance < ethers.parseEther("0.05")) {
    console.warn(`   ⚠️ Warning: Deployer balance is low. Deployment might fail.`);
  }

  const networkData = await ethers.provider.getNetwork();
  const deploymentData: DeploymentData = {
    network: network.name,
    chainId: Number(networkData.chainId),
    date: new Date().toISOString(),
    contracts: {} as ContractsData
  };

  // STEP 1: Deploy Core Contracts
  console.log("\n=== Deploying Core Contracts ===");
  const roleManager = await deployUpgradeableContract("RoleManager");
  await saveContractInfo(deploymentData.contracts, "RoleManager", roleManager, true);

  const tribeController = await deployUpgradeableContract("TribeController", [await roleManager.getAddress()]);
  await saveContractInfo(deploymentData.contracts, "TribeController", tribeController, true);

  const initialSupply = ethers.parseEther("100000000"); 
  const astrixToken = await deployUpgradeableContract("AstrixToken", [initialSupply, deployer.address]);
  await saveContractInfo(deploymentData.contracts, "AstrixToken", astrixToken, true);
  
  const tokenDispenser = await deployUpgradeableContract("TokenDispenser", [await astrixToken.getAddress(), deployer.address]);
  await saveContractInfo(deploymentData.contracts, "TokenDispenser", tokenDispenser, true);

  console.log("Deploying PointSystem (upgradeable)...");
  const PointSystem = await ethers.getContractFactory("PointSystem");
  const pointSystem = await upgrades.deployProxy(PointSystem, [
      await roleManager.getAddress(),
      await tribeController.getAddress()
  ], { kind: 'uups', unsafeAllow: ['constructor'] });
  await pointSystem.waitForDeployment();
  console.log(`   PointSystem deployed to proxy: ${await pointSystem.getAddress()}`); 
  await saveContractInfo(deploymentData.contracts, "PointSystem", pointSystem as unknown as Contract, true);

  const collectibleController = await deployUpgradeableContract("CollectibleController", [
    await roleManager.getAddress(),
    await tribeController.getAddress(),
    await pointSystem.getAddress()
  ], { kind: 'uups', unsafeAllow: ['constructor'] });
  await saveContractInfo(deploymentData.contracts, "CollectibleController", collectibleController, true);

  const postFeedManager = await deployNonUpgradeableContract("PostFeedManager", [await tribeController.getAddress()]);
  await saveContractInfo(deploymentData.contracts, "PostFeedManager", postFeedManager, false);

  const profileNFTMinter = await deployNonUpgradeableContract("ProfileNFTMinter", [await roleManager.getAddress()]);
  await saveContractInfo(deploymentData.contracts, "ProfileNFTMinter", profileNFTMinter, false);

  const eventController = await deployNonUpgradeableContract("EventController", [await roleManager.getAddress()]);
  await saveContractInfo(deploymentData.contracts, "EventController", eventController, false);

  // STEP 2: Setup Initial Roles & Permissions
  console.log("\n=== Setting Initial Roles & Permissions ===");
  try {
    const spenderRole = await tokenDispenser.SPENDER_ROLE(); 
    await tokenDispenser.grantRole(spenderRole, await pointSystem.getAddress()); 
    console.log(`   Granted SPENDER_ROLE to PointSystem (${await pointSystem.getAddress()}) in TokenDispenser`);
  } catch(error) {
    console.error("   Error setting up initial permissions:", error);
  }

  // STEP 3: Deploy ModularPostMinter (optional)
  if (!skipPostMinter) {
    console.log("\n=== Deploying Modular PostMinter System ===");
    try {
      const roleMgrAddr = await roleManager.getAddress();
      const tribeCtrlAddr = await tribeController.getAddress();
      const collCtrlAddr = await collectibleController.getAddress();
      const feedMgrAddr = await postFeedManager.getAddress();

      const creationManager = await deployUpgradeableContract("PostCreationManager", [roleMgrAddr, tribeCtrlAddr, collCtrlAddr, feedMgrAddr]);
      const encryptionManager = await deployUpgradeableContract("PostEncryptionManager", [roleMgrAddr, tribeCtrlAddr, collCtrlAddr, feedMgrAddr]);
      const interactionManager = await deployUpgradeableContract("PostInteractionManager", [roleMgrAddr, tribeCtrlAddr, collCtrlAddr, feedMgrAddr]);
      const queryManager = await deployUpgradeableContract("PostQueryManager", [roleMgrAddr, tribeCtrlAddr, collCtrlAddr, feedMgrAddr]);

      const postMinterProxy = await deployUpgradeableContract("PostMinterProxy", [
        roleMgrAddr,
        tribeCtrlAddr,
        collCtrlAddr,
        feedMgrAddr, 
        await creationManager.getAddress(),
        await encryptionManager.getAddress(),
        await interactionManager.getAddress(),
        await queryManager.getAddress()
      ]);

      const postFeedManagerContract = await ethers.getContractAt("PostFeedManager", feedMgrAddr);
      const ADMIN_ROLE = await postFeedManagerContract.DEFAULT_ADMIN_ROLE();
      const tx = await postFeedManagerContract.grantRole(ADMIN_ROLE, await postMinterProxy.getAddress());
      await tx.wait();
      console.log(`   Granted DEFAULT_ADMIN_ROLE to PostMinterProxy (${await postMinterProxy.getAddress()}) in PostFeedManager`);

      await saveModularPostMinterInfo(deploymentData.contracts, postMinterProxy, {
          creation: creationManager,
          encryption: encryptionManager,
          interaction: interactionManager,
          query: queryManager
      });

    } catch (error) {
      console.error("   ❌ Error during Modular PostMinter deployment:", error);
      console.log("   Skipping PostMinter system deployment.");
    }
  } else {
    console.log("\n=== Skipping Modular PostMinter Deployment ===");
  }


  // STEP 4: Save Deployment Data
  console.log("\n=== Saving Deployment Data ===");
  saveDeploymentData(deploymentData);

  console.log("\n✅ Unified Deployment Finished Successfully!");
  return deploymentData;
}

// --- Main Execution ---
if (require.main === module) {
  const skipPostMinterArg = process.argv.includes('--skip-postminter');
  
  deployAllContracts(skipPostMinterArg)
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("\n🚨 Deployment failed:", error);
      process.exit(1);
    });
}

export default deployAllContracts; 