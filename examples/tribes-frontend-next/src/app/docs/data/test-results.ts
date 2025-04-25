export interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'PENDING';
  timestamp: string;
  duration: string;
  description: string;
  environment: string;
  notes?: string;
}

export const testResults: TestResult[] = [
  {
    name: 'User Authentication',
    status: 'PASS',
    timestamp: '2023-06-15T14:30:22Z',
    duration: '2.3s',
    description: 'Validates user authentication flow with wallet connect',
    environment: 'Testnet',
    notes: 'All assertions passed successfully across multiple wallet providers'
  },
  {
    name: 'Tribe Creation',
    status: 'PASS',
    timestamp: '2023-06-15T14:32:45Z',
    duration: '4.7s',
    description: 'Tests creation of a new tribe with default parameters',
    environment: 'Testnet',
    notes: 'Tribe created successfully with expected properties and roles'
  },
  {
    name: 'Content Posting',
    status: 'PASS',
    timestamp: '2023-06-15T14:35:12Z',
    duration: '3.1s',
    description: 'Tests creation of a post with text and metadata',
    environment: 'Testnet',
    notes: 'Content posted successfully with correct metadata structure'
  },
  {
    name: 'Post Reaction',
    status: 'PASS',
    timestamp: '2023-06-15T14:38:05Z',
    duration: '1.8s',
    description: 'Tests reaction functionality on posts',
    environment: 'Testnet',
    notes: 'Multiple reaction types tested and verified on-chain'
  },
  {
    name: 'Comment Posting',
    status: 'PASS',
    timestamp: '2023-06-15T14:40:33Z',
    duration: '2.2s',
    description: 'Tests commenting on posts',
    environment: 'Testnet',
    notes: 'Comments successfully posted and retrieved with correct author information'
  },
  {
    name: 'Point Management',
    status: 'FAIL',
    timestamp: '2023-06-15T14:43:18Z',
    duration: '5.3s',
    description: 'Tests point allocation and redemption',
    environment: 'Testnet',
    notes: 'Failed to redeem points in specific edge case with high value transactions. Error: TRANSACTION_REVERTED'
  },
  {
    name: 'Collectible Creation',
    status: 'PASS',
    timestamp: '2023-06-15T14:48:02Z',
    duration: '8.5s',
    description: 'Tests creation of collectibles with metadata',
    environment: 'Testnet',
    notes: 'Collectible created with correct URI and ownership attributes'
  },
  {
    name: 'Invitation Flow',
    status: 'PASS',
    timestamp: '2023-06-15T14:52:35Z',
    duration: '6.2s',
    description: 'Tests creation and usage of tribe invitations',
    environment: 'Testnet',
    notes: 'Invitation codes generated and successfully used for private tribe access'
  },
  {
    name: 'Role Management',
    status: 'PENDING',
    timestamp: '2023-06-15T14:58:47Z',
    duration: 'N/A',
    description: 'Tests role assignment and permission management',
    environment: 'Testnet',
    notes: 'Test incomplete due to pending contract update for role structure'
  },
  {
    name: 'Error Handling',
    status: 'PASS',
    timestamp: '2023-06-15T15:01:22Z',
    duration: '4.3s',
    description: 'Tests SDK error handling and recovery',
    environment: 'Testnet',
    notes: 'All expected error cases properly handled with appropriate error codes'
  }
]; 