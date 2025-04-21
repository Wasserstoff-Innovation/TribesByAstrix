#!/usr/bin/env node

/**
 * Script to verify deployed contracts on block explorers
 * 
 * Usage:
 * node scripts/verify-contracts.js --network <network>
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { Command } = require('commander');

// Parse command line arguments
const program = new Command();
program
  .option('-n, --network <network>', 'Target network', 'monadDevnet')
  .parse(process.argv);

const options = program.opts();
const networkName = options.network;

// Network configuration for hardhat
const HARDHAT_NETWORK_MAP = {
  monadDevnet: 'monadDevnet',
  mumbai: 'polygonMumbai',
  polygon: 'polygon',
  hardhat: 'hardhat'
};

// Convert network name to deployment file format
function getDeploymentNetworkName(network) {
  return network === 'monadDevnet' ? 'monad-devnet' : network;
}

// ANSI colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m'
};

// Log with color
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// Execute a command and return the result
function execute(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    log(`Executing: ${command} ${args.join(' ')}`, colors.blue);
    
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

// Skip verification for local networks
if (networkName === 'hardhat' || networkName === 'localhost') {
  log('Skipping verification for local network', colors.yellow);
  process.exit(0);
}

// Main function
async function main() {
  log('Contract Verification Script', colors.green);
  log(`Network: ${networkName}`, colors.green);
  log('=============================', colors.green);
  
  // Path to deployment info
  const deploymentNetwork = getDeploymentNetworkName(networkName);
  const deploymentPath = path.resolve(`deployments/${deploymentNetwork}-latest.json`);
  
  // Check if deployment file exists
  if (!fs.existsSync(deploymentPath)) {
    log(`Deployment file not found: ${deploymentPath}`, colors.red);
    log('Please run deployment first', colors.yellow);
    process.exit(1);
  }
  
  // Load deployment data
  const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
  
  // Get the correct network name for hardhat
  const hardhatNetwork = HARDHAT_NETWORK_MAP[networkName] || networkName;
  
  // Define contracts to verify along with constructor arguments
  // Non-proxy contracts since proxies are handled differently
  const contractsToVerify = [
    { 
      name: 'PointSystem', 
      constructorArgs: [deployment.RoleManagerProxy, deployment.TribeControllerProxy]
    },
    { 
      name: 'CollectibleController', 
      constructorArgs: [deployment.RoleManagerProxy, deployment.TribeControllerProxy, deployment.PointSystem]
    },
    { 
      name: 'PostFeedManager', 
      constructorArgs: [deployment.TribeControllerProxy]
    },
    { 
      name: 'CommunityPoints', 
      constructorArgs: null // Will be extracted from deployment
    },
    { 
      name: 'EventController', 
      constructorArgs: null
    },
    { 
      name: 'ProfileNFTMinter', 
      constructorArgs: null
    },
    { 
      name: 'SuperCommunityController', 
      constructorArgs: null
    },
    { 
      name: 'Voting', 
      constructorArgs: null
    }
  ];

  // Check if ETHERSCAN_API_KEY is set
  if (!process.env.ETHERSCAN_API_KEY) {
    log('Warning: ETHERSCAN_API_KEY not set in .env file', colors.yellow);
    log('Contract verification may fail', colors.yellow);
  }
  
  // Verify each contract
  for (const contract of contractsToVerify) {
    const contractAddress = deployment[contract.name];
    
    if (!contractAddress) {
      log(`Contract address not found for ${contract.name}, skipping...`, colors.yellow);
      continue;
    }
    
    log(`\nVerifying ${contract.name} at ${contractAddress}...`, colors.cyan);
    
    try {
      const args = [
        'hardhat', 
        'verify', 
        '--network', 
        hardhatNetwork, 
        contractAddress
      ];
      
      // Add constructor arguments if available
      if (contract.constructorArgs) {
        contract.constructorArgs.forEach(arg => {
          args.push(arg);
        });
      }
      
      await execute('npx', args);
      log(`${contract.name} verified successfully!`, colors.green);
    } catch (error) {
      log(`Error verifying ${contract.name}: ${error.message}`, colors.red);
    }
  }
  
  // Verify proxy implementations
  log('\nVerifying proxy implementations...', colors.cyan);
  
  const proxyContracts = [
    'RoleManager',
    'TribeController',
    'AstrixToken',
    'TokenDispenser',
    'PostMinter'
  ];
  
  for (const contract of proxyContracts) {
    const implAddress = deployment[`${contract}Implementation`];
    
    if (!implAddress) {
      log(`Implementation address not found for ${contract}, skipping...`, colors.yellow);
      continue;
    }
    
    log(`\nVerifying ${contract} implementation at ${implAddress}...`, colors.cyan);
    
    try {
      await execute('npx', [
        'hardhat', 
        'verify', 
        '--network', 
        hardhatNetwork, 
        implAddress
      ]);
      log(`${contract} implementation verified successfully!`, colors.green);
    } catch (error) {
      log(`Error verifying ${contract} implementation: ${error.message}`, colors.red);
    }
  }
  
  log('\nContract verification completed!', colors.green);
}

// Execute main function
main()
  .then(() => process.exit(0))
  .catch((error) => {
    log(`Error: ${error.message}`, colors.red);
    process.exit(1);
  }); 