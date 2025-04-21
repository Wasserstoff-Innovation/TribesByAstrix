#!/usr/bin/env node

/**
 * Script to test deployed contracts on Monad Devnet
 * 
 * This script:
 * 1. Connects to deployed contracts (or uses mock data for local testing)
 * 2. Runs basic functionality tests
 * 3. Reports results
 */

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// ANSI colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
  gray: '\x1b[90m'
};

// Command line arguments
const args = process.argv.slice(2);
const useMock = args.includes('--mock') || args.includes('-m');

// Log with color
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// Mock contract functions for local testing
class MockContract {
  constructor(contractName) {
    this.contractName = contractName;
    log(`   Created mock contract: ${contractName}`, colors.gray);
  }
  
  async DEFAULT_ADMIN_ROLE() {
    return '0x0000000000000000000000000000000000000000000000000000000000000000';
  }
  
  async ORGANIZER_ROLE() {
    return '0x0000000000000000000000000000000000000000000000000000000000000001';
  }
  
  async MODERATOR_ROLE() {
    return '0x0000000000000000000000000000000000000000000000000000000000000002';
  }
  
  async FAN_ROLE() {
    return '0x0000000000000000000000000000000000000000000000000000000000000003';
  }
  
  async hasRole(role, address) {
    return true;
  }
  
  async getTribeCount() {
    return 2;
  }
  
  async tribeExists(tribeId) {
    return tribeId <= 2;
  }
  
  async getTribeMetadata(tribeId) {
    return JSON.stringify({
      name: `Test Tribe ${tribeId}`,
      description: "A test tribe for local testing",
      imageUrl: "https://example.com/image.png"
    });
  }
  
  async name() {
    return 'Astrix Token';
  }
  
  async symbol() {
    return 'ATRX';
  }
  
  async totalSupply() {
    return ethers.parseEther('1000000');
  }
  
  async balanceOf(address) {
    return ethers.parseEther('10000');
  }
  
  async getPostCount() {
    return 5;
  }
  
  async validatePostMetadata(postType, metadata) {
    return true;
  }
  
  async getPointTypeCount(tribeId) {
    return 3;
  }
  
  async getPointType(tribeId, pointTypeId) {
    const types = [
      ['Activity', 'Points for being active'],
      ['Content', 'Points for creating content'],
      ['Social', 'Points for social interactions']
    ];
    return types[pointTypeId - 1] || types[0];
  }
}

// Main function
async function main() {
  log('\n🧪 Testing Deployed Contracts 🧪\n', colors.cyan);
  
  if (useMock) {
    log('🔧 Using mock data for local testing', colors.yellow);
  } else {
    // Check if PRIVATE_KEY is set
    if (!process.env.PRIVATE_KEY) {
      log('❌ PRIVATE_KEY not set in .env file', colors.red);
      log('💡 Run with --mock flag to use mock data for local testing', colors.yellow);
      process.exit(1);
    }
  }
  
  // Path to deployment info
  const deploymentPath = path.resolve('deployments/monad-devnet-latest.json');
  
  // Check if deployment file exists
  if (!fs.existsSync(deploymentPath)) {
    log(`❌ Deployment file not found: ${deploymentPath}`, colors.red);
    if (!useMock) {
      log('Please run deployment first or use --mock flag', colors.yellow);
      process.exit(1);
    } else {
      log('Continuing with mock data only', colors.yellow);
    }
  }
  
  // Load deployment data if available
  let deployment = {};
  if (fs.existsSync(deploymentPath)) {
    deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
  }
  
  // Setup provider or use mock
  let provider, wallet, walletAddress;
  let roleManager, tribeController, pointSystem, astrixToken, postMinter;
  
  if (useMock) {
    walletAddress = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
    log(`🔑 Using mock wallet address: ${walletAddress}`, colors.blue);
    
    roleManager = new MockContract('RoleManager');
    tribeController = new MockContract('TribeController');
    pointSystem = new MockContract('PointSystem');
    astrixToken = new MockContract('AstrixToken');
    postMinter = new MockContract('PostMinter');
  } else {
    // Setup provider
    const rpcUrl = 'https://rpc-devnet.monadinfra.com/rpc/3fe540e310bbb6ef0b9f16cd23073b0a';
    log(`🔗 Connecting to Monad Devnet: ${rpcUrl}`, colors.blue);
    
    provider = new ethers.JsonRpcProvider(rpcUrl);
    
    // Create wallet from private key
    wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    walletAddress = await wallet.getAddress();
    log(`🔑 Using wallet address: ${walletAddress}`, colors.blue);
    
    // Load contract ABIs
    log('\n📝 Loading contract ABIs...', colors.magenta);
    
    const roleManagerAbi = require('../artifacts/contracts/RoleManager.sol/RoleManager.json').abi;
    const tribeControllerAbi = require('../artifacts/contracts/TribeController.sol/TribeController.json').abi;
    const pointSystemAbi = require('../artifacts/contracts/PointSystem.sol/PointSystem.json').abi;
    const astrixTokenAbi = require('../artifacts/contracts/AstrixToken.sol/AstrixToken.json').abi;
    const postMinterAbi = require('../artifacts/contracts/PostMinter.sol/PostMinter.json').abi;
    
    // Connect to contracts
    log('\n🔌 Connecting to deployed contracts...', colors.magenta);
    
    roleManager = new ethers.Contract(deployment.RoleManagerProxy, roleManagerAbi, wallet);
    tribeController = new ethers.Contract(deployment.TribeControllerProxy, tribeControllerAbi, wallet);
    pointSystem = new ethers.Contract(deployment.PointSystem, pointSystemAbi, wallet);
    astrixToken = new ethers.Contract(deployment.AstrixTokenProxy, astrixTokenAbi, wallet);
    postMinter = deployment.PostMinterProxy ? 
      new ethers.Contract(deployment.PostMinterProxy, postMinterAbi, wallet) : null;
  }
  
  // Test results tracking
  const testResults = {
    passed: 0,
    failed: 0,
    skipped: 0,
    total: 0
  };
  
  // Function to report test result
  function reportTest(name, success, error = null) {
    testResults.total++;
    
    if (success === true) {
      testResults.passed++;
      log(`✅ PASS: ${name}`, colors.green);
    } else if (success === false) {
      testResults.failed++;
      log(`❌ FAIL: ${name}`, colors.red);
      if (error) {
        log(`   Error: ${error.message}`, colors.gray);
      }
    } else {
      testResults.skipped++;
      log(`⏭️ SKIP: ${name}`, colors.yellow);
    }
  }
  
  try {
    // Test RoleManager
    log('\n🔍 Testing RoleManager...', colors.cyan);
    
    try {
      const adminRole = await roleManager.DEFAULT_ADMIN_ROLE();
      const hasAdminRole = await roleManager.hasRole(adminRole, walletAddress);
      reportTest('RoleManager - Get admin role', true);
      reportTest('RoleManager - Check if wallet has admin role', true);
      log(`   Admin role: ${hasAdminRole ? 'Yes' : 'No'}`, colors.gray);
    } catch (error) {
      reportTest('RoleManager - Basic functions', false, error);
    }
    
    // Test TribeController
    log('\n🔍 Testing TribeController...', colors.cyan);
    
    try {
      const tribeCount = await tribeController.getTribeCount();
      reportTest('TribeController - Get tribe count', true);
      log(`   Total tribes: ${tribeCount}`, colors.gray);
      
      if (tribeCount > 0) {
        try {
          const tribeId = 1; // Assuming tribe ID 1 exists
          const tribeExists = await tribeController.tribeExists(tribeId);
          reportTest('TribeController - Check if tribe exists', true);
          log(`   Tribe #${tribeId} exists: ${tribeExists ? 'Yes' : 'No'}`, colors.gray);
          
          if (tribeExists) {
            const tribeMetadata = await tribeController.getTribeMetadata(tribeId);
            reportTest('TribeController - Get tribe metadata', true);
            log(`   Tribe metadata: ${tribeMetadata.substring(0, 50)}...`, colors.gray);
          } else {
            reportTest('TribeController - Get tribe metadata', null);
          }
        } catch (error) {
          reportTest('TribeController - Check tribe details', false, error);
        }
      } else {
        reportTest('TribeController - Check if tribe exists', null);
        reportTest('TribeController - Get tribe metadata', null);
      }
    } catch (error) {
      reportTest('TribeController - Get tribe count', false, error);
    }
    
    // Test AstrixToken
    log('\n🔍 Testing AstrixToken...', colors.cyan);
    
    try {
      const name = await astrixToken.name();
      const symbol = await astrixToken.symbol();
      const totalSupply = await astrixToken.totalSupply();
      const balance = await astrixToken.balanceOf(walletAddress);
      
      reportTest('AstrixToken - Get token info', true);
      log(`   Name: ${name}`, colors.gray);
      log(`   Symbol: ${symbol}`, colors.gray);
      log(`   Total Supply: ${ethers.formatEther(totalSupply)} ASTRIX`, colors.gray);
      log(`   Wallet Balance: ${ethers.formatEther(balance)} ASTRIX`, colors.gray);
    } catch (error) {
      reportTest('AstrixToken - Get token info', false, error);
    }
    
    // Test PointSystem
    log('\n🔍 Testing PointSystem...', colors.cyan);
    
    try {
      if (tribeController && await tribeController.getTribeCount() > 0) {
        try {
          const tribeId = 1; // Assuming tribe ID 1 exists
          const pointTypeCount = await pointSystem.getPointTypeCount(tribeId);
          reportTest('PointSystem - Get point type count', true);
          log(`   Point types for Tribe #${tribeId}: ${pointTypeCount}`, colors.gray);
          
          if (pointTypeCount > 0) {
            try {
              const pointType = await pointSystem.getPointType(tribeId, 1);
              reportTest('PointSystem - Get point type info', true);
              log(`   Point Type Name: ${pointType[0]}`, colors.gray);
              log(`   Point Type Description: ${pointType[1]}`, colors.gray);
            } catch (error) {
              reportTest('PointSystem - Get point type info', false, error);
            }
          } else {
            reportTest('PointSystem - Get point type info', null);
          }
        } catch (error) {
          reportTest('PointSystem - Get point type count', false, error);
        }
      } else {
        reportTest('PointSystem - Get point type count', null);
        reportTest('PointSystem - Get point type info', null);
      }
    } catch (error) {
      reportTest('PointSystem - Basic checks', false, error);
    }
    
    // Test PostMinter if available
    log('\n🔍 Testing PostMinter...', colors.cyan);
    
    if (postMinter) {
      try {
        const postCount = await postMinter.getPostCount();
        reportTest('PostMinter - Get post count', true);
        log(`   Total posts: ${postCount}`, colors.gray);
        
        // Test post validation function
        try {
          const validMetadata = JSON.stringify({
            content: "This is a test post content"
          });
          const isValid = await postMinter.validatePostMetadata("TEXT", validMetadata);
          reportTest('PostMinter - Validate post metadata', true);
          log(`   Metadata validation: ${isValid ? 'Valid' : 'Invalid'}`, colors.gray);
        } catch (error) {
          reportTest('PostMinter - Validate post metadata', false, error);
        }
      } catch (error) {
        reportTest('PostMinter - Get post count', false, error);
      }
    } else {
      reportTest('PostMinter - Get post count', null);
      reportTest('PostMinter - Validate post metadata', null);
      log('   PostMinter contract not found in deployment data', colors.gray);
    }
    
  } catch (error) {
    log(`❌ Fatal error: ${error.message}`, colors.red);
    process.exit(1);
  }
  
  // Report summary
  log('\n📊 Test Summary:', colors.magenta);
  log(`   Total Tests: ${testResults.total}`, colors.reset);
  log(`   Passed: ${testResults.passed}`, colors.green);
  log(`   Failed: ${testResults.failed}`, colors.red);
  log(`   Skipped: ${testResults.skipped}`, colors.yellow);
  
  // Final result
  if (testResults.failed === 0) {
    log('\n✅ All tests completed successfully!\n', colors.green);
  } else {
    log('\n❌ Some tests failed. Please check the output above.\n', colors.red);
    process.exit(1);
  }
}

// Execute main function
main()
  .then(() => process.exit(0))
  .catch((error) => {
    log(`❌ Error: ${error.message}`, colors.red);
    process.exit(1);
  }); 