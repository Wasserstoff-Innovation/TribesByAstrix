#!/usr/bin/env node

/**
 * Storage Layout Checker
 * 
 * This script checks the storage layout of a contract to ensure compatibility
 * with previous versions. It uses Hardhat's ability to output storage layouts
 * and compares them to verify upgrade safety.
 * 
 * Usage:
 * node scripts/check-storage-layout.js --contract ContractName
 */

const fs = require('fs');
const path = require('path');
const { Command } = require('commander');
const { execSync } = require('child_process');

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

// Log with color
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// Generate storage layout
function generateStorageLayout(contractName) {
  try {
    // Make sure the directories exist
    if (!fs.existsSync('./storageLayout')) {
      fs.mkdirSync('./storageLayout');
    }
    
    // Run hardhat compile with the storage layout flag
    log(`Generating storage layout for ${contractName}...`, colors.cyan);
    execSync('HARDHAT_STORAGE_LAYOUT=true npx hardhat compile', { stdio: 'inherit' });
    
    // Find the storage layout file
    const artifactsDir = './artifacts';
    const storageLayoutFile = path.join(artifactsDir, 'contracts', `${contractName}.sol`, `${contractName}.json`);
    
    if (!fs.existsSync(storageLayoutFile)) {
      throw new Error(`Storage layout file not found for ${contractName}. Make sure the contract exists and is compiled.`);
    }
    
    // Read the storage layout
    const artifact = JSON.parse(fs.readFileSync(storageLayoutFile, 'utf8'));
    if (!artifact.storageLayout) {
      throw new Error(`Storage layout not found in artifact for ${contractName}.`);
    }
    
    // Save the storage layout to a separate file
    const outputFile = path.join('./storageLayout', `${contractName}.json`);
    fs.writeFileSync(outputFile, JSON.stringify(artifact.storageLayout, null, 2));
    
    log(`Storage layout for ${contractName} saved to ${outputFile}`, colors.green);
    
    return artifact.storageLayout;
  } catch (error) {
    log(`Error generating storage layout: ${error.message}`, colors.red);
    process.exit(1);
  }
}

// Compare storage layouts
function compareStorageLayouts(oldLayout, newLayout) {
  const compatibilityIssues = [];
  
  // Check storage slot compatibility
  const oldStorage = oldLayout.storage;
  const newStorage = newLayout.storage;
  
  // Create a map of old variables by name for quick lookup
  const oldVarsByName = {};
  oldStorage.forEach(v => { oldVarsByName[v.label] = v; });
  
  // Check each old variable
  for (const oldVar of oldStorage) {
    const newVar = newStorage.find(v => v.label === oldVar.label);
    
    // If variable no longer exists
    if (!newVar) {
      compatibilityIssues.push({
        type: 'REMOVED',
        variable: oldVar.label,
        message: `Variable '${oldVar.label}' was removed in new implementation`
      });
      continue;
    }
    
    // If variable type changed
    if (oldVar.type !== newVar.type) {
      compatibilityIssues.push({
        type: 'TYPE_CHANGE',
        variable: oldVar.label,
        message: `Variable '${oldVar.label}' changed type from '${oldVar.type}' to '${newVar.type}'`
      });
    }
    
    // If variable slot changed
    if (oldVar.slot !== newVar.slot) {
      compatibilityIssues.push({
        type: 'SLOT_CHANGE',
        variable: oldVar.label,
        message: `Variable '${oldVar.label}' changed slot from ${oldVar.slot} to ${newVar.slot}`
      });
    }
  }
  
  // Check for new variables in incompatible slots
  const oldMaxSlot = Math.max(...oldStorage.map(v => parseInt(v.slot)));
  for (const newVar of newStorage) {
    // Skip if it exists in old layout
    if (oldVarsByName[newVar.label]) continue;
    
    // Check if the new variable is in a slot that should be available
    if (parseInt(newVar.slot) <= oldMaxSlot) {
      compatibilityIssues.push({
        type: 'INCORRECT_NEW_VAR_SLOT',
        variable: newVar.label,
        message: `New variable '${newVar.label}' uses slot ${newVar.slot} which conflicts with existing storage layout`
      });
    }
  }
  
  return compatibilityIssues;
}

// Check if a previous version exists
function getPreviousLayout(contractName) {
  const previousLayoutPath = path.join('./storageLayout', `${contractName}.previous.json`);
  
  if (fs.existsSync(previousLayoutPath)) {
    try {
      return JSON.parse(fs.readFileSync(previousLayoutPath, 'utf8'));
    } catch (error) {
      log(`Error reading previous layout: ${error.message}`, colors.yellow);
      return null;
    }
  }
  
  return null;
}

// Save the current layout as previous
function saveAsPrevious(contractName) {
  const currentLayoutPath = path.join('./storageLayout', `${contractName}.json`);
  const previousLayoutPath = path.join('./storageLayout', `${contractName}.previous.json`);
  
  if (fs.existsSync(currentLayoutPath)) {
    fs.copyFileSync(currentLayoutPath, previousLayoutPath);
    log(`Current layout saved as previous for future comparisons`, colors.green);
  }
}

// Main function
async function main(contractName, options) {
  log(`Checking storage layout for ${contractName}...`, colors.blue);
  
  // Generate current storage layout
  const currentLayout = generateStorageLayout(contractName);
  
  // Check if we should compare with a previous version
  if (options.compare) {
    const previousLayout = getPreviousLayout(contractName);
    
    if (previousLayout) {
      log(`Comparing with previous storage layout...`, colors.cyan);
      const issues = compareStorageLayouts(previousLayout, currentLayout);
      
      if (issues.length === 0) {
        log(`✅ No compatibility issues found. Safe to upgrade!`, colors.green);
      } else {
        log(`❌ Found ${issues.length} compatibility issues:`, colors.red);
        issues.forEach(issue => {
          log(`- ${issue.message}`, colors.red);
        });
        log(`The contract is NOT safe to upgrade.`, colors.red);
        process.exit(1);
      }
    } else {
      log(`No previous storage layout found to compare with.`, colors.yellow);
    }
  }
  
  // Save as previous if requested
  if (options.save) {
    saveAsPrevious(contractName);
  }
  
  // Display tips
  log(`\nTips for upgrading contracts:`, colors.blue);
  log(`1. Don't remove existing state variables`, colors.gray);
  log(`2. Don't change the type of existing state variables`, colors.gray);
  log(`3. Don't reorder existing state variables`, colors.gray);
  log(`4. Only add new state variables at the end`, colors.gray);
  log(`5. Run this script with --compare flag before upgrading`, colors.gray);
}

// Setup CLI options
program
  .description('Check storage layout for contract upgrades')
  .requiredOption('--contract <contractName>', 'Name of the contract to check')
  .option('--compare', 'Compare with previous storage layout', false)
  .option('--save', 'Save current layout as previous', false)
  .action(async (options) => {
    try {
      await main(options.contract, options);
    } catch (error) {
      log(`Error: ${error.message}`, colors.red);
      process.exit(1);
    }
  });

program.parse(process.argv); 