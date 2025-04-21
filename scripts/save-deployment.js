#!/usr/bin/env node

/**
 * Saves deployment information to a JSON file.
 * This file is used for SDK integration, verification, and auditing.
 */

const fs = require('fs');
const path = require('path');
const { Command } = require('commander');

// Create the deployments directory if it doesn't exist
const ensureDeploymentDirExists = () => {
  const deploymentDir = path.join(process.cwd(), 'deployments');
  if (!fs.existsSync(deploymentDir)) {
    fs.mkdirSync(deploymentDir, { recursive: true });
  }
  return deploymentDir;
};

// Save deployment data to a file
const saveDeployment = (deploymentData, network) => {
  const deploymentDir = ensureDeploymentDirExists();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `deployment-${network}-${timestamp}.json`;
  const filePath = path.join(deploymentDir, fileName);
  
  // Add metadata
  const finalData = {
    ...deploymentData,
    saved: new Date().toISOString(),
    fileName
  };
  
  fs.writeFileSync(filePath, JSON.stringify(finalData, null, 2));
  console.log(`Deployment data saved to ${filePath}`);
  
  // Update latest deployment link
  const latestLinkPath = path.join(deploymentDir, `latest-${network}.json`);
  fs.writeFileSync(latestLinkPath, JSON.stringify(finalData, null, 2));
  console.log(`Latest deployment updated at ${latestLinkPath}`);
  
  return filePath;
};

// Save deployment from command line
const program = new Command();
program
  .name('save-deployment')
  .description('Save deployment information to a JSON file')
  .option('-n, --network <network>', 'Network name', 'hardhat')
  .option('-f, --file <file>', 'Input JSON file with deployment data')
  .action(async (options) => {
    try {
      let deploymentData;
      
      if (options.file) {
        // Load from file
        const filePath = path.resolve(options.file);
        if (!fs.existsSync(filePath)) {
          console.error(`File not found: ${filePath}`);
          process.exit(1);
        }
        
        deploymentData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      } else {
        // Use current process deployment data from module export 
        try {
          // First try to load from the deploy script
          const { deployContracts } = require('./deploy-upgradeable');
          deploymentData = await deployContracts();
        } catch (error) {
          console.error(`No deployment data found. Use --file option to provide a JSON file.`);
          process.exit(1);
        }
      }
      
      // Save the deployment info
      const savedFilePath = saveDeployment(deploymentData, options.network);
      console.log(`Deployment information saved successfully to ${savedFilePath}`);
    } catch (error) {
      console.error(`Error saving deployment: ${error.message}`);
      process.exit(1);
    }
  });

program.parse(process.argv);

// Export for use in other scripts
module.exports = { saveDeployment }; 