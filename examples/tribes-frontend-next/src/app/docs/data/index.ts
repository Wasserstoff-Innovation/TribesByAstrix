import { contracts } from './contracts';
import { sdkModules, sdkOverview } from './sdk';
import { guides, Guide } from './guides';
import { errorCodes } from './error-codes';

export * from './contracts';
export * from './sdk';
export * from './guides';
export * from './error-codes';

// Structure for the docs sidebar
export const docsSections = {
  gettingStarted: {
    title: 'Getting Started',
    sections: [
      {
        id: 'introduction',
        title: 'Introduction'
      },
      {
        id: 'installation',
        title: 'Installation'
      },
      {
        id: 'configuration',
        title: 'Configuration'
      }
    ]
  },
  sdk: {
    title: 'SDK Documentation',
    sections: [
      {
        id: 'sdk-overview',
        title: 'Overview'
      },
      {
        id: 'tribe-management',
        title: 'Tribe Management'
      },
      {
        id: 'points-tokens',
        title: 'Points & Tokens'
      },
      {
        id: 'content-management',
        title: 'Content Management'
      },
      {
        id: 'collectibles',
        title: 'Collectibles'
      },
      {
        id: 'error-codes',
        title: 'Error Codes'
      }
    ]
  },
  flows: {
    title: 'Flows & Integration',
    sections: [
      {
        id: 'flows-overview',
        title: 'Flows Overview'
      },
      {
        id: 'sdk-flows',
        title: 'SDK Flows'
      },
      {
        id: 'user-flows',
        title: 'User Flows'
      },
      {
        id: 'content-flows',
        title: 'Content Flows'
      }
    ]
  },
  platform: {
    title: 'Platform Documentation',
    sections: [
      {
        id: 'test-reports',
        title: 'Test Reports'
      },
      {
        id: 'api-performance',
        title: 'API Performance'
      }
    ]
  },
  contracts: {
    title: 'Smart Contracts',
    sections: [
      {
        id: 'contracts-overview',
        title: 'Overview'
      },
      {
        id: 'tribe-controller',
        title: 'Tribe Controller'
      },
      {
        id: 'token-dispenser',
        title: 'Token Dispenser'
      },
      {
        id: 'point-system',
        title: 'Point System'
      },
      {
        id: 'content-manager',
        title: 'Content Manager'
      },
      {
        id: 'collectible-controller',
        title: 'Collectible Controller'
      },
      {
        id: 'role-manager',
        title: 'Role Manager'
      }
    ]
  },
  guides: {
    title: 'Guides & Tutorials',
    sections: guides.map(guide => ({
      id: guide.id,
      title: guide.title
    }))
  }
};

interface DocContent {
  title: string;
  content: () => any;
}

// Create a mapping of content for each section
export const docsContent: Record<string, DocContent> = {
  // Getting Started
  'introduction': {
    title: 'Introduction',
    content: () => ({
      description: 'Tribes by Astrix is a toolkit that allows you to create and manage crypto communities with their own tokens and governance structures.',
      overview: 'The SDK provides methods for creating tribes, managing memberships, creating tribe tokens, and setting up point systems for rewarding community activities.'
    })
  },
  'installation': {
    title: 'Installation',
    content: () => ({
      npm: 'npm install @wasserstoff/tribes-sdk ethers@6',
      yarn: 'yarn add @wasserstoff/tribes-sdk ethers@6'
    })
  },
  'configuration': {
    title: 'Configuration',
    content: () => ({
      basicSetup: `import { AstrixSDK } from '@wasserstoff/tribes-sdk';
import { ethers } from 'ethers';

// Initialize SDK with Linea Sepolia testnet
const sdk = new AstrixSDK({
  provider: window.ethereum, // Browser provider
  chainId: 59141, // Linea Sepolia Testnet
  contracts: {
    roleManager: '0x123...',      // Role Manager contract address
    tribeController: '0x456...',  // Tribe Controller contract address
    astrixToken: '0x789...',      // Astrix Token contract address
    tokenDispenser: '0xabc...',   // Token Dispenser contract address
    astrixPointSystem: '0xdef...', // Point System contract address
    profileNFTMinter: '0xghi...'   // Profile NFT Minter contract address
  },
  verbose: true // Enable detailed logging
});`,
      connectingWallet: `// Initialize for read-only operations
await sdk.init();

// Connect wallet for write operations
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();
await sdk.connect(signer);

console.log("Connected with address:", await signer.getAddress());`
    })
  },

  // SDK Documentation
  'sdk-overview': {
    title: 'SDK Overview',
    content: () => sdkOverview
  },
  'tribe-management': {
    title: 'Tribe Management',
    content: () => sdkModules.tribes
  },
  'points-tokens': {
    title: 'Points & Tokens',
    content: () => sdkModules.points
  },
  'content-management': {
    title: 'Content Management',
    content: () => sdkModules.content
  },
  'collectibles': {
    title: 'Collectibles',
    content: () => sdkModules.collectibles
  },
  'error-codes': {
    title: 'Error Codes',
    content: () => ({
      description: 'These are the error codes you may encounter when using the SDK. Each error includes a code, message, description, and possible solutions.',
      errors: errorCodes
    })
  },
  
  // Flows & Integration
  'flows-overview': {
    title: 'Flows Overview',
    content: () => ({
      description: 'Comprehensive diagrams illustrating the system architecture and key flows through the Tribes by Astrix platform.',
      categories: [
        {
          title: 'SDK Integration Flows',
          description: 'How your application interacts with the SDK and blockchain contracts',
          link: '/docs/sdk-flows'
        },
        {
          title: 'User Interaction Flows',
          description: 'End-to-end user journeys through the platform',
          link: '/docs/user-flows'
        },
        {
          title: 'Content Management Flows',
          description: 'Content creation, retrieval, and interaction processes',
          link: '/docs/content-flows'
        }
      ]
    })
  },
  'user-flows': {
    title: 'User Flows',
    content: () => ({
      description: 'Common user flows and journeys through the Tribes platform, illustrating how users interact with the system.'
    })
  },
  'sdk-flows': {
    title: 'SDK Flows',
    content: () => ({
      description: 'Key SDK user flows illustrating how the Tribes SDK interacts with the platform.'
    })
  },
  'content-flows': {
    title: 'Content Flows',
    content: () => ({
      description: 'Detailed flows for creating posts, comments, reactions, and content privacy management.'
    })
  },

  // Platform
  'test-reports': {
    title: 'Test Reports',
    content: () => ({
      description: 'Detailed test reports and coverage metrics for the Tribes by Astrix platform.'
    })
  },
  'api-performance': {
    title: 'API Performance',
    content: () => ({
      description: 'Performance metrics and benchmarks for the Tribes API endpoints.'
    })
  },

  // Contracts
  'contracts-overview': {
    title: 'Contracts Overview',
    content: () => ({
      description: 'The Tribes by Astrix platform is built on a set of smart contracts that handle different aspects of the platform functionality.',
      contractList: Object.keys(contracts).map(key => ({
        name: contracts[key].name,
        description: contracts[key].description
      }))
    })
  },
  'tribe-controller': {
    title: 'Tribe Controller',
    content: () => contracts.tribeController
  },
  'token-dispenser': {
    title: 'Token Dispenser',
    content: () => contracts.tokenDispenser
  },
  'point-system': {
    title: 'Point System',
    content: () => contracts.pointSystem
  },
  'content-manager': {
    title: 'Content Manager',
    content: () => contracts.contentManager
  },
  'collectible-controller': {
    title: 'Collectible Controller',
    content: () => contracts.collectibleController
  },
  'role-manager': {
    title: 'Role Manager',
    content: () => contracts.roleManager
  },

  // Guides & Tutorials
  ...guides.reduce((acc: Record<string, DocContent>, guide: Guide) => {
    acc[guide.id] = {
      title: guide.title,
      content: () => guide
    };
    return acc;
  }, {})
}; 