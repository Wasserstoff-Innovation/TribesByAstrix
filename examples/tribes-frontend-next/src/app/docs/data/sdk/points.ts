import { MethodDocumentation } from './tribes';

export const pointsModule = {
  title: 'Points & Tokens Module',
  description: 'The Points module provides functionality for managing tribe tokens and points systems.',
  methods: [
    {
      name: 'createTribeToken',
      description: 'Creates a new ERC20 token for a tribe that can be used for rewards, access control, or other functionality.',
      parameters: [
        { name: 'tribeId', type: 'number', description: 'The ID of the tribe' },
        { name: 'name', type: 'string', description: 'Name of the token' },
        { name: 'symbol', type: 'string', description: 'Symbol of the token (ticker)' }
      ],
      returns: {
        type: 'Promise<string>',
        description: 'Transaction hash'
      },
      example: `const tx = await sdk.points.createTribeToken({
  tribeId: 42,
  name: "Awesome Tribe Token",
  symbol: "ATT"
});

console.log(\`Created tribe token! Transaction: \${tx}\`);`
    },
    {
      name: 'getTribeTokenAddress',
      description: "Retrieves the address of a tribe's token.",
      parameters: [
        { name: 'tribeId', type: 'number', description: 'The ID of the tribe' }
      ],
      returns: {
        type: 'Promise<string>',
        description: 'Token contract address'
      },
      example: `const tokenAddress = await sdk.points.getTribeTokenAddress(tribeId);
console.log(\`Tribe \${tribeId} token address: \${tokenAddress}\`);`
    },
    {
      name: 'mintTokens',
      description: 'Mints tokens to a specific address.',
      parameters: [
        { name: 'tribeId', type: 'number', description: 'The ID of the tribe' },
        { name: 'amount', type: 'BigInt', description: 'Amount of tokens to mint' },
        { name: 'recipient', type: 'string', description: 'Address to receive the tokens' }
      ],
      returns: {
        type: 'Promise<string>',
        description: 'Transaction hash'
      },
      example: `const amount = ethers.parseUnits("100", 18); // 100 tokens with 18 decimals
const tx = await sdk.points.mintTokens(tribeId, amount, userAddress);
console.log(\`Minted \${amount} tokens! Transaction: \${tx}\`);`
    },
    {
      name: 'setPointsForAction',
      description: 'Sets the number of points earned for performing different actions within a tribe.',
      parameters: [
        { name: 'tribeId', type: 'number', description: 'The ID of the tribe' },
        { name: 'actionType', type: 'string', description: 'Type of action (e.g., "POST_CREATE", "COMMENT")' },
        { name: 'points', type: 'number', description: 'Number of points for the action' }
      ],
      returns: {
        type: 'Promise<string>',
        description: 'Transaction hash'
      },
      example: `const tx = await sdk.points.setPointsForAction(tribeId, "POST_CREATE", 10);
console.log(\`Set points for creating posts! Transaction: \${tx}\`);`
    },
    {
      name: 'getPoints',
      description: 'Gets the total points a user has earned in a tribe.',
      parameters: [
        { name: 'tribeId', type: 'number', description: 'The ID of the tribe' },
        { name: 'userAddress', type: 'string', description: 'Address of the user' }
      ],
      returns: {
        type: 'Promise<number>',
        description: 'Total points earned'
      },
      example: `const points = await sdk.points.getPoints(tribeId, userAddress);
console.log(\`User has earned \${points} points in tribe \${tribeId}\`);`
    },
    {
      name: 'setExchangeRate',
      description: 'Sets the exchange rate between tribe tokens and Astrix tokens.',
      parameters: [
        { name: 'tribeId', type: 'number', description: 'The ID of the tribe' },
        { name: 'rate', type: 'number', description: 'Exchange rate (tribe tokens per 1 Astrix token)' }
      ],
      returns: {
        type: 'Promise<string>',
        description: 'Transaction hash'
      },
      example: `// 10 tribe tokens for 1 Astrix token
const tx = await sdk.points.setExchangeRate(tribeId, 10);
console.log(\`Set exchange rate! Transaction: \${tx}\`);`
    },
    {
      name: 'getActionPointsConfig',
      description: 'Gets the current point values for different actions in a tribe.',
      parameters: [
        { name: 'tribeId', type: 'number', description: 'The ID of the tribe' }
      ],
      returns: {
        type: 'Promise<Record<string, number>>',
        description: 'Object mapping action types to point values'
      },
      example: `const pointsConfig = await sdk.points.getActionPointsConfig(tribeId);
console.log("Points for posting:", pointsConfig.POST_CREATE);
console.log("Points for commenting:", pointsConfig.COMMENT);`
    },
    {
      name: 'getPointsLeaderboard',
      description: 'Gets the leaderboard of users by points in a tribe.',
      parameters: [
        { name: 'tribeId', type: 'number', description: 'The ID of the tribe' },
        { name: 'limit', type: 'number', description: 'Maximum number of entries to return', optional: true }
      ],
      returns: {
        type: 'Promise<Array<{ address: string, points: number }>>',
        description: 'Array of user addresses and their points, sorted by points descending'
      },
      example: `// Get top 10 users by points
const leaderboard = await sdk.points.getPointsLeaderboard(tribeId, 10);
console.log("Points leaderboard:");
leaderboard.forEach((entry, index) => {
  console.log(\`\${index + 1}. \${entry.address}: \${entry.points} points\`);
});`
    },
    {
      name: 'convertPointsToTokens',
      description: 'Converts user points to tribe tokens based on the configured exchange rate.',
      parameters: [
        { name: 'tribeId', type: 'number', description: 'The ID of the tribe' },
        { name: 'points', type: 'number', description: 'Number of points to convert' }
      ],
      returns: {
        type: 'Promise<{ tokens: BigInt, txHash: string }>',
        description: 'Object containing the amount of tokens received and transaction hash'
      },
      example: `// Convert 100 points to tokens
const result = await sdk.points.convertPointsToTokens(tribeId, 100);
console.log(\`Converted 100 points to \${ethers.formatUnits(result.tokens, 18)} tokens\`);
console.log(\`Transaction: \${result.txHash}\`);`
    }
  ]
}; 