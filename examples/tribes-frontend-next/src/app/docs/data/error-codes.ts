export interface ErrorCode {
  code: string;
  contractCode?: number;
  message: string;
  description: string;
  possibleSolutions: string[];
}

export const errorCodes: ErrorCode[] = [
  // Common errors (1-99)
  {
    code: 'COMMON_001',
    contractCode: 1,
    message: 'Unauthorized',
    description: 'The connected wallet does not have the required permissions or role to perform this operation.',
    possibleSolutions: [
      'Verify you are using the correct wallet address',
      'Request the required role from a contract administrator',
      'Check if you are a member or admin of the tribe you are trying to interact with'
    ]
  },
  {
    code: 'COMMON_002',
    contractCode: 2,
    message: 'Invalid parameter',
    description: 'One or more parameters provided to the contract function are invalid or out of allowed range.',
    possibleSolutions: [
      'Check function parameter requirements in the documentation',
      'Ensure all IDs, addresses and amounts are correctly formatted',
      'Verify that string values meet length and format requirements'
    ]
  },
  {
    code: 'COMMON_003',
    contractCode: 3,
    message: 'Zero address not allowed',
    description: 'A zero address (0x0000000000000000000000000000000000000000) was provided where a valid address is required.',
    possibleSolutions: [
      'Provide a valid address for contract or wallet parameters',
      'Check if your wallet is properly connected before making transactions'
    ]
  },
  {
    code: 'COMMON_004',
    contractCode: 4,
    message: 'Already exists',
    description: 'An attempt was made to create something that already exists.',
    possibleSolutions: [
      'Check if the resource already exists before creating it',
      'Use update functions instead of create functions for existing resources',
      'Verify you are using the correct ID or address'
    ]
  },
  {
    code: 'COMMON_005',
    contractCode: 5,
    message: 'Does not exist',
    description: 'The requested resource (tribe, post, member, etc.) does not exist.',
    possibleSolutions: [
      'Verify the ID is correct',
      'Check if the resource has been deleted',
      'Ensure you have access to view the resource'
    ]
  },

  // Tribe errors (100-199)
  {
    code: 'TRIBE_100',
    contractCode: 100,
    message: 'Not a tribe member',
    description: 'The operation requires tribe membership, but the calling address is not a member of the specified tribe.',
    possibleSolutions: [
      'Join the tribe before attempting this operation',
      'Request membership from the tribe admin',
      'Verify your membership status is active'
    ]
  },
  {
    code: 'TRIBE_101',
    contractCode: 101,
    message: 'Already a member',
    description: 'An attempt was made to join a tribe that the user is already a member of.',
    possibleSolutions: [
      'Check your membership status using getTribeMemberStatus() before joining',
      'If your membership status is PENDING, wait for admin approval',
      'If you want to change membership type, use a different function'
    ]
  },
  {
    code: 'TRIBE_102',
    contractCode: 102,
    message: 'User is banned',
    description: 'The user has been banned from the tribe and cannot perform operations related to it.',
    possibleSolutions: [
      'Contact the tribe admin to discuss the ban',
      'Check your membership status to confirm if you are banned',
      'Join a different tribe or create your own'
    ]
  },
  {
    code: 'TRIBE_103',
    contractCode: 103,
    message: 'Invalid join type',
    description: 'The join type specified for the tribe is not valid or not properly configured.',
    possibleSolutions: [
      'Use a valid join type from the available options (PUBLIC, PRIVATE, NFT_GATED, etc.)',
      'If you are a tribe admin, reconfigure the join settings',
      'Check the tribe configuration for specific join requirements'
    ]
  },
  {
    code: 'TRIBE_104',
    contractCode: 104,
    message: 'Insufficient entry fee',
    description: 'The amount paid as entry fee is less than the required amount to join the tribe.',
    possibleSolutions: [
      'Check the required entry fee using getTribeEntryFee()',
      'Include the correct amount when calling the join function',
      'Ensure your wallet has sufficient funds'
    ]
  },
  {
    code: 'TRIBE_105',
    contractCode: 105,
    message: 'Invalid invite code',
    description: 'The invite code provided for joining a tribe is not valid.',
    possibleSolutions: [
      'Verify the invite code is correct',
      'Request a new invite code from a tribe member or admin',
      'Check if the tribe has changed its join requirements'
    ]
  },
  {
    code: 'TRIBE_106',
    contractCode: 106,
    message: 'Invite code expired',
    description: 'The invite code provided has expired and is no longer valid.',
    possibleSolutions: [
      'Request a new invite code from a tribe member or admin',
      'Check the expiration period for invite codes in this tribe',
      'Contact a tribe admin for direct invitation'
    ]
  },
  {
    code: 'TRIBE_107',
    contractCode: 107,
    message: 'Invite code fully used',
    description: 'The invite code has reached its maximum usage limit and cannot be used again.',
    possibleSolutions: [
      'Request a new invite code from a tribe member or admin',
      'Check if the tribe allows multiple uses of invite codes',
      'Try joining the tribe through alternative methods'
    ]
  },

  // Post errors (200-299)
  {
    code: 'POST_200',
    contractCode: 200,
    message: 'Empty metadata',
    description: 'The post metadata cannot be empty.',
    possibleSolutions: [
      'Provide valid metadata for your post that includes required fields',
      'Check the metadata format requirements in the documentation',
      'Ensure content fields are properly formatted as JSON'
    ]
  },
  {
    code: 'POST_201',
    contractCode: 201,
    message: 'Invalid metadata format',
    description: 'The post metadata is not in a valid format (usually should be a properly structured JSON).',
    possibleSolutions: [
      'Follow the required JSON structure for post metadata',
      'Validate your JSON before submitting',
      'Include all required fields (title, content, etc.)'
    ]
  },
  {
    code: 'POST_202',
    contractCode: 202,
    message: 'Post not found',
    description: 'The specified post ID does not exist in the tribe.',
    possibleSolutions: [
      'Verify the post ID is correct',
      'Check if the post has been deleted',
      'Confirm you are checking the correct tribe'
    ]
  },
  {
    code: 'POST_203',
    contractCode: 203,
    message: 'Post deleted',
    description: 'The post has been deleted and is no longer accessible.',
    possibleSolutions: [
      'Posts cannot be recovered once deleted',
      'Create a new post instead',
      'Contact tribe admin if you believe this was done in error'
    ]
  },
  {
    code: 'POST_204',
    contractCode: 204,
    message: 'Already interacted',
    description: 'The user has already interacted with this post (reacted, commented, etc.).',
    possibleSolutions: [
      'Check if you have already reacted to this post',
      'Some interactions may be limited to once per user',
      'Try a different type of interaction if available'
    ]
  },
  {
    code: 'POST_205',
    contractCode: 205,
    message: 'Cannot interact with own post',
    description: 'Users cannot perform certain interactions on their own posts (such as reacting to them).',
    possibleSolutions: [
      'This is a platform limitation to prevent self-promotion',
      'Only other tribe members can interact with your posts in certain ways',
      'Check the documentation for allowed self-interactions'
    ]
  },
  {
    code: 'POST_206',
    contractCode: 206,
    message: 'Cooldown active',
    description: 'A cooldown period is active for this type of action to prevent spam.',
    possibleSolutions: [
      'Wait for the cooldown period to expire before trying again',
      'Check the cooldown duration in the tribe settings',
      'Different actions may have different cooldown periods'
    ]
  },

  // Collectible errors (300-399)
  {
    code: 'COLLECTIBLE_300',
    contractCode: 300,
    message: 'Supply limit reached',
    description: 'The collectible has reached its maximum supply limit and no more can be minted.',
    possibleSolutions: [
      'Check the current supply before attempting to mint',
      'If you are the creator, you may be able to increase the maximum supply',
      'Try obtaining the collectible through marketplace trading if available'
    ]
  },
  {
    code: 'COLLECTIBLE_301',
    contractCode: 301,
    message: 'Collectible not active',
    description: 'The collectible is not active or has been retired.',
    possibleSolutions: [
      'Verify if the collectible is still available for minting',
      'Check if there is a specific time window for this collectible',
      'Contact the tribe admin or collectible creator for more information'
    ]
  },
  {
    code: 'COLLECTIBLE_302',
    contractCode: 302,
    message: 'Insufficient points',
    description: 'The user does not have enough points to claim or purchase this collectible.',
    possibleSolutions: [
      'Earn more points through tribe activities',
      'Check your current point balance before attempting to claim',
      'Some collectibles may require specific types of points'
    ]
  },
  {
    code: 'COLLECTIBLE_303',
    contractCode: 303,
    message: 'Insufficient payment',
    description: 'The payment amount is less than the required amount for this collectible.',
    possibleSolutions: [
      'Check the price of the collectible before attempting to purchase',
      'Ensure your wallet has sufficient funds',
      'Some collectibles may require payment in specific tokens'
    ]
  },
  {
    code: 'COLLECTIBLE_304',
    contractCode: 304,
    message: 'Invalid collectible contract',
    description: 'The contract address provided for the collectible is not valid or not recognized.',
    possibleSolutions: [
      'Verify the collectible contract address is correct',
      'Ensure the contract is properly deployed and initialized',
      'Check if the contract implements the required interfaces'
    ]
  },
  {
    code: 'COLLECTIBLE_305',
    contractCode: 305,
    message: 'Invalid collectible',
    description: 'The collectible ID or metadata is not valid.',
    possibleSolutions: [
      'Verify the collectible ID is correct',
      'Check if the collectible exists and is available',
      'Ensure you are using the correct parameters for the collectible'
    ]
  },

  // SDK specific errors
  {
    code: 'SDK_001',
    message: 'SDK not initialized',
    description: 'An attempt was made to use the SDK before it was properly initialized.',
    possibleSolutions: [
      'Call await sdk.init() before using any SDK methods',
      'Ensure initialization completed successfully without errors',
      'Check that all required configuration parameters were provided'
    ]
  },
  {
    code: 'NETWORK_001',
    message: 'Network mismatch',
    description: 'The SDK is configured for a different network than the connected provider.',
    possibleSolutions: [
      'Switch your wallet to the network specified in the SDK configuration',
      'Update the SDK configuration to match your current network',
      'Check the chainId in your SDK initialization'
    ]
  },
  {
    code: 'AUTH_001',
    message: 'Wallet not connected',
    description: 'An attempt was made to perform an operation that requires a connected wallet.',
    possibleSolutions: [
      'Connect a wallet using sdk.connect(signer) before performing this operation',
      'Ensure the wallet is unlocked and accessible',
      'Check if the wallet is connected to the correct network'
    ]
  },
  {
    code: 'CONTRACT_001',
    message: 'Transaction failed',
    description: 'The blockchain transaction failed to execute.',
    possibleSolutions: [
      'Check that you have enough gas for the transaction',
      'Verify that the contract is not paused',
      'Ensure all parameters are correct and within allowed ranges',
      'Check for any blockchain network issues'
    ]
  },
  {
    code: 'CONTRACT_002',
    message: 'Contract not found at address',
    description: 'The SDK attempted to interact with a contract that does not exist at the provided address.',
    possibleSolutions: [
      'Verify contract addresses in your SDK configuration',
      'Ensure you are connected to the correct network',
      'Check if contracts have been deployed to the network you are using'
    ]
  }
]; 