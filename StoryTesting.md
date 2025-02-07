# Story Mode: Login and Finding Tribes

This document outlines the user journey for discovering and joining communities within the platform. It includes a series of steps that a user would take, along with corresponding test scenarios to ensure that all functionalities are working as intended.

## User Journey Steps

### Step 1: User Logs into the Platform
- [ ] Verify that the user can successfully log in to the platform.

### Step 2: Navigate to "Explore Communities"
- [ ] Verify that the user can access the "Explore Communities" section from the dashboard.

### Step 3: Filter/Search Communities
- [ ] Verify that the user can filter communities based on categories.
- [ ] Verify that the user can search for communities by popularity.
- [ ] Verify that the user can search for communities by artist/organizer names.

### Step 4: View Community Details
- [ ] Verify that the user can click on a community to view:
  - Community description
  - Type of content shared
  - Engagement statistics (members, posts, collectibles)
  - Joining criteria

### Step 5: Join a Community
- [ ] Verify that the user can click "Join Community."
- [ ] If the community is:
  - Public:
    - [ ] Verify that the user joins instantly.
  - Invite-only:
    - [ ] Verify that the user can send a request and waits for admin approval.
  - Restricted (Gated by criteria):
    - [ ] Verify that the user must complete a requirement:
      - [ ] Pay an entry fee (tokens, currency, or points).
      - [ ] Earn a required badge or achievement.
      - [ ] Answer a quiz or poll.

### Step 6: Successful Joining
- [ ] Verify that upon successful joining, the user lands on the Community Feed.
- [ ] Verify that the user receives a welcome message.

## Pre-requirements
- [ ] Ensure that there are some tribes listed in the system for testing.
- [ ] Implement methods to get tribes mapped in the contracts for frontend reference.

## Related Test Cases from SCENARIO_TESTING_README.md

### Tribe Creation and Management
- **Scenario 1: Create a Tribe**
  - [ ] Verify that the tribe is created with the correct attributes.
  - **Contract Test Reference**: `TribeController.createTribe()`

- **Scenario 3: Join a Tribe**
  - [ ] Verify that the user's status is updated to "PENDING" and the tribe owner is notified.
  - **Contract Test Reference**: `TribeController.joinTribe()`

### Super Community Management
- **Scenario 9: Create a Super Community**
  - [ ] Verify that the super community is created with the correct attributes.
  - **Contract Test Reference**: `SuperCommunityController.createSuperCommunity()`

## Conclusion
This document serves as a checklist for the user journey of logging in and finding tribes. Each step should be validated against the corresponding test scenarios to ensure a seamless user experience. 