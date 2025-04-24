import { ethers } from 'ethers';
import { AstrixSDK, PostType } from '../../sdk/src';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// --- Configuration & Address Loading ---
const NETWORK = process.env.NETWORK || 'localhost'; 
const RPC_URL = process.env.RPC_URL || 'http://127.0.0.1:8545/';
const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY;
const USER1_PRIVATE_KEY = process.env.USER1_PRIVATE_KEY; 

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
            console.log(`   ✅ Joined tribe ${tribeId}. Tx Hash: ${joinTxHash}`);
        } catch (joinError) {
            console.error(`   ❌ Failed to join tribe ${tribeId}:`, joinError);
            throw new Error(`User ${userWallet.address} could not ensure membership in tribe ${tribeId}`);
        }
    }
}

// --- Main Execution ---
async function main() {
    console.log(`🚀 Running SDK Modular Post Example on ${NETWORK}...`);

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
        // Prerequisites & Funding
        await checkAdminRole(sdk, adminWallet);
        await ensureFunds(provider, userWallet, adminWallet, REQUIRED_ETH);

        // Ensure Tribe Exists and User is Member
        const targetTribeId = 0; // Assuming public tribe 0 exists
        console.log(`\nℹ️ Using Tribe ID: ${targetTribeId}`);
        await ensureTribeMembership(sdk, targetTribeId, userWallet);
        
        // Connect user wallet for subsequent calls
        await sdk.connect(userWallet);

        // 1. Create a Text Post
        console.log(`\n✍️ Creating TEXT post...`);
        const textMetadata = JSON.stringify({
            title: "Simple Text Post",
            content: "This is the content of the text post.",
            type: "TEXT"
        });
        const textPostId = await sdk.content.createPost({ tribeId: targetTribeId, metadata: textMetadata });
        console.log(`   ✅ Text post created with ID: ${textPostId}`);

        // 2. Create a Rich Media Post
        console.log(`\n🖼️ Creating RICH_MEDIA post...`);
        const mediaMetadata = JSON.stringify({
            title: "Rich Media Example",
            content: "Includes image and video links.",
            type: "RICH_MEDIA",
            mediaContent: {
                images: [{ url: "ipfs://image_hash", caption: "Example Image" }],
                videos: [{ url: "ipfs://video_hash", caption: "Example Video" }]
            }
        });
        const mediaPostId = await sdk.content.createPost({ tribeId: targetTribeId, metadata: mediaMetadata });
        console.log(`   ✅ Rich Media post created with ID: ${mediaPostId}`);

        // 3. Create a Poll Post
        console.log(`\n📊 Creating POLL post...`);
        const pollMetadata = JSON.stringify({
            title: "Favorite Color Poll",
            content: "What is your favorite color?",
            type: "POLL",
            options: ["Red", "Green", "Blue"]
        });
        const pollPostId = await sdk.content.createPost({ tribeId: targetTribeId, metadata: pollMetadata });
        console.log(`   ✅ Poll post created with ID: ${pollPostId}`);

        // 4. Create a Community Update Post
        console.log(`\n📢 Creating COMMUNITY_UPDATE post...`);
        const communityUpdateMetadata = JSON.stringify({
            title: "Weekly Update",
            content: "Here is what happened this week!",
            type: "COMMUNITY_UPDATE",
            communityDetails: { importance: "medium" }
        });
        const communityUpdatePostId = await sdk.content.createPost({ tribeId: targetTribeId, metadata: communityUpdateMetadata });
        console.log(`   ✅ Community Update post created with ID: ${communityUpdatePostId}`);
        
        // Note: PROJECT_UPDATE, EVENT, ENCRYPTED types would require more specific metadata
        // and potentially different SDK methods or parameters not covered in this basic example.

        console.log("\n🎉 Modular Post Example Completed Successfully!");

    } catch (error) {
        console.error('\n🚨 An error occurred during the example execution:', error);
        process.exit(1);
    }
}

main().catch((error) => {
    console.error('💥 Unhandled error in main function:', error);
    process.exit(1);
});
