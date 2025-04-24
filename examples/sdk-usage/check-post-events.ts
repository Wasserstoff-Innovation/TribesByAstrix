import { ethers } from 'ethers';
import { AstrixSDK, InteractionType } from '../../sdk/src';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Import ABI for manual contract interaction
const PostMinterABI = JSON.parse(fs.readFileSync(
    path.join(__dirname, '../../sdk/abis/PostMinter.json'), // Adjust path to ABI if needed
    'utf8'
));

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// --- Configuration & Address Loading ---
const NETWORK = process.env.NETWORK || 'localhost';
const RPC_URL = process.env.RPC_URL || 'http://127.0.0.1:8545/';
const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY;
const USER1_PRIVATE_KEY = process.env.USER1_PRIVATE_KEY; 
const USER2_PRIVATE_KEY = process.env.USER2_PRIVATE_KEY; 

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

if (!CONTRACT_ADDRESSES.roleManager || !CONTRACT_ADDRESSES.tribeController || !CONTRACT_ADDRESSES.postMinter || !CONTRACT_ADDRESSES.astrixPointSystem) {
    console.error('❌ Essential contract addresses (RoleManager, TribeController, PostMinter, PointSystem) missing in deployment file.');
    process.exit(1);
}

// --- Test Account Setup ---
const REQUIRED_ETH = ethers.parseEther('0.01');

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
}

async function ensureTribeMembership(sdk: AstrixSDK, tribeId: number, userWallet: ethers.Wallet): Promise<void> {
    await sdk.connect(userWallet);
    const memberStatus = await sdk.tribes.getMemberStatus(tribeId, userWallet.address);
    if (memberStatus !== 1) { // Assuming 1 is ACTIVE
        console.log(`   User ${userWallet.address} not active in tribe ${tribeId}. Joining...`);
        try {
            const joinTxHash = await sdk.tribes.joinTribe({ tribeId });
            // Corrected: No .wait() needed here as SDK likely returns hash or handles wait
            console.log(`   ✅ Joined tribe ${tribeId}. Tx Hash: ${joinTxHash}`);
        } catch (joinError) {
             console.error(`   ❌ Failed to join tribe ${tribeId}:`, joinError);
             throw new Error(`User ${userWallet.address} could not ensure membership in tribe ${tribeId}`); 
        }
    }
}

// --- Main Execution ---
async function main() {
    console.log(`🚀 Running SDK Check Post Events Example on ${NETWORK}...`);

    if (!ADMIN_PRIVATE_KEY || !USER1_PRIVATE_KEY || !USER2_PRIVATE_KEY) {
        console.error('❌ ADMIN_PRIVATE_KEY, USER1_PRIVATE_KEY, or USER2_PRIVATE_KEY not found in environment variables.');
        process.exit(1);
    }

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const adminWallet = new ethers.Wallet(ADMIN_PRIVATE_KEY, provider);
    const user1Wallet = new ethers.Wallet(USER1_PRIVATE_KEY, provider);
    const user2Wallet = new ethers.Wallet(USER2_PRIVATE_KEY, provider);

    console.log(`🔑 Admin Wallet: ${adminWallet.address}`);
    console.log(`👤 User 1 Wallet: ${user1Wallet.address}`);
    console.log(`👤 User 2 Wallet: ${user2Wallet.address}`);

    const sdk = new AstrixSDK({
        provider: RPC_URL,
        contracts: CONTRACT_ADDRESSES
    });

    try {
        // Prerequisites & Funding
        await checkAdminRole(sdk, adminWallet);
        await ensureFunds(provider, user1Wallet, adminWallet, REQUIRED_ETH);
        await ensureFunds(provider, user2Wallet, adminWallet, REQUIRED_ETH);

        // Ensure Tribe Exists and Users are Members
        // For simplicity, let's assume tribe 0 exists and is public
        const targetTribeId = 0; 
        console.log(`\nℹ️ Using Tribe ID: ${targetTribeId}`);
        await ensureTribeMembership(sdk, targetTribeId, user1Wallet);
        await ensureTribeMembership(sdk, targetTribeId, user2Wallet);

        // 1. Create Post as User 1
        console.log(`\n✍️ User 1 creating post in tribe ${targetTribeId}...`);
        await sdk.connect(user1Wallet);
        const postMetadata = JSON.stringify({
            title: `Event Check Post ${Date.now()}`,
            content: "Testing event emissions from SDK",
            type: 'TEXT',
        });
        const postId = await sdk.content.createPost({ 
            tribeId: targetTribeId,
            metadata: postMetadata,
        }); 
        console.log(`   ✅ Post created with ID: ${postId}`);

        // --- Event Listening/Querying --- 
        console.log(`\n👂 Manually querying events related to post ${postId}...`);
        // Corrected: Instantiate contract manually using address and ABI
        const postMinterContract = new ethers.Contract(
            CONTRACT_ADDRESSES.postMinter!, 
            PostMinterABI,
            provider // Use provider for read-only event querying
        );
        
        // Example: Query PostCreated event 
        const createdFilter = postMinterContract.filters.PostCreated(postId);
        const createdEvents = await postMinterContract.queryFilter(createdFilter, -1000); 
        if (createdEvents.length > 0) {
             console.log(`   ✅ Found PostCreated event for post ${postId}`);
        } else {
             console.warn(`   ⚠️ Could not find PostCreated event for post ${postId} via queryFilter.`);
        }

        // 2. Interact with Post as User 2
        console.log(`\n❤️ User 2 liking post ${postId}...`);
        await sdk.connect(user2Wallet);
        const interactReceipt = await sdk.content.interactWithPost(postId, InteractionType.LIKE);
        console.log(`   ✅ Post liked. Tx: ${interactReceipt.hash}`);

        // Example: Query PostInteraction event
        const interactFilter = postMinterContract.filters.PostInteraction(postId, user2Wallet.address, 0); // 0 for LIKE
        const interactEvents = await postMinterContract.queryFilter(interactFilter, -1000); 
        if (interactEvents.length > 0) {
            console.log(`   ✅ Found PostInteraction (LIKE) event for post ${postId} by ${user2Wallet.address}`);
        } else {
            console.warn(`   ⚠️ Could not find PostInteraction event for post ${postId} via queryFilter.`);
        }

        console.log('\n🎉 Check Post Events Example Completed Successfully!');

    } catch (error) {
        console.error('\n🚨 An error occurred during the example execution:', error);
        process.exit(1);
    }
}

main().catch((error) => {
    console.error('💥 Unhandled error in main function:', error);
    process.exit(1);
}); 