# Fundraiser User Flows

This document outlines the key user flows tested in the Fundraiser Journey test suite. Each section describes a specific user journey and the corresponding test cases that validate the functionality.

## Setup Flow

**Test**: Before Hook Setup

**Description**: 
The setup flow establishes the fundamental contracts and roles required for the fundraiser ecosystem. It deploys the necessary contracts (RoleManager, TribeController, PointSystem, CollectibleController, PostFeedManager, and PostMinter), assigns roles to different users, and creates a test tribe for hosting fundraisers.

**User Journey**:
1. Admin deploys all required contracts and establishes their relationships
2. Admin assigns specialized roles (admin, moderator, fundraiser creator)
3. Admin creates a new tribe as a container for fundraising activities
4. Various users join the tribe (fundraiser creator, contributors)
5. Admin bans a problematic member to test access controls

## Fundraiser Creation Flows

### Standard Fundraiser Creation

**Test**: `Should create a standard fundraiser`

**Description**:
This flow tests the basic creation of a fundraiser by an authorized creator. It validates that users with the creator role can successfully create fundraisers with standard parameters and that the metadata is correctly stored.

**User Journey**:
1. Fundraiser creator designs a community garden project with complete details
2. Creator sets a funding target of 1000 ETH with a 30-day duration
3. Creator establishes three contribution tiers (Bronze: 50 ETH, Silver: 100 ETH, Gold: 200 ETH)
4. Creator adds supplementary metadata (images, documents, website)
5. Creator submits the fundraiser to the tribe
6. System validates and stores the fundraiser data
7. System emits a PostCreated event to notify tribe members

### Multi-Currency Fundraiser Creation

**Test**: `Should create fundraiser with multiple currencies`

**Description**:
This flow ensures creators can establish fundraisers using different currency options (ETH, USDC, TRIBE_TOKEN), providing flexibility in how contributors can support initiatives.

**User Journey**:
1. Creator designs three separate fundraisers with identical parameters
2. Each fundraiser specifies a different currency (ETH, USDC, TRIBE_TOKEN)
3. Creator submits each fundraiser with appropriate cooldown periods between submissions
4. System validates and stores each fundraiser with its specific currency
5. System emits a PostCreated event for each submission

### Time-Flexible Fundraiser Creation

**Test**: `Should create fundraiser with flexible durations`

**Description**:
This flow tests the system's ability to handle fundraisers with different time horizons, from short one-week campaigns to long three-month initiatives.

**User Journey**:
1. Creator designs three fundraisers with identical parameters except duration
2. Creator sets different timeframes: 7 days (1 week), 30 days (1 month), and 90 days (3 months)
3. Creator submits each fundraiser with appropriate cooldown periods
4. System validates and stores each fundraiser with its specific duration
5. System emits a PostCreated event for each submission

### Multi-Tier Fundraiser Creation

**Test**: `Should handle different slab configurations`

**Description**:
This flow validates the system's support for various contribution tier structures, from simple single-tier fundraisers to complex multi-tier campaigns with numerous options.

**User Journey**:
1. Creator designs three fundraisers with identical parameters except tier structure
2. First fundraiser has a minimal single-tier structure (Single: 100 ETH)
3. Second fundraiser has standard three-tier structure (Bronze: 50 ETH, Silver: 100 ETH, Gold: 200 ETH)
4. Third fundraiser has extended five-tier structure (Early Bird through Platinum: 25-500 ETH)
5. Creator submits each fundraiser with appropriate cooldown periods
6. System validates and stores each fundraiser with its specific tier configuration
7. System emits a PostCreated event for each submission

## Contribution Flows

### Basic Contribution Tracking

**Test**: `Should simulate contribution through interaction`

**Description**:
This flow tests the system's ability to track contributions to fundraisers through user interactions, specifically using likes as a proxy for contributions in the test environment.

**User Journey**:
1. Fundraiser creator establishes a test fundraiser with multiple tiers
2. System creates the fundraiser and assigns it an ID
3. Contributor 1 interacts with the fundraiser post (simulating a contribution)
4. System records the interaction/contribution
5. System verifies the interaction count is updated correctly

### Multi-User Contribution Tracking

**Test**: `Should track multiple interactions`

**Description**:
This flow ensures the system can properly track contributions from multiple users to the same fundraiser.

**User Journey**:
1. Fundraiser creator establishes a test fundraiser
2. Contributor 1 interacts with the fundraiser (simulating a contribution)
3. Contributor 2 also interacts with the fundraiser
4. System records both interactions
5. System verifies the total interaction count is 2

### Access Control for Contributions

**Test**: `Should prevent banned members from interacting`

**Description**:
This flow verifies that banned members cannot interact with or contribute to fundraisers, maintaining the integrity of the contribution system.

**User Journey**:
1. Fundraiser creator establishes a test fundraiser
2. A banned member attempts to interact with the fundraiser
3. System identifies the banned status of the user
4. System rejects the interaction attempt with "InsufficientAccess" error
5. Fundraiser interaction counts remain unchanged

### Deleted Fundraiser Protection

**Test**: `Should prevent interactions with deleted fundraiser`

**Description**:
This flow tests the system's handling of deleted fundraisers, ensuring users cannot interact with or contribute to fundraisers that have been removed.

**User Journey**:
1. Fundraiser creator establishes a test fundraiser
2. Creator later decides to delete the fundraiser
3. System marks the fundraiser as deleted
4. Contributor attempts to interact with the deleted fundraiser
5. System rejects the interaction with "PostDeleted" error
6. No interactions are recorded for the deleted fundraiser

## Frontend Validation Guidelines

**Description**:
While not actual test cases, the test file documents important validation rules that should be implemented in the frontend to ensure a smooth user experience and prevent invalid data submission.

**Validation Categories**:
1. **Date Validations**:
   - Start date must be in the future
   - Duration must be between 1 week and 3 months

2. **Amount Validations**:
   - Target amount must be > 0
   - Target amount must be reasonable (platform-specific max)

3. **Slab/Tier Validations**:
   - At least one slab required
   - Slab amounts must be in ascending order
   - No duplicate slab names
   - Slab amounts must be > 0

4. **Currency Validations**:
   - Currency must be from supported list
   - If token, must be valid contract address

These frontend validations complement the contract-level validations to create a seamless and error-resistant user experience. 