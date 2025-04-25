"use client";

import React, { useState } from 'react';
import { PageContainer } from '../../../components/ui';
import Link from 'next/link';

// Main Flows Overview Page
export default function FlowsPage() {
  const [activeTab, setActiveTab] = useState('sdk-flows');
  
  // Flow type definitions
  const flowTypes = [
    { id: 'sdk-flows', label: 'SDK Integration' },
    { id: 'content-flows', label: 'Content Management' },
    { id: 'user-flows', label: 'User Interaction' },
    { id: 'auth-flows', label: 'Authentication' },
    { id: 'tribe-flows', label: 'Tribe Management' }
  ];

  return (
    <PageContainer className="max-w-7xl">
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-3 flex items-center text-white">
          Platform Flows & Integration Patterns
        </h1>
        <div className="h-1 w-20 bg-gradient-to-r from-accent to-accent/70 rounded-full mb-8"></div>
        
        <p className="text-gray-300 mb-8 max-w-3xl">
          Explore how different components of the Tribes platform interact, from SDK integrations to user journeys. 
          These diagrams and documentation help visualize the flow of data and interactions within the system.
        </p>

        {/* Flow Navigation */}
        <div className="flex overflow-x-auto pb-2 mb-6 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
          <div className="flex space-x-2">
            {flowTypes.map(type => (
              <button
                key={type.id}
                onClick={() => setActiveTab(type.id)}
                className={`px-4 py-2 whitespace-nowrap font-medium rounded-md transition-colors ${
                  activeTab === type.id 
                    ? 'bg-accent text-white' 
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Flow Content Area */}
        <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-xl p-6 mb-8">
          {activeTab === 'sdk-flows' && (
            <>
              <h2 className="text-2xl font-semibold mb-6 text-white">SDK Integration Flows</h2>
              <p className="text-gray-300 mb-8">
                These diagrams illustrate how applications interact with the Tribes SDK and underlying blockchain contracts.
              </p>
              
              <div className="bg-gray-950 p-6 rounded-lg border border-gray-800 overflow-auto">
                <pre className="text-sm text-gray-300 whitespace-pre">
{`sequenceDiagram
    actor User
    participant App as Web App
    participant SDK as Tribes SDK
    participant Contracts as Blockchain Contracts
    
    User->>App: Connect Wallet
    App->>SDK: sdk.connect(signer)
    SDK->>Contracts: Verify Connection
    Contracts-->>SDK: Connection Established
    SDK-->>App: Connection Successful
    App-->>User: Wallet Connected
    
    Note over App,SDK: Create and Manage Tribes
    User->>App: Create Tribe
    App->>SDK: sdk.tribes.createTribe()
    SDK->>Contracts: Deploy Tribe
    Contracts-->>SDK: Return Tribe ID
    SDK-->>App: Return Tribe Details
    App-->>User: Display Tribe Info
    
    Note over App,SDK: Content Management
    User->>App: Create Post
    App->>SDK: sdk.content.createPost()
    SDK->>Contracts: Store Post Data
    Contracts-->>SDK: Return Post ID
    SDK-->>App: Return Post Details
    App-->>User: Display Post`}
                </pre>
              </div>
              
              <div className="mt-6 text-right">
                <Link href="/docs/sdk" className="text-accent hover:text-accent/80 inline-flex items-center">
                  View detailed SDK flows
                  <svg xmlns="http://www.w3.org/2000/svg" className="ml-1 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </Link>
              </div>
            </>
          )}
          
          {activeTab === 'content-flows' && (
            <>
              <h2 className="text-2xl font-semibold mb-6 text-white">Content Management Flows</h2>
              <p className="text-gray-300 mb-8">
                Detailed flows for creating, retrieving, and interacting with content in tribes.
              </p>
              
              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-4 text-white">Create Post Flow</h3>
                <div className="bg-gray-950 p-6 rounded-lg border border-gray-800 overflow-auto">
                  <pre className="text-sm text-gray-300 whitespace-pre">
{`sequenceDiagram
    actor User
    participant App as Web App
    participant SDK as Tribes SDK
    participant Storage as IPFS Storage
    participant Contracts as ContentContract
    
    User->>App: Create post with text, optional media
    App->>App: Validate input
    
    Note over App,Storage: Handle media (if present)
    opt Media Upload
      App->>Storage: Upload media files
      Storage-->>App: Return media CIDs
    end
    
    App->>SDK: sdk.content.createPost()
    SDK->>SDK: Validate parameters
    
    SDK->>Storage: Upload post metadata
    Storage-->>SDK: Return metadata CID
    
    SDK->>Contracts: createPost(tribeId, metadataCID)
    Contracts-->>SDK: Emit PostCreated event
    SDK-->>App: Return post data with ID
    
    App->>User: Display success and new post`}
                  </pre>
                </div>
              </div>
              
              <div className="mt-6 text-right">
                <Link href="/docs/content-management" className="text-accent hover:text-accent/80 inline-flex items-center">
                  View detailed content flows
                  <svg xmlns="http://www.w3.org/2000/svg" className="ml-1 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </Link>
              </div>
            </>
          )}
          
          {activeTab === 'user-flows' && (
            <>
              <h2 className="text-2xl font-semibold mb-6 text-white">User Interaction Flows</h2>
              <p className="text-gray-300 mb-8">
                How users interact with the Tribes platform through your application.
              </p>
              
              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-4 text-white">User Registration Flow</h3>
                
                <div className="relative">
                  {/* Flow Steps */}
                  <div className="flex flex-col md:flex-row justify-between items-start mb-8">
                    {/* Step 1 */}
                    <div className="bg-gray-800/70 backdrop-blur-sm border border-gray-700 rounded-lg p-4 w-full md:w-1/5 mb-4 md:mb-0 relative z-10">
                      <div className="flex items-center mb-2">
                        <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center mr-2 font-semibold">1</div>
                        <h3 className="text-lg font-medium text-white">Sign Up</h3>
                      </div>
                      <p className="text-sm text-gray-300">User connects wallet to create an account</p>
                      <div className="mt-3 text-xs text-blue-400">sdk.connect(signer)</div>
                    </div>
                    
                    {/* Step 2 */}
                    <div className="bg-gray-800/70 backdrop-blur-sm border border-gray-700 rounded-lg p-4 w-full md:w-1/5 mb-4 md:mb-0 relative z-10">
                      <div className="flex items-center mb-2">
                        <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center mr-2 font-semibold">2</div>
                        <h3 className="text-lg font-medium text-white">Profile</h3>
                      </div>
                      <p className="text-sm text-gray-300">User completes profile with username and optional details</p>
                      <div className="mt-3 text-xs text-blue-400">user.updateProfile(profileData)</div>
                    </div>
                    
                    {/* Step 3 */}
                    <div className="bg-gray-800/70 backdrop-blur-sm border border-gray-700 rounded-lg p-4 w-full md:w-1/5 mb-4 md:mb-0 relative z-10">
                      <div className="flex items-center mb-2">
                        <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center mr-2 font-semibold">3</div>
                        <h3 className="text-lg font-medium text-white">Join Tribe</h3>
                      </div>
                      <p className="text-sm text-gray-300">User joins existing tribe or creates a new one</p>
                      <div className="mt-3 text-xs text-blue-400">tribes.joinTribe(tribeId)</div>
                    </div>
                    
                    {/* Step 4 */}
                    <div className="bg-gray-800/70 backdrop-blur-sm border border-gray-700 rounded-lg p-4 w-full md:w-1/5 mb-4 md:mb-0 relative z-10">
                      <div className="flex items-center mb-2">
                        <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center mr-2 font-semibold">4</div>
                        <h3 className="text-lg font-medium text-white">Explore</h3>
                      </div>
                      <p className="text-sm text-gray-300">User browses content and features with guided introduction</p>
                      <div className="mt-3 text-xs text-blue-400">content.getTribePosts(tribeId)</div>
                    </div>
                    
                    {/* Step 5 */}
                    <div className="bg-gray-800/70 backdrop-blur-sm border border-gray-700 rounded-lg p-4 w-full md:w-1/5 relative z-10">
                      <div className="flex items-center mb-2">
                        <div className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center mr-2 font-semibold">5</div>
                        <h3 className="text-lg font-medium text-white">Engage</h3>
                      </div>
                      <p className="text-sm text-gray-300">User creates first post or interacts with content</p>
                      <div className="mt-3 text-xs text-blue-400">content.createPost(tribeId, postData)</div>
                    </div>
                  </div>
                  
                  {/* Flow Arrows - Hidden on mobile */}
                  <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-blue-500/30 transform -translate-y-1/2 z-0"></div>
                </div>
              </div>
              
              <div className="mt-6 text-right">
                <Link href="/docs/user-flows" className="text-accent hover:text-accent/80 inline-flex items-center">
                  View detailed user flows
                  <svg xmlns="http://www.w3.org/2000/svg" className="ml-1 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </Link>
              </div>
            </>
          )}
          
          {activeTab === 'auth-flows' && (
            <>
              <h2 className="text-2xl font-semibold mb-6 text-white">Authentication Flows</h2>
              <p className="text-gray-300 mb-8">
                How users authenticate with the Tribes platform through wallet connections and sessions.
              </p>
              
              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-4 text-white">Wallet Authentication Flow</h3>
                <div className="bg-gray-950 p-6 rounded-lg border border-gray-800 overflow-auto">
                  <pre className="text-sm text-gray-300 whitespace-pre">
{`sequenceDiagram
    actor User
    participant App as Web App
    participant SDK as Tribes SDK
    participant Contracts as Blockchain Contracts
    
    User->>App: Click "Connect Wallet"
    App->>SDK: Initialize connection
    
    alt Wallet not installed
        SDK-->>App: Return error
        App->>User: Show wallet installation guide
    else Wallet installed
        SDK->>User: Wallet prompts for connection
        User->>SDK: Approve connection
        SDK->>Contracts: Verify connection
        Contracts-->>SDK: Return connection status
        SDK-->>App: Return connected address
        App->>User: Show connected state
    end
    
    Note over App,SDK: Sign Message for Authentication
    App->>SDK: Request authentication
    SDK->>User: Wallet prompts for signature
    User->>SDK: Sign message
    SDK->>Contracts: Verify signature
    Contracts-->>SDK: Return verification status
    SDK-->>App: Return authentication token
    App->>App: Store authentication token
    App->>User: Show authenticated state`}
                  </pre>
                </div>
              </div>
              
              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-4 mt-6">
                <h3 className="text-lg font-medium mb-2 text-white">Authentication Notes</h3>
                <ul className="list-disc pl-5 space-y-2 text-sm text-gray-300">
                  <li><strong className="text-white">Non-custodial:</strong> Users maintain control of their private keys</li>
                  <li><strong className="text-white">Signature-based:</strong> Authentication happens via message signing, not transactions</li>
                  <li><strong className="text-white">Multiple wallets:</strong> Support for MetaMask, WalletConnect, and other providers</li>
                </ul>
              </div>
            </>
          )}
          
          {activeTab === 'tribe-flows' && (
            <>
              <h2 className="text-2xl font-semibold mb-6 text-white">Tribe Management Flows</h2>
              <p className="text-gray-300 mb-8">
                How tribes are created, managed, and how members interact within them.
              </p>
              
              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-4 text-white">Tribe Creation Flow</h3>
                
                <div className="mb-6">
                  <div className="flex flex-col md:flex-row justify-between items-start mb-8">
                    {/* Step 1 */}
                    <div className="bg-gray-800/70 backdrop-blur-sm border border-gray-700 rounded-lg p-4 w-full md:w-1/4 mb-4 md:mb-0 relative z-10">
                      <div className="flex items-center mb-2">
                        <div className="bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center mr-2 font-semibold">1</div>
                        <h3 className="text-lg font-medium text-white">Create Tribe</h3>
                      </div>
                      <p className="text-sm text-gray-300">User creates a new tribe with name, description and privacy settings</p>
                      <div className="mt-3 text-xs text-purple-400">tribes.createTribe(name, description, privacy)</div>
                    </div>
                    
                    {/* Step 2 */}
                    <div className="bg-gray-800/70 backdrop-blur-sm border border-gray-700 rounded-lg p-4 w-full md:w-1/4 mb-4 md:mb-0 relative z-10">
                      <div className="flex items-center mb-2">
                        <div className="bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center mr-2 font-semibold">2</div>
                        <h3 className="text-lg font-medium text-white">Customize</h3>
                      </div>
                      <p className="text-sm text-gray-300">User adds banner image, icon, and configures tribe rules</p>
                      <div className="mt-3 text-xs text-purple-400">tribes.updateTribeSettings(tribeId, settings)</div>
                    </div>
                    
                    {/* Step 3 */}
                    <div className="bg-gray-800/70 backdrop-blur-sm border border-gray-700 rounded-lg p-4 w-full md:w-1/4 mb-4 md:mb-0 relative z-10">
                      <div className="flex items-center mb-2">
                        <div className="bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center mr-2 font-semibold">3</div>
                        <h3 className="text-lg font-medium text-white">Invite Members</h3>
                      </div>
                      <p className="text-sm text-gray-300">User invites friends via email or generates invite link</p>
                      <div className="mt-3 text-xs text-purple-400">tribes.inviteUsers(tribeId, emails) or tribes.createInviteLink(tribeId)</div>
                    </div>
                    
                    {/* Step 4 */}
                    <div className="bg-gray-800/70 backdrop-blur-sm border border-gray-700 rounded-lg p-4 w-full md:w-1/4 relative z-10">
                      <div className="flex items-center mb-2">
                        <div className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center mr-2 font-semibold">4</div>
                        <h3 className="text-lg font-medium text-white">First Post</h3>
                      </div>
                      <p className="text-sm text-gray-300">User creates welcome post to start tribe activity</p>
                      <div className="mt-3 text-xs text-purple-400">content.createPost(tribeId, postData)</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 text-right">
                <Link href="/docs/tribe-management" className="text-accent hover:text-accent/80 inline-flex items-center">
                  View detailed tribe flows
                  <svg xmlns="http://www.w3.org/2000/svg" className="ml-1 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </Link>
              </div>
            </>
          )}
        </div>
        
        {/* Flow Categories Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-800 rounded-lg p-5 hover:bg-gray-900/80 transition">
            <h3 className="text-lg font-semibold text-white mb-2">SDK Lifecycle Flows</h3>
            <p className="text-gray-300 text-sm mb-3">
              SDK initialization, connection, and lifecycle management patterns for integration into your application.
            </p>
            <ul className="text-accent text-sm space-y-1">
              <li>• SDK Initialization</li>
              <li>• Wallet Connection</li>
              <li>• Error Handling</li>
              <li>• Session Management</li>
            </ul>
            <Link href="/docs/sdk" className="mt-4 text-accent text-sm hover:text-accent/80 flex items-center">
              View SDK Flows
              <svg xmlns="http://www.w3.org/2000/svg" className="ml-1 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>

          <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-800 rounded-lg p-5 hover:bg-gray-900/80 transition">
            <h3 className="text-lg font-semibold text-white mb-2">User Journey Flows</h3>
            <p className="text-gray-300 text-sm mb-3">
              End-to-end user journeys through the platform, showing how users interact with your application.
            </p>
            <ul className="text-accent text-sm space-y-1">
              <li>• User Registration</li>
              <li>• Tribe Membership</li>
              <li>• Content Creation</li>
              <li>• Rewards & Collectibles</li>
            </ul>
            <Link href="/docs/user-flows" className="mt-4 text-accent text-sm hover:text-accent/80 flex items-center">
              View User Flows
              <svg xmlns="http://www.w3.org/2000/svg" className="ml-1 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>
        </div>
        
        {/* Flow Integration Patterns */}
        <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4 text-white">Best Practices</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-4">
              <h3 className="font-semibold text-accent mb-2">Error Handling</h3>
              <p className="text-sm text-gray-300">Always implement proper error handling with specific error codes for better user experience.</p>
              <Link href="/docs/error-codes" className="mt-3 text-xs text-accent hover:text-accent/80 flex items-center">
                Error Codes Reference →
              </Link>
            </div>
            
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-4">
              <h3 className="font-semibold text-accent mb-2">Optimistic Updates</h3>
              <p className="text-sm text-gray-300">Use optimistic UI updates to make your application feel responsive while transactions confirm.</p>
            </div>
            
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-4">
              <h3 className="font-semibold text-accent mb-2">Authentication</h3>
              <p className="text-sm text-gray-300">Cache authentication state securely to provide a seamless user experience across sessions.</p>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
} 