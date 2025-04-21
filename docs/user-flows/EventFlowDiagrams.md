# Event Flow Diagrams

This document provides visual representations of the key user flows in the event management system using Mermaid diagrams.

## Setup Flow

```mermaid
flowchart TD
    A[Admin] --> B[Deploy Contracts]
    B --> C[Assign Roles]
    C --> D[Create Test Tribe]
    D --> E[Users Join Tribe]

    subgraph Contracts
        B1[RoleManager]
        B2[TribeController]
        B3[PointSystem]
        B4[CollectibleController]
        B5[EventController]
    end

    subgraph Roles
        C1[Admin Role]
        C2[Moderator Role]
        C3[Organizer Role]
    end

    B --> Contracts
    C --> Roles
```

## Event Creation Flows

### Physical Event Creation

```mermaid
flowchart TD
    A[Event Organizer] --> B[Design Physical Meetup]
    B --> C[Set Dates & Location]
    C --> D[Define Capacity & Coordinates]
    D --> E[Establish Ticket Types]
    E --> F[Submit Event]
    
    F --> G{Valid Organizer?}
    G -->|Yes| H[Store Event Data]
    G -->|No| I[Error: Not Organizer]
    
    H --> J[Emit EventCreated Event]
    J --> K[Assign Event ID]

    subgraph Event Details
        C1[Start Date]
        C2[End Date]
        C3[Location Type: PHYSICAL]
        C4[Venue Address]
        C5[GPS Coordinates]
    end

    subgraph Ticket Config
        E1[Ticket Types]
        E2[Maximum Supply]
        E3[Price Per Ticket]
        E4[Wallet Limits]
    end

    C --> Event Details
    E --> Ticket Config
```

### Event Metadata Validation

```mermaid
flowchart TD
    A[Organizer] --> B[Submit Different Metadata Types]
    B --> C1[Valid JSON Metadata]
    B --> C2[Empty Metadata String]
    B --> C3[Zero Values for Parameters]
    
    C1 --> D1[System Accepts]
    C2 --> D2[System Accepts]
    C3 --> D3[System Accepts]
    
    E[Regular User] --> F[Submit Event]
    F --> G{Check Role}
    G -->|Not Organizer| H[Reject: Not Organizer]
    G -->|Organizer| I[Allow Creation]
```

## Ticket Purchase and Management Flows

### Hybrid Event Setup

```mermaid
flowchart TD
    A[Organizer] --> B[Create Hybrid Event]
    
    B --> C[Define Location Types]
    C --> C1[Physical Venue]
    C --> C2[Virtual URL]
    
    B --> D[Set Capacity]
    D --> D1[Physical: 100]
    D --> D2[Virtual: 200]
    
    B --> E[Define Ticket Types]
    E --> E1[Virtual Tickets]
    E --> E2[Physical Tickets]
    
    E1 --> F1[Virtual Price: 0.1 ETH]
    E2 --> F2[Physical Price: 0.2 ETH]
    
    B --> G[Submit Event]
    G --> H[System Assigns Event ID]
```

### Standard Ticket Purchase

```mermaid
flowchart TD
    A[Regular User] --> B[View Event Details]
    B --> C[Purchase 2 Tickets]
    C --> D[Send Payment: 0.2 ETH]
    
    D --> E{Payment Valid?}
    E -->|Yes| F[Process Purchase]
    E -->|No| G[Reject Purchase]
    
    F --> H[Emit TicketPurchased Event]
    H --> I[Update User Ticket Balance]
    I --> J[User Verifies Ownership]
```

### Payment Processing and Refunds

```mermaid
flowchart TD
    A[User] --> B[Purchase 1 Ticket]
    B --> C[Send Excess Payment: 0.2 ETH]
    
    C --> D[Process Purchase: 0.1 ETH]
    D --> E[Calculate Refund Amount]
    E --> F[Automatically Refund 0.1 ETH]
    
    F --> G[User Receives Ticket]
    F --> H[User Receives Refund]
```

### Ticket Supply Enforcement

```mermaid
flowchart TD
    A[User] --> B[Attempt to Purchase 301 Tickets]
    B --> C[Event Capacity: 300]
    
    C --> D{Check Supply}
    D -->|Exceeds Capacity| E[Reject: Not Enough Tickets]
    D -->|Within Capacity| F[Allow Purchase]
    
    E --> G[No Tickets Issued]
    E --> H[Payment Returned]
```

### Payment Validation

```mermaid
flowchart TD
    A[User] --> B[Attempt to Purchase 2 Tickets]
    B --> C[Send Insufficient Payment: 0.1 ETH]
    C --> D[Required: 0.2 ETH]
    
    D --> E{Payment Sufficient?}
    E -->|No| F[Reject: Insufficient Payment]
    E -->|Yes| G[Process Purchase]
    
    F --> H[No Tickets Issued]
    F --> I[Payment Returned]
```

### Ticket Transfer

```mermaid
flowchart TD
    A[User 1] --> B[Purchase Ticket]
    B --> C[User 1 Decides to Transfer]
    C --> D[Initiate NFT Transfer to User 2]
    
    D --> E[System Processes Transfer]
    E --> F[Update Ownership Records]
    F --> G[Flag Ticket as Transferred]
    
    G --> H[User 2 Receives Ticket]
    H --> I[User 2 Attempts Second Transfer]
    
    I --> J{Already Transferred?}
    J -->|Yes| K[Reject: Already Transferred Once]
    J -->|No| L[Allow Transfer]
    
    K --> M[Ticket Stays with User 2]
```

## Event Management Flows

### Event Metadata Updates

```mermaid
flowchart TD
    A[Organizer] --> B[Create Initial Event]
    B --> C[Need to Update Details]
    C --> D[Submit Updated Metadata]
    
    D --> E{Is Original Organizer?}
    E -->|Yes| F[Update Stored Metadata]
    E -->|No| G[Reject: Not Event Organizer]
    
    F --> H[Changes Visible to Users]
```

### Event Cancellation

```mermaid
flowchart TD
    A[Organizer] --> B[Decide to Cancel Event]
    B --> C[Call Cancel Function]
    
    C --> D{Is Original Organizer?}
    D -->|Yes| E[Set Event to Inactive]
    D -->|No| F[Reject: Not Event Organizer]
    
    E --> G[Event Marked as Canceled]
    G --> H[Prevent New Ticket Purchases]
    
    I[User] --> J[Attempt to Buy Tickets]
    J --> K{Event Active?}
    K -->|No| L[Reject: Event Not Active]
    K -->|Yes| M[Allow Purchase]
``` 