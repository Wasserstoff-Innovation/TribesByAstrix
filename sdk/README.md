# Tribes by Astrix SDK

[![npm version](https://img.shields.io/npm/v/@astrix-labs/sdk.svg)](https://www.npmjs.com/package/@astrix-labs/sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A TypeScript/JavaScript SDK for interacting with the Tribes by Astrix platform.

## Installation

```bash
npm install @astrix-labs/sdk # Or your actual package name
# or
yarn add @astrix-labs/sdk
```

## Quick Start

```typescript
import { AstrixSDK, InteractionType } from '@astrix-labs/sdk'; // Adjust import path/name
import { ethers } from 'ethers';

// 1. Define Configuration (RPC and Contract Addresses)
const RPC_URL = 'YOUR_RPC_URL'; // e.g., http://127.0.0.1:8545/ or Infura/Alchemy URL
const CONTRACT_ADDRESSES = {
    roleManager: '0x...',            // Replace with deployed address
    tribeController: '0x...',       // Replace with deployed address
    collectibleController: '0x...',  // Replace with deployed address
    postMinter: '0x...',           // Replace with deployed address
    astrixPointSystem: '0x...',      // Replace with deployed address (ensure key matches SDK)
    profileNFTMinter: '0x...',       // Replace with deployed address
    // Add other required contract addresses from your deployment
};

// 2. Initialize SDK
const sdk = new AstrixSDK({
  provider: RPC_URL,        // Pass RPC URL string
  contracts: CONTRACT_ADDRESSES
});

// 3. Connect a Wallet (for write operations)
// Ensure you have a private key or other signer mechanism
const provider = new ethers.JsonRpcProvider(RPC_URL);
const privateKey = 'YOUR_PRIVATE_KEY'; 
const wallet = new ethers.Wallet(privateKey, provider);
await sdk.connect(wallet); 
console.log("SDK Connected with wallet:", await wallet.getAddress());

// --- Example Usage ---

// Create a Tribe (Requires connected signer with permissions)
async function createMyTribe() {
  try {
    const tribeId = await sdk.tribes.createTribe({
      name: "My SDK Tribe",
      metadata: JSON.stringify({ description: "Test tribe via SDK" }),
      joinType: 0 // Public
    });
    console.log("Created Tribe ID:", tribeId);
    return tribeId;
  } catch (e) { console.error("Error creating tribe:", e); }
}

// Join a Tribe (Requires connected signer)
async function join(tribeId: number) {
  try {
    const txHash = await sdk.tribes.joinTribe({ tribeId });
    console.log("Joined Tribe Tx:", txHash);
  } catch (e) { console.error("Error joining tribe:", e); }
}

// Create a Post (Requires connected signer with tribe membership)
async function post(tribeId: number) {
  try {
    const postId = await sdk.content.createPost({
      tribeId: tribeId,
      metadata: JSON.stringify({ title: "SDK Post", content: "Hello World!", type: 'TEXT' })
    });
    console.log("Created Post ID:", postId);
    return postId;
  } catch (e) { console.error("Error creating post:", e); }
}

// Like a Post (Requires connected signer with tribe membership)
async function like(postId: number) {
  try {
    const receipt = await sdk.content.interactWithPost(postId, InteractionType.LIKE);
    console.log("Liked Post Tx:", receipt.hash);
  } catch (e) { console.error("Error liking post:", e); }
}

// Check Admin Role (Uses connected signer)
async function checkAdmin() {
  try {
    const isAdmin = await sdk.roles.isAdmin(await sdk.getAddress());
    console.log("Is connected wallet admin?", isAdmin);
  } catch (e) { console.error("Error checking admin role:", e); }
}

// --- Run Example Flow ---
async function runFlow() {
    const myTribeId = await createMyTribe();
    if (myTribeId !== undefined) {
        await join(myTribeId);
        const myPostId = await post(myTribeId);
        if (myPostId !== undefined) {
            await like(myPostId);
        }
    }
    await checkAdmin(); 
}

runFlow();
```

## Core Concepts

1.  **Initialization:** Create an `AstrixSDK` instance with your RPC provider URL and the deployed contract addresses for your target network.
2.  **Connection:** Use `sdk.connect(signer)` to enable write operations (like creating tribes or posts). The `signer` should be an `ethers.Wallet` or compatible signer object.
3.  **Modules:** Access platform features through specific modules attached to the SDK instance (e.g., `sdk.tribes`, `sdk.content`, `sdk.roles`).
4.  **Methods:** Call methods on the modules (e.g., `sdk.tribes.createTribe(...)`, `sdk.content.createPost(...)`). Refer to the specific module documentation or source code for method parameters and return types.
    *   Methods performing on-chain transactions typically return either a transaction receipt (`ethers.TransactionReceipt`) or, in some cases, a derived ID (`number`) after waiting for confirmation internally.
    *   Read-only methods return the requested data directly.

## Key Modules & Methods

*(This is a non-exhaustive list based on recent usage examples)*

*   **`sdk.connect(signer)`:** Connects a wallet/signer for write operations.
*   **`sdk.roles`**
    *   `isAdmin(address)`: Checks if an address has the admin role.
    *   `hasRole(roleHash, address)`: Checks for a specific role.
*   **`sdk.tribes`**
    *   `createTribe({ name, metadata, joinType?, ... })`: Creates a new tribe, returns `Promise<number>` (tribeId).
    *   `joinTribe({ tribeId })`: Joins a tribe, returns `Promise<string>` (txHash).
    *   `getMemberStatus(tribeId, address)`: Returns the membership status (number).
    *   `getUserTribes(address)`: Returns an array of tribe IDs (`number[]`) the user is in.
    *   `getAllTribes(offset?, limit?)`: Returns `{ tribeIds: number[], total: number }`.
    *   `getTribeDetails(tribeId)`: Returns detailed tribe information.
*   **`sdk.content`**
    *   `createPost({ tribeId, metadata, isGated?, ... })`: Creates a post, returns `Promise<number>` (postId).
    *   `interactWithPost(postId, interactionType)`: Performs an interaction (like, etc.), returns `Promise<ethers.TransactionReceipt>`.
*   **`sdk.points`**
    *   `getTribeTokenAddress(tribeId)`: Returns the tribe's ERC20 token address or ZeroAddress.
*   **`sdk.profiles`**
    *   *(Currently limited implementation - `createProfile` needed)*

## Configuration

The SDK requires the provider URL and contract addresses. If you don't provide specific contract addresses during initialization, the SDK will attempt to load default addresses based on the connected network's chain ID from `sdk/src/config/deployedContracts.ts`.

```typescript
const sdk = new AstrixSDK({
  provider: 'YOUR_RPC_URL', 
  // Optionally provide addresses directly to override defaults:
  // contracts: {
  //   roleManager: '0x...',
  //   tribeController: '0x...',
  //   // ... other necessary addresses
  // }
});
```

Default contract addresses for supported networks are maintained in `sdk/src/config/deployedContracts.ts`. This file is automatically updated by the deployment script.

## Development

To build the SDK locally:

```