export interface MethodDocumentation {
  name: string;
  description: string;
  parameters?: Array<{
    name: string;
    type: string;
    description: string;
    optional?: boolean;
  }>;
  returns: {
    type: string;
    description: string;
  };
  example: string;
}

export const tribesModule = {
  title: 'Tribes Module',
  description: 'The Tribes module provides comprehensive functionality for creating and managing tribes on the platform.',
  methods: [
    {
      name: 'createTribe',
      description: 'Creates a new tribe with the specified name and metadata.',
      parameters: [
        { name: 'name', type: 'string', description: 'The name of the tribe' },
        { name: 'metadata', type: 'string', description: 'JSON string with tribe metadata (description, logo, banner, etc.)' },
        { name: 'admins', type: 'Array<string>', description: 'List of additional admin addresses', optional: true },
        { name: 'joinType', type: 'number', description: 'Type of tribe (0=Public, 1=Private, 2=Invite)', optional: true },
        { name: 'entryFee', type: 'BigInt', description: 'Fee to join the tribe in wei', optional: true },
        { name: 'nftRequirements', type: 'Array', description: 'NFT requirements for joining', optional: true }
      ],
      returns: {
        type: 'Promise<number>',
        description: 'The ID of the newly created tribe'
      },
      example: `const tribeId = await sdk.tribes.createTribe({
  name: 'My Awesome Tribe',
  metadata: JSON.stringify({
    description: 'A tribe for awesome people',
    logoUrl: 'https://example.com/logo.png',
    bannerUrl: 'https://example.com/banner.png',
    tags: ['awesome', 'community']
  }),
  joinType: 0, // Public
  entryFee: 0n // No entry fee
});

console.log(\`Created tribe with ID: \${tribeId}\`);`
    },
    {
      name: 'getAllTribes',
      description: 'Retrieves a list of all tribes on the platform with optional pagination.',
      parameters: [
        { name: 'offset', type: 'number', description: 'Pagination offset (default: 0)', optional: true },
        { name: 'limit', type: 'number', description: 'Maximum number of tribes to return (default: 100)', optional: true }
      ],
      returns: {
        type: 'Promise<{ tribeIds: number[], total: number }>',
        description: 'Object containing tribe IDs and total count'
      },
      example: `// Get all tribes
const allTribes = await sdk.tribes.getAllTribes();
console.log(\`Total tribes: \${allTribes.total}\`);
console.log(\`Tribe IDs: \${allTribes.tribeIds.join(', ')}\`);

// With pagination
const page1 = await sdk.tribes.getAllTribes(0, 10); // First 10 tribes
const page2 = await sdk.tribes.getAllTribes(10, 10); // Next 10 tribes`
    },
    {
      name: 'getTribeDetails',
      description: 'Get detailed information about a specific tribe by ID.',
      parameters: [
        { name: 'tribeId', type: 'number', description: 'The ID of the tribe to retrieve' }
      ],
      returns: {
        type: 'Promise<TribeDetails>',
        description: 'Object containing tribe details'
      },
      example: `const tribeDetails = await sdk.tribes.getTribeDetails(tribeId);

console.log(\`Tribe Name: \${tribeDetails.name}\`);
console.log(\`Members: \${tribeDetails.memberCount}\`);
console.log(\`Creator: \${tribeDetails.creator}\`);

// Parse metadata if needed
const metadata = JSON.parse(tribeDetails.metadata);
console.log(\`Description: \${metadata.description}\`);`
    },
    {
      name: 'getMembers',
      description: 'Retrieves a list of all members in a specific tribe.',
      parameters: [
        { name: 'tribeId', type: 'number', description: 'The ID of the tribe' }
      ],
      returns: {
        type: 'Promise<string[]>',
        description: 'Array of member addresses'
      },
      example: `const members = await sdk.tribes.getMembers(tribeId);
console.log(\`Tribe has \${members.length} members\`);
console.log(\`Members: \${members.join(', ')}\`);`
    },
    {
      name: 'joinTribe',
      description: 'Allows the connected wallet to join a public tribe.',
      parameters: [
        { name: 'tribeId', type: 'number', description: 'The ID of the tribe to join' }
      ],
      returns: {
        type: 'Promise<string>',
        description: 'Transaction hash'
      },
      example: `const tx = await sdk.tribes.joinTribe({ tribeId: 42 });
console.log(\`Joined tribe! Transaction: \${tx}\`);`
    },
    {
      name: 'requestToJoinTribe',
      description: 'Requests to join a private tribe, potentially with an entry fee.',
      parameters: [
        { name: 'tribeId', type: 'number', description: 'The ID of the tribe' },
        { name: 'entryFee', type: 'BigInt', description: 'Entry fee to include with the request', optional: true }
      ],
      returns: {
        type: 'Promise<string>',
        description: 'Transaction hash'
      },
      example: `// Request with entry fee
const tx = await sdk.tribes.requestToJoinTribe({
  tribeId: 42,
  entryFee: ethers.parseEther("0.01")
});
console.log(\`Request submitted! Transaction: \${tx}\`);`
    },
    {
      name: 'joinTribeWithCode',
      description: 'Joins a tribe using an invite code.',
      parameters: [
        { name: 'tribeId', type: 'number', description: 'The ID of the tribe' },
        { name: 'inviteCode', type: 'string', description: 'The invite code' }
      ],
      returns: {
        type: 'Promise<string>',
        description: 'Transaction hash'
      },
      example: `const tx = await sdk.tribes.joinTribeWithCode({
  tribeId: 42,
  inviteCode: "ABC123XYZ"
});
console.log(\`Joined tribe with invite code! Transaction: \${tx}\`);`
    },
    {
      name: 'getUserTribes',
      description: "Get a list of tribe IDs that a specific address is a member of.",
      parameters: [
        { name: 'address', type: 'string', description: 'Address to check memberships for' }
      ],
      returns: {
        type: 'Promise<number[]>',
        description: 'Array of tribe IDs'
      },
      example: `// Get tribes for a specific address
const userTribes = await sdk.tribes.getUserTribes("0x1234...");
console.log(\`User is a member of tribes: \${userTribes.join(', ')}\`);

// Get tribes for connected wallet
const myTribes = await sdk.tribes.getUserTribes(await signer.getAddress());
console.log(\`You are a member of \${myTribes.length} tribes\`);`
    },
    {
      name: 'getMemberStatus',
      description: 'Checks the membership status of an address in a tribe.',
      parameters: [
        { name: 'tribeId', type: 'number', description: 'The ID of the tribe' },
        { name: 'address', type: 'string', description: 'The address to check' }
      ],
      returns: {
        type: 'Promise<MemberStatus>',
        description: 'Member status enum (0=NotMember, 1=Pending, 2=Member, 3=Admin)'
      },
      example: `const status = await sdk.tribes.getMemberStatus(tribeId, "0x1234...");

if (status === 2) {
  console.log("User is a member");
} else if (status === 3) {
  console.log("User is an admin");
} else if (status === 1) {
  console.log("User has a pending request");
} else {
  console.log("User is not a member");
}`
    }
  ]
}; 