#!/usr/bin/env node

/**
 * Upgrade Specific Contract Script
 * 
 * This script simplifies the process of upgrading a specific contract
 * in the Tribes by Astrix platform.
 * 
 * Usage:
 * node scripts/upgrade-specific-contract.js --contract TribeController --network monad-devnet --proxy 0x1234...
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { Command } = require('commander');

// Create CLI program
const program = new Command();

// Log with timestamp
function log(message, isError = false) {
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const output = `[${timestamp}] ${message}`;
  isError ? console.error(output) : console.log(output);
}

// Execute a command and return the result
function execute(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    log(`Executing: ${command} ${args.join(' ')}`);
    
    const proc = spawn(command, args, {
      stdio: 'inherit',
      ...options
    });
    
    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });
    
    proc.on('error', (err) => {
      reject(err);
    });
  });
}

// Get the correct network paths
function getNetworkInfo(network) {
  // Network for hardhat commands
  const hardhatNetwork = {
    'monad-devnet': 'monadDevnet',
    'mumbai': 'polygonMumbai',
    'polygon': 'polygon',
    'local': 'hardhat'
  }[network] || network;
  
  return { hardhatNetwork };
}

// Create temporary upgrade script
async function createTempUpgradeScript(contractName, proxyAddress) {
  const scriptContent = `
import { ethers, upgrades } from "hardhat";

async function main() {
  const CONTRACT_NAME = "${contractName}";
  const PROXY_ADDRESS = "${proxyAddress}";
  
  // Get the contract factory for the new implementation
  const ContractFactory = await ethers.getContractFactory(CONTRACT_NAME);
  
  // Upgrade the contract
  const upgradedContract = await upgrades.upgradeProxy(PROXY_ADDRESS, ContractFactory);
  await upgradedContract.waitForDeployment();
  
  // Get the new implementation address
  const newImplementationAddress = await upgrades.erc1967.getImplementationAddress(
    await upgradedContract.getAddress()
  );
  
  console.log({
    contract: CONTRACT_NAME,
    proxy: await upgradedContract.getAddress(),
    implementation: newImplementationAddress
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
`;

  const tempScriptPath = path.resolve('temp-upgrade-script.ts');
  fs.writeFileSync(tempScriptPath, scriptContent);
  return tempScriptPath;
}

// Upgrade specific contract
async function upgradeContract(contractName, network, proxyAddress) {
  const { hardhatNetwork } = getNetworkInfo(network);
  
  log(`Upgrading ${contractName} on ${network}...`);
  
  try {
    // Create temporary upgrade script
    const tempScriptPath = await createTempUpgradeScript(contractName, proxyAddress);
    
    // Run the upgrade script
    await execute('npx', ['hardhat', 'run', tempScriptPath, '--network', hardhatNetwork]);
    
    // Clean up temporary script
    fs.unlinkSync(tempScriptPath);
    
    log(`${contractName} upgraded successfully!`);
  } catch (error) {
    log(`Contract upgrade failed: ${error.message}`, true);
    process.exit(1);
  }
}

// Setup CLI options
program
  .description('Upgrade a specific contract in the Tribes by Astrix platform')
  .requiredOption('--contract <contractName>', 'Name of the contract to upgrade')
  .requiredOption('--network <network>', 'Network to deploy to (monad-devnet, mumbai, polygon, local)')
  .requiredOption('--proxy <proxyAddress>', 'Proxy address of the contract to upgrade')
  .action(async (options) => {
    try {
      await upgradeContract(options.contract, options.network, options.proxy);
    } catch (error) {
      log(`Failed to upgrade contract: ${error.message}`, true);
      process.exit(1);
    }
  });

program.parse(process.argv); 