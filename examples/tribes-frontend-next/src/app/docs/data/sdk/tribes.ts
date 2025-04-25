export interface MethodDocumentation {
  name: string;
  description: string;
  parameters?: {
    name: string;
    type: string;
    description: string;
    optional?: boolean;
  }[];
  returns: {
    type: string;
    description: string;
  };
  example: string;
}

export const tribesModule = {
  title: "Tribes Module",
  description: "The Tribes module provides methods for creating, managing, and interacting with tribes. A tribe is a community governed by its members with customizable settings and features.",
  methods: [
    {
      name: "createTribe",
      description: "Creates a new tribe with specified settings.",
      parameters: [
        {
          name: "tribeData",
          type: "TribeCreationData",
          description: "Object containing the tribe configuration details",
          optional: false
        }
      ],
      returns: {
        type: "Promise<{ tribeId: string; txHash: string }>",
        description: "A promise that resolves to the created tribe ID and transaction hash"
      },
      example: `import { tribes } from '@astrix/tribes-sdk';

// Create a new tribe
const tribeData = {
  name: "Web3 Enthusiasts",
  description: "A community for web3 developers and enthusiasts",
  imageUrl: "https://example.com/tribe-image.jpg",
  bannerUrl: "https://example.com/tribe-banner.jpg",
  isPrivate: false,
  membershipType: "open"
};

const { tribeId, txHash } = await tribes.tribes.createTribe(tribeData);
console.log("Tribe created with ID:", tribeId);`
    },
    {
      name: "getTribeInfo",
      description: "Retrieves information about a specific tribe.",
      parameters: [
        {
          name: "tribeId",
          type: "string",
          description: "The ID of the tribe to retrieve",
          optional: false
        }
      ],
      returns: {
        type: "Promise<TribeInfo>",
        description: "A promise that resolves to the tribe information"
      },
      example: `import { tribes } from '@astrix/tribes-sdk';

// Get tribe information
const tribeId = "123";
const tribeInfo = await tribes.tribes.getTribeInfo(tribeId);
console.log("Tribe info:", tribeInfo);`
    },
    {
      name: "updateTribeInfo",
      description: "Updates the information and settings of a tribe.",
      parameters: [
        {
          name: "tribeId",
          type: "string",
          description: "The ID of the tribe to update",
          optional: false
        },
        {
          name: "updateData",
          type: "TribeUpdateData",
          description: "Object containing the fields to update",
          optional: false
        }
      ],
      returns: {
        type: "Promise<{ success: boolean; txHash: string }>",
        description: "A promise that resolves to a success status and transaction hash"
      },
      example: `import { tribes } from '@astrix/tribes-sdk';

// Update tribe information
const tribeId = "123";
const updateData = {
  description: "Updated description for our community",
  bannerUrl: "https://example.com/new-banner.jpg",
  isPrivate: true
};

const { success, txHash } = await tribes.tribes.updateTribeInfo(tribeId, updateData);
if (success) {
  console.log("Tribe updated successfully");
}`
    },
    {
      name: "joinTribe",
      description: "Joins a tribe as the connected user.",
      parameters: [
        {
          name: "tribeId",
          type: "string",
          description: "The ID of the tribe to join",
          optional: false
        }
      ],
      returns: {
        type: "Promise<{ success: boolean; txHash: string }>",
        description: "A promise that resolves to a success status and transaction hash"
      },
      example: `import { tribes } from '@astrix/tribes-sdk';

// Join a tribe
const tribeId = "123";
const { success, txHash } = await tribes.tribes.joinTribe(tribeId);
if (success) {
  console.log("Joined tribe successfully");
}`
    },
    {
      name: "leaveTribe",
      description: "Leaves a tribe as the connected user.",
      parameters: [
        {
          name: "tribeId",
          type: "string",
          description: "The ID of the tribe to leave",
          optional: false
        }
      ],
      returns: {
        type: "Promise<{ success: boolean; txHash: string }>",
        description: "A promise that resolves to a success status and transaction hash"
      },
      example: `import { tribes } from '@astrix/tribes-sdk';

// Leave a tribe
const tribeId = "123";
const { success, txHash } = await tribes.tribes.leaveTribe(tribeId);
if (success) {
  console.log("Left tribe successfully");
}`
    },
    {
      name: "getMembers",
      description: "Gets the members of a tribe.",
      parameters: [
        {
          name: "tribeId",
          type: "string",
          description: "The ID of the tribe",
          optional: false
        },
        {
          name: "options",
          type: "{ limit?: number; offset?: number; role?: string }",
          description: "Optional parameters for pagination and filtering",
          optional: true
        }
      ],
      returns: {
        type: "Promise<{ members: TribeMember[]; total: number }>",
        description: "A promise that resolves to an array of tribe members and the total count"
      },
      example: `import { tribes } from '@astrix/tribes-sdk';

// Get all members of a tribe
const tribeId = "123";
const allMembers = await tribes.tribes.getMembers(tribeId);
console.log("Total members:", allMembers.total);
console.log("Members:", allMembers.members);

// Get only admins with pagination
const options = {
  limit: 10,
  offset: 0,
  role: "admin"
};
const adminMembers = await tribes.tribes.getMembers(tribeId, options);
console.log("Admin members:", adminMembers.members);`
    },
    {
      name: "assignRole",
      description: "Assigns a role to a tribe member.",
      parameters: [
        {
          name: "tribeId",
          type: "string",
          description: "The ID of the tribe",
          optional: false
        },
        {
          name: "memberAddress",
          type: "string",
          description: "The wallet address of the member",
          optional: false
        },
        {
          name: "role",
          type: "string",
          description: "The role to assign (e.g., 'admin', 'moderator', 'member')",
          optional: false
        }
      ],
      returns: {
        type: "Promise<{ success: boolean; txHash: string }>",
        description: "A promise that resolves to a success status and transaction hash"
      },
      example: `import { tribes } from '@astrix/tribes-sdk';

// Assign a moderator role to a member
const tribeId = "123";
const memberAddress = "0x1234567890abcdef1234567890abcdef12345678";
const role = "moderator";

const { success, txHash } = await tribes.tribes.assignRole(tribeId, memberAddress, role);
if (success) {
  console.log("Role assigned successfully");
}`
    }
  ]
}; 