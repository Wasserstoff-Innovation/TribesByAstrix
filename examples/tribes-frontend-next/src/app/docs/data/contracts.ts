export interface ContractParameter {
  name: string;
  type: string;
  description: string;
}

export interface ContractReturn {
  type: string;
  description: string;
}

export interface ContractFunction {
  name: string;
  description: string;
  parameters: ContractParameter[];
  returns?: ContractReturn;
}

export interface Contract {
  name: string;
  address?: string;
  description: string;
  mainFunctions: ContractFunction[];
}

export interface ContractGroup {
  [key: string]: Contract;
}

export const contracts: ContractGroup = {
  tribeController: {
    name: 'TribeController',
    description: 'Core contract that manages tribes, including creation, membership, and configuration. It handles tribe membership, permissions, join requests, and tribe merging.',
    mainFunctions: [
      {
        name: 'createTribe',
        description: 'Creates a new tribe with specified parameters',
        parameters: [
          {
            name: 'name',
            type: 'string',
            description: 'Name of the tribe'
          },
          {
            name: 'metadata',
            type: 'string',
            description: 'JSON metadata containing tribe details (description, image, rules, etc.)'
          },
          {
            name: 'admins',
            type: 'address[]',
            description: 'Array of wallet addresses to set as tribe admins'
          },
          {
            name: 'joinType',
            type: 'JoinType enum',
            description: 'Membership access type (PUBLIC, PRIVATE, NFT_GATED, etc.)'
          },
          {
            name: 'entryFee',
            type: 'uint256',
            description: 'Fee required to join the tribe (in wei)'
          },
          {
            name: 'nftRequirements',
            type: 'NFTRequirement[]',
            description: 'NFT requirements for joining the tribe (if join type requires NFTs)'
          }
        ],
        returns: {
          type: 'uint256',
          description: 'ID of the newly created tribe'
        }
      },
      {
        name: 'joinTribe',
        description: 'Join a tribe that has public access',
        parameters: [
          {
            name: 'tribeId',
            type: 'uint256',
            description: 'ID of the tribe to join'
          }
        ],
        returns: {
          type: 'void',
          description: 'Emits MemberJoined and MembershipUpdated events'
        }
      },
      {
        name: 'requestToJoinTribe',
        description: 'Request to join a private tribe (requires approval by admin)',
        parameters: [
          {
            name: 'tribeId',
            type: 'uint256',
            description: 'ID of the tribe to join'
          }
        ],
        returns: {
          type: 'void',
          description: 'Sets membership status to PENDING and emits MembershipUpdated event'
        }
      },
      {
        name: 'approveMember',
        description: 'Approve a pending join request (admin only)',
        parameters: [
          {
            name: 'tribeId',
            type: 'uint256',
            description: 'Tribe ID'
          },
          {
            name: 'member',
            type: 'address',
            description: 'Address of the member to approve'
          }
        ],
        returns: {
          type: 'void',
          description: 'Sets membership status to ACTIVE and emits MembershipUpdated event'
        }
      },
      {
        name: 'banMember',
        description: 'Ban a member from the tribe (admin only)',
        parameters: [
          {
            name: 'tribeId',
            type: 'uint256',
            description: 'Tribe ID'
          },
          {
            name: 'member',
            type: 'address',
            description: 'Address of the member to ban'
          }
        ],
        returns: {
          type: 'void',
          description: 'Sets membership status to BANNED and emits MembershipUpdated event'
        }
      },
      {
        name: 'updateTribeConfig',
        description: 'Update tribe configuration (admin only)',
        parameters: [
          {
            name: 'tribeId',
            type: 'uint256',
            description: 'Tribe ID'
          },
          {
            name: 'joinType',
            type: 'JoinType enum',
            description: 'New join type'
          },
          {
            name: 'entryFee',
            type: 'uint256',
            description: 'New entry fee'
          },
          {
            name: 'nftRequirements',
            type: 'NFTRequirement[]',
            description: 'New NFT requirements'
          }
        ],
        returns: {
          type: 'void',
          description: 'Emits TribeConfigUpdated event'
        }
      }
    ]
  },
  
  tokenDispenser: {
    name: 'TokenDispenser',
    description: 'Manages tokens for tribes, including creating tribe-specific tokens, handling token distribution, and token operations.',
    mainFunctions: [
      {
        name: 'createToken',
        description: 'Create a new ERC20 token for a tribe (admin only)',
        parameters: [
          {
            name: 'tribeId',
            type: 'uint256',
            description: 'ID of the tribe'
          },
          {
            name: 'name',
            type: 'string',
            description: 'Name of the token'
          },
          {
            name: 'symbol',
            type: 'string',
            description: 'Symbol of the token (ticker)'
          },
          {
            name: 'initialSupply',
            type: 'uint256',
            description: 'Initial supply of tokens to mint'
          }
        ],
        returns: {
          type: 'address',
          description: 'Address of the newly created token contract'
        }
      },
      {
        name: 'allocateTokens',
        description: 'Allocate tokens to a member (admin only)',
        parameters: [
          {
            name: 'tribeId',
            type: 'uint256',
            description: 'ID of the tribe'
          },
          {
            name: 'memberAddr',
            type: 'address',
            description: 'Address of the member to receive tokens'
          },
          {
            name: 'amount',
            type: 'uint256',
            description: 'Amount of tokens to allocate'
          }
        ],
        returns: {
          type: 'bool',
          description: 'True if allocation was successful'
        }
      },
      {
        name: 'mintTokens',
        description: 'Mint additional tokens for a tribe (admin only)',
        parameters: [
          {
            name: 'tribeId',
            type: 'uint256',
            description: 'ID of the tribe'
          },
          {
            name: 'amount',
            type: 'uint256',
            description: 'Amount of tokens to mint'
          }
        ],
        returns: {
          type: 'bool',
          description: 'True if minting was successful'
        }
      },
      {
        name: 'transferTokens',
        description: 'Transfer tokens between members',
        parameters: [
          {
            name: 'tribeId',
            type: 'uint256',
            description: 'ID of the tribe'
          },
          {
            name: 'recipient',
            type: 'address',
            description: 'Address of the recipient'
          },
          {
            name: 'amount',
            type: 'uint256',
            description: 'Amount of tokens to transfer'
          }
        ],
        returns: {
          type: 'bool',
          description: 'True if transfer was successful'
        }
      }
    ]
  },
  
  pointSystem: {
    name: 'PointSystem',
    description: 'Manages the point-based reward system for tribes, allowing configuration of point rewards for different actions and redeeming points for benefits.',
    mainFunctions: [
      {
        name: 'initializePointSystem',
        description: 'Initialize the point system for a tribe (admin only)',
        parameters: [
          {
            name: 'tribeId',
            type: 'uint256',
            description: 'ID of the tribe'
          },
          {
            name: 'pointActions',
            type: 'PointAction[]',
            description: 'Array of actions that earn points and their values'
          }
        ],
        returns: {
          type: 'bool',
          description: 'True if initialization was successful'
        }
      },
      {
        name: 'awardPoints',
        description: 'Award points to a member for completing an action (restricted to authorized callers)',
        parameters: [
          {
            name: 'tribeId',
            type: 'uint256',
            description: 'ID of the tribe'
          },
          {
            name: 'member',
            type: 'address',
            description: 'Address of the member to award points to'
          },
          {
            name: 'actionType',
            type: 'string',
            description: 'Type of action that earned points'
          }
        ],
        returns: {
          type: 'uint256',
          description: 'Number of points awarded'
        }
      },
      {
        name: 'getPoints',
        description: 'Get the current point balance for a member',
        parameters: [
          {
            name: 'tribeId',
            type: 'uint256',
            description: 'ID of the tribe'
          },
          {
            name: 'member',
            type: 'address',
            description: 'Address of the member'
          }
        ],
        returns: {
          type: 'uint256',
          description: 'Current point balance'
        }
      },
      {
        name: 'setExchangeRate',
        description: 'Set the exchange rate between points and tokens (admin only)',
        parameters: [
          {
            name: 'tribeId',
            type: 'uint256',
            description: 'ID of the tribe'
          },
          {
            name: 'rate',
            type: 'uint256',
            description: 'Exchange rate (points per token)'
          }
        ],
        returns: {
          type: 'void',
          description: 'Updates exchange rate'
        }
      },
      {
        name: 'redeemPoints',
        description: 'Redeem points for tokens',
        parameters: [
          {
            name: 'tribeId',
            type: 'uint256',
            description: 'ID of the tribe'
          },
          {
            name: 'pointsAmount',
            type: 'uint256',
            description: 'Amount of points to redeem'
          }
        ],
        returns: {
          type: 'uint256',
          description: 'Amount of tokens received'
        }
      }
    ]
  },
  
  contentManager: {
    name: 'ContentManager',
    description: 'Manages content creation and interactions within tribes, including posts, polls, quizzes, and reactions.',
    mainFunctions: [
      {
        name: 'createPost',
        description: 'Create a basic post in a tribe',
        parameters: [
          {
            name: 'tribeId',
            type: 'uint256',
            description: 'ID of the tribe'
          },
          {
            name: 'contentURI',
            type: 'string',
            description: 'URI pointing to the content metadata (usually IPFS)'
          },
          {
            name: 'postType',
            type: 'PostType enum',
            description: 'Type of post (TEXT, MEDIA, POLL, QUIZ, COLLECTIBLE_ANNOUNCEMENT)'
          }
        ],
        returns: {
          type: 'uint256',
          description: 'ID of the newly created post'
        }
      },
      {
        name: 'createPoll',
        description: 'Create a poll post in a tribe',
        parameters: [
          {
            name: 'tribeId',
            type: 'uint256',
            description: 'ID of the tribe'
          },
          {
            name: 'contentURI',
            type: 'string',
            description: 'URI pointing to the content metadata'
          },
          {
            name: 'options',
            type: 'string[]',
            description: 'Array of poll options'
          },
          {
            name: 'duration',
            type: 'uint256',
            description: 'Duration of the poll in seconds'
          }
        ],
        returns: {
          type: 'uint256',
          description: 'ID of the newly created poll post'
        }
      },
      {
        name: 'submitPollVote',
        description: 'Vote on a poll',
        parameters: [
          {
            name: 'tribeId',
            type: 'uint256',
            description: 'ID of the tribe'
          },
          {
            name: 'postId',
            type: 'uint256',
            description: 'ID of the poll post'
          },
          {
            name: 'optionIndex',
            type: 'uint256',
            description: 'Index of the selected option'
          }
        ],
        returns: {
          type: 'void',
          description: 'Records vote and emits PollVoteSubmitted event'
        }
      },
      {
        name: 'deletePost',
        description: 'Delete a post (admin only)',
        parameters: [
          {
            name: 'tribeId',
            type: 'uint256',
            description: 'ID of the tribe'
          },
          {
            name: 'postId',
            type: 'uint256',
            description: 'ID of the post to delete'
          }
        ],
        returns: {
          type: 'void',
          description: 'Marks post as inactive and emits PostDeleted event'
        }
      }
    ]
  },
  
  collectibleController: {
    name: 'CollectibleController',
    description: 'Manages digital collectibles within tribes, including creation, minting, and trading of NFTs that can be earned or purchased by tribe members.',
    mainFunctions: [
      {
        name: 'createCollectible',
        description: 'Create a new collectible for a tribe (admin only)',
        parameters: [
          {
            name: 'tribeId',
            type: 'uint256',
            description: 'ID of the tribe'
          },
          {
            name: 'name',
            type: 'string',
            description: 'Name of the collectible'
          },
          {
            name: 'symbol',
            type: 'string',
            description: 'Symbol for the collectible'
          },
          {
            name: 'maxSupply',
            type: 'uint256',
            description: 'Maximum supply of this collectible'
          },
          {
            name: 'pointsRequired',
            type: 'uint256',
            description: 'Points required to mint this collectible'
          },
          {
            name: 'uri',
            type: 'string',
            description: 'URI for the collectible metadata'
          }
        ],
        returns: {
          type: 'address',
          description: 'Address of the new collectible contract'
        }
      },
      {
        name: 'mintCollectible',
        description: 'Mint a collectible using points',
        parameters: [
          {
            name: 'tribeId',
            type: 'uint256',
            description: 'ID of the tribe'
          },
          {
            name: 'collectibleAddress',
            type: 'address',
            description: 'Address of the collectible contract'
          }
        ],
        returns: {
          type: 'uint256',
          description: 'ID of the minted collectible'
        }
      },
      {
        name: 'getCollectiblesOfMember',
        description: 'Get all collectibles owned by a member',
        parameters: [
          {
            name: 'tribeId',
            type: 'uint256',
            description: 'ID of the tribe'
          },
          {
            name: 'member',
            type: 'address',
            description: 'Address of the member'
          }
        ],
        returns: {
          type: 'CollectibleInfo[]',
          description: 'Array of collectible information'
        }
      }
    ]
  },
  
  roleManager: {
    name: 'RoleManager',
    description: 'Manages roles and permissions throughout the platform, providing a centralized access control system for all contracts.',
    mainFunctions: [
      {
        name: 'grantRole',
        description: 'Grant a role to an address (admin only)',
        parameters: [
          {
            name: 'role',
            type: 'bytes32',
            description: 'Role identifier (keccak256 hash of role name)'
          },
          {
            name: 'account',
            type: 'address',
            description: 'Address to grant the role to'
          }
        ],
        returns: {
          type: 'void',
          description: 'Grants the role and emits RoleGranted event'
        }
      },
      {
        name: 'revokeRole',
        description: 'Revoke a role from an address (admin only)',
        parameters: [
          {
            name: 'role',
            type: 'bytes32',
            description: 'Role identifier'
          },
          {
            name: 'account',
            type: 'address',
            description: 'Address to revoke the role from'
          }
        ],
        returns: {
          type: 'void',
          description: 'Revokes the role and emits RoleRevoked event'
        }
      },
      {
        name: 'hasRole',
        description: 'Check if an address has a specific role',
        parameters: [
          {
            name: 'role',
            type: 'bytes32',
            description: 'Role identifier'
          },
          {
            name: 'account',
            type: 'address',
            description: 'Address to check'
          }
        ],
        returns: {
          type: 'bool',
          description: 'True if the address has the role'
        }
      },
      {
        name: 'getRoles',
        description: 'Get all roles an address has',
        parameters: [
          {
            name: 'account',
            type: 'address',
            description: 'Address to check'
          }
        ],
        returns: {
          type: 'bytes32[]',
          description: 'Array of role identifiers'
        }
      }
    ]
  }
}; 