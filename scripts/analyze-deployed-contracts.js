// Script to analyze deployed contracts on Linea Sepolia
const fs = require('fs');
const path = require('path');
const { ethers } = require('hardhat');

// Helper to format function signatures
function formatFunctionSignature(fragment) {
  if (fragment.type !== 'function') return null;
  
  let params = fragment.inputs.map(input => 
    `${input.type}${input.name ? ' ' + input.name : ''}`
  ).join(', ');
  
  let returns = '';
  if (fragment.outputs && fragment.outputs.length > 0) {
    returns = ' returns (' + fragment.outputs.map(output => 
      `${output.type}${output.name ? ' ' + output.name : ''}`
    ).join(', ') + ')';
  }
  
  const stateMutability = fragment.stateMutability !== 'nonpayable' 
    ? ` ${fragment.stateMutability}` 
    : '';
  
  return `${fragment.name}(${params})${stateMutability}${returns}`;
}

// Main function to analyze contracts
async function main() {
  console.log('Analyzing deployed contracts on Linea Sepolia...');
  
  // Load deployment data
  const deploymentsDir = path.join(__dirname, '..', 'deployments');
  const deploymentFile = path.join(deploymentsDir, 'lineaSepolia-latest.json');
  
  if (!fs.existsSync(deploymentFile)) {
    console.error('Deployment file not found:', deploymentFile);
    return;
  }
  
  const deployment = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));
  console.log(`Network: ${deployment.network}, ChainID: ${deployment.chainId}`);
  
  // Get a signer
  const [signer] = await ethers.getSigners();
  console.log(`Using signer: ${signer.address}`);
  
  // Analyze each contract
  for (const [name, info] of Object.entries(deployment.contracts)) {
    // Skip ModularPostMinter since it has a different structure
    if (name === 'ModularPostMinter') {
      analyzeModularPostMinter(deployment.contracts.ModularPostMinter, signer);
      continue;
    }
    
    if (!info.address || !info.abi) {
      console.log(`Skipping ${name}: missing address or ABI`);
      continue;
    }
    
    console.log(`\n==== Contract: ${name} (${info.address}) ====`);
    
    // Create contract instance
    const contract = new ethers.Contract(info.address, info.abi, signer);
    
    // Analyze ABI
    const iface = new ethers.Interface(info.abi);
    const functions = Object.values(iface.fragments).filter(f => f.type === 'function');
    
    console.log(`Total functions: ${functions.length}`);
    
    // Group functions by type
    const viewFunctions = functions.filter(f => f.stateMutability === 'view' || f.stateMutability === 'pure');
    const nonViewFunctions = functions.filter(f => f.stateMutability !== 'view' && f.stateMutability !== 'pure');
    
    console.log(`\nView/Pure Functions (${viewFunctions.length}):`);
    viewFunctions.sort((a, b) => a.name.localeCompare(b.name));
    viewFunctions.forEach(fragment => {
      console.log(`- ${formatFunctionSignature(fragment)}`);
    });
    
    console.log(`\nNon-View Functions (${nonViewFunctions.length}):`);
    nonViewFunctions.sort((a, b) => a.name.localeCompare(b.name));
    nonViewFunctions.forEach(fragment => {
      console.log(`- ${formatFunctionSignature(fragment)}`);
    });
    
    // Optional: Try to call some key view functions if needed
    if (name === 'TribeController') {
      await testTribeControllerFunctions(contract);
    } else if (name === 'PostMinter') {
      await testPostMinterFunctions(contract);
    }
  }
}

// Analyze ModularPostMinter
async function analyzeModularPostMinter(moduleInfo, signer) {
  if (!moduleInfo) return;
  
  console.log('\n==== ModularPostMinter System ====');
  
  // Analyze proxy
  if (moduleInfo.proxy) {
    console.log(`\nProxy: ${moduleInfo.proxy.address}`);
    const proxy = new ethers.Contract(moduleInfo.proxy.address, moduleInfo.proxy.abi, signer);
    const iface = new ethers.Interface(moduleInfo.proxy.abi);
    const functions = Object.values(iface.fragments).filter(f => f.type === 'function');
    console.log(`Total functions: ${functions.length}`);
  }
  
  // Analyze each manager
  if (moduleInfo.managers) {
    for (const [managerName, manager] of Object.entries(moduleInfo.managers)) {
      console.log(`\n-- ${managerName} Manager (${manager.address}) --`);
      const managerContract = new ethers.Contract(manager.address, manager.abi, signer);
      const iface = new ethers.Interface(manager.abi);
      const functions = Object.values(iface.fragments).filter(f => f.type === 'function');
      
      console.log(`Total functions: ${functions.length}`);
      
      // Group functions by type
      const viewFunctions = functions.filter(f => f.stateMutability === 'view' || f.stateMutability === 'pure');
      const nonViewFunctions = functions.filter(f => f.stateMutability !== 'view' && f.stateMutability !== 'pure');
      
      if (viewFunctions.length > 0) {
        console.log(`\nView/Pure Functions (${viewFunctions.length}):`);
        viewFunctions.sort((a, b) => a.name.localeCompare(b.name));
        viewFunctions.forEach(fragment => {
          console.log(`- ${formatFunctionSignature(fragment)}`);
        });
      }
      
      if (nonViewFunctions.length > 0) {
        console.log(`\nNon-View Functions (${nonViewFunctions.length}):`);
        nonViewFunctions.sort((a, b) => a.name.localeCompare(b.name));
        nonViewFunctions.forEach(fragment => {
          console.log(`- ${formatFunctionSignature(fragment)}`);
        });
      }
      
      // Test query manager functions
      if (managerName === 'query') {
        await testPostQueryManagerFunctions(managerContract);
      }
    }
  }
}

// Test TribeController functions
async function testTribeControllerFunctions(contract) {
  console.log('\nTesting TribeController functions...');
  
  try {
    // Try to find functions for getting tribe count or listing tribes
    const possibleCountFunctions = [
      'getTotalTribes', 'tribeCount', 'totalTribes', 'getTribesCount'
    ];
    
    for (const funcName of possibleCountFunctions) {
      if (typeof contract[funcName] === 'function') {
        try {
          const result = await contract[funcName]();
          console.log(`SUCCESS: ${funcName}() => ${result}`);
          break;
        } catch (error) {
          console.log(`ERROR: ${funcName}() - ${error.message}`);
        }
      }
    }
    
    // Try to get existing tribe IDs
    try {
      if (typeof contract.getAllTribes === 'function') {
        const tribes = await contract.getAllTribes();
        console.log(`Found ${tribes.length} tribes: ${tribes}`);
      } else if (typeof contract.listTribes === 'function') {
        const tribes = await contract.listTribes();
        console.log(`Found ${tribes.length} tribes: ${tribes}`);
      }
    } catch (error) {
      console.log(`Error listing tribes: ${error.message}`);
    }
  } catch (error) {
    console.log(`Error testing TribeController: ${error.message}`);
  }
}

// Test PostMinter functions
async function testPostMinterFunctions(contract) {
  console.log('\nTesting PostMinter functions...');
  
  try {
    // Try to find functions for getting post count
    const possibleCountFunctions = [
      'getTotalPosts', 'postCount', 'totalPosts', 'getPostsCount'
    ];
    
    for (const funcName of possibleCountFunctions) {
      if (typeof contract[funcName] === 'function') {
        try {
          const result = await contract[funcName]();
          console.log(`SUCCESS: ${funcName}() => ${result}`);
          break;
        } catch (error) {
          console.log(`ERROR: ${funcName}() - ${error.message}`);
        }
      }
    }
  } catch (error) {
    console.log(`Error testing PostMinter: ${error.message}`);
  }
}

// Test PostQueryManager functions
async function testPostQueryManagerFunctions(contract) {
  console.log('\nTesting PostQueryManager functions...');
  
  try {
    // Try to find functions for getting post count
    const possibleCountFunctions = [
      'getTotalPosts', 'postCount', 'totalPosts', 'getPostsCount'
    ];
    
    for (const funcName of possibleCountFunctions) {
      if (typeof contract[funcName] === 'function') {
        try {
          const result = await contract[funcName]();
          console.log(`SUCCESS: ${funcName}() => ${result}`);
          break;
        } catch (error) {
          console.log(`ERROR: ${funcName}() - ${error.message}`);
        }
      }
    }
    
    // Try to list posts
    try {
      if (typeof contract.getAllPosts === 'function') {
        const posts = await contract.getAllPosts(0, 5);
        console.log(`getAllPosts(0, 5): ${JSON.stringify(posts)}`);
      }
    } catch (error) {
      console.log(`Error listing posts: ${error.message}`);
    }
  } catch (error) {
    console.log(`Error testing PostQueryManager: ${error.message}`);
  }
}

// Run the script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 