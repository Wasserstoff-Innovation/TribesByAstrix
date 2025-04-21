# System Architecture

This document provides a visual representation of the Tribes by Astrix system architecture using Mermaid diagrams, showing how the various components interact.

## Contract Architecture

```mermaid
flowchart TD
    User[User/Client] --> SDK[JavaScript SDK]
    SDK --> Provider[Web3 Provider]
    Provider --> Blockchain[Monad Blockchain]
    
    subgraph Core Contracts
        RM[RoleManager]
        TC[TribeController]
        PS[PointSystem]
        CC[CollectibleController]
        PFM[PostFeedManager]
        PM[PostMinter]
        EC[EventController]
    end
    
    RM -.-> TC
    RM -.-> PS
    RM -.-> CC
    RM -.-> PM
    RM -.-> EC
    
    TC -.-> PS
    TC -.-> CC
    TC -.-> PFM
    
    CC -.-> PS
    
    PM -.-> TC
    PM -.-> CC
    PM -.-> PFM
    
    EC -.-> RM
    
    Blockchain --> RM
    Blockchain --> TC
    Blockchain --> PS
    Blockchain --> CC
    Blockchain --> PFM
    Blockchain --> PM
    Blockchain --> EC
```

## SDK Architecture

```mermaid
flowchart TD
    App[Client Application] --> SDK[AstrixSDK]
    
    subgraph SDK_Modules [SDK Modules]
        TM[Token Module]
        PTM[Points Module]
        TBM[Tribes Module]
        PFM[Profiles Module]
        CM[Content Module]
        OM[Organizations Module]
        AM[Analytics Module]
    end
    
    subgraph Core_Services [Core Services]
        Cache[Caching Layer]
        ErrorH[Error Handling]
        Utils[Utilities]
        Config[Configuration]
    end
    
    SDK --> TM
    SDK --> PTM
    SDK --> TBM
    SDK --> PFM
    SDK --> CM
    SDK --> OM
    SDK --> AM
    
    TM --> Contracts[Smart Contracts]
    PTM --> Contracts
    TBM --> Contracts
    PFM --> Contracts
    CM --> Contracts
    OM --> Contracts
    AM --> Contracts
    
    SDK --> Cache
    SDK --> ErrorH
    SDK --> Utils
    SDK --> Config
    
    TM --> Cache
    TM --> ErrorH
    TM --> Utils
    TM --> Config
    PTM --> Cache
    PTM --> ErrorH
    PTM --> Utils
    PTM --> Config
    TBM --> Cache
    TBM --> ErrorH
    TBM --> Utils
    TBM --> Config
    PFM --> Cache
    PFM --> ErrorH
    PFM --> Utils
    PFM --> Config
    CM --> Cache
    CM --> ErrorH
    CM --> Utils
    CM --> Config
    OM --> Cache
    OM --> ErrorH
    OM --> Utils
    OM --> Config
    AM --> Cache
    AM --> ErrorH
    AM --> Utils
    AM --> Config
```

## User Authentication Flow

```mermaid
sequenceDiagram
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
    SDK->>SDK: Set Signer to Modules
    SDK-->>App: Connection Successful
    App-->>User: Show Connected UI
    
    User->>App: Perform Action
    App->>SDK: Call Module Method
    SDK->>Wallet: Sign Transaction
    Wallet->>User: Prompt for Signature
    User->>Wallet: Approve Signature
    Wallet-->>SDK: Return Signed Transaction
    SDK->>Contracts: Submit Transaction
    Contracts-->>SDK: Return Transaction Receipt
    SDK-->>App: Return Result
    App-->>User: Show Success/Failure
```

## Cache Invalidation Flow

```mermaid
flowchart TD
    A[User Action] --> B[SDK Method Call]
    B --> C[Check Cache]
    
    C -->|Cache Hit| D[Return Cached Data]
    C -->|Cache Miss| E[Fetch Fresh Data]
    
    E --> F[Store in Cache]
    F --> G[Return Data]
    
    H[State-Changing Action] --> I[SDK Write Method]
    I --> J[Smart Contract Call]
    J --> K[Transaction Success]
    
    K --> L{Invalidate Related Cache}
    L --> M[Pattern-Based Invalidation]
    L --> N[Key-Specific Invalidation]
    
    M --> O[Clear Matching Keys]
    N --> P[Clear Specific Key]
    
    O --> Q[Next User Action Gets Fresh Data]
    P --> Q
```

## Tribe Creation and Management Flow

```mermaid
flowchart TD
    A[Admin] --> B[Create Tribe]
    B --> C[Set Tribe Metadata]
    C --> D[Define Access Model]
    D --> E[Set Administrators]
    
    E --> F[Tribe Created]
    F --> G[Users Can Join]
    
    G --> H{Access Model}
    H -->|Public| I[Join Directly]
    H -->|Token Gated| J[Verify Token Ownership]
    H -->|Invite Only| K[Verify Invite]
    
    J -->|Has Token| I
    J -->|No Token| L[Access Denied]
    
    K -->|Has Invite| I
    K -->|No Invite| L
    
    I --> M[User Joined Tribe]
    M --> N[Can Create Content]
    M --> O[Can Participate in Events]
    M --> P[Can Join Fundraisers]
```

## Event and Fundraiser Integration

```mermaid
flowchart TD
    A[Tribe] --> B[Create Event]
    A --> C[Create Fundraiser]
    
    B --> D[Event Created]
    C --> E[Fundraiser Created]
    
    D --> F[Sell Tickets]
    E --> G[Accept Contributions]
    
    F --> H[Generate Revenue]
    G --> I[Generate Funds]
    
    H --> J[Distribute to Tribe Treasury]
    I --> J
    
    J --> K[Fund Tribe Activities]
    K --> L[Grow Tribe Ecosystem]
    L --> A
``` 