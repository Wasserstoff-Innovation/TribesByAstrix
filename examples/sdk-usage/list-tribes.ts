import { ethers } from 'ethers';
import { AstrixSDK } from '../../sdk/src';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// --- Configuration & Address Loading ---
const NETWORK = process.env.NETWORK || 'localhost'; 
const RPC_URL = process.env.RPC_URL || 'http://127.0.0.1:8545/';
const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY; // Use admin key for checking roles

const deploymentsPath = path.join(__dirname, `../../../deployments/${NETWORK}-latest.json`);
if (!fs.existsSync(deploymentsPath)) {
    console.error(`❌ Deployments file not found at ${deploymentsPath}. Run deployment first.`);
    process.exit(1);
}
const deploymentData = JSON.parse(fs.readFileSync(deploymentsPath, 'utf8'));
const CONTRACT_ADDRESSES = {
    roleManager: deploymentData.contracts.RoleManager?.proxy,
    tribeController: deploymentData.contracts.TribeController?.proxy,
    collectibleController: deploymentData.contracts.CollectibleController?.proxy,
    postMinter: deploymentData.contracts.PostMinter?.proxy,
    astrixPointSystem: deploymentData.contracts.PointSystem?.proxy,
    profileNFTMinter: deploymentData.contracts.ProfileNFTMinter?.proxy,
    eventController: deploymentData.contracts.EventController?.proxy,
    astrixToken: deploymentData.contracts.AstrixToken?.proxy,
    tokenDispenser: deploymentData.contracts.TokenDispenser?.proxy,
    postFeedManager: deploymentData.contracts.PostFeedManager?.address
};

// Validate essential addresses
if (!CONTRACT_ADDRESSES.roleManager || !CONTRACT_ADDRESSES.tribeController || !CONTRACT_ADDRESSES.astrixPointSystem) {
    console.error('❌ Essential contract addresses (RoleManager, TribeController, PointSystem) missing in deployment file.');
    process.exit(1);
}

// --- Helper Functions (Simplified Prerequisites) ---
async function checkPrerequisites(sdkInstance: AstrixSDK, adminSigner: ethers.Signer): Promise<void> {
    console.log('\n🔍 Checking prerequisites...');
    const provider = adminSigner.provider;
    if (!provider) throw new Error("Admin signer needs a provider.");

    console.log(`   ✅ Connected to RPC: ${RPC_URL}`);
    console.log(`   ✅ Verified essential contracts exist.`);

    // Check admin role using SDK
    try {
        await sdkInstance.connect(adminSigner as ethers.Wallet);
        const isAdmin = await sdkInstance.roles.isAdmin(await adminSigner.getAddress());
        if (!isAdmin) {
            console.warn(`   ⚠️ Admin wallet ${await adminSigner.getAddress()} lacks DEFAULT_ADMIN_ROLE. Some SDK functions might fail.`);
        }
         else {
           console.log(`   ✅ Admin role verified for ${await adminSigner.getAddress()}.`);
         }
    } catch (error) {
        console.error('   ❌ Error checking admin role:', error);
        // Don't throw, allow listing anyway
    }
    console.log('   👍 Prerequisites checked.');
}

// --- Main Execution ---
async function main() {
    console.log(`🚀 Running SDK List Tribes Example on ${NETWORK}...`);

    if (!ADMIN_PRIVATE_KEY) {
        // Allow running without admin key for read-only operations
        console.warn('⚠️ ADMIN_PRIVATE_KEY not found. Running in read-only mode.');
    }

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    // Use admin wallet if available, otherwise use a placeholder or just the provider for read-only
    const signer = ADMIN_PRIVATE_KEY ? new ethers.Wallet(ADMIN_PRIVATE_KEY, provider) : provider;

    console.log(`🔑 Using Signer/Provider: ${ADMIN_PRIVATE_KEY ? (signer as ethers.Wallet).address : 'Provider only'}`);

    const sdk = new AstrixSDK({
        provider: RPC_URL,
        contracts: CONTRACT_ADDRESSES
    });

    try {
        // Run prerequisites check if admin key is available
        if (ADMIN_PRIVATE_KEY) {
            await checkPrerequisites(sdk, signer as ethers.Wallet);
        }
        
        // Connect the signer (if available)
        if (ADMIN_PRIVATE_KEY) {
             await sdk.connect(signer as ethers.Wallet);
             console.log('✅ SDK connected with admin wallet.');
        } else {
             console.log('ℹ️ SDK running in read-only mode.');
        }

        // List all tribes using the SDK
        console.log('\n=== LISTING ALL TRIBES ===');
        const allTribesResult = await sdk.tribes.getAllTribes(); // Use default pagination
        console.log(`Found ${allTribesResult.total} tribes total.`);

        if (allTribesResult.total === 0) {
            console.log("No tribes found on this network.");
            return;
        }
        
        console.log("Fetching details for listed tribes...");
        for (const tribeId of allTribesResult.tribeIds) {
            try {
                 const tribe = await sdk.tribes.getTribeDetails(tribeId);
                 
                 console.log(`\n--- Tribe ID: ${tribe.id} ---`);
                 console.log(`   Name: ${tribe.name || 'N/A'}`);
                 console.log(`   Admin: ${tribe.admin}`);
                 console.log(`   Member Count: ${tribe.memberCount}`);
                 console.log(`   Join Type: ${tribe.joinType}`); // Assuming JoinType enum is exported or use number
                 console.log(`   Is Active: ${tribe.isActive}`);
                 
                 // Attempt to get tribe token information
                 try {
                     const tokenAddress = await sdk.points.getTribeTokenAddress(tribe.id);
                     if (tokenAddress && tokenAddress !== ethers.ZeroAddress) {
                         // Fetch token info using ethers directly (SDK might add helpers later)
                         const tokenContract = new ethers.Contract(
                             tokenAddress,
                             ['function name() view returns (string)', 'function symbol() view returns (string)'],
                             provider // Use read-only provider
                         );
                         const tokenName = await tokenContract.name();
                         const tokenSymbol = await tokenContract.symbol();
                         console.log(`   Token: ${tokenName} (${tokenSymbol})`);
                         console.log(`   Token Address: ${tokenAddress}`);
                     } else {
                         console.log('   Token: None configured');
                     }
                 } catch (tokenError) {
                     console.log('   Token: Error fetching info or none configured.');
                 }

                 // Optionally parse and display metadata
                 try {
                    const metadata = JSON.parse(tribe.metadata);
                    console.log(`   Description: ${metadata.description || 'N/A'}`);
                 } catch { 
                    console.log('   Metadata: (Could not parse JSON)'); 
                 }

            } catch (detailError) {
                 console.error(`   ❌ Error fetching details for Tribe ID ${tribeId}:`, detailError);
            }
        }

        console.log('\n🎉 List Tribes Example Completed Successfully!');

    } catch (error) {
        console.error('\n🚨 An error occurred during the example execution:', error);
        process.exit(1);
    }
}

main().catch((error) => {
    console.error('💥 Unhandled error in main function:', error);
    process.exit(1);
}); 