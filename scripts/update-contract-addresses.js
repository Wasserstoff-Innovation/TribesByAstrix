#!/usr/bin/env node

/**
 * Update SDK contract addresses with deployment data
 * 
 * Usage:
 * node scripts/update-contract-addresses.js --network monad-devnet [--file deployment-file.json] [--use-implementation]
 */

const fs = require('fs');
const path = require('path');
const { program } = require('commander');

// Setup command line options
program
  .option('-n, --network <network>', 'Target network (local, monad-devnet, polygon, mumbai, mainnet)')
  .option('-f, --file <file>', 'Optional: Deployment output JSON file path (defaults to latest)')
  .option('-i, --use-implementation', 'Use implementation addresses instead of proxy addresses', false)
  .parse(process.argv);

const options = program.opts();

// Map network argument to NetworkId
const networkMap = {
  'local': 'NetworkId.LOCAL',
  'monad-devnet': 'NetworkId.MONAD_DEVNET',
  'polygon': 'NetworkId.POLYGON',
  'mumbai': 'NetworkId.MUMBAI',
  'mainnet': 'NetworkId.MAINNET'
};

// Check for required arguments
if (!options.network) {
  console.error('Error: Missing required network argument');
  console.error('Usage: node update-contract-addresses.js --network <network>');
  process.exit(1);
}

// Network ID based on input
const networkId = networkMap[options.network];
if (!networkId) {
  console.error(`Error: Unknown network "${options.network}"`);
  console.error('Supported networks: local, monad-devnet, polygon, mumbai, mainnet');
  process.exit(1);
}

// Paths
let deploymentFilePath;
if (options.file) {
  deploymentFilePath = path.resolve(options.file);
} else {
  // Use latest deployment file if none specified
  const latestFile = path.resolve(`deployments/latest-${options.network}.json`);
  if (fs.existsSync(latestFile)) {
    deploymentFilePath = latestFile;
  } else {
    console.error(`Error: No deployment file specified and no latest deployment found for ${options.network}`);
    console.error(`Expected: ${latestFile}`);
    process.exit(1);
  }
}

const sdkContractsFilePath = path.resolve('sdk/src/config/contracts.ts');

// Read deployment output
let deploymentData;
try {
  const fileContent = fs.readFileSync(deploymentFilePath, 'utf8');
  deploymentData = JSON.parse(fileContent);
  console.log(`Successfully loaded deployment data from ${deploymentFilePath}`);
} catch (error) {
  console.error(`Error reading deployment file: ${error.message}`);
  process.exit(1);
}

// Read SDK contracts file
let sdkContractsContent;
try {
  sdkContractsContent = fs.readFileSync(sdkContractsFilePath, 'utf8');
  console.log(`Successfully loaded SDK contracts file from ${sdkContractsFilePath}`);
} catch (error) {
  console.error(`Error reading SDK contracts file: ${error.message}`);
  process.exit(1);
}

// Contract name mapping between deployment data and SDK
const contractMapping = {
  'RoleManager': 'roleManager',
  'TribeController': 'tribeController',
  'AstrixToken': 'astrixToken',
  'TokenDispenser': 'tokenDispenser',
  'PointSystem': 'astrixPointSystem',
  'CollectibleController': 'collectibleController',
  'PostFeedManager': 'postFeedManager',
  'PostMinter': 'postMinter',
  'ProfileNFTMinter': 'profileNFTMinter',
  'CommunityPoints': 'communityPoints',
  'EventController': 'eventController',
  'SuperCommunityController': 'superCommunityController',
  'Voting': 'voting'
};

// Extract contract addresses from deployment data
const addresses = {};

// Handle the new deployment data structure with 'contracts' field
if (deploymentData.contracts) {
  // New format (with contracts field)
  for (const [contractName, contractData] of Object.entries(deploymentData.contracts)) {
    const sdkName = contractMapping[contractName] || contractName.charAt(0).toLowerCase() + contractName.slice(1);
    
    // Skip if no mapping exists
    if (!sdkName) continue;
    
    // Use implementation or proxy address based on flag
    if (options.useImplementation && contractData.implementation) {
      addresses[sdkName] = contractData.implementation;
    } else if (contractData.proxy) {
      addresses[sdkName] = contractData.proxy;
    }
  }
} else {
  // Legacy format (direct contract data)
  for (const contractName in deploymentData) {
    if (contractName === 'network' || contractName === 'date' || contractName === 'saved' || contractName === 'fileName') {
      continue; // Skip metadata fields
    }
    
    const sdkName = contractMapping[contractName] || contractName.charAt(0).toLowerCase() + contractName.slice(1);
    
    // Skip if no mapping exists
    if (!sdkName) continue;
    
    // Use implementation or proxy address based on flag
    if (options.useImplementation && deploymentData[contractName].implementation) {
      addresses[sdkName] = deploymentData[contractName].implementation;
    } else if (deploymentData[contractName].proxy) {
      addresses[sdkName] = deploymentData[contractName].proxy;
    } else if (deploymentData[contractName].address) {
      addresses[sdkName] = deploymentData[contractName].address;
    }
  }
}

// Generate updated network section
let addressEntries = Object.entries(addresses)
  .map(([name, address]) => `    ${name}: '${address}'`)
  .join(',\n');

// Create the network section
const networkSection = `  [${networkId}]: {\n${addressEntries}\n  }`;

// Regular expression to find and replace the network section
const networkRegex = new RegExp(`\\s*\\[${networkId}\\]\\s*:\\s*\\{[^}]*\\}`, 'g');

// Update the content
const updatedContent = sdkContractsContent.replace(networkRegex, networkSection);

// Write the updated content back to the file
try {
  fs.writeFileSync(sdkContractsFilePath, updatedContent, 'utf8');
  console.log(`Successfully updated contract addresses for ${options.network} in ${sdkContractsFilePath}`);
} catch (error) {
  console.error(`Error writing to SDK contracts file: ${error.message}`);
  process.exit(1);
}

// Update exported constant in deployedContracts.ts 
const deployedContractsPath = path.resolve('sdk/src/config/deployedContracts.ts');
try {
  const deployedContractsTemplate = `/**
 * Auto-generated on ${new Date().toISOString()}
 * Contains the deployed contract addresses
 */

import { ContractAddresses } from '../types/contracts';

/**
 * Contract addresses from most recent deployment
 */
export const DEPLOYED_CONTRACTS: ContractAddresses = {
${Object.entries(addresses)
  .map(([name, address]) => `  ${name}: '${address}'`)
  .join(',\n')}
};
`;

  fs.writeFileSync(deployedContractsPath, deployedContractsTemplate, 'utf8');
  console.log(`Successfully updated deployed contracts in ${deployedContractsPath}`);
} catch (error) {
  console.error(`Error updating deployed contracts: ${error.message}`);
}

console.log('Contract addresses updated successfully!'); 