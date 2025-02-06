# Frontend Integration Guide

## Contract Addresses (Monad Devnet)

```javascript
export const CONTRACT_ADDRESSES = {
  ROLE_MANAGER: "0xAb8Da15b9DFE9168341E3DCc9Ad820A36f82eFD5",
  PROFILE_NFT_MINTER: "0xE7Dc40d90b3036405AF0d1e0ea906d80e8878c9e",
  TRIBE_CONTROLLER: "0x8cFC9F002302AD3a0A142AaFc6f0b8a336B3CA3D",
  COLLECTIBLE_CONTROLLER: "0xbCC2D04a10EA4020327F350A2aef314AFd999085",
  POST_MINTER: "0xc9E487d4CB748cA0c0Dfd21aFA545b90CB6d8ff1",
  VOTING: "0x3E135b94CC68FAA159F4466803179c0F04a33d6E",
  COMMUNITY_POINTS: "0xe84a9e515ffbc2FA3f3419a5010ba623f373f793",
  EVENT_CONTROLLER: "0x36a651d892F1c4A8610415EEe206497a8297fc11",
  SUPER_COMMUNITY_CONTROLLER: "0xfBf1F5Bc0D4f9CB093e3D7619af39aeee346BfA8"
};
```

## Role-Based Access

```javascript
// RoleManager ABI (core functions)
const ROLE_MANAGER_ABI = [
  {
    "inputs": [
      {"internalType": "bytes32", "name": "role", "type": "bytes32"},
      {"internalType": "address", "name": "account", "type": "address"}
    ],
    "name": "hasRole",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "ORGANIZER_ROLE",
    "outputs": [{"internalType": "bytes32", "name": "", "type": "bytes32"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "ARTIST_ROLE",
    "outputs": [{"internalType": "bytes32", "name": "", "type": "bytes32"}],
    "stateMutability": "view",
    "type": "function"
  }
];

// Check user roles
async function checkUserRoles(signer, address) {
  const roleManager = new ethers.Contract(
    CONTRACT_ADDRESSES.ROLE_MANAGER,
    ROLE_MANAGER_ABI,
    signer
  );

  const roles = {
    isOrganizer: await roleManager.hasRole(await roleManager.ORGANIZER_ROLE(), address),
    isArtist: await roleManager.hasRole(await roleManager.ARTIST_ROLE(), address)
  };

  return roles;
}
```

## Core User Journeys

### 1. Regular User Journey

### 1. Profile Creation & Management

```javascript
// ProfileNFTMinter ABI (core functions)
const PROFILE_NFT_MINTER_ABI = [
  // Profile Creation
  {
    "inputs": [
      {"internalType": "string", "name": "username", "type": "string"},
      {"internalType": "string", "name": "metadataURI", "type": "string"}
    ],
    "name": "createProfile",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // Username Checks
  {
    "inputs": [{"internalType": "string", "name": "username", "type": "string"}],
    "name": "usernameExists",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  // Profile Updates
  {
    "inputs": [
      {"internalType": "uint256", "name": "tokenId", "type": "uint256"},
      {"internalType": "string", "name": "newMetadataURI", "type": "string"}
    ],
    "name": "updateProfileMetadata",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // Profile Queries
  {
    "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
    "name": "getProfileByTokenId",
    "outputs": [
      {"internalType": "string", "name": "username", "type": "string"},
      {"internalType": "string", "name": "metadataURI", "type": "string"},
      {"internalType": "address", "name": "owner", "type": "address"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "string", "name": "username", "type": "string"}],
    "name": "getTokenIdByUsername",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
];

// Username validation constants
const USERNAME_CONSTRAINTS = {
  MIN_LENGTH: 3,
  MAX_LENGTH: 32,
  ALLOWED_CHARS: /^[a-zA-Z0-9_-]+$/
};

// Profile metadata structure
const PROFILE_METADATA_SCHEMA = {
  version: "1.0",
  fields: {
    avatar: "string (IPFS URI)",
    displayName: "string",
    bio: "string",
    social: {
      twitter: "string (optional)",
      discord: "string (optional)",
      website: "string (optional)"
    },
    attributes: "array (optional custom attributes)"
  }
};

// Integration Functions

// 1. Username Validation
function validateUsername(username) {
  if (username.length < USERNAME_CONSTRAINTS.MIN_LENGTH || 
      username.length > USERNAME_CONSTRAINTS.MAX_LENGTH) {
    return {
      valid: false,
      error: `Username must be between ${USERNAME_CONSTRAINTS.MIN_LENGTH} and ${USERNAME_CONSTRAINTS.MAX_LENGTH} characters`
    };
  }
  
  if (!USERNAME_CONSTRAINTS.ALLOWED_CHARS.test(username)) {
    return {
      valid: false,
      error: "Username can only contain letters, numbers, underscores, and hyphens"
    };
  }
  
  return { valid: true };
}

// 2. Check Username Availability
async function checkUsernameAvailability(signer, username) {
  const profileContract = new ethers.Contract(
    CONTRACT_ADDRESSES.PROFILE_NFT_MINTER,
    PROFILE_NFT_MINTER_ABI,
    signer
  );
  
  // Validate format first
  const validation = validateUsername(username);
  if (!validation.valid) {
    throw new Error(validation.error);
  }
  
  // Check availability
  const exists = await profileContract.usernameExists(username);
  return !exists;
}

// 3. Create Profile
async function createProfile(signer, username, metadata) {
  const profileContract = new ethers.Contract(
    CONTRACT_ADDRESSES.PROFILE_NFT_MINTER,
    PROFILE_NFT_MINTER_ABI,
    signer
  );
  
  // Validate username
  const validation = validateUsername(username);
  if (!validation.valid) {
    throw new Error(validation.error);
  }
  
  // Check availability
  const isAvailable = await checkUsernameAvailability(signer, username);
  if (!isAvailable) {
    throw new Error("Username is already taken");
  }
  
  // Upload metadata to IPFS
  const metadataURI = await uploadToIPFS(metadata);
  
  // Create profile
  const tx = await profileContract.createProfile(username, metadataURI);
  const receipt = await tx.wait();
  
  // Get tokenId from event
  const event = receipt.logs.find(
    log => log.topics[0] === ethers.id("ProfileCreated(uint256,address,string)")
  );
  const tokenId = Number(event.topics[1]);
  
  return {
    tokenId,
    username,
    metadataURI,
    owner: await signer.getAddress()
  };
}

// 4. Get Profile Data
async function getProfile(signer, identifier) {
  const profileContract = new ethers.Contract(
    CONTRACT_ADDRESSES.PROFILE_NFT_MINTER,
    PROFILE_NFT_MINTER_ABI,
    signer
  );
  
  let tokenId;
  
  // Handle both username and tokenId lookups
  if (typeof identifier === 'string') {
    tokenId = await profileContract.getTokenIdByUsername(identifier);
  } else {
    tokenId = identifier;
  }
  
  const profile = await profileContract.getProfileByTokenId(tokenId);
  
  // Fetch metadata from IPFS
  const metadata = await fetchFromIPFS(profile.metadataURI);
  
  return {
    tokenId,
    username: profile.username,
    metadataURI: profile.metadataURI,
    owner: profile.owner,
    metadata
  };
}

// 5. Update Profile
async function updateProfile(signer, tokenId, metadata) {
  const profileContract = new ethers.Contract(
    CONTRACT_ADDRESSES.PROFILE_NFT_MINTER,
    PROFILE_NFT_MINTER_ABI,
    signer
  );
  
  // Upload new metadata to IPFS
  const metadataURI = await uploadToIPFS(metadata);
  
  // Update profile
  const tx = await profileContract.updateProfileMetadata(tokenId, metadataURI);
  await tx.wait();
  
  return {
    tokenId,
    metadataURI,
    metadata
  };
}

// Error Handling
const PROFILE_ERROR_CODES = {
  USERNAME_EXISTS: "Username already taken",
  INVALID_USERNAME: "Invalid username format",
  NOT_OWNER: "Not token owner",
  PROFILE_NOT_FOUND: "Profile does not exist"
};

function handleProfileError(error) {
  const message = error.message || '';
  
  // Map contract errors to user-friendly messages
  if (message.includes("Username already taken")) {
    return PROFILE_ERROR_CODES.USERNAME_EXISTS;
  }
  if (message.includes("Invalid username")) {
    return PROFILE_ERROR_CODES.INVALID_USERNAME;
  }
  if (message.includes("Not token owner")) {
    return PROFILE_ERROR_CODES.NOT_OWNER;
  }
  if (message.includes("Profile does not exist")) {
    return PROFILE_ERROR_CODES.PROFILE_NOT_FOUND;
  }
  
  return "An unexpected error occurred";
}

// Example Usage
async function completeProfileCreation(signer, username, displayName, avatar, bio) {
  try {
    // 1. Prepare metadata
    const metadata = {
      version: "1.0",
      avatar,
      displayName,
      bio,
      social: {},
      attributes: [],
      createdAt: Date.now()
    };
    
    // 2. Create profile
    const profile = await createProfile(signer, username, metadata);
    
    return profile;
  } catch (error) {
    throw handleProfileError(error);
  }
}

### 2. Tribe Management

```javascript
// TribeController ABI (core functions)
const TRIBE_CONTROLLER_ABI = [
  {
    "inputs": [
      {"internalType": "string", "name": "name", "type": "string"},
      {"internalType": "string", "name": "metadata", "type": "string"},
      {"internalType": "address[]", "name": "whitelist", "type": "address[]"}
    ],
    "name": "createTribe",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAllTribes",
    "outputs": [{"internalType": "uint256[]", "name": "", "type": "uint256[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "tribeId", "type": "uint256"}],
    "name": "getTribeDetails",
    "outputs": [
      {
        "components": [
          {"internalType": "string", "name": "name", "type": "string"},
          {"internalType": "string", "name": "metadata", "type": "string"},
          {"internalType": "address", "name": "admin", "type": "address"},
          {"internalType": "bool", "name": "active", "type": "bool"}
        ],
        "internalType": "struct TribeController.Tribe",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// Example tribe metadata structure
const tribeMetadata = {
  description: "Tribe description",
  image: "ipfs://QmTribeImage...",
  social: {
    discord: "https://discord.gg/...",
    twitter: "@tribename"
  }
};

// 1. List all tribes
async function listAllTribes(signer) {
  const tribeContract = new ethers.Contract(
    CONTRACT_ADDRESSES.TRIBE_CONTROLLER,
    TRIBE_CONTROLLER_ABI,
    signer
  );
  
  const tribeIds = await tribeContract.getAllTribes();
  const tribes = await Promise.all(
    tribeIds.map(async id => {
      const details = await tribeContract.getTribeDetails(id);
      return {
        id: id,
        name: details.name,
        metadata: details.metadata,
        admin: details.admin,
        active: details.active
      };
    })
  );
  return tribes;
}

// 2. Create new tribe
async function createTribe(signer, name, metadata, whitelist) {
  const tribeContract = new ethers.Contract(
    CONTRACT_ADDRESSES.TRIBE_CONTROLLER,
    TRIBE_CONTROLLER_ABI,
    signer
  );
  
  const metadataURI = await uploadToIPFS(metadata);
  const tx = await tribeContract.createTribe(name, metadataURI, whitelist);
  const receipt = await tx.wait();
  
  const event = receipt.events.find(e => e.event === 'TribeCreated');
  return event.args.tribeId;
}

### 3. Post Creation

```javascript
// PostMinter ABI (core functions)
const POST_MINTER_ABI = [
  {
    "inputs": [
      {"internalType": "uint256", "name": "tribeId", "type": "uint256"},
      {"internalType": "string", "name": "contentURI", "type": "string"}
    ],
    "name": "createPost",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "tribeId", "type": "uint256"}],
    "name": "getTribePosts",
    "outputs": [{"internalType": "uint256[]", "name": "", "type": "uint256[]"}],
    "stateMutability": "view",
    "type": "function"
  }
];

// Example post metadata structure
const postMetadata = {
  content: "Post content here",
  media: ["ipfs://QmMedia1...", "ipfs://QmMedia2..."],
  timestamp: Date.now()
};

// 1. Create a post in a tribe
async function createPost(signer, tribeId, content) {
  const postContract = new ethers.Contract(
    CONTRACT_ADDRESSES.POST_MINTER,
    POST_MINTER_ABI,
    signer
  );
  
  const contentURI = await uploadToIPFS(content);
  const tx = await postContract.createPost(tribeId, contentURI);
  const receipt = await tx.wait();
  
  const event = receipt.events.find(e => e.event === 'PostCreated');
  return event.args.postId;
}

// 2. Get all posts in a tribe
async function getTribePosts(signer, tribeId) {
  const postContract = new ethers.Contract(
    CONTRACT_ADDRESSES.POST_MINTER,
    POST_MINTER_ABI,
    signer
  );
  
  const postIds = await postContract.getTribePosts(tribeId);
  return postIds;
}
```

## Helper Functions

```javascript
// IPFS upload helper (example using web3.storage)
async function uploadToIPFS(data) {
  const client = new Web3Storage({ token: YOUR_WEB3_STORAGE_TOKEN });
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
  const file = new File([blob], 'metadata.json');
  const cid = await client.put([file]);
  return `ipfs://${cid}/metadata.json`;
}

// Error handler
function handleError(error) {
  const message = error.message || '';
  if (message.includes("username already exists")) {
    return "This username is already taken";
  }
  if (message.includes("not whitelisted")) {
    return "You are not whitelisted for this tribe";
  }
  return "Transaction failed. Please try again.";
}
```

## Example Usage Flow

```javascript
// Complete profile creation flow
async function completeProfileCreation(signer, username, avatar, bio) {
  try {
    // 1. Check username availability
    const isAvailable = await checkUsernameAvailability(signer, username);
    if (!isAvailable) {
      throw new Error("Username already exists");
    }

    // 2. Prepare metadata
    const metadata = {
      avatar,
      bio,
      createdAt: Date.now()
    };

    // 3. Create profile
    const tokenId = await createProfile(signer, username, metadata);
    return tokenId;
  } catch (error) {
    throw handleError(error);
  }
}

// Create tribe and first post flow
async function createTribeWithFirstPost(signer, tribeName, tribeMetadata, firstPost) {
  try {
    // 1. Create tribe
    const tribeId = await createTribe(signer, tribeName, tribeMetadata, []);
    
    // 2. Create first post
    const postId = await createPost(signer, tribeId, firstPost);
    
    return { tribeId, postId };
  } catch (error) {
    throw handleError(error);
  }
}
```

## Testing Checklist

1. Profile Creation
   - [ ] Check username availability
   - [ ] Create profile with username and avatar
   - [ ] Update profile metadata

2. Tribe Management
   - [ ] List all tribes
   - [ ] Create new tribe
   - [ ] View tribe details

3. Content Creation
   - [ ] Create post in tribe
   - [ ] View tribe posts
   - [ ] Update post metadata

## Network Configuration

```javascript
export const NETWORK_CONFIG = {
  chainId: "0x4E9F", // 20143 in hex
  chainName: "Monad Devnet",
  nativeCurrency: {
    name: "DMON",
    symbol: "DMON",
    decimals: 18
  },
  rpcUrls: ["https://rpc-devnet.monadinfra.com/rpc/3fe540e310bbb6ef0b9f16cd23073b0a"],
  blockExplorerUrls: ["https://explorer-devnet.monadinfra.com"]
};
```

## Common Integration Patterns

### 1. Connecting to Monad Network

```javascript
async function addMonadNetwork() {
  try {
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [NETWORK_CONFIG],
    });
  } catch (error) {
    console.error('Error adding Monad network:', error);
  }
}

async function switchToMonadNetwork() {
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: NETWORK_CONFIG.chainId }],
    });
  } catch (error) {
    if (error.code === 4902) {
      await addMonadNetwork();
    }
  }
}
```

### 2. Event Management

```javascript
// Create an event
async function createEvent(signer, metadataURI, maxTickets, price) {
  const eventController = new ethers.Contract(
    CONTRACT_ADDRESSES.EVENT_CONTROLLER,
    EventControllerABI,
    signer
  );
  
  const tx = await eventController.createEvent(metadataURI, maxTickets, price);
  await tx.wait();
}

// Purchase tickets
async function purchaseTickets(signer, eventId, amount, totalPrice) {
  const eventController = new ethers.Contract(
    CONTRACT_ADDRESSES.EVENT_CONTROLLER,
    EventControllerABI,
    signer
  );
  
  const tx = await eventController.purchaseTickets(eventId, amount, {
    value: totalPrice
  });
  await tx.wait();
}

// Transfer ticket
async function transferTicket(signer, from, to, eventId, amount) {
  const eventController = new ethers.Contract(
    CONTRACT_ADDRESSES.EVENT_CONTROLLER,
    EventControllerABI,
    signer
  );
  
  const tx = await eventController.safeTransferFrom(from, to, eventId, amount, "0x");
  await tx.wait();
}
```

### 3. Community Points

```javascript
// Redeem points (requires backend signature)
async function redeemPoints(signer, points, collectibleType, signature) {
  const communityPoints = new ethers.Contract(
    CONTRACT_ADDRESSES.COMMUNITY_POINTS,
    CommunityPointsABI,
    signer
  );
  
  const tx = await communityPoints.redeemPoints(points, collectibleType, signature);
  await tx.wait();
}
```

### 4. Super Community Management

```javascript
// Create super community
async function createSuperCommunity(signer, name, metadata, initialTribeIds) {
  const superCommunityController = new ethers.Contract(
    CONTRACT_ADDRESSES.SUPER_COMMUNITY_CONTROLLER,
    SuperCommunityControllerABI,
    signer
  );
  
  const tx = await superCommunityController.createSuperCommunity(
    name,
    metadata,
    initialTribeIds
  );
  await tx.wait();
}

// Add tribe to super community
async function addTribeToSuperCommunity(signer, superCommunityId, tribeId) {
  const superCommunityController = new ethers.Contract(
    CONTRACT_ADDRESSES.SUPER_COMMUNITY_CONTROLLER,
    SuperCommunityControllerABI,
    signer
  );
  
  const tx = await superCommunityController.addTribeToSuperCommunity(
    superCommunityId,
    tribeId
  );
  await tx.wait();
}
```

## Event Listening

### Important Events to Track

```javascript
// Profile creation
profileNFTMinter.on("ProfileCreated", (tokenId, owner, username, event) => {
  console.log(`New profile created: ${username} (Token ID: ${tokenId})`);
});

// Tribe creation
tribeController.on("TribeCreated", (tribeId, name, admin, event) => {
  console.log(`New tribe created: ${name} (ID: ${tribeId})`);
});

// Event creation
eventController.on("EventCreated", (eventId, organizer, metadata, maxTickets, price, event) => {
  console.log(`New event created: ${eventId}`);
});

// Ticket purchase
eventController.on("TicketPurchased", (eventId, buyer, amount, event) => {
  console.log(`Tickets purchased: ${amount} for event ${eventId}`);
});

// Points redemption
communityPoints.on("PointsRedeemed", (user, points, collectibleType, event) => {
  console.log(`Points redeemed: ${points} by ${user}`);
});
```

## Error Handling

Common error codes and messages:

```javascript
const ERROR_MESSAGES = {
  "Not organizer": "You need organizer role to perform this action",
  "Not admin": "You need admin role to perform this action",
  "Insufficient payment": "Not enough DMON sent for the transaction",
  "Not enough tickets": "The requested number of tickets is not available",
  "Ticket already transferred once": "This ticket has already been transferred",
  "Tribe already in super community": "This tribe is already part of a super community"
};

function handleContractError(error) {
  const message = error.message || '';
  const reason = Object.keys(ERROR_MESSAGES).find(key => message.includes(key));
  return reason ? ERROR_MESSAGES[reason] : 'Transaction failed. Please try again.';
}
```

## Contract ABIs

The ABIs for each contract can be found in the `artifacts` directory after compilation. For convenience, you can export them like this:

```javascript
export const ABIS = {
  RoleManager: require('./artifacts/contracts/RoleManager.sol/RoleManager.json').abi,
  ProfileNFTMinter: require('./artifacts/contracts/ProfileNFTMinter.sol/ProfileNFTMinter.json').abi,
  TribeController: require('./artifacts/contracts/TribeController.sol/TribeController.json').abi,
  EventController: require('./artifacts/contracts/EventController.sol/EventController.json').abi,
  CommunityPoints: require('./artifacts/contracts/CommunityPoints.sol/CommunityPoints.json').abi,
  SuperCommunityController: require('./artifacts/contracts/SuperCommunityController.sol/SuperCommunityController.json').abi,
  CollectibleController: require('./artifacts/contracts/CollectibleController.sol/CollectibleController.json').abi,
  PostMinter: require('./artifacts/contracts/PostMinter.sol/PostMinter.json').abi,
  Voting: require('./artifacts/contracts/Voting.sol/Voting.json').abi
};
```

## Utility Functions

```javascript
// Format DMON amount
function formatDMON(amount) {
  return ethers.formatEther(amount);
}

// Parse DMON amount
function parseDMON(amount) {
  return ethers.parseEther(amount.toString());
}

// Get contract instance
function getContract(address, abi, signer) {
  return new ethers.Contract(address, abi, signer);
}

// Check if address has role
async function hasRole(roleManager, role, address) {
  return await roleManager.hasRole(role, address);
}
```

## Testing the Integration

Before deploying to production, test all interactions on the Monad Devnet:

1. Connect to Monad Devnet
2. Create a test profile
3. Create a test tribe
4. Create a test event
5. Purchase and transfer tickets
6. Create a super community
7. Test points redemption

## Support

For technical support and questions:
- GitHub Issues: [Project Repository]
- Documentation: [Project Docs]
- Developer Chat: [Discord/Telegram]

### 2. Organizer Journey

```javascript
// Check if user is organizer
async function isOrganizer(signer, address) {
  const roles = await checkUserRoles(signer, address);
  return roles.isOrganizer;
}

// Create and manage events
async function createEvent(signer, metadata, maxTickets, price) {
  if (!await isOrganizer(signer, await signer.getAddress())) {
    throw new Error("Not authorized as organizer");
  }
  
  const eventController = new ethers.Contract(
    CONTRACT_ADDRESSES.EVENT_CONTROLLER,
    EVENT_CONTROLLER_ABI,
    signer
  );
  
  const tx = await eventController.createEvent(metadata, maxTickets, price);
  const receipt = await tx.wait();
  return receipt.events.find(e => e.event === 'EventCreated').args.eventId;
}

// Manage super communities
async function createSuperCommunity(signer, name, metadata, initialTribeIds) {
  if (!await isOrganizer(signer, await signer.getAddress())) {
    throw new Error("Not authorized as organizer");
  }

  const superCommunityController = new ethers.Contract(
    CONTRACT_ADDRESSES.SUPER_COMMUNITY_CONTROLLER,
    SUPER_COMMUNITY_CONTROLLER_ABI,
    signer
  );
  
  const tx = await superCommunityController.createSuperCommunity(name, metadata, initialTribeIds);
  const receipt = await tx.wait();
  return receipt.events.find(e => e.event === 'SuperCommunityCreated').args.superCommunityId;
}
```

### 3. Artist Journey

```javascript
// Check if user is artist
async function isArtist(signer, address) {
  const roles = await checkUserRoles(signer, address);
  return roles.isArtist;
}

// Create collectibles
async function createCollectible(signer, metadata, maxSupply) {
  if (!await isArtist(signer, await signer.getAddress())) {
    throw new Error("Not authorized as artist");
  }

  const collectibleController = new ethers.Contract(
    CONTRACT_ADDRESSES.COLLECTIBLE_CONTROLLER,
    COLLECTIBLE_CONTROLLER_ABI,
    signer
  );
  
  const tx = await collectibleController.createCollectible(metadata, maxSupply);
  const receipt = await tx.wait();
  return receipt.events.find(e => e.event === 'CollectibleCreated').args.collectibleId;
}
```

### 4. Tribe Admin Journey

```javascript
// Check if user is tribe admin
async function isTribeAdmin(signer, tribeId) {
  const tribeController = new ethers.Contract(
    CONTRACT_ADDRESSES.TRIBE_CONTROLLER,
    TRIBE_CONTROLLER_ABI,
    signer
  );
  
  const tribeDetails = await tribeController.getTribeDetails(tribeId);
  return tribeDetails.admin === await signer.getAddress();
}

// Manage tribe whitelist
async function manageTribeWhitelist(signer, tribeId, address, isWhitelisted) {
  if (!await isTribeAdmin(signer, tribeId)) {
    throw new Error("Not authorized as tribe admin");
  }

  const tribeController = new ethers.Contract(
    CONTRACT_ADDRESSES.TRIBE_CONTROLLER,
    TRIBE_CONTROLLER_ABI,
    signer
  );
  
  const tx = await tribeController.setWhitelistStatus(tribeId, address, isWhitelisted);
  await tx.wait();
}

// Remove tribe from super community
async function removeTribeFromSuperCommunity(signer, superCommunityId, tribeId) {
  if (!await isTribeAdmin(signer, tribeId)) {
    throw new Error("Not authorized as tribe admin");
  }

  const superCommunityController = new ethers.Contract(
    CONTRACT_ADDRESSES.SUPER_COMMUNITY_CONTROLLER,
    SUPER_COMMUNITY_CONTROLLER_ABI,
    signer
  );
  
  const tx = await superCommunityController.removeTribeFromSuperCommunity(superCommunityId, tribeId);
  await tx.wait();
}
```

## Role-Based Testing Checklist

1. Regular User Functions
   - [ ] Create and manage profile
   - [ ] Join tribes (if whitelisted)
   - [ ] Create posts in joined tribes
   - [ ] Purchase event tickets

2. Organizer Functions
   - [ ] Create and manage events
   - [ ] Create super communities
   - [ ] Manage tribe memberships in super communities

3. Artist Functions
   - [ ] Create collectibles
   - [ ] Set collectible metadata
   - [ ] Manage collectible supply

4. Tribe Admin Functions
   - [ ] Manage tribe whitelist
   - [ ] Update tribe metadata
   - [ ] Remove tribe from super community
   - [ ] Moderate tribe content 

## Test Cases

### Profile Creation and Username Lookup Test

```javascript
// Complete test case for profile creation and username lookup
async function testProfileCreationAndLookup(signer) {
  try {
    // 1. Create a profile with "demousername"
    const profileMetadata = {
      version: "1.0",
      avatar: "ipfs://QmTest...",
      displayName: "Demo User",
      bio: "This is a test profile",
      social: {},
      attributes: [],
      createdAt: Date.now()
    };

    console.log("Creating profile with username: demousername");
    const profile = await createProfile(signer, "demousername", profileMetadata);
    console.log("Profile created:", profile);

    // 2. Test different ways to lookup the profile
    
    // Method 1: Get profile by token ID
    console.log("\nMethod 1: Looking up by token ID");
    const profileByTokenId = await getProfile(signer, profile.tokenId);
    console.log("Profile found by token ID:", profileByTokenId);

    // Method 2: Get profile by username
    console.log("\nMethod 2: Looking up by username");
    const profileByUsername = await getProfile(signer, "demousername");
    console.log("Profile found by username:", profileByUsername);

    // Method 3: Check username existence
    console.log("\nMethod 3: Checking username existence");
    const exists = await checkUsernameAvailability(signer, "demousername");
    console.log("Username availability:", !exists);

    // Method 4: Get token ID directly by username
    console.log("\nMethod 4: Getting token ID by username");
    const profileContract = new ethers.Contract(
      CONTRACT_ADDRESSES.PROFILE_NFT_MINTER,
      PROFILE_NFT_MINTER_ABI,
      signer
    );
    const tokenId = await profileContract.getTokenIdByUsername("demousername");
    console.log("Token ID found:", Number(tokenId));

    return {
      success: true,
      profile,
      lookupResults: {
        byTokenId: profileByTokenId,
        byUsername: profileByUsername,
        exists: !exists,
        tokenId: Number(tokenId)
      }
    };
  } catch (error) {
    console.error("Test failed:", handleProfileError(error));
    return {
      success: false,
      error: handleProfileError(error)
    };
  }
}

// Example usage:
async function runProfileTest() {
  // First ensure we're connected to Monad network
  await switchToMonadNetwork();
  
  // Get signer
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  
  console.log("Starting profile creation and lookup test...");
  const result = await testProfileCreationAndLookup(signer);
  
  if (result.success) {
    console.log("Test completed successfully!");
    console.log("Original profile:", result.profile);
    console.log("Lookup results:", result.lookupResults);
  } else {
    console.error("Test failed:", result.error);
  }
}

// Expected console output for successful test:
/*
Starting profile creation and lookup test...
Creating profile with username: demousername
Profile created: {
  tokenId: 1,
  username: "demousername",
  metadataURI: "ipfs://QmTest...",
  owner: "0x..."
}

Method 1: Looking up by token ID
Profile found by token ID: {
  tokenId: 1,
  username: "demousername",
  metadataURI: "ipfs://QmTest...",
  owner: "0x...",
  metadata: {
    version: "1.0",
    avatar: "ipfs://QmTest...",
    displayName: "Demo User",
    bio: "This is a test profile",
    social: {},
    attributes: [],
    createdAt: 1234567890
  }
}

Method 2: Looking up by username
Profile found by username: {
  tokenId: 1,
  username: "demousername",
  metadataURI: "ipfs://QmTest...",
  owner: "0x...",
  metadata: {
    version: "1.0",
    avatar: "ipfs://QmTest...",
    displayName: "Demo User",
    bio: "This is a test profile",
    social: {},
    attributes: [],
    createdAt: 1234567890
  }
}

Method 3: Checking username existence
Username availability: false

Method 4: Getting token ID by username
Token ID found: 1

Test completed successfully!
*/
```

### Common Test Scenarios

1. **Create and Verify Profile**
```javascript
// Create profile
const profile = await createProfile(signer, "demousername", metadata);

// Verify by token ID
const verifyById = await getProfile(signer, profile.tokenId);
assert(verifyById.username === "demousername", "Username mismatch in token ID lookup");

// Verify by username
const verifyByName = await getProfile(signer, "demousername");
assert(verifyByName.tokenId === profile.tokenId, "Token ID mismatch in username lookup");
```

2. **Handle Duplicate Username**
```javascript
// Create first profile
await createProfile(signer, "demousername", metadata);

// Try to create duplicate (should fail)
try {
  await createProfile(signer, "demousername", metadata);
  throw new Error("Should not allow duplicate username");
} catch (error) {
  assert(error.message.includes("Username already taken"), "Wrong error message");
}
```

3. **Case Sensitivity Test**
```javascript
// Create profile with lowercase
await createProfile(signer, "demousername", metadata);

// Try uppercase (should fail)
try {
  await createProfile(signer, "DemoUsername", metadata);
  throw new Error("Should not allow case-variant username");
} catch (error) {
  assert(error.message.includes("Username already taken"), "Case sensitivity not working");
}
```

Add these test cases to your integration testing suite to ensure proper functionality of the profile creation and username lookup features. 