export interface ContractDocumentation {
  name: string;
  description: string;
  mainFunctions: Array<{
    name: string;
    description: string;
    parameters?: Array<{
      name: string;
      type: string;
      description: string;
    }>;
    returns?: {
      type: string;
      description: string;
    };
  }>;
}

export const contracts: Record<string, ContractDocumentation> = {
  tribeController: {
    name: "TribeController",
    description: "Core contract for creating and managing tribes. Handles tribe creation, membership management, tribe settings, and user permissions.",
    mainFunctions: [
      {
        name: "createTribe",
        description: "Creates a new tribe with the specified parameters.",
        parameters: [
          { name: "name", type: "string", description: "Name of the tribe" },
          { name: "metadata", type: "string", description: "JSON string containing tribe metadata" },
          { name: "admins", type: "address[]", description: "Additional admin addresses for the tribe" },
          { name: "joinType", type: "uint8", description: "Type of tribe (0=Public, 1=Private, 2=Invite)" },
          { name: "entryFee", type: "uint256", description: "Fee required to join the tribe (in wei)" }
        ],
        returns: {
          type: "uint256",
          description: "ID of the newly created tribe"
        }
      },
      {
        name: "joinTribe",
        description: "Allows a user to join a public tribe",
        parameters: [
          { name: "tribeId", type: "uint256", description: "ID of the tribe to join" }
        ],
        returns: {
          type: "bool",
          description: "True if joining was successful"
        }
      },
      {
        name: "requestToJoinTribe",
        description: "Allows a user to request to join a private tribe",
        parameters: [
          { name: "tribeId", type: "uint256", description: "ID of the tribe to join" }
        ],
        returns: {
          type: "bool",
          description: "True if request was successful"
        }
      }
    ]
  },
  astrixToken: {
    name: "AstrixToken",
    description: "ERC20 token implementation for the Astrix ecosystem. Powers the platform's economy and is used for governance.",
    mainFunctions: [
      {
        name: "mint",
        description: "Mints new tokens to a specified address (only callable by authorized minters)",
        parameters: [
          { name: "to", type: "address", description: "Address to receive the tokens" },
          { name: "amount", type: "uint256", description: "Amount of tokens to mint" }
        ],
        returns: {
          type: "bool",
          description: "True if minting was successful"
        }
      },
      {
        name: "burn",
        description: "Burns tokens from the caller's address",
        parameters: [
          { name: "amount", type: "uint256", description: "Amount of tokens to burn" }
        ],
        returns: {
          type: "bool",
          description: "True if burning was successful"
        }
      }
    ]
  },
  pointSystem: {
    name: "PointSystem",
    description: "Manages reputation points and rewards for user activities within tribes. Tracks user contributions and rewards them accordingly.",
    mainFunctions: [
      {
        name: "setPointsForAction",
        description: "Sets the number of points earned for a specific action type",
        parameters: [
          { name: "tribeId", type: "uint256", description: "ID of the tribe" },
          { name: "actionType", type: "string", description: "Type of action (e.g., POST_CREATE, COMMENT)" },
          { name: "points", type: "uint256", description: "Number of points for the action" }
        ],
        returns: {
          type: "bool",
          description: "True if setting was successful"
        }
      },
      {
        name: "awardPoints",
        description: "Awards points to a user for performing an action",
        parameters: [
          { name: "user", type: "address", description: "User address" },
          { name: "tribeId", type: "uint256", description: "ID of the tribe" },
          { name: "actionType", type: "string", description: "Type of action performed" },
          { name: "metadata", type: "string", description: "Additional metadata about the action" }
        ],
        returns: {
          type: "uint256",
          description: "Number of points awarded"
        }
      }
    ]
  },
  tokenDispenser: {
    name: "TokenDispenser",
    description: "Manages the creation and distribution of tribe-specific ERC20 tokens. Allows tribes to create their own token economy.",
    mainFunctions: [
      {
        name: "createTribeToken",
        description: "Creates a new ERC20 token for a tribe",
        parameters: [
          { name: "tribeId", type: "uint256", description: "ID of the tribe" },
          { name: "name", type: "string", description: "Name of the token" },
          { name: "symbol", type: "string", description: "Symbol/ticker of the token" }
        ],
        returns: {
          type: "address",
          description: "Address of the newly created token contract"
        }
      },
      {
        name: "mintTokens",
        description: "Mints tribe tokens to a specific address",
        parameters: [
          { name: "tribeId", type: "uint256", description: "ID of the tribe" },
          { name: "amount", type: "uint256", description: "Amount of tokens to mint" },
          { name: "recipient", type: "address", description: "Address to receive the tokens" }
        ],
        returns: {
          type: "bool",
          description: "True if minting was successful"
        }
      }
    ]
  },
  roleManager: {
    name: "RoleManager",
    description: "Manages permissions and access control throughout the platform. Controls who can perform specific actions in the ecosystem.",
    mainFunctions: [
      {
        name: "grantRole",
        description: "Grants a role to an address",
        parameters: [
          { name: "role", type: "bytes32", description: "Role identifier" },
          { name: "account", type: "address", description: "Address to grant the role to" }
        ],
        returns: {
          type: "void",
          description: "No return value"
        }
      },
      {
        name: "revokeRole",
        description: "Revokes a role from an address",
        parameters: [
          { name: "role", type: "bytes32", description: "Role identifier" },
          { name: "account", type: "address", description: "Address to revoke the role from" }
        ],
        returns: {
          type: "void",
          description: "No return value"
        }
      }
    ]
  },
  contentManager: {
    name: "ContentManager",
    description: "Manages content creation and interactions within tribes. Handles posts, comments, and reactions.",
    mainFunctions: [
      {
        name: "createPost",
        description: "Creates a new post in a tribe",
        parameters: [
          { name: "tribeId", type: "uint256", description: "ID of the tribe" },
          { name: "content", type: "string", description: "Post content" },
          { name: "metadata", type: "string", description: "JSON metadata for the post" }
        ],
        returns: {
          type: "uint256",
          description: "ID of the newly created post"
        }
      },
      {
        name: "createComment",
        description: "Creates a comment on a post",
        parameters: [
          { name: "postId", type: "uint256", description: "ID of the post" },
          { name: "content", type: "string", description: "Comment content" }
        ],
        returns: {
          type: "uint256",
          description: "ID of the newly created comment"
        }
      }
    ]
  },
  collectibleController: {
    name: "CollectibleController",
    description: "Manages collectible NFTs within the ecosystem. Allows tribes to create and distribute unique digital assets.",
    mainFunctions: [
      {
        name: "createCollectible",
        description: "Creates a new collectible NFT type for a tribe",
        parameters: [
          { name: "tribeId", type: "uint256", description: "ID of the tribe" },
          { name: "name", type: "string", description: "Name of the collectible" },
          { name: "metadata", type: "string", description: "JSON metadata for the collectible" },
          { name: "maxSupply", type: "uint256", description: "Maximum supply of the collectible" }
        ],
        returns: {
          type: "uint256",
          description: "ID of the newly created collectible type"
        }
      },
      {
        name: "mintCollectible",
        description: "Mints a collectible to a specific address",
        parameters: [
          { name: "collectibleId", type: "uint256", description: "ID of the collectible type" },
          { name: "recipient", type: "address", description: "Address to receive the collectible" }
        ],
        returns: {
          type: "uint256",
          description: "Token ID of the minted collectible"
        }
      }
    ]
  },
  profileNFTMinter: {
    name: "ProfileNFTMinter",
    description: "Manages user profile NFTs. Allows users to mint and update their profile as an NFT.",
    mainFunctions: [
      {
        name: "mintProfile",
        description: "Mints a profile NFT to a user",
        parameters: [
          { name: "recipient", type: "address", description: "Address to receive the profile NFT" },
          { name: "metadata", type: "string", description: "JSON metadata for the profile" }
        ],
        returns: {
          type: "uint256",
          description: "Token ID of the minted profile NFT"
        }
      },
      {
        name: "updateProfileMetadata",
        description: "Updates the metadata of a profile NFT",
        parameters: [
          { name: "tokenId", type: "uint256", description: "Token ID of the profile NFT" },
          { name: "metadata", type: "string", description: "New JSON metadata for the profile" }
        ],
        returns: {
          type: "bool",
          description: "True if update was successful"
        }
      }
    ]
  },
  astrixPointSystem: {
    name: "AstrixPointSystem",
    description: "Extended point system with additional features. Manages more complex reward mechanisms and integrates with other platform components.",
    mainFunctions: [
      {
        name: "createPointPlan",
        description: "Creates a custom point plan for a tribe",
        parameters: [
          { name: "tribeId", type: "uint256", description: "ID of the tribe" },
          { name: "name", type: "string", description: "Name of the point plan" },
          { name: "actions", type: "string[]", description: "List of actions included in the plan" },
          { name: "points", type: "uint256[]", description: "Points for each action in the plan" }
        ],
        returns: {
          type: "uint256",
          description: "ID of the newly created point plan"
        }
      },
      {
        name: "convertPointsToTokens",
        description: "Converts user points to tribe tokens",
        parameters: [
          { name: "tribeId", type: "uint256", description: "ID of the tribe" },
          { name: "points", type: "uint256", description: "Number of points to convert" }
        ],
        returns: {
          type: "uint256",
          description: "Amount of tokens received"
        }
      }
    ]
  }
}; 