import { ethers } from 'hardhat';
import * as fs from 'fs';
import * as path from 'path';
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';

// Interfaces for deployment data
interface ContractDeploymentInfo {
  address: string;
  implementation?: string;
  abi: any;
}

interface DeploymentData {
  network: string;
  chainId: number;
  date: string;
  contracts: {
    [key: string]: ContractDeploymentInfo;
  };
}

// Get deployment data
export function getLineaSepoliaDeployment(): DeploymentData {
  const deploymentsDir = path.join(__dirname, '..', '..', 'deployments');
  const deploymentFile = path.join(deploymentsDir, 'lineaSepolia-latest.json');
  
  if (!fs.existsSync(deploymentFile)) {
    throw new Error('Linea Sepolia deployment file not found');
  }
  
  return JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));
}

// Get contract instances from deployment
export async function getDeployedContracts(signer: SignerWithAddress) {
  const deployment = getLineaSepoliaDeployment();
  
  const contracts: Record<string, any> = {};
  
  // Load each contract with signer
  for (const [name, info] of Object.entries(deployment.contracts)) {
    // Skip ModularPostMinter which has a different structure
    if (name === 'ModularPostMinter') continue;
    
    if (info.address && info.abi) {
      contracts[name] = new ethers.Contract(info.address, info.abi, signer);
      console.log(`Loaded ${name} from deployment at ${info.address}`);
    }
  }
  
  return contracts;
}

// Helper to get test accounts with ETH
export async function setupTestAccounts() {
  try {
    const signers = await ethers.getSigners();
    
    if (!signers || signers.length === 0) {
      throw new Error('No signers available');
    }
    
    const [deployer, user1, user2, user3, user4] = signers;
    
    console.log(`Using deployer: ${deployer.address}`);
    
    if (user1) console.log(`Test user1: ${user1.address}`);
    if (user2) console.log(`Test user2: ${user2.address}`);
    
    return { 
      deployer, 
      user1: user1 || deployer, 
      user2: user2 || deployer, 
      user3: user3 || deployer, 
      user4: user4 || deployer 
    };
  } catch (error) {
    console.error('Error setting up test accounts:', error);
    // Fallback to a default account for read-only tests
    const provider = ethers.provider;
    const wallet = new ethers.Wallet(ethers.ZeroHash, provider);
    return {
      deployer: wallet,
      user1: wallet,
      user2: wallet,
      user3: wallet,
      user4: wallet
    };
  }
} 