#!/usr/bin/env node

/**
 * Tribes by Astrix CLI Tool
 * 
 * A unified command-line interface for deploying and managing
 * the Tribes by Astrix platform.
 * 
 * Usage:
 * ./scripts/tribes-cli.js <command> [options]
 * 
 * Commands:
 *   deploy           Deploy contracts
 *   verify           Verify contracts on block explorer
 *   setup            Run post-deployment setup
 *   test             Test deployed contracts
 *   upgrade          Upgrade a specific contract
 *   update-sdk       Update SDK with contract addresses
 *   build-sdk        Build the SDK
 *   save-deployment  Save deployment information
 *   full             Run complete deployment process
 */

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { Command } = require('commander');

// Create CLI program
const program = new Command();

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

// Log with timestamp
function log(message, color = colors.reset) {
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
  console.log(`${color}[${timestamp}] ${message}${colors.reset}`);
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

// File exists helper
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (err) {
    return false;
  }
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
  
  // Network for deployment files
  const deploymentNetwork = network;
  
  return { hardhatNetwork, deploymentNetwork };
}

// Check environment setup
async function checkEnvironment() {
  log('Checking environment setup...', colors.yellow);
  
  // Check .env file
  const envPath = path.resolve('.env');
  if (!fileExists(envPath)) {
    throw new Error('.env file not found. Please create one with PRIVATE_KEY set.');
  }
  
  // Check PRIVATE_KEY in .env
  const envContent = fs.readFileSync(envPath, 'utf8');
  if (!envContent.includes('PRIVATE_KEY=') || envContent.includes('PRIVATE_KEY=\n')) {
    throw new Error('PRIVATE_KEY is not set in .env file. Please add your private key.');
  }
  
  // Check if SDK exists
  const sdkPath = path.resolve('sdk');
  if (!fs.existsSync(sdkPath)) {
    throw new Error('SDK folder not found. Please make sure it exists.');
  }
  
  log('Environment setup looks good!', colors.green);
}

// Deploy contracts
async function deployContracts(network, options = {}) {
  const { hardhatNetwork } = getNetworkInfo(network);
  
  log(`Deploying contracts to ${network}...`, colors.magenta);
  
  // If in mock mode, skip actual deployment
  if (options.mock) {
    log('Mock mode enabled - skipping actual deployment', colors.yellow);
    log('Creating mock deployment data...', colors.yellow);
    
    // Create mock deployment directory if it doesn't exist
    const deploymentsDir = path.resolve('deployments');
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }
    
    // Create a mock deployment file
    const mockDeployment = {
      timestamp: new Date().toISOString(),
      network: network,
      RoleManagerProxy: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
      RoleManagerImplementation: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
      TribeControllerProxy: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
      TribeControllerImplementation: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
      AstrixTokenProxy: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
      AstrixTokenImplementation: "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707",
      TokenDispenserProxy: "0x0165878A594ca255338adfa4d48449f69242Eb8F",
      TokenDispenserImplementation: "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853",
      PostMinterProxy: "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6",
      PostMinterImplementation: "0x8A791620dd6260079BF849Dc5567aDC3F2FdC318",
      PointSystem: "0x610178dA211FEF7D417bC0e6FeD39F05609AD788",
      CollectibleController: "0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e",
      PostFeedManager: "0xA51c1fc2f0D1a1b8494Ed1FE312d7C3a78Ed91C0"
    };
    
    // Write mock deployment file
    const mockDeploymentPath = path.resolve(`deployments/${network}-latest.json`);
    fs.writeFileSync(mockDeploymentPath, JSON.stringify(mockDeployment, null, 2));
    
    log('Mock deployment data created successfully!', colors.green);
    return;
  }
  
  try {
    await execute('npx', ['hardhat', 'run', 'scripts/deploy-upgradeable.ts', '--network', hardhatNetwork]);
    log('Contract deployment successful!', colors.green);
  } catch (error) {
    throw new Error(`Contract deployment failed: ${error.message}`);
  }
}

// Save deployment information
async function saveDeployment(network) {
  log('Saving deployment information...', colors.cyan);
  
  try {
    await execute('node', ['scripts/save-deployment.js', '--network', network]);
    log('Deployment information saved successfully!', colors.green);
  } catch (error) {
    throw new Error(`Failed to save deployment information: ${error.message}`);
  }
}

// Update SDK contract addresses
async function updateSdk(network) {
  log('Updating SDK contract addresses...', colors.yellow);
  
  try {
    await execute('node', ['scripts/update-contract-addresses.js', '--network', network, '--file', `deployments/${network}-latest.json`]);
    log('SDK contract addresses updated successfully!', colors.green);
  } catch (error) {
    throw new Error(`Failed to update SDK contract addresses: ${error.message}`);
  }
}

// Build the SDK
async function buildSdk() {
  log('Building the SDK...', colors.blue);
  
  try {
    await execute('npm', ['run', 'build:sdk']);
    log('SDK built successfully!', colors.green);
  } catch (error) {
    throw new Error(`Failed to build SDK: ${error.message}`);
  }
}

// Verify contracts
async function verifyContracts(network) {
  log('Verifying contracts...', colors.cyan);
  
  try {
    await execute('node', ['scripts/verify-contracts.js', '--network', network]);
    log('Contracts verified successfully!', colors.green);
  } catch (error) {
    throw new Error(`Failed to verify contracts: ${error.message}`);
  }
}

// Run post-deployment setup
async function runSetup(network) {
  log('Running post-deployment setup...', colors.magenta);
  
  try {
    await execute('node', ['scripts/post-deployment-setup.js', '--network', network]);
    log('Post-deployment setup completed successfully!', colors.green);
  } catch (error) {
    throw new Error(`Failed to run post-deployment setup: ${error.message}`);
  }
}

// Test deployed contracts
async function testDeployment(network, useMock = false) {
  log('Testing deployed contracts...', colors.blue);
  
  try {
    const args = ['scripts/test-deployed-contracts.js'];
    if (useMock) args.push('--mock');
    await execute('node', args);
    log('Deployment tests completed successfully!', colors.green);
  } catch (error) {
    throw new Error(`Deployment tests failed: ${error.message}`);
  }
}

// Full deployment process
async function fullDeployment(network, options) {
  log(`Starting full deployment process to ${network}`, colors.green);
  
  try {
    await checkEnvironment();
    await deployContracts(network, { mock: options.mock });
    
    // Skip network-dependent steps if in mock mode
    if (!options.mock) {
      await saveDeployment(network);
      await updateSdk(network);
      await buildSdk();
      
      if (options.verify) {
        await verifyContracts(network);
      }
      
      if (options.setup) {
        await runSetup(network);
      }
    } else {
      log('Mock mode enabled - skipping network-dependent steps', colors.yellow);
    }
    
    if (options.test) {
      await testDeployment(network, options.mock);
    }
    
    log('Full deployment process completed successfully!', colors.green);
    log(`
${colors.yellow}====================================
${colors.green}Deployment process completed!
${colors.yellow}====================================
${colors.cyan}
Next steps:
1. ${options.verify && !options.mock ? '✅' : '❌'} Verify contracts on block explorer
2. ${options.test ? '✅' : '❌'} Run post-deployment tests
3. ${options.setup && !options.mock ? '✅' : '❌'} Setup initial roles and permissions
4. Update documentation with new addresses
${colors.yellow}====================================
`, colors.reset);
  } catch (error) {
    log(`ERROR: ${error.message}`, colors.red);
    process.exit(1);
  }
}

// Upgrade a specific contract
async function upgradeSpecificContract(contractName, network, proxyAddress) {
  log(`Upgrading ${contractName} on ${network}...`, colors.magenta);
  
  try {
    await execute('node', [
      'scripts/upgrade-specific-contract.js', 
      '--contract', contractName,
      '--network', network,
      '--proxy', proxyAddress
    ]);
    log(`Contract ${contractName} upgraded successfully!`, colors.green);
  } catch (error) {
    throw new Error(`Contract upgrade failed: ${error.message}`);
  }
}

// Configure CLI
program
  .version('1.0.0')
  .description('Tribes by Astrix CLI');

// Deploy command
program
  .command('deploy')
  .description('Deploy contracts')
  .option('-n, --network <network>', 'Target network', 'monad-devnet')
  .option('-m, --mock', 'Use mock data instead of actual deployment', false)
  .action(async (options) => {
    try {
      await checkEnvironment();
      await deployContracts(options.network, { mock: options.mock });
    } catch (error) {
      log(`ERROR: ${error.message}`, colors.red);
      process.exit(1);
    }
  });

// Save deployment command
program
  .command('save-deployment')
  .description('Save deployment information')
  .option('-n, --network <network>', 'Target network', 'monad-devnet')
  .action(async (options) => {
    try {
      await saveDeployment(options.network);
    } catch (error) {
      log(`ERROR: ${error.message}`, colors.red);
      process.exit(1);
    }
  });

// Update SDK command
program
  .command('update-sdk')
  .description('Update SDK with contract addresses')
  .option('-n, --network <network>', 'Target network', 'monad-devnet')
  .action(async (options) => {
    try {
      await updateSdk(options.network);
    } catch (error) {
      log(`ERROR: ${error.message}`, colors.red);
      process.exit(1);
    }
  });

// Build SDK command
program
  .command('build-sdk')
  .description('Build the SDK')
  .action(async () => {
    try {
      await buildSdk();
    } catch (error) {
      log(`ERROR: ${error.message}`, colors.red);
      process.exit(1);
    }
  });

// Verify contracts command
program
  .command('verify')
  .description('Verify contracts on block explorer')
  .option('-n, --network <network>', 'Target network', 'monad-devnet')
  .action(async (options) => {
    try {
      await verifyContracts(options.network);
    } catch (error) {
      log(`ERROR: ${error.message}`, colors.red);
      process.exit(1);
    }
  });

// Setup command
program
  .command('setup')
  .description('Run post-deployment setup')
  .option('-n, --network <network>', 'Target network', 'monad-devnet')
  .action(async (options) => {
    try {
      await runSetup(options.network);
    } catch (error) {
      log(`ERROR: ${error.message}`, colors.red);
      process.exit(1);
    }
  });

// Test command
program
  .command('test')
  .description('Test deployed contracts')
  .option('-m, --mock', 'Use mock data for testing', false)
  .action(async (options) => {
    try {
      await testDeployment(null, options.mock);
    } catch (error) {
      log(`ERROR: ${error.message}`, colors.red);
      process.exit(1);
    }
  });

// Full deployment command
program
  .command('full')
  .description('Run complete deployment process')
  .option('-n, --network <network>', 'Target network', 'monad-devnet')
  .option('-v, --verify', 'Verify contracts after deployment', false)
  .option('-s, --setup', 'Run post-deployment setup', false)
  .option('-t, --test', 'Test deployment after completion', false)
  .option('-m, --mock', 'Use mock data for testing and deployment', false)
  .action(async (options) => {
    await fullDeployment(options.network, options);
  });

// Upgrade command
program
  .command('upgrade')
  .description('Upgrade a specific contract')
  .requiredOption('--contract <contractName>', 'Name of the contract to upgrade')
  .requiredOption('--proxy <proxyAddress>', 'Proxy address of the contract')
  .option('--network <network>', 'Network to deploy to', 'monad-devnet')
  .action(async (options) => {
    try {
      await checkEnvironment();
      await upgradeSpecificContract(options.contract, options.network, options.proxy);
    } catch (error) {
      log(`Failed to upgrade contract: ${error.message}`, colors.red);
      process.exit(1);
    }
  });

// Parse args and execute
program.parse(process.argv);

// Default behavior if no command is specified
if (!process.argv.slice(2).length) {
  program.outputHelp();
} 