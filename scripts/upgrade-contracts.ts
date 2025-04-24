import { ethers, upgrades, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

/**
 * Enhanced Contract Upgrade Script
 * Supports:
 * 1. Upgrading individual contracts
 * 2. Upgrading all contracts (--all flag)
 * 3. Upgrading just PostMinter components (--postminter flag)
 * 4. Storage layout validation prior to upgrade (--validate flag)
 * 
 * Usage:
 * npx hardhat run scripts/upgrade-contracts.ts --network [network-name] [options] [contracts]
 * 
 * Options:
 * --all: Upgrade all upgradeable contracts
 * --postminter: Upgrade only PostMinter related contracts
 * --validate: Run storage layout validation before upgrading
 * 
 * Examples:
 * 1. Upgrade a single contract:
 *    npx hardhat run scripts/upgrade-contracts.ts --network lineaSepolia TribeController
 * 
 * 2. Upgrade all contracts:
 *    npx hardhat run scripts/upgrade-contracts.ts --network lineaSepolia --all
 * 
 * 3. Upgrade all PostMinter components:
 *    npx hardhat run scripts/upgrade-contracts.ts --network lineaSepolia --postminter
 * 
 * 4. Validate and upgrade multiple contracts:
 *    npx hardhat run scripts/upgrade-contracts.ts --network lineaSepolia --validate TribeController TokenDispenser
 */

// List of PostMinter components
const POST_MINTER_COMPONENTS = [
  "PostMinterProxy",
  "PostCreationManager",
  "PostEncryptionManager",
  "PostInteractionManager",
  "PostQueryManager"
];

// Contracts that are not upgradeable (to skip them when --all is used)
const NON_UPGRADEABLE_CONTRACTS = [
  "AstrixPointSystem", 
  "PostFeedManager"
];

// Check if storage layout validation is needed before upgrading
async function validateStorageLayout(contractName: string): Promise<boolean> {
  try {
    console.log(`Validating storage layout for ${contractName}...`);
    const { stdout, stderr } = await execAsync(`npx hardhat check-storage ${contractName} --network ${network.name}`);
    console.log(stdout);
    if (stderr) console.error(stderr);
    
    // If validation fails, it will have thrown an error
    console.log(`✅ Storage layout validation passed for ${contractName}`);
    return true;
  } catch (error) {
    console.error(`❌ Storage layout validation failed for ${contractName}:`, error);
    return false;
  }
}

async function upgradeContract(contractName: string, proxyAddress: string, validate: boolean = false): Promise<boolean> {
  console.log(`\n📝 Preparing to upgrade ${contractName} at address ${proxyAddress}...`);
  
  // Validate storage layout if requested
  if (validate) {
    const isValid = await validateStorageLayout(contractName);
    if (!isValid) {
      console.error(`⛔ Skipping upgrade of ${contractName} due to storage layout validation failure.`);
      return false;
    }
  }
  
  // Get the contract factory for the contract to upgrade
  try {
    const ContractFactory = await ethers.getContractFactory(contractName);
    console.log(`Upgrading ${contractName}...`);
    
    const upgraded = await upgrades.upgradeProxy(proxyAddress, ContractFactory);
    await upgraded.waitForDeployment();
    
    // Get the new implementation address
    const newImplementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);
    console.log(`✅ ${contractName} upgraded successfully`);
    console.log(`New implementation: ${newImplementationAddress}`);
    console.log(`Proxy address (unchanged): ${proxyAddress}`);
    
    return true;
  } catch (error) {
    console.error(`❌ Error upgrading ${contractName}:`, error);
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  // Parse options
  const upgradeAll = args.includes('--all');
  const upgradePostMinter = args.includes('--postminter');
  const validateStorageLayouts = args.includes('--validate');
  
  // Remove options from args to get contract names
  const contractsToUpgrade = args.filter(arg => !arg.startsWith('--'));
  
  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log(`Using deployer address: ${deployer.address}`);
  
  // Load deployment info
  const deploymentPath = path.join(__dirname, "..", "deployments", `${network.name}-latest.json`);
  if (!fs.existsSync(deploymentPath)) {
    throw new Error(`Deployment file not found: ${deploymentPath}. Please deploy contracts first.`);
  }
  
  const deploymentData = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
  console.log(`Using contracts deployed to ${network.name}`);
  
  const contracts = deploymentData.contracts;
  let contractsToProcess: string[] = [];
  
  // Determine which contracts to upgrade
  if (upgradeAll) {
    contractsToProcess = Object.keys(contracts).filter(name => 
      !NON_UPGRADEABLE_CONTRACTS.includes(name) &&
      name !== 'ModularPostMinter' // Skip this special record
    );
  } else if (upgradePostMinter) {
    contractsToProcess = POST_MINTER_COMPONENTS;
  } else if (contractsToUpgrade.length > 0) {
    contractsToProcess = contractsToUpgrade;
  } else {
    console.error("Error: No contracts specified for upgrade");
    console.log(`
Usage: npx hardhat run scripts/upgrade-contracts.ts --network [network-name] [options] [contracts]

Options:
  --all: Upgrade all upgradeable contracts
  --postminter: Upgrade only PostMinter related contracts
  --validate: Run storage layout validation before upgrading
    `);
    return;
  }
  
  console.log(`Will attempt to upgrade ${contractsToProcess.length} contracts: ${contractsToProcess.join(', ')}`);
  
  // Track upgrade results
  const results = {
    succeeded: [] as string[],
    failed: [] as string[]
  };
  
  // Handle special case for ModularPostMinter components
  for (const contractName of contractsToProcess) {
    let proxyAddress: string;
    
    // Special handling for PostMinter components
    if (contractName === 'PostMinterProxy') {
      // Use either the ModularPostMinter or PostMinter address
      proxyAddress = contracts.ModularPostMinter 
        ? contracts.ModularPostMinter.proxy 
        : contracts.PostMinter.proxy;
    } 
    else if (POST_MINTER_COMPONENTS.includes(contractName) && contractName !== 'PostMinterProxy') {
      // For other PostMinter components, get from ModularPostMinter.managers
      if (!contracts.ModularPostMinter || !contracts.ModularPostMinter.managers) {
        console.error(`❌ Cannot upgrade ${contractName} - ModularPostMinter data not found in deployment`);
        results.failed.push(contractName);
        continue;
      }
      
      // Match component name to manager key (e.g., PostCreationManager -> creation)
      const managerKey = contractName.replace('Post', '').replace('Manager', '').toLowerCase();
      proxyAddress = contracts.ModularPostMinter.managers[managerKey];
      
      if (!proxyAddress) {
        console.error(`❌ Cannot find proxy address for ${contractName}`);
        results.failed.push(contractName);
        continue;
      }
    }
    else {
      // Regular contracts
      if (!contracts[contractName]) {
        console.error(`❌ Contract ${contractName} not found in deployment data`);
        results.failed.push(contractName);
        continue;
      }
      
      proxyAddress = contracts[contractName].proxy;
    }
    
    // Upgrade the contract
    const success = await upgradeContract(contractName, proxyAddress, validateStorageLayouts);
    
    if (success) {
      results.succeeded.push(contractName);
      
      // If successful, update implementation address in deployment data
      try {
        const newImplementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);
        
        // Update the implementation address in deployment data
        if (POST_MINTER_COMPONENTS.includes(contractName) && contractName !== 'PostMinterProxy') {
          // Don't update managers implementation addresses for now
        } else if (contractName === 'PostMinterProxy') {
          // Update both ModularPostMinter and PostMinter for backward compatibility
          if (contracts.ModularPostMinter) {
            contracts.ModularPostMinter.implementation = newImplementationAddress;
          }
          if (contracts.PostMinter) {
            contracts.PostMinter.implementation = newImplementationAddress;
          }
        } else {
          // Regular contract update
          contracts[contractName].implementation = newImplementationAddress;
        }
      } catch (error) {
        console.error(`Error updating implementation address for ${contractName}:`, error);
      }
    } else {
      results.failed.push(contractName);
    }
  }
  
  // Save updated deployment data
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentData, null, 2));
  console.log(`Updated deployment data saved to: ${deploymentPath}`);
  
  // Print summary
  console.log("\n====== UPGRADE SUMMARY ======");
  console.log(`✅ Successfully upgraded: ${results.succeeded.length} contracts`);
  if (results.succeeded.length > 0) {
    console.log(results.succeeded.join(', '));
  }
  
  console.log(`❌ Failed to upgrade: ${results.failed.length} contracts`);
  if (results.failed.length > 0) {
    console.log(results.failed.join(', '));
  }
}

// Execute directly
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Error:", error);
      process.exit(1);
    });
}

export default main; 