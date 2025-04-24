const { deployContracts } = require('./test/util/deployContracts');

async function main() {
  console.log("Deploying contracts to local network...");
  const result = await deployContracts();
  
  // Save the deployment info
  const fs = require('fs');
  const path = require('path');
  
  // Create a deployment data structure
  const deploymentData = {
    network: 'localhost',
    chainId: 31337,
    date: new Date().toISOString(),
    contracts: {}
  };
  
  // Map contract addresses
  const contracts = result.contracts;
  for (const [name, contract] of Object.entries(contracts)) {
    deploymentData.contracts[name] = {
      proxy: await contract.getAddress()
    };
  }
  
  // Save to deployments directory
  const deploymentsDir = path.join(__dirname, 'deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  const latestFilePath = path.join(deploymentsDir, 'localhost-latest.json');
  const datePath = path.join(deploymentsDir, `localhost-${new Date().toISOString().split('T')[0]}.json`);
  
  fs.writeFileSync(latestFilePath, JSON.stringify(deploymentData, null, 2));
  fs.writeFileSync(datePath, JSON.stringify(deploymentData, null, 2));
  
  console.log('Deployment completed successfully');
  console.log('Deployment data saved to:', latestFilePath);
  console.log('\nDeployed contracts:');
  
  for (const [name, data] of Object.entries(deploymentData.contracts)) {
    console.log(`- ${name}: ${data.proxy}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Deployment failed:', error);
    process.exit(1);
  }); 