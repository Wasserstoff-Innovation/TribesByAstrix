import { ethers } from 'ethers';
import { AstrixSDK } from '../../sdk/src';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') }); 

// --- Configuration & Address Loading ---
const NETWORK = process.env.NETWORK || 'localhost'; 
const RPC_URL = process.env.RPC_URL || 'http://127.0.0.1:8545/';
const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY;
const USER1_PRIVATE_KEY = process.env.USER1_PRIVATE_KEY; // Assuming a separate key for the user creating the post

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
if (!CONTRACT_ADDRESSES.roleManager || !CONTRACT_ADDRESSES.tribeController || !CONTRACT_ADDRESSES.postMinter) {
    console.error('❌ Essential contract addresses (RoleManager, TribeController, PostMinter) missing in deployment file.');
    process.exit(1);
}

// --- Helper Functions (Simplified Prerequisites & Funding) ---

async function checkAdminRole(sdkInstance: AstrixSDK, adminSigner: ethers.Signer): Promise<void> {
    await sdkInstance.connect(adminSigner as ethers.Wallet);
    const isAdmin = await sdkInstance.roles.isAdmin(await adminSigner.getAddress());
    if (!isAdmin) {
        throw new Error(`Admin wallet ${await adminSigner.getAddress()} lacks DEFAULT_ADMIN_ROLE.`);
    }
    console.log(`✅ Admin role verified for ${await adminSigner.getAddress()}.`);
}

async function ensureFunds(provider: ethers.Provider, targetWallet: ethers.Wallet, adminSigner: ethers.Wallet, minEth: bigint): Promise<void> {
    const balance = await provider.getBalance(targetWallet.address);
    if (balance < minEth) {
        console.log(`   Funding ${targetWallet.address} with ETH...`);
        const tx = await adminSigner.sendTransaction({ to: targetWallet.address, value: minEth - balance });
        await tx.wait();
        console.log(`   ✅ Funded ${targetWallet.address}`);
    } else {
        console.log(`   ✅ ${targetWallet.address} has sufficient ETH.`);
    }
    // TODO: Add token funding if needed
}

async function ensureTribeMembership(sdk: AstrixSDK, tribeId: number, userWallet: ethers.Wallet): Promise<void> {
    await sdk.connect(userWallet);
    const memberStatus = await sdk.tribes.getMemberStatus(tribeId, userWallet.address);
    // Assuming MemberStatus.ACTIVE = 1
    if (memberStatus !== 1) {
        console.log(`   User ${userWallet.address} not active in tribe ${tribeId}. Attempting to join...`);
        try {
            const joinTxHash = await sdk.tribes.joinTribe({ tribeId });
            // Removed .wait() as joinTribe likely returns hash or handles wait internally
            console.log(`   ✅ Joined tribe ${tribeId}. Tx Hash: ${joinTxHash}`);
        } catch (joinError) {
            console.error(`   ❌ Failed to join tribe ${tribeId}:`, joinError);
            // Attempt to create the tribe if joining fails (e.g., tribe doesn't exist or requires special join logic not handled here)
             console.warn(`   ⚠️ Attempting to create tribe as fallback...`);
             throw new Error(`User could not join or ensure membership in tribe ${tribeId}`); // More robust error handling needed for production
        }
    } else {
         console.log(`   ✅ User ${userWallet.address} is already an active member of tribe ${tribeId}.`);
    }
}

// --- Main Execution ---

async function main() {
    console.log(`🚀 Running SDK Create Post Example on ${NETWORK}...`);

    if (!ADMIN_PRIVATE_KEY || !USER1_PRIVATE_KEY) {
        console.error('❌ ADMIN_PRIVATE_KEY or USER1_PRIVATE_KEY not found in environment variables.');
        process.exit(1);
    }

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const adminWallet = new ethers.Wallet(ADMIN_PRIVATE_KEY, provider);
    const userWallet = new ethers.Wallet(USER1_PRIVATE_KEY, provider);

    console.log(`🔑 Admin Wallet: ${adminWallet.address}`);
    console.log(`👤 User Wallet: ${userWallet.address}`);

    const sdk = new AstrixSDK({
        provider: RPC_URL,
        contracts: CONTRACT_ADDRESSES
    });

    try {
        // Prerequisites
        await checkAdminRole(sdk, adminWallet); // Check admin role first
        await ensureFunds(provider, userWallet, adminWallet, ethers.parseEther('0.01')); // Ensure user has gas

        // Find or create a suitable tribe
        await sdk.connect(userWallet);
        const userTribes = await sdk.tribes.getUserTribes(userWallet.address);
        let targetTribeId: number;

        if (userTribes.length > 0) {
            targetTribeId = userTribes[0]; // Use the first tribe the user is in
            console.log(`
✅ User is already in tribe ${targetTribeId}. Ensuring active membership...`);
            await ensureTribeMembership(sdk, targetTribeId, userWallet);
        } else {
            console.log(`
⚠️ User not in any tribes. Creating a new public tribe with User Wallet...`);
            await sdk.connect(userWallet); // Ensure userWallet creates the tribe
            const tribeName = `SDK-PostExample-Tribe-${Date.now().toString().slice(-5)}`;
            targetTribeId = await sdk.tribes.createTribe({
                name: tribeName,
                metadata: JSON.stringify({ name: tribeName, description: 'Tribe for SDK post example' }),
                joinType: 0, // PUBLIC
            });
            console.log(`   ✅ Created and automatically joined tribe ${targetTribeId}`);
            // No need to call join separately if createTribe auto-joins creator
        }

        // Create the post
        console.log(`\n✍️ Creating post in tribe ${targetTribeId} as ${userWallet.address}...`);
        await sdk.connect(userWallet); // Ensure userWallet is the signer
        const postMetadata = JSON.stringify({
            title: `SDK Post Example (${new Date().toISOString()})`,
            content: "This post was created using the Astrix SDK's content.createPost method.",
            type: 'TEXT', 
        });

        const postId = await sdk.content.createPost({ 
            tribeId: targetTribeId,
            metadata: postMetadata,
         }); 
        console.log(`   ✅ Post successfully created with ID: ${postId}!`);

        console.log("\n🎉 Create Post Example Completed Successfully!");

    } catch (error) {
        console.error('\n🚨 An error occurred during the example execution:', error);
        process.exit(1);
    }
}

main().catch((error) => {
    console.error('💥 Unhandled error in main function:', error);
    process.exit(1);
}); 