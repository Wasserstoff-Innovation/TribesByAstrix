import React from 'react';
import { PageContainer } from '../../../components/ui';

// UI Flow diagrams for key SDK flows with color theme matching the app's design
export default function SDKFlows() {
  return (
    <PageContainer className="max-w-7xl">
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-3 flex items-center text-white">
          SDK User Flows
        </h1>
        <div className="h-1 w-20 bg-gradient-to-r from-accent to-accent/70 rounded-full mb-8"></div>
        
        <p className="text-gray-200 mb-8">
          These diagrams illustrate the key flows and interactions between users, frontend applications, 
          the Tribes SDK, and smart contracts. Use these as a reference for implementing features in your application.
        </p>

        <div className="grid grid-cols-1 gap-10">
          
          {/* User Authentication Flow */}
          <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-xl p-8">
            <h2 className="text-2xl font-semibold mb-6 text-white">User Authentication Flow</h2>
            <div className="mb-6">
              <p className="text-gray-300">The authentication process connects a user's wallet to access platform features.</p>
            </div>
            <div className="bg-gray-950 p-6 rounded-lg border border-gray-800 overflow-auto">
              <pre className="text-sm text-gray-300 whitespace-pre">
{`sequenceDiagram
    %% Define custom styles with accent colors
    %%{init: {
      'theme': 'dark',
      'themeVariables': {
        'primaryColor': '#212836',
        'primaryTextColor': '#F3F4F6',
        'primaryBorderColor': '#374151',
        'lineColor': '#4F46E5',
        'secondaryColor': '#1F2937',
        'tertiaryColor': '#111827'
      }
    }}%%
    
    actor User
    participant App as Web App
    participant SDK as Astrix SDK
    participant Wallet as Web3 Wallet
    participant Contracts as Smart Contracts
    
    User->>App: Access App
    App->>SDK: Initialize SDK
    SDK->>Contracts: Fetch Contract Addresses
    Contracts-->>SDK: Return Addresses
    
    User->>App: Click "Connect Wallet"
    App->>SDK: Request Connect
    SDK->>Wallet: Request Connection
    Wallet->>User: Prompt for Approval
    User->>Wallet: Approve Connection
    Wallet-->>SDK: Return Signer
    
    Note over App,SDK: User now authenticated
    
    App->>SDK: Call sdk.tribes.getTribeDetails()
    SDK->>Contracts: Read Contract Data
    Contracts-->>SDK: Return Tribe Data
    SDK-->>App: Return Formatted Data
    App->>User: Display Tribe Information`}
              </pre>
            </div>
          </div>

          {/* Tribe Creation Flow */}
          <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-xl p-8">
            <h2 className="text-2xl font-semibold mb-6 text-white">Tribe Creation Flow</h2>
            <div className="mb-6">
              <p className="text-gray-300">Creating a new tribe using the SDK with configuration options.</p>
            </div>
            <div className="bg-gray-950 p-6 rounded-lg border border-gray-800 overflow-auto">
              <pre className="text-sm text-gray-300 whitespace-pre">
{`sequenceDiagram
    actor Admin
    participant App as Web App
    participant SDK as Astrix SDK
    participant Wallet as Web3 Wallet
    participant Contracts as TribeController
    
    Admin->>App: Fill Tribe Creation Form
    App->>App: Validate Form Data
    
    Admin->>App: Submit Form
    App->>SDK: sdk.tribes.createTribe()
    SDK->>SDK: Validate Parameters
    
    SDK->>Wallet: Request Signature
    Wallet->>Admin: Prompt for Approval
    Admin->>Wallet: Approve Transaction
    Wallet-->>SDK: Return Signed TX
    
    SDK->>Contracts: createTribe()
    Note over Contracts: Contract stores tribe data
    Contracts-->>SDK: Emit TribeCreated Event
    SDK-->>App: Return New Tribe ID
    
    App->>Admin: Show Success Message
    App->>App: Redirect to Tribe Page`}
              </pre>
            </div>
          </div>

          {/* Content Posting Flow */}
          <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-xl p-8">
            <h2 className="text-2xl font-semibold mb-6 text-white">Content Posting Flow</h2>
            <div className="mb-6">
              <p className="text-gray-300">Creating and publishing content within a tribe.</p>
            </div>
            <div className="bg-gray-950 p-6 rounded-lg border border-gray-800 overflow-auto">
              <pre className="text-sm text-gray-300 whitespace-pre">
{`sequenceDiagram
    actor User
    participant App as Web App
    participant IPFS as IPFS Storage
    participant SDK as Astrix SDK
    participant Wallet as Web3 Wallet
    participant Contracts as PostMinter
    
    User->>App: Compose Post Content
    App->>App: Validate Content
    
    User->>App: Add Media (Optional)
    App->>IPFS: Upload Media
    IPFS-->>App: Return Media CID
    
    User->>App: Click Post
    App->>App: Prepare Metadata JSON
    
    App->>SDK: sdk.content.createPost()
    SDK->>Wallet: Request Signature
    Wallet->>User: Prompt for Approval
    User->>Wallet: Approve Transaction
    Wallet-->>SDK: Return Signed TX
    
    SDK->>Contracts: createPost()
    Contracts-->>SDK: Emit PostCreated Event
    SDK-->>App: Return Post ID
    
    App->>User: Show Success Message
    
    Note over App,SDK: Update Feed
    App->>SDK: sdk.content.getPostsByTribe()
    SDK->>Contracts: getPostsByTribe()
    Contracts-->>SDK: Return Post Data
    SDK-->>App: Return Formatted Posts
    App->>User: Display Updated Feed`}
              </pre>
            </div>
          </div>

          {/* Point System Flow */}
          <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-xl p-8">
            <h2 className="text-2xl font-semibold mb-6 text-white">Point System Flow</h2>
            <div className="mb-6">
              <p className="text-gray-300">Awarding and managing points for user actions.</p>
            </div>
            <div className="bg-gray-950 p-6 rounded-lg border border-gray-800 overflow-auto">
              <pre className="text-sm text-gray-300 whitespace-pre">
{`sequenceDiagram
    actor User
    participant App as Web App
    participant SDK as Astrix SDK
    participant Contracts as PointSystem
    
    User->>App: Perform Action (Comment)
    App->>SDK: sdk.content.interactWithPost()
    SDK->>Contracts: interactWithPost()
    
    Contracts->>Contracts: Emit Interaction Event
    
    Note over Contracts: Point System Listens
    
    Contracts->>Contracts: Award Points for Action
    Contracts->>Contracts: Update User Points
    
    App->>SDK: sdk.points.getPoints()
    SDK->>Contracts: getPoints()
    Contracts-->>SDK: Return Current Points
    SDK-->>App: Return Formatted Point Data
    
    App->>User: Show Points Animation
    App->>User: Update Points Display`}
              </pre>
            </div>
          </div>

          {/* Collectible Creation Flow */}
          <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-xl p-8">
            <h2 className="text-2xl font-semibold mb-6 text-white">Collectible Creation Flow</h2>
            <div className="mb-6">
              <p className="text-gray-300">Creating and distributing digital collectibles within tribes.</p>
            </div>
            <div className="bg-gray-950 p-6 rounded-lg border border-gray-800 overflow-auto">
              <pre className="text-sm text-gray-300 whitespace-pre">
{`sequenceDiagram
    actor Admin
    participant App as Web App
    participant Storage as Storage Service
    participant SDK as Astrix SDK
    participant Wallet as Web3 Wallet
    participant Contracts as CollectibleController
    
    Admin->>App: Fill Collectible Form
    
    Admin->>App: Upload Collectible Image
    App->>Storage: Store Image
    Storage-->>App: Return Image URI
    
    Admin->>App: Submit Form
    App->>SDK: sdk.collectibles.createCollectible()
    SDK->>Wallet: Request Signature
    Wallet->>Admin: Prompt for Approval
    Admin->>Wallet: Approve Transaction
    Wallet-->>SDK: Return Signed TX
    
    SDK->>Contracts: createCollectible()
    Contracts-->>SDK: Return Collectible Address
    SDK-->>App: Return Collectible Data
    
    App->>Admin: Show Success Message
    
    Note over Contracts: Members can now claim
    
    actor Member
    Member->>App: View Collectible
    App->>SDK: sdk.collectibles.getCollectibleDetails()
    SDK->>Contracts: getCollectibleDetails()
    Contracts-->>SDK: Return Details
    SDK-->>App: Display Details
    
    Member->>App: Claim Collectible
    App->>SDK: sdk.collectibles.mintCollectible()
    SDK->>Contracts: mintCollectible()
    Contracts->>Contracts: Verify Eligibility
    Contracts->>Contracts: Mint NFT to Member
    Contracts-->>SDK: Return Success
    SDK-->>App: Show Claim Success`}
              </pre>
            </div>
          </div>

          {/* Error Handling Flow */}
          <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-xl p-8">
            <h2 className="text-2xl font-semibold mb-6 text-white">Error Handling Flow</h2>
            <div className="mb-6">
              <p className="text-gray-300">How the SDK handles and reports errors from different sources.</p>
            </div>
            <div className="bg-gray-950 p-6 rounded-lg border border-gray-800 overflow-auto">
              <pre className="text-sm text-gray-300 whitespace-pre">
{`flowchart TD
    A[User Action] --> B[App Call]
    B --> C[SDK Method]
    
    C --> D{Input Validation}
    D -->|Valid| E[Contract Call]
    D -->|Invalid| F[Validation Error]
    
    E --> G{Contract Execution}
    G -->|Success| H[Return Result]
    G -->|Failure| I[Contract Error]
    
    F --> J[SDK Error Handler]
    I --> J
    
    J --> K[Create AstrixSDKError]
    K --> L[Return Error with Code]
    
    L --> M{Error Type}
    M -->|CONTRACT_ERROR| N[Show Contract Error]
    M -->|VALIDATION_ERROR| O[Show Validation Error]
    M -->|UNAUTHORIZED| P[Show Authentication Error]
    M -->|NETWORK_ERROR| Q[Show Network Error]
    
    N & O & P & Q --> R[Display User Friendly Message]
    R --> S[Log Error Details]`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
} 