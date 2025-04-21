# Fundraiser Flow Diagrams

This document provides visual representations of the key user flows in the fundraiser system using Mermaid diagrams.

## Setup Flow

```mermaid
flowchart TD
    A[Admin] --> B[Deploy Contracts]
    B --> C[Assign Roles]
    C --> D[Create Test Tribe]
    D --> E[Users Join Tribe]
    E --> F[Ban Problematic Member]

    subgraph Contracts
        B1[RoleManager]
        B2[TribeController]
        B3[PointSystem]
        B4[CollectibleController]
        B5[PostFeedManager]
        B6[PostMinter]
    end

    subgraph Roles
        C1[Admin Role]
        C2[Moderator Role]
        C3[Creator Role]
    end

    B --> Contracts
    C --> Roles
```

## Fundraiser Creation Flows

### Standard Fundraiser Creation

```mermaid
flowchart TD
    A[Fundraiser Creator] --> B[Design Community Project]
    B --> C[Set Funding Target & Duration]
    C --> D[Establish Contribution Tiers]
    D --> E[Add Supplementary Metadata]
    E --> F[Submit Fundraiser to Tribe]
    
    F --> G{Valid Creator?}
    G -->|Yes| H[Store Fundraiser Data]
    G -->|No| I[Error: Insufficient Access]
    
    H --> J[Emit PostCreated Event]
    J --> K[Notify Tribe Members]

    subgraph Contribution Tiers
        D1[Bronze: 50 ETH]
        D2[Silver: 100 ETH]
        D3[Gold: 200 ETH]
    end

    subgraph Metadata
        E1[Images]
        E2[Documents]
        E3[Website]
    end

    D --> Contribution Tiers
    E --> Metadata
```

### Multi-Currency Fundraiser Creation

```mermaid
flowchart TD
    A[Creator] --> B[Design Fundraisers]
    B --> C1[ETH Fundraiser]
    B --> C2[USDC Fundraiser]
    B --> C3[TRIBE_TOKEN Fundraiser]
    
    C1 --> D1[Submit with Cooldown]
    C2 --> D2[Submit with Cooldown]
    C3 --> D3[Submit with Cooldown]
    
    D1 --> E1[Store ETH Fundraiser]
    D2 --> E2[Store USDC Fundraiser]
    D3 --> E3[Store TRIBE_TOKEN Fundraiser]
    
    E1 --> F1[Emit PostCreated Event]
    E2 --> F2[Emit PostCreated Event]
    E3 --> F3[Emit PostCreated Event]
```

### Time-Flexible Fundraiser Creation

```mermaid
flowchart TD
    A[Creator] --> B[Design Fundraisers]
    B --> C1[One-Week Campaign]
    B --> C2[One-Month Campaign]
    B --> C3[Three-Month Campaign]
    
    C1 --> D1[Submit with Cooldown]
    C2 --> D2[Submit with Cooldown]
    C3 --> D3[Submit with Cooldown]
    
    D1 --> E1[Store 7-Day Fundraiser]
    D2 --> E2[Store 30-Day Fundraiser]
    D3 --> E3[Store 90-Day Fundraiser]
    
    E1 --> F1[Emit PostCreated Event]
    E2 --> F2[Emit PostCreated Event]
    E3 --> F3[Emit PostCreated Event]
```

## Contribution Flows

### Basic Contribution Tracking

```mermaid
flowchart TD
    A[Fundraiser Creator] --> B[Create Test Fundraiser]
    B --> C[System Assigns ID]
    C --> D[Contributor Interacts]
    D --> E[System Records Interaction]
    E --> F[Verify Interaction Count]
```

### Access Control for Contributions

```mermaid
flowchart TD
    A[Create Fundraiser] --> B[Banned Member Attempts Interaction]
    B --> C{Check Member Status}
    C -->|Banned| D[Reject with InsufficientAccess]
    C -->|Active| E[Allow Interaction]
    D --> F[Interaction Count Unchanged]
    E --> G[Increment Interaction Count]
```

### Deleted Fundraiser Protection

```mermaid
flowchart TD
    A[Create Fundraiser] --> B[Creator Deletes Fundraiser]
    B --> C[Mark as Deleted]
    C --> D[Contributor Attempts Interaction]
    D --> E{Check Fundraiser Status}
    E -->|Deleted| F[Reject with PostDeleted]
    E -->|Active| G[Allow Interaction]
    F --> H[No Interactions Recorded]
```

## Frontend Validation Rules

```mermaid
flowchart TD
    A[Frontend Validations] --> B[Date Validations]
    A --> C[Amount Validations]
    A --> D[Tier Validations]
    A --> E[Currency Validations]
    
    subgraph Date Rules
        B1[Start Date in Future]
        B2[Duration Between 1 Week - 3 Months]
    end
    
    subgraph Amount Rules
        C1[Target > 0]
        C2[Target Under Max Limit]
    end
    
    subgraph Tier Rules
        D1[At Least One Tier]
        D2[Amounts in Ascending Order]
        D3[No Duplicate Names]
        D4[All Amounts > 0]
    end
    
    subgraph Currency Rules
        E1[From Supported List]
        E2[Valid Contract if Token]
    end
    
    B --> Date Rules
    C --> Amount Rules
    D --> Tier Rules
    E --> Currency Rules
``` 