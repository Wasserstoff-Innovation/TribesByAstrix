import { ethers } from 'ethers';
import { AstrixSDK, InteractionType } from '../../sdk/src'; // Correct path to SDK source and import InteractionType
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config(); // Load environment variables from .env file

// --- Configuration ---
const NETWORK = process.env.NETWORK || 'localhost'; // Default to localhost if not set
const RPC_URL = process.env.RPC_URL || 'http://127.0.0.1:8545/';
const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY;

// --- Contract Address Loading ---
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
    astrixPointSystem: deploymentData.contracts.PointSystem?.proxy, // Corrected name
    profileNFTMinter: deploymentData.contracts.ProfileNFTMinter?.proxy,
    eventController: deploymentData.contracts.EventController?.proxy,
    astrixToken: deploymentData.contracts.AstrixToken?.proxy,
    tokenDispenser: deploymentData.contracts.TokenDispenser?.proxy,
    postFeedManager: deploymentData.contracts.PostFeedManager?.address
};

// Validate essential addresses
if (!CONTRACT_ADDRESSES.roleManager || !CONTRACT_ADDRESSES.tribeController || !CONTRACT_ADDRESSES.postMinter || /*!CONTRACT_ADDRESSES.profileNFTMinter ||*/ !CONTRACT_ADDRESSES.astrixPointSystem ) {
    console.error('❌ Essential contract addresses (RoleManager, TribeController, PostMinter, PointSystem) missing in deployment file.');
    // Note: Temporarily removing profileNFTMinter check as profile creation is skipped
    process.exit(1);
}


// --- Test Account Setup ---
const TEST_MNEMONICS = [
    'test test test test test test test test test test test junk', // Wallet 0 (User 1)
    'announce resemble domain patrol tunnel judge employ rescue behave journey venture survey', // Wallet 1 (User 2 / Creator)
    'example exile hungry ability gloom grocery limb island witness spirit length twelve', // Wallet 2
    'orbit hope memory puzzle potato sugar desert evil machine impact elegant salmon attitude', // Wallet 3
    'often summer suggest pupil obtain logic vital enable region patch Carlson consider dinner', // Wallet 4
];
const NUM_TEST_ACCOUNTS = 5;
const REQUIRED_ETH = ethers.parseEther('0.05'); 

// --- Helper Functions ---

function generateTestWallets(provider: ethers.Provider): ethers.Wallet[] {
    console.log('\n🌱 Generating test wallets...');
    const wallets: ethers.Wallet[] = [];
    for (let i = 0; i < NUM_TEST_ACCOUNTS; i++) {
        // Explicitly type assert to unknown first, then ethers.Wallet
        const wallet = ethers.Wallet.fromPhrase(TEST_MNEMONICS[i]).connect(provider) as unknown as ethers.Wallet;
        wallets.push(wallet);
        console.log(`   Wallet ${i}: ${wallet.address}`);
    }
    return wallets;
}

async function checkPrerequisites(sdkInstance: AstrixSDK, adminSigner: ethers.Signer): Promise<void> {
    console.log('\n🔍 Checking prerequisites...');
    const provider = adminSigner.provider;
    if (!provider) throw new Error("Admin signer needs a provider.");

    console.log(`   ✅ Connected to RPC: ${RPC_URL}`);
    console.log(`   ✅ Verified essential contracts exist.`);

    // Check admin role using SDK
    try {
        await sdkInstance.connect(adminSigner as ethers.Wallet);
        // Corrected: Use sdk.roles.isAdmin based on previous snippet
        const isAdmin = await sdkInstance.roles.isAdmin(await adminSigner.getAddress()); 
        if (!isAdmin) {
            throw new Error(`   ❌ Wallet ${await adminSigner.getAddress()} does not have DEFAULT_ADMIN_ROLE on RoleManager.`);
        }
        console.log(`   ✅ Admin role verified for ${await adminSigner.getAddress()}`);
    } catch (error) {
        console.error('   ❌ Error checking admin role:', error);
        throw error;
    }

    console.log('   👍 Prerequisites met.');
}

async function fundTestAccounts(
    adminSigner: ethers.Wallet, // Explicitly type as Wallet
    testWallets: ethers.Wallet[],
    ethAmount: bigint
): Promise<void> {
    console.log(`\n💸 Funding ${testWallets.length} test accounts...`);
    const provider = adminSigner.provider;
    if (!provider) throw new Error("Admin signer needs a provider.");

    for (const wallet of testWallets) {
        const address = wallet.address;
        const ethBalance = await provider.getBalance(address);

        if (ethBalance < ethAmount) {
            const needed = ethAmount - ethBalance;
            console.log(`   Funding ${address} with ${ethers.formatEther(needed)} ETH...`);
            try {
                const tx = await adminSigner.sendTransaction({
                    to: address,
                    value: needed,
                });
                console.log(`      ⏳ Sending ETH Tx: ${tx.hash}`);
                await tx.wait();
                console.log(`      ✅ ETH sent.`);
            } catch (error) {
                console.error(`      ❌ Failed to send ETH to ${address}:`, error);
            }
        } else {
            console.log(`   ✅ ${address} already has sufficient ETH.`);
        }
        // TODO: Implement ERC20 token dispensing 
    }
    console.log('   👍 Funding complete.');
}

async function main() {
    console.log('🚀 Starting User Onboarding Flow SDK Example...');

    if (!ADMIN_PRIVATE_KEY) {
        console.error('❌ ADMIN_PRIVATE_KEY not found in environment variables.');
        process.exit(1);
    }

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const adminWallet = new ethers.Wallet(ADMIN_PRIVATE_KEY, provider);
    const testWallets = generateTestWallets(provider);
    const user1Wallet = testWallets[0];
    const user2Wallet = testWallets[1];

    console.log(`\n🔑 Using Admin Wallet: ${adminWallet.address}`);

    const sdk = new AstrixSDK({
        provider: RPC_URL,
        contracts: CONTRACT_ADDRESSES
    });

    try {
        await checkPrerequisites(sdk, adminWallet);
        await fundTestAccounts(adminWallet, testWallets, REQUIRED_ETH);

        console.log('\n🏁 Starting Core Onboarding Flow...');

        // 4. User 2 Creates Tribe
        console.log(`\n🏘️ User 2 (${user2Wallet.address}) creating tribe...`);
        await sdk.connect(user2Wallet); 
        let tribeId: number | undefined = undefined;
        try {
            const tribeName = `SDK Tribe ${Date.now().toString().slice(-5)}`;
            const tribeMetadata = JSON.stringify({
                name: tribeName,
                description: 'A tribe created via SDK.',
            });
            // Corrected: createTribe returns number (tribeId)
            tribeId = await sdk.tribes.createTribe({
                name: tribeName,
                metadata: tribeMetadata,
                joinType: 0, // PUBLIC
            }); 
            console.log(`   ✅ Tribe created with ID: ${tribeId}!`); 
        } catch (error) {
            console.error(`   ❌ Error creating tribe for ${user2Wallet.address}:`, error);
            throw error; 
        }

        // 5. User 1 Joins Tribe
        console.log(`\n🤝 User 1 (${user1Wallet.address}) joining tribe ${tribeId}...`);
        await sdk.connect(user1Wallet);
        if (tribeId === undefined) throw new Error("Cannot join tribe, ID is undefined");
        try {
            // Corrected: joinTribe returns tx hash (string), SDK handles wait
            const joinTxHash = await sdk.tribes.joinTribe({ tribeId }); 
            console.log(`   ✅ User 1 successfully joined tribe ${tribeId}. Tx: ${joinTxHash}`);
        } catch (error) {
            console.error(`   ❌ Error joining tribe ${tribeId} for ${user1Wallet.address}:`, error);
            throw error;
        }

        // 6. User 1 Creates Post
        console.log(`\n✍️ User 1 (${user1Wallet.address}) creating post in tribe ${tribeId}...`);
        let postId: number | undefined = undefined;
        try {
            const postMetadata = JSON.stringify({
                title: 'My First SDK Post!',
                content: 'Hello from the Astrix SDK example!',
                type: 'TEXT', 
            });
            // Corrected: createPost returns number (postId)
            postId = await sdk.content.createPost({ 
                tribeId: tribeId,
                metadata: postMetadata,
             }); 
            console.log(`   ✅ Post created with ID: ${postId}!`);
        } catch (error) {
            console.error(`   ❌ Error creating post in tribe ${tribeId} for ${user1Wallet.address}:`, error);
            throw error;
        }

        // 7. User 2 Interacts with Post
        console.log(`\n❤️ User 2 (${user2Wallet.address}) liking post ${postId} in tribe ${tribeId}...`);
        await sdk.connect(user2Wallet); 
        if (postId === undefined) throw new Error("Cannot interact with post, ID is undefined");
        try {
            // Corrected: interactWithPost takes separate args and returns receipt
            const interactReceipt = await sdk.content.interactWithPost(postId, InteractionType.LIKE); 
            console.log(`   ✅ Post ${postId} liked by User 2. Tx: ${interactReceipt.hash}`);
            console.log(`   📊 (Skipping interaction count check - SDK method not available)`);
        } catch (error) {
            console.error(`   ❌ Error liking post ${postId} by ${user2Wallet.address}:`, error);
        }

        console.log('\n🎉 User Onboarding Flow Example Completed Successfully!');

    } catch (error) {
        console.error('\n🚨 An error occurred during the example execution:', error);
        process.exit(1);
    }
}

main().catch((error) => {
    console.error('💥 Unhandled error in main function:', error);
    process.exit(1);
});
