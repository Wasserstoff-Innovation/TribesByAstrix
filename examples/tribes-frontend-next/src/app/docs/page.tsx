"use client";

import React, { useState, useEffect } from 'react';
import { Copy, X, Menu, ArrowLeft, ArrowRight } from 'lucide-react';
import { PageContainer } from '../../../components/ui';

// Documentation structure with nested sections
interface DocSection {
  id: string;
  title: string;
  content?: () => React.ReactNode;
  sections?: DocSection[]; // Add support for nested sections
}

interface DocCategory {
  title: string;
  sections: DocSection[];
}

interface DocStructure {
  [key: string]: DocCategory;
}

const DOCS_STRUCTURE: DocStructure = {
  gettingStarted: {
    title: 'Getting Started',
    sections: [
      {
        id: 'introduction',
        title: 'Introduction',
        content: () => (
          <>
            <p className="mb-4 text-lg leading-relaxed">
              Tribes by Astrix is a toolkit that allows you to create and manage crypto communities with their own tokens and governance structures.
            </p>
            <p className="text-gray-300 leading-relaxed">
              The SDK provides methods for creating tribes, managing memberships, creating tribe tokens, and setting up point systems for rewarding community activities.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
              {cardWithIcon(
                <div className="text-accent">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-accent">
                    <path d="M21 6H19V15H21V6Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M11 6H9V15H11V6Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M16 15V18H14H10H6H5H3V9M3 6V3H5H6H10H14H16V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>,
                'Create Tribes',
                'Build communities with customizable settings including access controls and membership requirements.'
              )}
              {cardWithIcon(
                <div className="text-accent">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-accent">
                    <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M3.41 22C3.41 18.13 7.26 15 12 15C12.96 15 13.89 15.13 14.76 15.37" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M22 18C22 18.75 21.79 19.46 21.42 20.06C21.21 20.42 20.94 20.74 20.63 21C19.93 21.63 19.01 22 18 22C16.54 22 15.27 21.22 14.58 20.06C14.21 19.46 14 18.75 14 18C14 16.74 14.58 15.61 15.5 14.88C16.19 14.33 17.06 14 18 14C20.21 14 22 15.79 22 18Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M16.44 18L17.5 19.06L19.56 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>,
                'Manage Tokens',
                'Create and distribute community tokens that power your tribe\'s economy and incentives.'
              )}
              {cardWithIcon(
                <div className="text-accent">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-accent">
                    <path d="M8.5 14.5L5 18M15.5 14.5L19 18M7 10.5H17M7 6.5H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>,
                'Reward Activities',
                'Set up reward systems to encourage engagement and active participation in your community.'
              )}
            </div>
          </>
        )
      },
      {
        id: 'installation',
        title: 'Installation',
        content: () => (
          <>
            <p className="mb-4">Install the SDK using npm:</p>
            <CodeBlock
              code="npm install @wasserstoff/tribes-sdk ethers@6"
              language="bash"
            />
            <p className="mt-4">The SDK requires ethers.js v6 as a peer dependency.</p>
          </>
        )
      },
      {
        id: 'configuration',
        title: 'Configuration',
        content: () => (
          <>
            <p className="mb-4">Initialize the SDK with your provider and contract addresses:</p>
            
            {sectionHeading('Basic Setup')}
            <CodeBlock
              code={`import { AstrixSDK } from '@wasserstoff/tribes-sdk';
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
});`}
              language="typescript"
            />
            
            {sectionHeading('Connecting a Wallet')}
            <p className="mb-4">
              For read-only operations, the SDK can be used immediately after initialization. For write operations (creating tribes, joining tribes, etc.), you need to connect a signer:
            </p>
            <CodeBlock
              code={`// Initialize for read-only operations
await sdk.init();

// Connect wallet for write operations
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();
await sdk.connect(signer);

console.log("Connected with address:", await signer.getAddress());`}
              language="typescript"
            />
            
            {sectionHeading('Using Environment Variables')}
            <p className="mb-4">
              In a production environment, it's best to use environment variables for contract addresses:
            </p>
            <CodeBlock
              code={`// Load from environment variables in Next.js
const sdk = new AstrixSDK({
  provider: new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL),
  chainId: parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '59141'),
  contracts: {
    roleManager: process.env.NEXT_PUBLIC_ROLE_MANAGER_ADDRESS || '',
    tribeController: process.env.NEXT_PUBLIC_TRIBE_CONTROLLER_ADDRESS || '',
    astrixToken: process.env.NEXT_PUBLIC_ASTRIX_TOKEN_ADDRESS || '',
    tokenDispenser: process.env.NEXT_PUBLIC_TOKEN_DISPENSER_ADDRESS || '',
    astrixPointSystem: process.env.NEXT_PUBLIC_POINT_SYSTEM_ADDRESS || '',
    profileNFTMinter: process.env.NEXT_PUBLIC_PROFILE_NFT_ADDRESS || ''
  }
});`}
              language="typescript"
            />
            
            {infoBox(
              <div className="text-accent">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-accent">
                  <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 16V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>,
              'Tip:',
              'For the development environment, you can find the default contract addresses for Linea Sepolia testnet in the SDK documentation or use the development network provided by Astrix.'
            )}
          </>
        )
      }
    ]
  },
  sdk: {
    title: 'SDK Documentation',
    sections: [
      {
        id: 'sdk-overview',
        title: 'Overview',
        content: () => (
          <>
            <p className="mb-4">
              A TypeScript/JavaScript SDK for interacting with the Tribes by Astrix platform, enabling seamless integration with tribe management, points system, content creation, and more.
            </p>
            
            {sectionHeading('Core Modules')}
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Tribes</strong>: Create and manage tribes, memberships, and tribe settings</li>
              <li><strong>Points</strong>: Handle tribe tokens, points distribution, and rewards</li>
              <li><strong>Token</strong>: Interact with the Astrix token and related functions</li>
              <li><strong>Content</strong>: Create and manage posts and other content</li>
              <li><strong>Collectibles</strong>: Manage collectible NFTs within tribes</li>
            </ul>
            
            {sectionHeading('Features')}
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Easy Integration</strong>: Simple methods to interact with Tribes by Astrix contracts</li>
              <li><strong>Type Safety</strong>: Full TypeScript support with comprehensive types and interfaces</li>
              <li><strong>Modular Design</strong>: Use only the modules you need for your application</li>
              <li><strong>Caching Layer</strong>: Optimized performance with intelligent caching</li>
              <li><strong>Comprehensive Error Handling</strong>: Clear error messages and recovery options</li>
              <li><strong>Detailed Documentation</strong>: Complete API documentation and examples</li>
            </ul>

            {sectionHeading('Example Usage')}
            <CodeBlock
              code={`import { AstrixSDK } from '@wasserstoff/tribes-sdk';
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
await sdk.connect(signer);

// Create a tribe
const tribeId = await sdk.tribes.createTribe({
  name: "My Amazing Tribe",
  metadata: JSON.stringify({
    description: "A community for blockchain enthusiasts",
    logoUrl: "https://example.com/logo.png",
    coverImageUrl: "https://example.com/cover.png",
    visibility: "PUBLIC"
  })
});

// Get tribe details
const tribeDetails = await sdk.tribes.getTribeDetails(tribeId);
console.log("Tribe details:", tribeDetails);`}
              language="typescript"
            />
          </>
        )
      },
      {
        id: 'tribe-management',
        title: 'Tribe Management',
        content: () => (
          <>
            <p className="mb-4">
              The Tribes module provides comprehensive functionality for creating and managing tribes on the platform.
            </p>
            
            {sectionHeading('Creating a Tribe')}
            <p className="mb-4">
              Creates a new tribe with the specified name and metadata.
            </p>
            <p><strong>Parameters:</strong></p>
            <ul className="list-disc pl-6 mb-4">
              {parameterItem('name', 'String', 'The name of the tribe')}
              {parameterItem('metadata', 'String', 'JSON string with tribe metadata (description, logo, banner, etc.)')}
              {parameterItem('admins', 'Array (optional)', 'List of additional admin addresses')}
              {parameterItem('joinType', 'Number (optional)', 'Type of tribe (0=Public, 1=Private, 2=Invite')}
              {parameterItem('entryFee', 'BigInt (optional)', 'Fee to join the tribe in wei')}
              {parameterItem('nftRequirements', 'Array (optional)', 'NFT requirements for joining')}
            </ul>
            <p><strong>Returns:</strong> Promise&lt;number&gt; - The ID of the newly created tribe</p>
            
            <CodeBlock
              code={`const tribeId = await sdk.tribes.createTribe({
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

console.log(\`Created tribe with ID: \${tribeId}\`);`}
              language="typescript"
            />
            
            {sectionHeading('Getting All Tribes')}
            <p className="mb-4">Retrieves a list of all tribes on the platform with optional pagination.</p>
            <p><strong>Parameters:</strong></p>
            <ul className="list-disc pl-6 mb-4">
              {parameterItem('offset', 'Number (optional)', 'Pagination offset (default: 0)')}
              {parameterItem('limit', 'Number (optional)', 'Maximum number of tribes to return (default: 100)')}
            </ul>
            <p><strong>Returns:</strong> Promise&lt;{`{ tribeIds: number[], total: number }`}&gt;</p>
            
            <CodeBlock
              code={`// Get all tribes
const allTribes = await sdk.tribes.getAllTribes();
console.log(\`Total tribes: \${allTribes.total}\`);
console.log(\`Tribe IDs: \${allTribes.tribeIds.join(', ')}\`);

// With pagination
const page1 = await sdk.tribes.getAllTribes(0, 10); // First 10 tribes
const page2 = await sdk.tribes.getAllTribes(10, 10); // Next 10 tribes`}
              language="typescript"
            />
            
            {sectionHeading('Getting Tribe Members')}
            <p className="mb-4">Retrieves a list of all members in a specific tribe.</p>
            <p><strong>Parameters:</strong></p>
            <ul className="list-disc pl-6 mb-4">
              {parameterItem('tribeId', 'Number', 'The ID of the tribe')}
            </ul>
            <p><strong>Returns:</strong> Promise&lt;string[]&gt; - Array of member addresses</p>
            
            <CodeBlock
              code={`const members = await sdk.tribes.getMembers(tribeId);
console.log(\`Tribe has \${members.length} members\`);
console.log(\`Members: \${members.join(', ')}\`);`}
              language="typescript"
            />
            
            {sectionHeading('Joining a Tribe')}
            <p className="mb-4">Allows the connected wallet to join a public tribe.</p>
            <p><strong>Parameters:</strong></p>
            <ul className="list-disc pl-6 mb-4">
              {parameterItem('tribeId', 'Number', 'The ID of the tribe to join')}
            </ul>
            <p><strong>Returns:</strong> Promise&lt;string&gt; - Transaction hash</p>
            
            <CodeBlock
              code={`const tx = await sdk.tribes.joinTribe({ tribeId: 42 });
console.log(\`Joined tribe! Transaction: \${tx}\`);`}
              language="typescript"
            />
            
            {sectionHeading('Checking Member Status')}
            <p className="mb-4">Checks the membership status of an address in a tribe.</p>
            <p><strong>Parameters:</strong></p>
            <ul className="list-disc pl-6 mb-4">
              {parameterItem('tribeId', 'Number', 'The ID of the tribe')}
              {parameterItem('address', 'String', 'The address to check')}
            </ul>
            <p><strong>Returns:</strong> Promise&lt;MemberStatus&gt; - Member status enum (0=NotMember, 1=Pending, 2=Member, 3=Admin)</p>
            
            <CodeBlock
              code={`const status = await sdk.tribes.getMemberStatus(tribeId, "0x1234...");

if (status === 2) {
  console.log("User is a member");
} else if (status === 3) {
  console.log("User is an admin");
} else if (status === 1) {
  console.log("User has a pending request");
} else {
  console.log("User is not a member");
}`}
              language="typescript"
            />
          </>
        )
      },
      {
        id: 'tokens-and-points',
        title: 'Tokens & Points',
        content: () => (
          <>
            <p className="mb-4">
              The Points module provides functionality for managing tribe tokens and points systems.
            </p>
            
            {sectionHeading('Creating a Tribe Token')}
            <p className="mb-4">Creates a new ERC20 token for a tribe that can be used for rewards, access control, or other functionality.</p>
            <p><strong>Parameters:</strong></p>
            <ul className="list-disc pl-6 mb-4">
              {parameterItem('tribeId', 'Number', 'The ID of the tribe')}
              {parameterItem('name', 'String', 'Name of the token')}
              {parameterItem('symbol', 'String', 'Symbol of the token (ticker)')}
            </ul>
            <p><strong>Returns:</strong> Promise&lt;string&gt; - Transaction hash</p>
            
            <CodeBlock
              code={`const tx = await sdk.points.createTribeToken({
  tribeId: 42,
  name: "Awesome Tribe Token",
  symbol: "ATT"
});

console.log(\`Created tribe token! Transaction: \${tx}\`);`}
              language="typescript"
            />
            
            {sectionHeading('Getting Tribe Token Address')}
            <p className="mb-4">Retrieves the address of a tribe's token.</p>
            <p><strong>Parameters:</strong></p>
            <ul className="list-disc pl-6 mb-4">
              {parameterItem('tribeId', 'Number', 'The ID of the tribe')}
            </ul>
            <p><strong>Returns:</strong> Promise&lt;string&gt; - Token contract address</p>
            
            <CodeBlock
              code={`const tokenAddress = await sdk.points.getTribeTokenAddress(tribeId);
console.log(\`Tribe \${tribeId} token address: \${tokenAddress}\`);`}
              language="typescript"
            />
            
            {sectionHeading('Minting Tokens')}
            <p className="mb-4">Mints tokens to a specific address.</p>
            <p><strong>Parameters:</strong></p>
            <ul className="list-disc pl-6 mb-4">
              {parameterItem('tribeId', 'Number', 'The ID of the tribe')}
              {parameterItem('amount', 'BigInt', 'Amount of tokens to mint')}
              {parameterItem('recipient', 'String', 'Address to receive the tokens')}
            </ul>
            <p><strong>Returns:</strong> Promise&lt;string&gt; - Transaction hash</p>
            
            <CodeBlock
              code={`const amount = ethers.parseUnits("100", 18); // 100 tokens with 18 decimals
const tx = await sdk.points.mintTokens(tribeId, amount, userAddress);
console.log(\`Minted \${amount} tokens! Transaction: \${tx}\`);`}
              language="typescript"
            />
            
            {sectionHeading('Setting Point Values for Actions')}
            <p className="mb-4">Sets the number of points earned for performing different actions within a tribe.</p>
            <p><strong>Parameters:</strong></p>
            <ul className="list-disc pl-6 mb-4">
              {parameterItem('tribeId', 'Number', 'The ID of the tribe')}
              {parameterItem('actionType', 'String', 'Type of action (e.g., "POST_CREATE", "COMMENT")')}
              {parameterItem('points', 'Number', 'Number of points for the action')}
            </ul>
            <p><strong>Returns:</strong> Promise&lt;string&gt; - Transaction hash</p>
            
            <CodeBlock
              code={`const tx = await sdk.points.setPointsForAction(tribeId, "POST_CREATE", 10);
console.log(\`Set points for creating posts! Transaction: \${tx}\`);`}
              language="typescript"
            />
            
            {sectionHeading('Getting User Points')}
            <p className="mb-4">Gets the total points a user has earned in a tribe.</p>
            <p><strong>Parameters:</strong></p>
            <ul className="list-disc pl-6 mb-4">
              {parameterItem('tribeId', 'Number', 'The ID of the tribe')}
              {parameterItem('userAddress', 'String', 'Address of the user')}
            </ul>
            <p><strong>Returns:</strong> Promise&lt;number&gt; - Total points earned</p>
            
            <CodeBlock
              code={`const points = await sdk.points.getPoints(tribeId, userAddress);
console.log(\`User has earned \${points} points in tribe \${tribeId}\`);`}
              language="typescript"
            />
          </>
        )
      },
      {
        id: 'content-management',
        title: 'Content Management',
        content: () => (
          <>
            <p className="mb-4 text-lg leading-relaxed">
              The Content module provides functionality for creating and managing posts and other content within tribes.
              This module lets you create rich posts with metadata, retrieve tribe content, and handle interactive features
              like reactions and comments.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
              <div className="bg-gray-900/60 p-5 rounded-xl border border-gray-800">
                <h4 className="font-bold text-accent mb-2">Create Content</h4>
                <p className="text-sm text-gray-300">Create posts and add content to your tribes with customizable metadata.</p>
              </div>
              <div className="bg-gray-900/60 p-5 rounded-xl border border-gray-800">
                <h4 className="font-bold text-accent mb-2">Retrieve Posts</h4>
                <p className="text-sm text-gray-300">Get posts for a tribe with pagination support to build feeds and content listings.</p>
              </div>
              <div className="bg-gray-900/60 p-5 rounded-xl border border-gray-800">
                <h4 className="font-bold text-accent mb-2">Social Interactions</h4>
                <p className="text-sm text-gray-300">Enable reactions, comments, and other social interactions on tribe content.</p>
              </div>
            </div>
            
            {sectionHeading('Creating a Post')}
            <p className="mb-4">Creates a new post within a tribe with content and metadata to describe the post.</p>
            
            <div className="bg-gray-900/40 p-5 rounded-lg border border-gray-800 mb-6">
              <h4 className="font-semibold text-gray-200 mb-3">Parameters</h4>
              <ul className="space-y-3">
                {parameterItem('tribeId', 'Number', 'The ID of the tribe where the post will be created')}
                {parameterItem('content', 'String', 'The actual content of the post (text)')}
                {parameterItem('metadata', 'String (JSON)', 'JSON metadata with details about the post format, attachments, etc.')}
              </ul>
              
              <h4 className="font-semibold text-gray-200 mt-6 mb-3">Returns</h4>
              <p className="flex items-center gap-2">
                <span className="bg-green-900/50 text-green-300 px-2 py-0.5 rounded-md font-mono text-sm">Promise&lt;number&gt;</span>
                <span className="text-gray-400 text-sm">Post ID that can be used to reference this post</span>
              </p>
            </div>
            
            <div className="bg-accent/20 border border-accent/30 p-5 rounded-lg p-4 mb-6">
              <h4 className="text-accent font-semibold mb-2">Post Metadata Types</h4>
              <p className="text-sm text-gray-300 mb-3">The metadata field allows you to specify different types of post content:</p>
              <ul className="list-disc pl-5 text-sm text-gray-300 space-y-1">
                <li><strong>title</strong>: Title of the post (useful for display in feeds)</li>
                <li><strong>tags</strong>: Array of tags for categorizing or searching posts</li>
                <li><strong>attachments</strong>: Array of attachment objects (images, files, etc.)</li>
                <li><strong>mediaUrls</strong>: External media like images or videos</li>
                <li><strong>externalLink</strong>: Link to external content</li>
                <li><strong>format</strong>: Content format (plain, markdown, html)</li>
              </ul>
            </div>
            
            <CodeBlock
              code={`const postId = await sdk.content.createPost({
  tribeId: 42,
  content: "Hello tribe members!",
  metadata: JSON.stringify({
    title: "My First Post",
    tags: ["introduction", "hello"],
    attachments: [],
    format: "plain"
  })
});

console.log(\`Created post with ID: \${postId}\`);`}
              language="typescript"
            />
            
            {sectionHeading('Getting Posts for a Tribe')}
            <p className="mb-4">Retrieves posts for a specific tribe with pagination support.</p>
            
            <div className="bg-gray-900/40 p-5 rounded-lg border border-gray-800 mb-6">
              <h4 className="font-semibold text-gray-200 mb-3">Parameters</h4>
              <ul className="space-y-3">
                {parameterItem('tribeId', 'Number', 'The ID of the tribe to get posts from')}
                {parameterItem('offset', 'Number (optional)', 'Pagination offset (default: 0')}
                {parameterItem('limit', 'Number (optional)', 'Maximum number of posts to return (default: 10')}
              </ul>
              
              <h4 className="font-semibold text-gray-200 mt-6 mb-3">Returns</h4>
              <p className="flex flex-col gap-1">
                <span className="bg-green-900/50 text-green-300 px-2 py-0.5 rounded-md font-mono text-sm inline-block w-fit">Promise&lt;{`{ posts: PostData[], total: number }`}&gt;</span>
                <span className="text-gray-400 text-sm mt-1">Object containing posts array and total count</span>
              </p>
            </div>
            
            {sectionHeading('Post Interactions')}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h4 className="font-semibold text-lg mb-2">Reacting to a Post</h4>
                <p className="text-sm text-gray-300 mb-4">Add reactions to posts such as likes, hearts, etc.</p>
                
                <div className="bg-gray-900/40 p-4 rounded-lg border border-gray-800 mb-4 text-sm">
                  <p className="mb-2"><strong>Parameters:</strong></p>
                  <ul className="list-disc pl-5 space-y-1">
                    {parameterItem('postId', 'Number', 'Post ID')}
                    {parameterItem('reactionType', 'String', 'Type of reaction')}
                  </ul>
                  <p className="mt-2"><strong>Returns:</strong> Promise&lt;string&gt; - Transaction hash</p>
                </div>
                
                <CodeBlock
                  code={`const tx = await sdk.content.reactToPost(postId, "LIKE");
console.log(\`Reacted to post! Transaction: \${tx}\`);`}
                  language="typescript"
                />
              </div>
              
              <div>
                <h4 className="font-semibold text-lg mb-2">Commenting on a Post</h4>
                <p className="text-sm text-gray-300 mb-4">Add comments to existing posts to engage with content.</p>
                
                <div className="bg-gray-900/40 p-4 rounded-lg border border-gray-800 mb-4 text-sm">
                  <p className="mb-2"><strong>Parameters:</strong></p>
                  <ul className="list-disc pl-5 space-y-1">
                    {parameterItem('postId', 'Number', 'Post ID')}
                    {parameterItem('content', 'String', 'Comment content')}
                  </ul>
                  <p className="mt-2"><strong>Returns:</strong> Promise&lt;number&gt; - Comment ID</p>
                </div>
                
                <CodeBlock
                  code={`const commentId = await sdk.content.commentOnPost(
  postId, 
  "Great post! Thanks for sharing."
);
console.log(\`Added comment with ID: \${commentId}\`);`}
                  language="typescript"
                />
              </div>
            </div>
            
            <div className="bg-gray-900/40 rounded-lg border border-gray-800 p-5 mt-8">
              <h4 className="font-semibold text-lg mb-3">Advanced Content Management</h4>
              <p className="text-sm text-gray-300 mb-4">Other content-related functionality available in the SDK:</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="bg-gray-800/60 p-3 rounded-lg">
                  <h5 className="font-medium text-accent-300 mb-1">Get Post Details</h5>
                  <code className="text-gray-300">sdk.content.getPostDetails(postId)</code>
                </div>
                <div className="bg-gray-800/60 p-3 rounded-lg">
                  <h5 className="font-medium text-accent-300 mb-1">Get Post Comments</h5>
                  <code className="text-gray-300">sdk.content.getPostComments(postId)</code>
                </div>
                <div className="bg-gray-800/60 p-3 rounded-lg">
                  <h5 className="font-medium text-accent-300 mb-1">Get User Posts</h5>
                  <code className="text-gray-300">sdk.content.getUserPosts(address)</code>
                </div>
                <div className="bg-gray-800/60 p-3 rounded-lg">
                  <h5 className="font-medium text-accent-300 mb-1">Delete Post</h5>
                  <code className="text-gray-300">sdk.content.deletePost(postId)</code>
                </div>
              </div>
            </div>
          </>
        )
      },
      {
        id: 'modules',
        title: 'SDK Modules',
        sections: [
          {
            id: 'tribes',
            title: 'Tribes Module',
            content: () => (
              <>
                <p className="mb-4">
                The Tribes module provides comprehensive functionality for creating and managing tribes on the platform.
              </p>

                {sectionHeading('Creating a Tribe')}
                <p className="mb-4">
                  Creates a new tribe with the specified name and metadata.
                </p>
                <CodeBlock
                  code={`// Create a tribe with detailed metadata
const tribeId = await sdk.tribes.createTribe({
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

console.log(\`Created tribe with ID: \${tribeId}\`);`}
                  language="typescript"
                />

                {sectionHeading('Getting All Tribes')}
                <p className="mb-4">
                  Retrieves a list of all tribes on the platform with optional pagination.
                </p>
                <CodeBlock
                  code={`// Get all tribes
const allTribes = await sdk.tribes.getAllTribes();
console.log(\`Total tribes: \${allTribes.total}\`);
console.log(\`Tribe IDs: \${allTribes.tribeIds.join(', ')}\`);

// With pagination
const page1 = await sdk.tribes.getAllTribes(0, 10); // First 10 tribes
const page2 = await sdk.tribes.getAllTribes(10, 10); // Next 10 tribes`}
                  language="typescript"
                />

                {sectionHeading('Getting Tribe Details')}
                <p className="mb-4">
                  Get detailed information about a specific tribe by ID.
                </p>
                <div className="bg-yellow-900/30 border border-yellow-800 p-3 rounded-md mb-4">
                  <strong className="text-yellow-400">Note:</strong> The SDK internally uses a contract method called <code>getTribe</code>, but this method is exposed through the SDK as <code>getTribeDetails</code>. Always use <code>getTribeDetails</code> in your application code.
                </div>
                <CodeBlock
                  code={`const tribeDetails = await sdk.tribes.getTribeDetails(tribeId);

console.log(\`Tribe Name: \${tribeDetails.name}\`);
console.log(\`Members: \${tribeDetails.memberCount}\`);
console.log(\`Creator: \${tribeDetails.creator}\`);

// Parse metadata if needed
const metadata = JSON.parse(tribeDetails.metadata);
console.log(\`Description: \${metadata.description}\`);`}
                  language="typescript"
                />

                {sectionHeading('Joining a Tribe')}
                <p className="mb-4">
                  Allows the connected wallet to join a public tribe.
                </p>
                <CodeBlock
                  code={`const tx = await sdk.tribes.joinTribe({ tribeId: 42 });
console.log(\`Joined tribe! Transaction: \${tx}\`);`}
                  language="typescript"
                />
              </>
            )
          },
          {
            id: 'tokens',
            title: 'Tokens Module',
            content: () => (
              <>
                <p className="mb-4">
                  The Points & Tokens module provides functionality for managing tribe tokens and points systems.
                </p>

                {sectionHeading('Creating a Tribe Token')}
                <p className="mb-4">
                  Creates a new ERC20 token for a tribe that can be used for rewards, access control, or other functionality.
                </p>
                <CodeBlock
                  code={`const tx = await sdk.points.createTribeToken({
  tribeId: 42,
  name: "Awesome Tribe Token",
  symbol: "ATT"
});

console.log(\`Created tribe token! Transaction: \${tx}\`);`}
                  language="typescript"
                />

                {sectionHeading('Getting Tribe Token Address')}
                <p className="mb-4">
                  Retrieves the address of a tribe's token.
                </p>
                <CodeBlock
                  code={`const tokenAddress = await sdk.points.getTribeTokenAddress(tribeId);
console.log(\`Tribe \${tribeId} token address: \${tokenAddress}\`);`}
                  language="typescript"
                />

                {sectionHeading('Setting Exchange Rate')}
                <p className="mb-4">
                  Sets the exchange rate between tribe tokens and Astrix tokens.
                </p>
                <CodeBlock
                  code={`// 10 tribe tokens for 1 Astrix token
const tx = await sdk.points.setExchangeRate(tribeId, 10);
console.log(\`Set exchange rate! Transaction: \${tx}\`);`}
                  language="typescript"
                />
              </>
            )
          },
          {
            id: 'points',
            title: 'Points Module',
            content: () => (
              <>
                <p className="mb-4">
                  The Points module helps you manage action points and rewards for tribe activities.
                </p>
                
                {sectionHeading('Getting User Points')}
                <p className="mb-4">
                  Gets the total points a user has earned in a tribe.
                </p>
                <CodeBlock
                  code={`const points = await sdk.points.getPoints(tribeId, userAddress);
console.log(\`User has earned \${points} points in tribe \${tribeId}\`);`}
                  language="typescript"
                />
                
                {sectionHeading('Setting Point Values for Actions')}
                <p className="mb-4">
                  Sets the number of points earned for performing different actions within a tribe.
                </p>
                <CodeBlock
                  code={`const tx = await sdk.points.setPointsForAction(tribeId, "POST_CREATE", 10);
console.log(\`Set points for creating posts! Transaction: \${tx}\`);

// Set points for other actions
await sdk.points.setPointsForAction(tribeId, "COMMENT", 5);
await sdk.points.setPointsForAction(tribeId, "REACTION", 1);`}
                  language="typescript"
                />
                
                {sectionHeading('Minting Tokens')}
                <p className="mb-4">
                  Mints tokens to a specific address.
                </p>
                <CodeBlock
                  code={`const amount = ethers.parseUnits("100", 18); // 100 tokens with 18 decimals
const tx = await sdk.points.mintTokens(tribeId, amount, userAddress);
console.log(\`Minted \${amount} tokens! Transaction: \${tx}\`);`}
                  language="typescript"
                />
              </>
            )
          },
          {
            id: 'actions',
            title: 'Actions & Content',
            content: () => (
              <>
                <p className="mb-4">
                  The Content module provides functionality for creating and managing posts and other content within tribes.
                </p>
                
                {sectionHeading('Creating a Post')}
                <p className="mb-4">
                  Creates a new post within a tribe.
                </p>
                <CodeBlock
                  code={`const postId = await sdk.content.createPost({
  tribeId: 42,
  content: "Hello tribe members!",
  metadata: JSON.stringify({
    title: "My First Post",
    tags: ["introduction", "hello"],
    attachments: []
  })
});

console.log(\`Created post with ID: \${postId}\`);`}
                  language="typescript"
                />
                
                {sectionHeading('Getting Posts for a Tribe')}
                <p className="mb-4">
                  Gets all posts for a specific tribe.
                </p>
                <CodeBlock
                  code={`const result = await sdk.content.getTribePosts(tribeId, 0, 10);
console.log(\`Tribe has \${result.total} posts\`);
result.posts.forEach(post => {
  console.log(\`Post \${post.id}: \${post.content}\`);
});`}
                  language="typescript"
                />
                
                {sectionHeading('Interacting with Posts')}
                <p className="mb-4">
                  React to posts and add comments.
                </p>
                <CodeBlock
                  code={`// Add a reaction
const txReact = await sdk.content.reactToPost(postId, "LIKE");
console.log(\`Reacted to post! Transaction: \${txReact}\`);

// Add a comment
const commentId = await sdk.content.commentOnPost(postId, "Great post!");
console.log(\`Added comment with ID: \${commentId}\`);`}
                  language="typescript"
                />
                
                {sectionHeading('Recording User Actions')}
                <p className="mb-4">
                  Manually record user actions that might trigger point rewards.
                </p>
                <CodeBlock
                  code={`// Listen for user actions
sdk.events.on('tribeAction', (event) => {
  console.log('Action performed:', event);
  // Award points based on action
});

// Manually record an action
await sdk.actions.recordAction({
  tribeId: 42,
  actionType: "CONTENT_SHARED",
  userAddress: "0x123..."
});`}
                  language="typescript"
                />
              </>
            )
          }
        ]
      },
      {
        id: 'advanced',
        title: 'Advanced Topics',
        sections: [
          {
            id: 'error-handling',
            title: 'Error Handling',
            content: () => (
              <>
                <p className="mb-4">
                  Proper error handling is essential for a robust application.
                  The SDK throws specific error types that you can catch and handle appropriately.
                </p>
                <CodeBlock
                  code={`try {
  await sdk.tribes.joinTribe({ tribeId: 1 });
} catch (error) {
  if (error.code === 'NOT_INITIALIZED') {
    // SDK not initialized properly
    console.error('Please connect wallet first');
  } else if (error.code === 'CONTRACT_ERROR') {
    // Contract-level error
    console.error('Blockchain transaction failed:', error.message);
  } else {
    // Other errors
    console.error('Operation failed:', error);
  }
}`}
                  language="typescript"
                />
              </>
            )
          },
          {
            id: 'custom-integration',
            title: 'Custom Integration',
            content: () => (
              <>
                <p className="mb-4">
                  For advanced use cases, you may need to interact with the contracts directly or extend the SDK functionality.
                </p>
                <CodeBlock
                  code={`// Access the underlying contract instance
const tribeController = sdk.getContract('tribeController');

// Call a contract method directly
const result = await tribeController.someCustomMethod(param1, param2);

// Extend the SDK with custom functionality
sdk.extend('myCustomModule', {
  customMethod: async function(param) {
    // Implementation
    return result;
  }
});

// Use your custom module
const result = await sdk.myCustomModule.customMethod('param');`}
                  language="typescript"
                />
              </>
            )
          }
        ]
      }
    ]
  },
  advanced: {
    title: 'Advanced Topics',
    sections: [
      {
        id: 'error-handling',
        title: 'Error Handling',
        content: () => (
          <>
            <p className="mb-4">
              Proper error handling is essential for a robust application.
              The SDK throws specific error types that you can catch and handle appropriately.
            </p>
            <CodeBlock
              code={`try {
  await sdk.tribes.joinTribe({ tribeId: 1 });
} catch (error) {
  if (error.code === 'NOT_INITIALIZED') {
    // SDK not initialized properly
    console.error('Please connect wallet first');
  } else if (error.code === 'CONTRACT_ERROR') {
    // Contract-level error
    console.error('Blockchain transaction failed:', error.message);
  } else {
    // Other errors
    console.error('Operation failed:', error);
  }
}`}
              language="typescript"
            />
          </>
        )
      },
      {
        id: 'custom-integration',
        title: 'Custom Integration',
        content: () => (
          <>
            <p className="mb-4">
              For advanced use cases, you may need to interact with the contracts directly or extend the SDK functionality.
            </p>
            <CodeBlock
              code={`// Access the underlying contract instance
const tribeController = sdk.getContract('tribeController');

// Call a contract method directly
const result = await tribeController.someCustomMethod(param1, param2);

// Extend the SDK with custom functionality
sdk.extend('myCustomModule', {
  customMethod: async function(param) {
    // Implementation
    return result;
  }
});

// Use your custom module
const result = await sdk.myCustomModule.customMethod('param');`}
              language="typescript"
            />
          </>
        )
      }
    ]
  }
};

// UI Components - Define helper components first to fix linter errors
const cardWithIcon = (iconSvg: React.ReactNode, title: string, description: string) => (
  <div className="bg-gray-900/60 p-5 rounded-xl border border-gray-800 hover:border-accent transition-colors">
    <div className="bg-accent/20 p-3 rounded-lg w-14 h-14 flex items-center justify-center mb-4">
      <div className="text-accent">{iconSvg}</div>
    </div>
    <h4 className="font-bold text-accent mb-2">{title}</h4>
    <p className="text-sm text-gray-300">{description}</p>
  </div>
);

const sectionHeading = (title: string) => (
  <h3 className="text-xl font-bold mt-6 mb-3 flex items-center">
    <div className="bg-accent w-1.5 h-6 rounded-full mr-2"></div>
    {title}
  </h3>
);

const infoBox = (iconSvg: React.ReactNode, title: string, description: string) => (
  <div className="bg-accent/10 border border-accent/30 p-5 rounded-md mt-6">
    <div className="flex items-start">
      <div className="bg-accent/20 p-2 rounded-md mr-4">
        <div className="text-accent">{iconSvg}</div>
      </div>
      <div>
        <strong className="text-accent font-semibold">{title}</strong> 
        <p className="text-gray-300 mt-1">{description}</p>
      </div>
    </div>
  </div>
);

const parameterItem = (name: string, type: string, description: string) => (
  <li className="flex items-start">
    <div className="bg-accent/20 text-accent px-2 py-0.5 rounded-md font-mono text-sm mt-0.5 mr-3 whitespace-nowrap">{name}</div>
    <div>
      <span className="text-gray-300">{type}</span>
      <p className="text-sm text-gray-400 mt-0.5">{description}</p>
    </div>
  </li>
);

interface NavItemProps {
  id: string;
  title: string;
  active: boolean;
  onClick: (id: string) => void;
}

function NavItem({ id, title, active, onClick }: NavItemProps) {
  return (
    <div
      className={`px-3 py-2 cursor-pointer rounded-lg transition-all duration-200 text-sm ${
        active
          ? 'bg-accent/30 text-black shadow-sm shadow-accent/30'
          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
      }`}
      onClick={() => onClick(id)}
    >
      {title}
    </div>
  );
}

interface CategoryProps {
  title: string;
  sections: DocSection[];
  activeSection: string;
  expanded: boolean;
  onToggle: () => void;
  onSectionChange: (id: string) => void;
}

// Category component with expandable sections
const Category = ({ title, sections, activeSection, expanded, onToggle, onSectionChange }: CategoryProps) => {
  return (
    <div className="mb-3">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full text-left p-2.5 rounded-lg hover:bg-gray-800/80 transition-colors group"
      >
        <span className="font-medium group-hover:text-accent transition-colors">{title}</span>
        <div className={`p-1 rounded-md transition-colors ${expanded ? 'bg-accent/30' : 'bg-gray-800/50 group-hover:bg-accent/20'}`}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`transition-transform ${expanded ? 'rotate-180 text-accent' : 'text-gray-400 group-hover:text-accent'}`}
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
      </button>
      
      {expanded && (
        <div className="ml-3 mt-1 space-y-1 pl-2 border-l border-gray-800">
          {sections.map(section => (
            <NavItem
              key={section.id}
              id={section.id}
              title={section.title}
              active={activeSection === section.id}
              onClick={onSectionChange}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface CodeBlockProps {
  code: string;
  language: string;
}

// Code block component with improved mobile styling
const CodeBlock = ({ language, code }: CodeBlockProps) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mb-6 group relative">
      <div className="flex items-center justify-between bg-gray-800/80 backdrop-blur-sm px-4 py-3 rounded-t-lg border-t border-l border-r border-gray-700">
        <div className="bg-accent/50 px-3 py-1 rounded-md text-accent text-sm font-mono">{language}</div>
        <button
          onClick={copyToClipboard}
          className="text-gray-400 hover:text-white transition duration-200 p-2 rounded-md hover:bg-gray-700/50"
          aria-label="Copy code"
        >
          {copied ? (
            <div className="flex items-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-green-400 mr-1.5">
                <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-green-400 text-sm">Copied</span>
            </div>
          ) : (
            <Copy size={16} />
          )}
        </button>
      </div>
      <pre className="bg-gray-900/80 backdrop-blur-sm overflow-x-auto p-5 border border-gray-700 rounded-b-lg text-sm md:text-base">
        <code className="text-gray-200 font-mono">{code}</code>
      </pre>
      <div className="absolute -inset-0.5 bg-gradient-to-r from-accent/0 via-accent/5 to-accent/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    </div>
  );
};

export default function DocsPage() {
  const [activeCategory, setActiveCategory] = useState('gettingStarted');
  const [expandedCategory, setExpandedCategory] = useState('gettingStarted');
  const [activeSection, setActiveSection] = useState<string>(
    DOCS_STRUCTURE.gettingStarted.sections[0].id
  );
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Get all sections from all categories
  const flattenDocs = () => {
    const flatDocs: DocSection[] = [];
    Object.keys(DOCS_STRUCTURE).forEach(catKey => {
      DOCS_STRUCTURE[catKey].sections.forEach(section => {
        flatDocs.push(section);
      });
    });
    return flatDocs;
  };

  // Find current category by active section
  useEffect(() => {
    for (const catKey of Object.keys(DOCS_STRUCTURE)) {
      if (DOCS_STRUCTURE[catKey].sections.some(s => s.id === activeSection)) {
        setActiveCategory(catKey);
        setExpandedCategory(catKey); // Also expand the category containing the active section
        break;
      }
    }
  }, [activeSection]);

  // Find active doc
  const activeDoc = flattenDocs().find(doc => doc.id === activeSection);
  
  // Navigation between docs
  const allDocs = flattenDocs();
  const currentIndex = allDocs.findIndex(doc => doc.id === activeSection);
  const prevDoc = currentIndex > 0 ? allDocs[currentIndex - 1] : null;
  const nextDoc = currentIndex < allDocs.length - 1 ? allDocs[currentIndex + 1] : null;

  // Handle category expansion
  const toggleCategory = (categoryKey: string) => {
    setExpandedCategory(expandedCategory === categoryKey ? '' : categoryKey);
  };

  return (
    <PageContainer className="max-w-7xl">
      {/* Mobile sidebar toggle */}
      <div className="lg:hidden fixed top-20 left-24 z-20">
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2.5 rounded-lg bg-gray-800/90 backdrop-blur-sm text-white border border-gray-700 shadow-lg hover:bg-gray-700 transition-all"
          aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          {sidebarOpen ? (
            <X size={20} />
          ) : (
            <Menu size={20} />
          )}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row relative pt-4">
        {/* Sidebar */}
        <aside className={`
          lg:sticky lg:top-[calc(var(--navbar-height)+1rem)] lg:self-start
          w-80 bg-gray-900/95 backdrop-blur-sm overflow-y-auto
          border border-gray-800 rounded-lg shadow-xl
          mb-6 lg:mb-0 h-[calc(100vh-var(--navbar-height)-4rem)] 
          transform transition-transform duration-200 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          fixed top-[calc(var(--navbar-height)+1rem)] left-24 z-10 lg:static lg:z-0
        `}>
          <div className="sticky top-0 bg-gray-900/95 backdrop-blur-sm z-10 border-b border-gray-800 p-4">
            <h1 className="text-xl font-bold flex items-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-accent mr-2">
                <path d="M16 4H18C19.1046 4 20 4.89543 20 6V20C20 21.1046 19.1046 22 18 22H6C4.89543 22 4 21.1046 4 20V6C4 4.89543 4.89543 4 6 4H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 16V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 13L12 16L15 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M15 8H9C7.89543 8 7 7.10457 7 6V4C7 2.89543 7.89543 2 9 2H15C16.1046 2 17 2.89543 17 4V6C17 7.10457 16.1046 8 15 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Tribes SDK Docs</span>
            </h1>
          </div>

          <div className="p-4 pb-16 overflow-y-auto" style={{ height: 'calc(100% - 60px)' }}>
            {Object.keys(DOCS_STRUCTURE).map(catKey => (
              <Category
                key={catKey}
                title={DOCS_STRUCTURE[catKey].title}
                sections={DOCS_STRUCTURE[catKey].sections}
                activeSection={activeSection}
                expanded={expandedCategory === catKey}
                onToggle={() => toggleCategory(catKey)}
                onSectionChange={setActiveSection}
              />
            ))}
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 overflow-auto pl-0 lg:pl-10">
          <div className="max-w-full pr-6">
            {activeDoc && (
              <>
                <div className="bg-gradient-to-br from-gray-900/80 via-gray-900/90 to-gray-800/50 backdrop-blur-sm rounded-xl p-8 mb-10 border border-gray-800 shadow-lg">
                  <h1 className="text-2xl md:text-3xl font-bold mb-3 flex items-center">
                    {activeDoc.title}
                  </h1>
                  <div className="h-1 w-20 bg-gradient-to-r from-accent to-accent/70 rounded-full"></div>
                </div>
                
                <div className="prose prose-invert max-w-4xl prose-headings:font-medium prose-h3:text-xl prose-h3:mt-10 prose-h3:mb-4 prose-p:text-gray-300">
                  {activeDoc.content && activeDoc.content()}
                </div>

                {/* Navigation between pages */}
                <div className="mt-16 flex justify-between items-center border-t border-gray-800/50 pt-6 max-w-4xl">
                  {prevDoc ? (
                    <button 
                      onClick={() => setActiveSection(prevDoc.id)}
                      className="flex items-center text-accent hover:text-accent/80 transition-all bg-gray-900/60 hover:bg-gray-900/90 backdrop-blur-sm py-3 px-5 rounded-lg border border-gray-800/50 hover:border-accent/50 shadow-md"
                    >
                      <ArrowLeft size={16} className="mr-2" />
                      <span>Previous: {prevDoc.title}</span>
                    </button>
                  ) : <div></div>}
                  
                  {nextDoc && (
                    <button 
                      onClick={() => setActiveSection(nextDoc.id)}
                      className="flex items-center text-accent hover:text-accent/80 transition-all bg-gray-900/60 hover:bg-gray-900/90 backdrop-blur-sm py-3 px-5 rounded-lg border border-gray-800/50 hover:border-accent/50 shadow-md"
                    >
                      <span>Next: {nextDoc.title}</span>
                      <ArrowRight size={16} className="ml-2" />
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  );
} 