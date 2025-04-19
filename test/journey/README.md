# Comprehensive User Journey Tests

This document outlines the combined user flows simulated and verified across the various journey tests in this directory. All tests are confirmed to be passing.

## Overall Flow

The tests cover a wide range of user interactions within a decentralized social platform, simulating the lifecycle from initial setup and user onboarding to advanced content creation, community management, and feature-specific interactions like events, projects, and fundraisers.

```mermaid
graph TD
    A[Start: Setup & Deployment] --> B(Role Management);
    B --> C{User Actions};
    B --> D{Admin/Creator Actions};

    subgraph User Actions
        direction LR
        C --> C1(Create Profile);
        C1 --> C2(Update Profile);
        C --> C3(Join Tribe);
        C3 --> C4(Interact with Post);
        C4 --> C5(Like/Comment);
        C4 --> C6(Report Post);
        C --> C7(Purchase Collectible);
        C7 -- Gating --> C8(View Gated Post);
        C --> C9(Purchase Event Ticket);
        C9 --> C10(Transfer Ticket);
        C --> C11(Simulated Fundraiser Contribution - Like);
        C --> C12(Simulated Milestone Action - Start/Submit);
    end

    subgraph Admin/Creator Actions
        direction LR
        D --> D1(Create Tribe);
        D1 --> D2(Update Tribe Config);
        D1 --> D3(Manage Members - Ban/Approve);
        D1 --> D4(Create Invite Code);
        D --> D5(Create Collectible);
        D5 --> D6(Update/Deactivate Collectible);
        D5 --> D7(Set Points Requirement);
        D --> D8(Create Post);
        D8 --> D9(Create Public Post);
        D8 --> D10(Create Gated Post);
        D8 --> D11(Create Encrypted Post);
        D8 --> D12(Create Specialized Post);
        D12 --> D12a(Community Update);
        D12 --> D12b(Event);
        D12 --> D12c(Project);
        D12 --> D12d(Poll);
        D12 --> D12e(Resource);
        D12 --> D12f(Rich Media);
        D12 --> D12g(Milestone);
        D12 --> D12h(Fundraiser);
        D8 --> D13(Delete Post);
        D8 --> D14(Create Project Update);
        D --> D15(Award Points);
        D --> D16(Create Event);
        D16 --> D17(Update/Cancel Event);
        D --> D18(Create Project - ProjectController);
        D18 --> D19(Manage Project Team);
        D18 --> D20(Manage Milestones - Approve/Reject);
    end

    subgraph System Checks
        direction LR
        S1(Metadata Validation) -- Checks --> D8;
        S2(Access Control/Permissions) -- Checks --> C;
        S2 -- Checks --> D;
        S3(Rate Limiting/Cooldown) -- Checks --> D8;
        S3 -- Checks --> C4;
        S4(Supply Limits - Collectible/Event) -- Checks --> C7;
        S4 -- Checks --> C9;
        S5(NFT/Points Gating) -- Checks --> C3;
        S5 -- Checks --> C7;
        S6(Concurrency Handling) -- Checks --> C7;
    end

    C4 --> S3;
    D8 --> S1;
    D8 --> S3;
    C --> S2;
    D --> S2;
    C3 --> S5;
    C7 --> S4;
    C7 --> S5;
    C7 --> S6;
    C9 --> S4;
```

## Key Flows Tested

1.  **Setup & Roles:** Deployment of all core contracts (`RoleManager`, `TribeController`, `ProfileNFTMinter`, `PostMinter`, `CollectibleController`, `PointSystem`, `EventController`, `ProjectController`, `PostFeedManager`) and assignment of granular roles (Admin, Moderator, Creator, Organizer, Reviewer, etc.).
2.  **User Profiles:** Creation, validation (username rules, duplicates), metadata updates, and ownership verification.
3.  **Tribe Lifecycle:**
    *   **Creation:** Public, Private (with fee), Invite-Only, Invite Code, NFT-Gated tribes.
    *   **Configuration:** Updating join type, fees, NFT requirements, metadata, admin lists.
    *   **Membership:** Joining (direct, request/approval, invite code, NFT gate), banning/unbanning members, checking status. Access control enforcement for management actions.
4.  **Collectibles:**
    *   **Creation:** Standard, free, points-required, limited supply.
    *   **Management:** Deactivation, updates (implicitly via PostMinter gating).
    *   **Claiming:** Purchasing with ETH, claiming for free, claiming with points. Enforcement of supply limits, points requirements, and active status. Concurrent claim handling tested.
5.  **Posts:**
    *   **Creation:** Basic text, with attachments, encrypted, gated (by collectible), Community Updates, Events, Projects, Polls, Resources, Rich Media, Milestones, Fundraisers. Validation of metadata format and required fields. Rate limiting enforcement.
    *   **Interaction:** Liking, commenting, reporting. Prevention of self-interaction and duplicate reports.
    *   **Management:** Deletion by creator/moderator. Access control checks (banned users, non-members).
    *   **Gating Access:** Verifying users with required collectibles can view gated posts.
    *   **Encrypted Access:** Authorizing viewers for encrypted posts.
6.  **Feeds:** Retrieving posts by tribe and by user, verifying pagination and chronological order.
7.  **Events (`EventController`):**
    *   **Creation:** Physical, virtual, hybrid events with detailed metadata, capacity, and ticket types/pricing.
    *   **Tickets:** Purchase (handling payment/refunds), supply limit enforcement, transfer (with re-transfer prevention).
    *   **Management:** Metadata updates, event cancellation (preventing further ticket sales). Role enforcement (only organizers manage events).
8.  **Projects & Grants (`PostMinter` Project type & `ProjectController`):**
    *   **Creation:** Creating "PROJECT" posts via `PostMinter` with budget, duration, milestones, team roles/permissions. Validating and creating corresponding `ProjectController` entries.
    *   **Updates:** Creating "PROJECT_UPDATE" posts for status changes and milestone submissions/reviews.
    *   **Team Management (`ProjectController`):** Adding/removing members (creator only).
    *   **Milestone Management (`ProjectController`):** Starting milestones, submitting deliverables, reviewer approval/rejection. Dependency checking enforced. Access control for team members vs. reviewers.
9.  **Fundraisers (`PostMinter` Fundraiser type):**
    *   **Creation:** Defining target amounts, currencies, durations, contribution slabs.
    *   **Contribution:** Simulated via post interactions (likes). Tracking interactions. Access control (banned members). Handling deleted fundraisers.
10. **Points System:** Awarding points for engagement, using points as a requirement for claiming collectibles.
11. **Concurrency & Scalability:** Simulating multiple users claiming collectibles concurrently, testing supply limit enforcement under load.
12. **Error Handling:** Explicit tests for invalid inputs, insufficient permissions, rate limits, unmet requirements (fees, NFTs, points), duplicate actions, interacting with deleted content, etc., across various modules.

This comprehensive suite ensures that the core user journeys and interactions function correctly according to the defined rules and access controls. 