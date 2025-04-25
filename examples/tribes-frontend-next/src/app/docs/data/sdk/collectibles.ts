import { MethodDocumentation } from './tribes';

export const collectiblesModule = {
  title: 'Collectibles Module',
  description: 'The Collectibles module provides functionality for creating and managing NFT collectibles within tribes.',
  methods: [
    {
      name: 'createCollectible',
      description: 'Creates a new collectible NFT type for a tribe.',
      parameters: [
        { name: 'tribeId', type: 'number', description: 'The ID of the tribe' },
        { name: 'name', type: 'string', description: 'Name of the collectible' },
        { name: 'metadata', type: 'string', description: 'JSON metadata for the collectible' },
        { name: 'maxSupply', type: 'number', description: 'Maximum supply of the collectible', optional: true },
        { name: 'transferable', type: 'boolean', description: 'Whether the collectible can be transferred', optional: true }
      ],
      returns: {
        type: 'Promise<number>',
        description: 'ID of the newly created collectible type'
      },
      example: `const collectibleId = await sdk.collectibles.createCollectible({
  tribeId: 42,
  name: "Founding Member Badge",
  metadata: JSON.stringify({
    description: "Badge for founding members of the tribe",
    image: "ipfs://QmXyZ123...",
    attributes: [
      { trait_type: "Rarity", value: "Legendary" },
      { trait_type: "Member Type", value: "Founder" }
    ]
  }),
  maxSupply: 100,
  transferable: false
});

console.log(\`Created collectible with ID: \${collectibleId}\`);`
    },
    {
      name: 'getTribeCollectibles',
      description: 'Gets all collectible types for a specific tribe.',
      parameters: [
        { name: 'tribeId', type: 'number', description: 'The ID of the tribe' }
      ],
      returns: {
        type: 'Promise<CollectibleType[]>',
        description: 'Array of collectible types'
      },
      example: `const collectibles = await sdk.collectibles.getTribeCollectibles(tribeId);
console.log(\`Tribe has \${collectibles.length} collectible types\`);
collectibles.forEach(collectible => {
  console.log(\`Collectible \${collectible.id}: \${collectible.name}\`);
  console.log(\`Supply: \${collectible.currentSupply} / \${collectible.maxSupply}\`);
});`
    },
    {
      name: 'mintCollectible',
      description: 'Mints a collectible to a specific address.',
      parameters: [
        { name: 'collectibleId', type: 'number', description: 'ID of the collectible type' },
        { name: 'recipient', type: 'string', description: 'Address to receive the collectible' },
        { name: 'quantity', type: 'number', description: 'Number of collectibles to mint (default: 1)', optional: true }
      ],
      returns: {
        type: 'Promise<{ tokenIds: number[], txHash: string }>',
        description: 'Object containing the token IDs of the minted collectibles and transaction hash'
      },
      example: `// Mint a single collectible
const result = await sdk.collectibles.mintCollectible(collectibleId, "0x1234...");
console.log(\`Minted collectible with token ID: \${result.tokenIds[0]}\`);

// Mint multiple collectibles
const batchResult = await sdk.collectibles.mintCollectible(collectibleId, "0x1234...", 5);
console.log(\`Minted 5 collectibles with token IDs: \${batchResult.tokenIds.join(', ')}\`);`
    },
    {
      name: 'getCollectibleDetails',
      description: 'Gets detailed information about a specific collectible type.',
      parameters: [
        { name: 'collectibleId', type: 'number', description: 'ID of the collectible type' }
      ],
      returns: {
        type: 'Promise<CollectibleDetails>',
        description: 'Detailed information about the collectible type'
      },
      example: `const details = await sdk.collectibles.getCollectibleDetails(collectibleId);
console.log(\`Collectible Name: \${details.name}\`);
console.log(\`Created by: \${details.creator}\`);
console.log(\`Max Supply: \${details.maxSupply}\`);
console.log(\`Current Supply: \${details.currentSupply}\`);
console.log(\`Transferable: \${details.transferable ? 'Yes' : 'No'}\`);

// Parse metadata
const metadata = JSON.parse(details.metadata);
console.log(\`Description: \${metadata.description}\`);`
    },
    {
      name: 'getUserCollectibles',
      description: 'Gets all collectibles owned by a specific user.',
      parameters: [
        { name: 'userAddress', type: 'string', description: 'Address of the user' },
        { name: 'tribeId', type: 'number', description: 'Optional tribe ID to filter by', optional: true }
      ],
      returns: {
        type: 'Promise<UserCollectible[]>',
        description: 'Array of collectibles owned by the user'
      },
      example: `// Get all user collectibles
const allCollectibles = await sdk.collectibles.getUserCollectibles("0x1234...");
console.log(\`User owns \${allCollectibles.length} collectibles\`);

// Get user collectibles for a specific tribe
const tribeCollectibles = await sdk.collectibles.getUserCollectibles("0x1234...", tribeId);
console.log(\`User owns \${tribeCollectibles.length} collectibles in tribe \${tribeId}\`);`
    },
    {
      name: 'transferCollectible',
      description: 'Transfers a collectible to another address (only if transferable).',
      parameters: [
        { name: 'tokenId', type: 'number', description: 'Token ID of the collectible' },
        { name: 'recipient', type: 'string', description: 'Address to receive the collectible' }
      ],
      returns: {
        type: 'Promise<string>',
        description: 'Transaction hash'
      },
      example: `const tx = await sdk.collectibles.transferCollectible(tokenId, "0x5678...");
console.log(\`Transferred collectible! Transaction: \${tx}\`);`
    },
    {
      name: 'setCollectibleURI',
      description: 'Updates the metadata URI for a collectible type (only callable by creator or tribe admin).',
      parameters: [
        { name: 'collectibleId', type: 'number', description: 'ID of the collectible type' },
        { name: 'metadata', type: 'string', description: 'New JSON metadata for the collectible' }
      ],
      returns: {
        type: 'Promise<string>',
        description: 'Transaction hash'
      },
      example: `const tx = await sdk.collectibles.setCollectibleURI(collectibleId, JSON.stringify({
  description: "Updated description for the collectible",
  image: "ipfs://QmNewHash...",
  attributes: [
    { trait_type: "Rarity", value: "Mythic" },
    { trait_type: "Member Type", value: "Founder" }
  ]
}));
console.log(\`Updated collectible metadata! Transaction: \${tx}\`);`
    }
  ]
}; 