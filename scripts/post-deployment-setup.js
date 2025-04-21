#!/usr/bin/env node

/**
 * Post-deployment setup script for Tribes by Astrix
 * 
 * This script sets up:
 * 1. Initial roles and permissions
 * 2. Creates a test community
 * 3. Mints initial tokens
 * 4. Sets up initial point types
 * 
 * Usage:
 * node scripts/post-deployment-setup.js --network <network>
 */

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { Command } = require('commander');

// Parse command line arguments
const program = new Command();
program
  .option('-n, --network <network>', 'Target network', 'monadDevnet')
  .parse(process.argv);

const options = program.opts();
const networkName = options.network;

// Load environment variables
dotenv.config();

// Network RPC URLs
const RPC_URLS = {
  hardhat: 'http://localhost:8545',
  monadDevnet: 'https://rpc-devnet.monadinfra.com/rpc/3fe540e310bbb6ef0b9f16cd23073b0a',
  mumbai: process.env.MUMBAI_RPC_URL || 'https://polygon-mumbai.infura.io/v3/${INFURA_API_KEY}',
  polygon: process.env.POLYGON_RPC_URL || 'https://polygon-mainnet.infura.io/v3/${INFURA_API_KEY}'
};

// Get RPC URL for the specified network
function getRpcUrl(network) {
  const rpcUrl = RPC_URLS[network];
  if (!rpcUrl) {
    console.error(`No RPC URL defined for network: ${network}`);
    console.error(`Available networks: ${Object.keys(RPC_URLS).join(', ')}`);
    process.exit(1);
  }
  return rpcUrl;
}

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
  red: '\x1b[31m',
  magenta: '\x1b[35m'
};

// Log with timestamp
function log(message, color = colors.reset) {
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
  console.log(`${color}[${timestamp}] ${message}${colors.reset}`);
}

// Main function
async function main() {
  log('Post-Deployment Setup Script', colors.green);
  log(`Network: ${networkName}`, colors.green);
  log('===========================', colors.green);
  
  // Check if PRIVATE_KEY is set
  if (!process.env.PRIVATE_KEY) {
    log('PRIVATE_KEY not set in .env file', colors.red);
    process.exit(1);
  }
  
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
  
  // Setup provider
  const rpcUrl = getRpcUrl(networkName);
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  
  // Create wallet from private key
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const walletAddress = await wallet.getAddress();
  
  log(`Using wallet address: ${walletAddress}`, colors.blue);
  
  // Load contract ABIs
  const roleManagerAbi = require('../artifacts/contracts/RoleManager.sol/RoleManager.json').abi;
  const tribeControllerAbi = require('../artifacts/contracts/TribeController.sol/TribeController.json').abi;
  const pointSystemAbi = require('../artifacts/contracts/PointSystem.sol/PointSystem.json').abi;
  const astrixTokenAbi = require('../artifacts/contracts/AstrixToken.sol/AstrixToken.json').abi;
  
  // Connect to contracts
  const roleManager = new ethers.Contract(deployment.RoleManagerProxy, roleManagerAbi, wallet);
  const tribeController = new ethers.Contract(deployment.TribeControllerProxy, tribeControllerAbi, wallet);
  const pointSystem = new ethers.Contract(deployment.PointSystem, pointSystemAbi, wallet);
  const astrixToken = new ethers.Contract(deployment.AstrixTokenProxy, astrixTokenAbi, wallet);
  
  // Setup initial roles
  log('Setting up initial roles...', colors.cyan);
  
  try {
    const adminRole = await roleManager.DEFAULT_ADMIN_ROLE();
    const organizerRole = await roleManager.ORGANIZER_ROLE();
    const moderatorRole = await roleManager.MODERATOR_ROLE();
    const fanRole = await roleManager.FAN_ROLE();
    
    // Grant roles to deployer account
    const tx1 = await roleManager.grantRole(adminRole, walletAddress);
    await tx1.wait();
    log(`Granted ADMIN_ROLE to ${walletAddress}`, colors.green);
    
    const tx2 = await roleManager.assignRole(walletAddress, organizerRole);
    await tx2.wait();
    log(`Granted ORGANIZER_ROLE to ${walletAddress}`, colors.green);
    
    const tx3 = await roleManager.assignRole(walletAddress, moderatorRole);
    await tx3.wait();
    log(`Granted MODERATOR_ROLE to ${walletAddress}`, colors.green);
    
    const tx4 = await roleManager.assignRole(walletAddress, fanRole);
    await tx4.wait();
    log(`Granted FAN_ROLE to ${walletAddress}`, colors.green);
  } catch (error) {
    log(`Error setting up roles: ${error.message}`, colors.red);
  }
  
  // Create a test community
  log('Creating test community...', colors.cyan);
  
  try {
    const communityMetadata = JSON.stringify({
      name: "Test Community",
      description: "A test community created by the post-deployment script",
      imageUrl: "https://example.com/image.png",
      website: "https://example.com",
      tags: ["test", networkName, "tribes"]
    });
    
    const tx = await tribeController.createTribe(communityMetadata);
    const receipt = await tx.wait();
    
    // Extract the tribeId from the event
    const tribeCreatedEvent = receipt.logs
      .filter(log => log.fragment && log.fragment.name === 'TribeCreated')
      .map(log => log.args)[0];
    
    const tribeId = tribeCreatedEvent ? tribeCreatedEvent[0] : null;
    
    if (tribeId) {
      log(`Created test community with ID: ${tribeId}`, colors.green);
      
      // Setup point types for the community
      log('Setting up point types...', colors.cyan);
      
      const pointTypes = [
        { name: "Activity", description: "Points for being active in the community" },
        { name: "Content", description: "Points for creating content" },
        { name: "Social", description: "Points for social interactions" }
      ];
      
      for (const pointType of pointTypes) {
        const tx = await pointSystem.registerPointType(
          tribeId,
          pointType.name,
          pointType.description
        );
        await tx.wait();
        log(`Created point type: ${pointType.name}`, colors.green);
      }
    } else {
      log('Could not extract tribe ID from transaction', colors.yellow);
    }
  } catch (error) {
    log(`Error creating test community: ${error.message}`, colors.red);
  }
  
  // Mint initial tokens
  log('Minting initial tokens...', colors.cyan);
  
  try {
    const balance = await astrixToken.balanceOf(walletAddress);
    log(`Current token balance: ${ethers.formatEther(balance)} ASTRIX`, colors.blue);
    
    // Mint additional tokens if balance is low
    if (balance < ethers.parseEther("1000")) {
      const amountToMint = ethers.parseEther("10000");
      const tx = await astrixToken.mint(walletAddress, amountToMint);
      await tx.wait();
      log(`Minted ${ethers.formatEther(amountToMint)} ASTRIX tokens to ${walletAddress}`, colors.green);
      
      const newBalance = await astrixToken.balanceOf(walletAddress);
      log(`New token balance: ${ethers.formatEther(newBalance)} ASTRIX`, colors.blue);
    } else {
      log('Token balance is sufficient, skipping minting', colors.yellow);
    }
  } catch (error) {
    log(`Error minting tokens: ${error.message}`, colors.red);
  }
  
  log('\nPost-deployment setup completed!', colors.green);
}

// Execute main function
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(`Error: ${error.message}`, colors.red);
    process.exit(1);
  }); 