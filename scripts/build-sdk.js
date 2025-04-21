#!/usr/bin/env node

/**
 * Build SDK Script
 * This script builds the SDK, updates contract addresses, and prepares for publishing
 * 
 * Usage:
 * node scripts/build-sdk.js --network <network>
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { program } = require('commander');
const readlineSync = require('readline-sync');

// Setup command-line options
program
  .option('-n, --network <network>', 'Network to use for contract addresses (default: monad-devnet)', 'monad-devnet')
  .option('-c, --clean', 'Clean build directories before building', false)
  .option('-s, --skip-address-update', 'Skip updating contract addresses', false)
  .option('-d, --dry-run', 'Do not publish the package', true)
  .parse(process.argv);

const options = program.opts();

// Paths
const sdkDir = path.resolve('sdk');
const deploymentDir = path.resolve('deployments');
const latestDeploymentFile = path.resolve(deploymentDir, `latest-${options.network}.json`);

/**
 * Check if the latest deployment file exists
 */
function checkDeployment() {
  console.log(`Checking for latest deployment data for ${options.network}...`);
  
  if (!fs.existsSync(latestDeploymentFile)) {
    console.warn(`Warning: No deployment data found for ${options.network}`);
    console.warn(`Expected file: ${latestDeploymentFile}`);
    console.warn('Contract addresses may not be up to date!');
    
    if (!options.skipAddressUpdate) {
      if (options.network === 'local' || options.network === 'hardhat') {
        console.log('Local network specified, continuing with build...');
      } else {
        const answer = readlineSync.question('Continue without updating addresses? (y/N) ');
        if (answer.toLowerCase() !== 'y') {
          console.log('Build aborted.');
          process.exit(1);
        }
      }
    }
  } else {
    console.log(`Found deployment data: ${latestDeploymentFile}`);
  }
}

/**
 * Update contract addresses in the SDK
 */
function updateContractAddresses() {
  if (options.skipAddressUpdate) {
    console.log('Skipping contract address update...');
    return;
  }
  
  console.log(`Updating contract addresses for ${options.network}...`);
  
  try {
    execSync(`node scripts/update-contract-addresses.js --network ${options.network}`, { 
      stdio: 'inherit' 
    });
    console.log('Contract addresses updated successfully.');
  } catch (error) {
    console.error('Error updating contract addresses:', error.message);
    process.exit(1);
  }
}

/**
 * Build the SDK
 */
function buildSdk() {
  console.log('Building the SDK...');
  
  // Change to the SDK directory
  process.chdir(sdkDir);
  
  // Clean build directories if requested
  if (options.clean) {
    console.log('Cleaning build directories...');
    try {
      execSync('rm -rf dist', { stdio: 'inherit' });
      console.log('Build directories cleaned.');
    } catch (error) {
      console.error('Error cleaning build directories:', error.message);
      process.exit(1);
    }
  }
  
  // Install dependencies
  console.log('Installing SDK dependencies...');
  try {
    execSync('npm install', { stdio: 'inherit' });
    console.log('Dependencies installed successfully.');
  } catch (error) {
    console.error('Error installing dependencies:', error.message);
    process.exit(1);
  }
  
  // Build the SDK
  console.log('Building the SDK...');
  try {
    execSync('npm run build', { stdio: 'inherit' });
    console.log('SDK built successfully.');
  } catch (error) {
    console.error('Error building SDK:', error.message);
    process.exit(1);
  }
  
  // Run tests
  console.log('Running SDK tests...');
  try {
    execSync('npm test', { stdio: 'inherit' });
    console.log('Tests passed successfully.');
  } catch (error) {
    console.error('Error running tests:', error.message);
    console.warn('Continuing despite test failures...');
  }
  
  // Change back to the root directory
  process.chdir('..');
}

/**
 * Prepare the package for publishing
 */
function preparePackage() {
  console.log('Preparing package for publishing...');
  
  // Change to the SDK directory
  process.chdir(sdkDir);
  
  // Update version
  const packageJsonPath = path.resolve('package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const currentVersion = packageJson.version;
  
  console.log(`Current version: ${currentVersion}`);
  console.log('Package is ready for publishing.');
  
  // Publish if not in dry-run mode
  if (!options.dryRun) {
    console.log('Publishing package...');
    try {
      execSync('npm publish', { stdio: 'inherit' });
      console.log('Package published successfully.');
    } catch (error) {
      console.error('Error publishing package:', error.message);
      process.exit(1);
    }
  } else {
    console.log('Dry run mode active. Skipping publish step.');
  }
  
  // Change back to the root directory
  process.chdir('..');
}

/**
 * Main execution
 */
function main() {
  console.log('Starting SDK build process...');
  
  // Check for latest deployment data
  checkDeployment();
  
  // Update contract addresses
  updateContractAddresses();
  
  // Build the SDK
  buildSdk();
  
  // Prepare the package for publishing
  preparePackage();
  
  console.log('SDK build process completed successfully!');
}

// Execute the main function
main(); 