# Journey Tests

This directory contains end-to-end journey tests that validate complete user flows in the Tribes by Astrix platform.

## Overview

Journey tests are designed to simulate real user interactions with the platform, testing multiple contracts and components together as an integrated system. These tests validate that features work correctly from a user's perspective.

## Test Organization

The tests are organized by feature area:

- `tribe-journeys.test.ts` - Tests for tribe creation, joining, and management
- `points-journeys.test.ts` - Tests for the points system and rewards
- `content-journeys.test.ts` - Tests for content creation and interactions
- `event-journeys.test.ts` - Tests for event creation and ticket management
- `fundraiser-journeys.test.ts` - Tests for fundraiser creation and contributions

## Running Tests

To run all journey tests:

```bash
npm run test:journey
```

To run a specific journey test file:

```bash
npx hardhat test test/journey/tribe-journeys.test.ts
```

## Test Environment

The journey tests use:

1. A local Hardhat network
2. Fresh contract deployments for each test suite
3. Multiple user accounts to simulate different roles

## Writing New Journey Tests

When adding new journey tests:

1. Create test accounts for different user roles
2. Deploy necessary contracts
3. Execute a complete user flow (e.g., create tribe → join tribe → create content)
4. Validate the state after each step
5. Document the flow being tested in the test description

```mermaid
graph TD
    %% Main setup and entry points
    Setup[Setup & Deployment] --> Roles[Role Management]
    Roles --> UserActions[User Actions]
    Roles --> AdminActions[Admin/Creator Actions]
    
    %% User Actions Section - More vertical layout
    UserActions --> Profile[Profile Management]
    UserActions --> Community[Community Participation]
    UserActions --> ContentInter[Content Interaction]
    UserActions --> Purchase[Purchases & Claims]
    
    %% Profile Management details
    Profile --> CreateProfile[Create Profile]
    Profile --> UpdateProfile[Update Profile]
    
    %% Community Participation details
    Community --> JoinTribe[Join Tribe]
    Community --> RequestJoin[Request to Join Private Tribe]
    Community --> JoinWithCode[Join with Invite Code]
    
    %% Content Interaction details
    ContentInter --> LikeComment[Like/Comment]
    ContentInter --> ReportPost[Report Post]
    ContentInter --> ViewGated[View Gated Content]
    ContentInter --> ProjectAction[Project Actions]
    
    %% Project Actions sub-details
    ProjectAction --> StartMilestone[Start Milestone]
    ProjectAction --> SubmitDeliverable[Submit Deliverable]
    
    %% Purchases & Claims details
    Purchase --> BuyCollectible[Purchase Collectible]
    Purchase --> BuyTicket[Purchase Event Ticket]
    Purchase --> TransferTicket[Transfer Ticket]
    Purchase --> Contribute[Fundraiser Contribution]
    
    %% Admin Actions Section - More vertical layout
    AdminActions --> TribeManage[Tribe Management]
    AdminActions --> ContentCreation[Content Creation]
    AdminActions --> AssetManage[Asset Management]
    AdminActions --> ProjectManage[Project Management]
    
    %% Tribe Management details
    TribeManage --> CreateTribe[Create Tribe]
    TribeManage --> UpdateTribe[Update Tribe Config]
    TribeManage --> ManageMembers[Manage Members]
    TribeManage --> CreateInvite[Create Invite Code]
    
    %% Content Creation details
    ContentCreation --> BasicPost[Basic Posts]
    ContentCreation --> GatedPost[Gated Posts]
    ContentCreation --> SpecialPost[Specialized Posts]
    
    %% Basic Posts types
    BasicPost --> PublicPost[Public Post]
    BasicPost --> EncryptedPost[Encrypted Post]
    
    %% Specialized Posts types
    SpecialPost --> CommunityUpdate[Community Update]
    SpecialPost --> EventPost[Event Post]
    SpecialPost --> ProjectPost[Project Post]
    SpecialPost --> PollPost[Poll Post]
    SpecialPost --> ResourcePost[Resource Post]
    SpecialPost --> MediaPost[Rich Media Post]
    SpecialPost --> MilestonePost[Milestone Post]
    SpecialPost --> FundraiserPost[Fundraiser Post]
    
    %% Asset Management details
    AssetManage --> CreateCollectible[Create Collectible]
    AssetManage --> DeactivateCollectible[Deactivate Collectible]
    AssetManage --> CreateEvent[Create Event]
    AssetManage --> ManageEvent[Update/Cancel Event]
    AssetManage --> AwardPoints[Award Points]
    
    %% Project Management details
    ProjectManage --> CreateProject[Create Project]
    ProjectManage --> AddTeamMember[Add Team Member]
    ProjectManage --> ReviewMilestone[Review Milestone]
    
    %% System Checks - Grouped at bottom
    SystemChecks[System Checks] --> Validation[Metadata Validation]
    SystemChecks --> Access[Access Control]
    SystemChecks --> RateLimit[Rate Limiting]
    SystemChecks --> SupplyLimit[Supply Limits]
    SystemChecks --> Gating[NFT/Points Gating]
    SystemChecks --> Concurrency[Concurrency]
    
    %% Connect System Checks to affected actions
    Validation -.-> ContentCreation
    Access -.-> UserActions
    Access -.-> AdminActions
    RateLimit -.-> ContentCreation
    RateLimit -.-> ContentInter
    SupplyLimit -.-> BuyCollectible
    SupplyLimit -.-> BuyTicket
    Gating -.-> JoinTribe
    Gating -.-> BuyCollectible
    Gating -.-> ViewGated
    Concurrency -.-> BuyCollectible
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