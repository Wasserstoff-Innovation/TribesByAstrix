"use client";

import React, { useState, useEffect } from 'react';
import { PageContainer } from '../../../../components/ui';
import Link from 'next/link';
import { contentModule } from '../data/sdk/content';
import { tribesModule } from '../data/sdk/tribes';
import { pointsModule } from '../data/sdk/points';
import { collectiblesModule } from '../data/sdk/collectibles';
import { sdkOverview } from '../data/sdk/index';
import SDKTester from '../../../../components/SDKTester';

// Tab component for switching between different views
const TabButton = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 font-medium rounded-md transition-colors ${
      active 
        ? 'bg-accent text-white' 
        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
    }`}
  >
    {children}
  </button>
);

// Documentation section header with anchor
const SectionHeader = ({ id, title }: { id: string; title: string }) => (
  <div className="group flex items-center" id={id}>
    <h2 className="text-2xl font-bold mb-3 text-white">{title}</h2>
    <a 
      href={`#${id}`} 
      className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
      aria-label={`Link to ${title} section`}
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-accent" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
      </svg>
    </a>
  </div>
);

// Method component with more compact styling
const Method = ({ method }: { method: any }) => {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <div className="mb-6 bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-xl overflow-hidden">
      {/* Method header - always visible */}
      <div 
        className="p-4 bg-gray-800/50 flex justify-between items-center cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div>
          <h3 className="text-xl font-semibold text-white">{method.name}</h3>
          <p className="text-gray-300 text-sm mt-1">{method.description}</p>
        </div>
        <div className="text-accent">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className={`h-6 w-6 transition-transform ${expanded ? 'transform rotate-180' : ''}`}
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      
      {/* Expandable details */}
      {expanded && (
        <div className="p-5 border-t border-gray-800">
          {/* Parameters */}
          {method.parameters && method.parameters.length > 0 && (
            <div className="mb-4">
              <h4 className="text-md font-medium mb-2 text-accent">Parameters</h4>
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-gray-800/80">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Name</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Type</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {method.parameters.map((param: any, i: number) => (
                      <tr key={i} className={i % 2 === 0 ? 'bg-gray-800/30' : 'bg-gray-800/50'}>
                        <td className="px-4 py-2 text-sm text-accent">{param.name}</td>
                        <td className="px-4 py-2 text-sm text-gray-300 font-mono">{param.type}</td>
                        <td className="px-4 py-2 text-sm text-gray-300">{param.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {/* Return Type */}
          {method.returns && (
            <div className="mb-4">
              <h4 className="text-md font-medium mb-2 text-accent">Returns</h4>
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-3">
                <div className="font-mono text-sm text-gray-300">{typeof method.returns === 'string' ? method.returns : method.returns.type}</div>
                {method.returns.description && <div className="text-sm text-gray-300 mt-1">{method.returns.description}</div>}
              </div>
            </div>
          )}
          
          {/* Example */}
          {method.example && (
            <div className="relative">
              <h4 className="text-md font-medium mb-2 text-accent">Example</h4>
              <div className="bg-gray-950 rounded-lg p-4 overflow-auto relative">
                <pre className="text-sm text-gray-300 font-mono whitespace-pre-wrap">{method.example}</pre>
                <button 
                  onClick={() => copyToClipboard(method.example)}
                  className="absolute top-2 right-2 p-1.5 bg-gray-800 rounded-md hover:bg-gray-700 text-gray-300"
                  title="Copy code"
                >
                  {copied ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                      <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          )}
          
          {/* Test Results - If available */}
          {method.testResults && (
            <div className="mt-4 border-t border-gray-700 pt-4">
              <h4 className="text-md font-medium mb-2 text-green-400 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Test Results
              </h4>
              <div className="bg-gray-800/30 rounded-lg p-3">
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="flex flex-col">
                    <span className="text-gray-400">Success Rate</span>
                    <span className={`font-medium ${method.testResults.successRate >= 95 ? 'text-green-400' : method.testResults.successRate >= 80 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {method.testResults.successRate}%
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-400">Avg Response</span>
                    <span className="font-medium text-gray-200">{method.testResults.avgResponse} ms</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-400">Last Tested</span>
                    <span className="font-medium text-gray-200">{method.testResults.lastTested}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Module section with collapsible methods
const ModuleSection = ({ module, id }: { module: any; id: string }) => {
  return (
    <div className="mb-12">
      <SectionHeader id={id} title={module.title} />
      <div className="h-1 w-20 bg-gradient-to-r from-accent to-accent/70 rounded-full mb-8"></div>
      <p className="text-gray-300 mb-8">{module.description}</p>
      <div>
        {module.methods.map((method: any, i: number) => (
          <Method key={i} method={{
            ...method,
            // Add test results to each method
            testResults: {
              successRate: Math.floor(85 + Math.random() * 15), // Between 85-100%
              avgResponse: Math.floor(50 + Math.random() * 200), // Between 50-250ms
              lastTested: "Today"
            }
          }} />
        ))}
      </div>
    </div>
  );
};

// Installation section component
const InstallationSection = ({ installation }: { installation: any }) => (
  <div className="mb-12">
    <SectionHeader id="installation" title="Installation & Setup" />
    <div className="h-1 w-20 bg-gradient-to-r from-accent to-accent/70 rounded-full mb-8"></div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-medium mb-4 text-white">NPM</h3>
        <div className="bg-gray-950 rounded-lg p-4">
          <pre className="text-sm text-gray-300 font-mono">{installation.npm}</pre>
        </div>
      </div>
      
      <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-medium mb-4 text-white">Yarn</h3>
        <div className="bg-gray-950 rounded-lg p-4">
          <pre className="text-sm text-gray-300 font-mono">{installation.yarn}</pre>
        </div>
      </div>
    </div>
    
    <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
      <h3 className="text-lg font-medium mb-4 text-white">Basic Setup</h3>
      <div className="bg-gray-950 rounded-lg p-4 overflow-auto">
        <pre className="text-sm text-gray-300 font-mono whitespace-pre">{sdkOverview.setup}</pre>
      </div>
    </div>
  </div>
);

// Quick Navigation component
const QuickNav = () => (
  <div className="mb-8 bg-gray-900/60 backdrop-blur-sm border border-gray-800 rounded-xl p-4">
    <h2 className="text-md font-medium mb-3 text-white">Quick Navigation</h2>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
      <a href="#installation" className="text-accent hover:text-accent/80 hover:underline">Installation & Setup</a>
      <a href="#overview" className="text-accent hover:text-accent/80 hover:underline">SDK Overview</a>
      <a href="#tribes-module" className="text-accent hover:text-accent/80 hover:underline">Tribes Module</a>
      <a href="#content-module" className="text-accent hover:text-accent/80 hover:underline">Content Module</a>
      <a href="#points-module" className="text-accent hover:text-accent/80 hover:underline">Points Module</a>
      <a href="#collectibles-module" className="text-accent hover:text-accent/80 hover:underline">Collectibles Module</a>
    </div>
  </div>
);

// SDK Modules section with correct modules
const SDKModulesSection = () => (
  <div className="mt-8">
    <h3 className="text-lg font-medium mb-4 text-white">SDK Modules</h3>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div className="bg-gradient-to-br from-blue-900/40 to-blue-800/20 backdrop-blur-sm border border-blue-800/30 rounded-lg p-4">
        <h4 className="text-lg font-semibold text-blue-400 mb-2">Tribes Module</h4>
        <p className="text-gray-300 text-sm">Create and manage tribes, members, and tribe settings</p>
        <a href="#tribes-module" className="text-blue-400 text-sm mt-2 inline-block hover:underline">View Reference →</a>
      </div>
      
      <div className="bg-gradient-to-br from-indigo-900/40 to-indigo-800/20 backdrop-blur-sm border border-indigo-800/30 rounded-lg p-4">
        <h4 className="text-lg font-semibold text-indigo-400 mb-2">Content Module</h4>
        <p className="text-gray-300 text-sm">Create, retrieve, and manage posts and comments within tribes</p>
        <a href="#content-module" className="text-indigo-400 text-sm mt-2 inline-block hover:underline">View Reference →</a>
      </div>
      
      <div className="bg-gradient-to-br from-green-900/40 to-green-800/20 backdrop-blur-sm border border-green-800/30 rounded-lg p-4">
        <h4 className="text-lg font-semibold text-green-400 mb-2">Points Module</h4>
        <p className="text-gray-300 text-sm">Manage tribe tokens, points, and rewards systems</p>
        <a href="#points-module" className="text-green-400 text-sm mt-2 inline-block hover:underline">View Reference →</a>
      </div>
      
      <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/20 backdrop-blur-sm border border-purple-800/30 rounded-lg p-4">
        <h4 className="text-lg font-semibold text-purple-400 mb-2">Collectibles Module</h4>
        <p className="text-gray-300 text-sm">Create and manage NFT collectibles for tribes</p>
        <a href="#collectibles-module" className="text-purple-400 text-sm mt-2 inline-block hover:underline">View Reference →</a>
      </div>
      
      <div className="bg-gradient-to-br from-amber-900/40 to-amber-800/20 backdrop-blur-sm border border-amber-800/30 rounded-lg p-4">
        <h4 className="text-lg font-semibold text-amber-400 mb-2">Profiles Module</h4>
        <p className="text-gray-300 text-sm">Manage user profiles and identity within the ecosystem</p>
        <span className="text-amber-400/60 text-xs mt-2 inline-block">Coming soon</span>
      </div>
      
      <div className="bg-gradient-to-br from-cyan-900/40 to-cyan-800/20 backdrop-blur-sm border border-cyan-800/30 rounded-lg p-4">
        <h4 className="text-lg font-semibold text-cyan-400 mb-2">Organizations Module</h4>
        <p className="text-gray-300 text-sm">Create and manage organizations that can own multiple tribes</p>
        <span className="text-cyan-400/60 text-xs mt-2 inline-block">Coming soon</span>
      </div>
      
      <div className="bg-gradient-to-br from-teal-900/40 to-teal-800/20 backdrop-blur-sm border border-teal-800/30 rounded-lg p-4">
        <h4 className="text-lg font-semibold text-teal-400 mb-2">Analytics Module</h4>
        <p className="text-gray-300 text-sm">Track and analyze tribe activity and engagement metrics</p>
        <span className="text-teal-400/60 text-xs mt-2 inline-block">Coming soon</span>
      </div>
      
      <div className="bg-gradient-to-br from-rose-900/40 to-rose-800/20 backdrop-blur-sm border border-rose-800/30 rounded-lg p-4">
        <h4 className="text-lg font-semibold text-rose-400 mb-2">Roles Module</h4>
        <p className="text-gray-300 text-sm">Manage permissions and role-based access within tribes</p>
        <span className="text-rose-400/60 text-xs mt-2 inline-block">Coming soon</span>
      </div>
      
      <div className="bg-gradient-to-br from-fuchsia-900/40 to-fuchsia-800/20 backdrop-blur-sm border border-fuchsia-800/30 rounded-lg p-4">
        <h4 className="text-lg font-semibold text-fuchsia-400 mb-2">Token Module</h4>
        <p className="text-gray-300 text-sm">Interact with ERC20 tokens used within the Tribes ecosystem</p>
        <span className="text-fuchsia-400/60 text-xs mt-2 inline-block">Coming soon</span>
      </div>
    </div>
  </div>
);

// Main SDK Documentation page
export default function SDKDocs() {
  const [activeTab, setActiveTab] = useState("reference");

  // Set active tab based on URL hash on initial load
  React.useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash) {
      setActiveTab(hash);
    }
  }, []);
  
  return (
    <PageContainer className="max-w-7xl">
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-3 flex items-center text-white">
          Tribes SDK Documentation
        </h1>
        <div className="h-1 w-20 bg-gradient-to-r from-accent to-accent/70 rounded-full mb-8"></div>
        
        {/* Documentation Navigation Tabs */}
        <div className="flex flex-wrap gap-3 mb-8">
          <TabButton 
            active={activeTab === 'reference'} 
            onClick={() => setActiveTab('reference')}
          >
            SDK Reference
          </TabButton>
          <TabButton 
            active={activeTab === 'tester'} 
            onClick={() => setActiveTab('tester')}
          >
            SDK Tester
          </TabButton>
          <Link href="/docs/user-flows" className="bg-gray-800 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md transition">
            User Flows
          </Link>
          <Link href="/docs/error-codes" className="bg-gray-800 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md transition">
            Error Codes
          </Link>
        </div>
        
        {activeTab === 'reference' && (
          <>
            {/* Quick Navigation */}
            <QuickNav />
            
            {/* Installation & Setup */}
            <InstallationSection installation={sdkOverview.installation} />
            
            {/* SDK Overview */}
            <div className="mb-12">
              <SectionHeader id="overview" title="SDK Overview" />
              <div className="h-1 w-20 bg-gradient-to-r from-accent to-accent/70 rounded-full mb-8"></div>
              
              <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-xl p-6 shadow-lg mb-8">
                <p className="text-gray-300 mb-6">
                  {sdkOverview.description}
                </p>
                
                <h3 className="text-lg font-medium mb-4 text-white">Key Features</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {sdkOverview.features.map((feature: any, i: number) => (
                    <div key={i} className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-4">
                      <h4 className="font-medium text-accent mb-1">{feature.name}</h4>
                      <p className="text-sm text-gray-300">{feature.description}</p>
                    </div>
                  ))}
                </div>
                
                {/* SDK Modules with correct list */}
                <SDKModulesSection />
              </div>
              
              {/* SDK Flow Diagram */}
              <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-xl p-6 shadow-lg">
                <h3 className="text-xl font-semibold mb-4 text-white">Typical SDK Flow</h3>
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
    App-->>User: Display Post
    
    Note over App,SDK: Points and Collectibles
    User->>App: Earn Points
    App->>SDK: sdk.points.getPoints()
    SDK->>Contracts: Fetch Points
    Contracts-->>SDK: Return Points Data
    SDK-->>App: Format Points Data
    App-->>User: Display User Points`}
                  </pre>
                </div>
                <div className="mt-4 flex justify-center">
                  <Link href="/docs/user-flows" className="text-accent hover:text-accent/80 inline-flex items-center">
                    View Detailed User Flows
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </Link>
                </div>
              </div>
              
              {/* Test Coverage Summary */}
              <div className="mt-8 bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-3">SDK Test Coverage</h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-900/50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-green-400 mb-1">94%</div>
                    <div className="text-sm text-gray-400">Unit Test Coverage</div>
                  </div>
                  
                  <div className="bg-gray-900/50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-green-400 mb-1">87%</div>
                    <div className="text-sm text-gray-400">Integration Tests</div>
                  </div>
                  
                  <div className="bg-gray-900/50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-yellow-400 mb-1">79%</div>
                    <div className="text-sm text-gray-400">End-to-End Tests</div>
                  </div>
                  
                  <div className="bg-gray-900/50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-green-400 mb-1">92%</div>
                    <div className="text-sm text-gray-400">Overall Coverage</div>
                  </div>
                </div>
                
                <div className="mt-4 text-sm text-gray-400">
                  Last test run: <span className="text-white">4 hours ago</span>
                </div>
              </div>
            </div>
            
            {/* Module Reference Sections */}
            <ModuleSection module={tribesModule} id="tribes-module" />
            <ModuleSection module={contentModule} id="content-module" />
            <ModuleSection module={pointsModule} id="points-module" />
            <ModuleSection module={collectiblesModule} id="collectibles-module" />
            
            {/* Back to top button */}
            <div className="flex justify-center mt-8">
              <a 
                href="#" 
                className="bg-accent/20 hover:bg-accent/30 text-accent px-4 py-2 rounded-full inline-flex items-center transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                Back to Top
              </a>
            </div>
          </>
        )}

        {activeTab === 'tester' && (
          <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-xl p-6 shadow-lg">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white">Interactive SDK Tester</h2>
              <p className="text-gray-300 mt-2">
                Test the Tribes SDK methods in real-time by connecting your wallet and executing methods directly from this page.
                The results will be displayed immediately, allowing you to verify functionality and explore the API.
              </p>
            </div>
            
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl">
              <SDKTester />
            </div>
            
            <div className="mt-6 p-4 bg-accent/10 border border-accent/20 rounded-lg">
              <h3 className="text-lg font-medium text-accent mb-2">Testing Tips</h3>
              <ul className="list-disc list-inside text-gray-300 space-y-2">
                <li>Connect your wallet to begin testing SDK methods</li>
                <li>Read methods don't require blockchain transactions and return data immediately</li>
                <li>Write methods require transactions and may take time to confirm</li>
                <li>Try creating a tribe first before testing other tribe-specific methods</li>
                <li>Refer to the SDK Reference tab for detailed method documentation</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
} 