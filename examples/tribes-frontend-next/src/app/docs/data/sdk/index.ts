import { tribesModule } from './tribes';
import { pointsModule } from './points';
import { contentModule } from './content';
import { collectiblesModule } from './collectibles';

export * from './tribes';

export const sdkModules = {
  tribes: tribesModule,
  points: pointsModule,
  content: contentModule,
  collectibles: collectiblesModule
};

export const sdkOverview = {
  title: 'SDK Overview',
  description: `A TypeScript/JavaScript SDK for interacting with the Tribes by Astrix platform, enabling seamless integration with tribe management, points system, content creation, and more.

The SDK consists of several modules for different aspects of the platform:
- **Tribes**: Create and manage tribes, memberships, and tribe settings
- **Points**: Handle tribe tokens, points distribution, and rewards
- **Token**: Interact with the Astrix token and related functions
- **Content**: Create and manage posts and other content
- **Collectibles**: Manage collectible NFTs within tribes`,
  features: [
    {
      name: 'Easy Integration',
      description: 'Simple methods to interact with Tribes by Astrix contracts'
    },
    {
      name: 'Type Safety',
      description: 'Full TypeScript support with comprehensive types and interfaces'
    },
    {
      name: 'Modular Design',
      description: 'Use only the modules you need for your application'
    },
    {
      name: 'Caching Layer',
      description: 'Optimized performance with intelligent caching'
    },
    {
      name: 'Comprehensive Error Handling',
      description: 'Clear error messages and recovery options'
    },
    {
      name: 'Detailed Documentation',
      description: 'Complete API documentation and examples'
    }
  ],
  installation: {
    npm: 'npm install @wasserstoff/tribes-sdk ethers@6',
    yarn: 'yarn add @wasserstoff/tribes-sdk ethers@6'
  },
  setup: `import { AstrixSDK } from '@wasserstoff/tribes-sdk';
import { ethers } from 'ethers';

// Initialize with Ethereum provider
const sdk = new AstrixSDK({
  provider: window.ethereum, // Browser provider or any ethers provider
  chainId: 59141,           // Linea Sepolia testnet
  verbose: true             // Optional debug logging
});

// Initialize for read-only operations
await sdk.init();

// Connect wallet for write operations
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();
await sdk.connect(signer);`
}; 