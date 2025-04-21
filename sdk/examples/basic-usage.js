/**
 * Basic usage example for the Tribes by Astrix SDK
 * Run with: node basic-usage.js
 */

const { ethers } = require('ethers');
const { AstrixSDK } = require('../dist');
require('dotenv').config();

// Replace with your private key and RPC URL
const PRIVATE_KEY = process.env.PRIVATE_KEY || '';
const RPC_URL = process.env.RPC_URL || 'http://localhost:8545';
const CHAIN_ID = parseInt(process.env.CHAIN_ID || '31337');

async function main() {
  try {
    console.log('Initializing Tribes by Astrix SDK...');
    
    // Setup provider and wallet
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    console.log(`Connected to network with chain ID: ${CHAIN_ID}`);
    console.log(`Using wallet address: ${wallet.address}`);
    
    // Initialize SDK
    const sdk = new AstrixSDK({
      provider,
      chainId: CHAIN_ID,
      verbose: true
    });
    
    // Initialize contract addresses
    await sdk.init();
    console.log('SDK initialized successfully');
    
    // Connect wallet for write operations
    await sdk.connect(wallet);
    console.log(`Connected wallet: ${await sdk.getAddress()}`);
    
    // Display contract addresses
    console.log('\nContract Addresses:');
    const contractNames = [
      'roleManager', 
      'tribeController', 
      'astrixToken', 
      'tokenDispenser', 
      'astrixPointSystem',
      'postMinter'
    ];
    
    for (const name of contractNames) {
      try {
        const address = sdk.getContractAddress(name);
        console.log(`- ${name}: ${address}`);
      } catch (error) {
        console.log(`- ${name}: Not configured`);
      }
    }
    
    // Example: Get tribes count
    try {
      console.log('\nFetching tribes count...');
      const tribesCount = await sdk.tribes.getTotalTribesCount();
      console.log(`Total tribes count: ${tribesCount}`);
      
      // If tribes exist, get details of the first tribe
      if (tribesCount > 0) {
        console.log('\nFetching details of the first tribe...');
        const tribeDetails = await sdk.tribes.getTribeDetails(1);
        console.log('Tribe details:', tribeDetails);
      }
    } catch (error) {
      console.error('Error fetching tribes:', error.message);
    }
    
    // Example: Get user tribes
    try {
      console.log('\nFetching user tribes...');
      const userTribes = await sdk.tribes.getUserTribes(wallet.address);
      console.log(`User is a member of ${userTribes.length} tribes`);
      
      if (userTribes.length > 0) {
        console.log('Tribe IDs:', userTribes);
      }
    } catch (error) {
      console.error('Error fetching user tribes:', error.message);
    }
    
    // Example: Create a new tribe (if user has permission)
    try {
      console.log('\nAttempting to create a new tribe...');
      
      const tribeName = `Test Tribe ${Date.now()}`;
      const tribeMetadata = JSON.stringify({
        description: 'A test tribe created with the SDK',
        image: 'https://example.com/tribe-image.png',
        externalUrl: 'https://example.com/tribe'
      });
      
      // Tribe creation parameters
      const params = {
        name: tribeName,
        metadata: tribeMetadata,
        joinType: 0, // 0: Open, 1: Whitelist, 2: Invite Only
        entryFee: ethers.parseEther('0'), // Free entry
        canMerge: true
      };
      
      const tx = await sdk.tribes.createTribe(params);
      console.log('Transaction submitted:', tx.hash);
      
      const receipt = await tx.wait();
      console.log('Tribe created successfully!');
      
      // Extract tribe ID from events
      const events = receipt.logs.filter(log => log.fragment && log.fragment.name === 'TribeCreated');
      if (events.length > 0) {
        const tribeId = events[0].args.tribeId;
        console.log(`New tribe ID: ${tribeId}`);
      }
    } catch (error) {
      console.error('Error creating tribe:', error.message);
      console.log('Note: You may need appropriate roles to create tribes');
    }
    
    console.log('\nExample completed successfully!');
  } catch (error) {
    console.error('Error in SDK example:', error);
  }
}

// Execute the example
main().catch(console.error); 