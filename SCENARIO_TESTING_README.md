# Scenario-Based Testing for Web2 Styled Flow in Web3 Contracts

This document outlines the scenario steps for testing the Web2 styled community management flows implemented in the Web3 contracts. Each scenario is designed to validate the functionality and interactions within the decentralized platform.

## 1. Tribe Creation and Management

### Scenario 1: Create a Tribe
- User initiates the creation of a new tribe.
- User selects the joining criteria (Public, Private, Invite Only).
- If Private, user specifies the task or collectible requirement for joining.
- User submits the tribe creation request.
- Verify that the tribe is created with the correct attributes.

### Scenario 2: Update Tribe Joining Criteria
- Tribe owner accesses the tribe management interface.
- Tribe owner selects the option to update the joining criteria.
- Tribe owner modifies the criteria and submits the update.
- Verify that the tribe's joining criteria are updated successfully.

### Scenario 3: Join a Tribe
- User requests to join a tribe.
- If the tribe is:
  - Public → User joins instantly
  - Invite-only → User sends request and waits for admin approval
  - Restricted (Gated) → User must:
    - Pay an entry fee (tokens/points)
    - Earn required badge/achievement
    - Answer quiz/poll
- Verify that the user's status is updated to "PENDING" or "ACTIVE" based on join type
- Verify welcome message event is emitted

### Scenario 4: Browse and Filter Tribes
- Verify that tribes can be listed with pagination
- Verify tribes can be filtered by:
  - Categories
  - Popularity (member count)
  - Artist/organizer names
- Verify tribe details retrieval:
  - Community description
  - Content type
  - Engagement statistics
  - Joining criteria

### Scenario 5: Approve or Reject Join Requests
- Tribe owner reviews pending join requests.
- Tribe owner approves or rejects the requests.
- Verify that the user's status is updated to "ACTIVE" or "BANNED" accordingly.

### Scenario 6: Manage Tribe Members
- Tribe owner can assign roles (Moderator, Manager) to active members.
- Tribe owner can view the list of active and pending members.
- Verify that the member count is accurately maintained.

### Scenario 7: Send Invitations
- User sends an invitation to another user after joining the community.
- Verify that the invitation is sent successfully and the invited user receives a notification.

### Scenario 8: Delete a Tribe
- Tribe owner initiates the deletion of a tribe.
- Verify that the tribe's data is marked as deleted and no interactions can occur.

## 2. Super Community Management

### Scenario 9: Create a Super Community
- User initiates the creation of a super community.
- User selects the joining criteria for the super community.
- User submits the super community creation request.
- Verify that the super community is created with the correct attributes.

### Scenario 10: Add or Remove Tribes from Super Community
- Super community owner accesses the management interface.
- Super community owner adds or removes tribes.
- Verify that the data of removed tribes is marked as deleted.

### Scenario 11: Manage Super Community Members
- New users joining the super community are added as the first members.
- Verify that sub-tribe users are not counted as members of the super community.

### Scenario 12: Merge Tribe Data
- Verify that merged tribe data is visible in the super community only when the super community creator imports the data of sub-tribes.

### Scenario 13: Prevent Single Tribe Creation
- Verify that a super tribe cannot be created with a single tribe ID.

### Scenario 13.1: Super Community Creation Tool
- Admin initiates Super Community Creator tool
- Admin selects multiple communities to merge
- Admin defines:
  - New super community name and description
  - Aggregation rules for posts, members, and collectibles
  - Admin structure and permissions
- Verify successful merge and data aggregation
- Verify notification delivery to all members

### Scenario 13.2: Super Community Navigation
- Verify unified feed combining posts from all sub-communities
- Verify sub-community content filtering
- Verify cross-community leaderboard functionality
- Verify Super Community Points calculation based on merged rules

## 3. Role Management

### Scenario 14: Assign Roles to Tribe Members
- Admin assigns roles to tribe members based on their responsibilities.
- Verify that the roles are assigned correctly and that permissions are enforced.

### Scenario 15: Change Admin Role
- Current admin initiates a request to change the admin role.
- Verify that the new admin has the correct permissions and the previous admin's permissions are revoked.

### Scenario 16: Role-Based Access Control
- Verify that the role manager contract includes roles based on the tribe, ensuring that an organizer of one tribe cannot change data of another tribe.

### Scenario 17: Add Admin Functionality
- Admin initiates a request to add a new admin.
- Verify that the new admin is granted the correct permissions.

## 4. Collectible Management

### Scenario 18: Mint a Collectible
- User initiates the minting of a new collectible.
- Verify that the collectible is created according to the ERC 1155 standard.

### Scenario 19: Buy and Resell Collectibles
- User purchases a collectible.
- User resells the collectible to another user.
- Verify that the transaction history is maintained.

### Scenario 20: Auction Collectibles
- User initiates an auction for a collectible.
- Other users place bids on the collectible.
- Verify that the highest bidder wins the collectible at the end of the auction.

### Scenario 21: Buy Collectibles
- Verify that there is a method to buy collectibles.

### Scenario 22: Free Claims
- User claims a collectible without paying for gas (gasless).
- Verify that the claim is successful.

### Scenario 23: Marketplace Functionality
- Verify that users can buy, sell, resell, and auction collectibles, including the royalty concept.

### Scenario 35: Browse Collectibles
- Verify collectibles are correctly categorized:
  - Free claimable collectibles
  - Points-based collectibles
  - Premium (paid) collectibles
- Verify collectible details display
- Verify availability status

### Scenario 36: Claim Free Collectibles
- Verify free claim process
- Verify claim limits per user
- Verify successful transfer to user's assets

### Scenario 37: Purchase Premium Collectibles
- Verify purchase process with tokens/currency
- Verify points-based redemption process
- Verify transaction completion and asset transfer
- Verify "My Assets" section update

## 5. Community Points Management

### Scenario 24: Earn Community Points
- Verify points earned for:
  - Liking a post (1 point)
  - Commenting on a post (5 points)
  - Purchasing/Claiming collectibles (varied points)
  - Attending events (higher points)
- Verify points are correctly credited to user's balance
- Verify real-time points update

### Scenario 25: Redeem Community Points
- User initiates a redemption request for community points.
- Verify that the points are deducted and the corresponding reward is granted.

### Scenario 26: Points Store Navigation
- Verify available redemption options:
  - Exclusive digital content
  - Discount coupons
  - Event tickets
- Verify "How to Earn More?" suggestions when insufficient points
- Verify successful redemption process

## 6. Post Management

### Scenario 27: Create a Post
- User creates a post within a tribe.
- Verify that the post is created and associated with the correct tribe.

### Scenario 28: Post Interactions
- Verify post interaction methods:
  - Like functionality
  - Comment functionality (text, images, GIFs)
  - Share functionality (if allowed)
- Verify engagement analytics update
- Verify points attribution for interactions

### Scenario 29: Delete a Post
- Tribe manager deletes a post.
- Verify that the post is marked as deleted and is no longer visible.

### Scenario 30: Post Status Management
- Tribe manager changes the post status to Active, Deleted, or Archived.
- Verify that the status change is reflected correctly.

## 7. Event Management

### Scenario 32: Create an Event
- Organizer creates a new event within a tribe.
- Verify that the event is created with the correct details.

### Scenario 33: Purchase Event Tickets
- User purchases tickets for an event.
- Verify that the ticket purchase is successful and the user's ticket count is updated.

### Scenario 34: Transfer Event Tickets
- User transfers an event ticket to another user.
- Verify that the transfer is successful and the ticket ownership is updated.

### Scenario 35: Ticket Quantity in Purchase
- Verify that the quantity of tickets can be specified when purchasing.

### Scenario 36: Sell Tickets
- Verify that tickets can be sold to another user.

### Scenario 37: Use Collectibles to Purchase Tickets
- Verify that collectibles can be used to purchase event tickets.

## 8. Edge Cases Management

### Scenario 38: Access Control Edge Cases
- Verify handling of unauthorized join attempts:
  - Private community access without invite
  - Banned user access attempts
  - Insufficient permissions
- Verify appropriate error messages and prompts
- Verify appeal/request functionality

### Scenario 39: Resource Contention
- Verify handling of simultaneous collectible claims:
  - Implement queue-based locking mechanism
  - Verify first-come-first-serve functionality
  - Verify proper error handling for failed claims
- Verify points requirement checks:
  - Show alternative earning methods
  - Display progress towards requirement

### Scenario 40: Content Management Edge Cases
- Verify handling of post deletion with active engagement:
  - Update engagement points
  - Notify affected users
  - Maintain engagement history
- Verify feed management in large super communities:
  - Implement pagination
  - Verify filtering system
  - Test performance with large data sets

### Scenario 41: Data Aggregation Edge Cases
- Verify handling of duplicate content across merged communities
- Verify points conversion and normalization
- Verify historical data preservation
- Test migration rollback scenarios

## 9. Community Creator Journey

### Scenario 9.1: Creating a Community
- Creator initiates community creation
- Creator defines:
  - Name & Description
  - Community Type (Public, Private, Invite-only)
  - Joining Criteria (Free, Paid, Points-based, Badge-based)
  - Community Points Configuration
  - Supported Features (Posts, Collectibles, Events, Polls)
- Creator uploads branding elements
- Verify community creation and configuration storage
- Verify creator receives admin role automatically

### Scenario 9.2: Managing Members & Engagement
- Admin accesses member management interface
- Admin performs member operations:
  - Approve/Reject join requests
  - Invite new users
  - Assign/revoke moderator roles
  - Remove users
- Admin configures engagement rewards:
  - Set point thresholds for badges
  - Define automatic role upgrades
  - Configure reward distribution rules
- Verify all member status changes
- Verify reward distribution accuracy

### Scenario 9.3: Content Posting & Interaction
- Creator creates different post types:
  - Text/Media posts
  - Polls & Quizzes
  - Collectible announcements
- Creator configures post settings:
  - Access restrictions
  - Engagement settings
- Verify post creation and settings
- Verify engagement tracking
- Test restricted access enforcement

### Scenario 9.4: Poll & Quiz Management
- Creator sets up interactive content:
  - Create poll with options
  - Create quiz with correct answers
  - Set reward rules
- Users participate and earn rewards
- Verify:
  - Real-time result tracking
  - Reward distribution
  - Participation limits
  - Result finalization

## 10. Collectible Management Journey

### Scenario 10.1: Collectible Creation
- Creator navigates to collectible creation
- Creator configures:
  - Collectible type (Media, Digital Merch, Coupons, Tickets)
  - Distribution method (Free, Points, Paid)
  - Supply limits
  - Access restrictions
- Verify collectible metadata storage
- Verify distribution settings enforcement

### Scenario 10.2: Collectible Distribution
- Monitor claim/purchase tracking
- Test supply management:
  - Pause/resume sales
  - Increase supply
  - Handle waitlists
- Verify NFT minting on purchase
- Test refund scenarios
- Verify ownership tracking

## 11. Event Management Journey

### Scenario 11.1: Event Creation
- Creator sets up event:
  - Basic details (Name, Description, Date)
  - Venue/Virtual link
  - Ticketing configuration
  - Access restrictions
- Verify event data storage
- Test ticket generation

### Scenario 11.2: Ticket Management
- Track ticket sales/claims
- Handle check-in process:
  - QR code generation
  - Attendance verification
  - Multiple check-in prevention
- Test ticket transfers
- Verify refund processing

## 12. Super Community Management

### Scenario 12.1: Community Merge Process
- Creator initiates merge:
  - Select communities
  - Configure merged community
  - Define roles
  - Set content rules
- Verify:
  - Member deduplication
  - Role preservation
  - Content aggregation
  - Notification delivery

### Scenario 12.2: Super Community Operations
- Test cross-community features:
  - Unified content feed
  - Aggregated analytics
  - Cross-community challenges
  - Reward distribution
- Verify sub-community independence
- Test unmerge scenarios

## 13. Edge Case Management

### Scenario 13.1: Event Edge Cases
- Handle zero ticket sales
- Process last-minute cancellations
- Manage venue changes
- Handle technical failures during live events

### Scenario 13.2: Collectible Edge Cases
- Handle rapid sellouts
- Process failed transactions
- Manage duplicate claims
- Handle metadata updates

### Scenario 13.3: Community Edge Cases
- Handle inactive communities
- Process community deletions
- Manage banned user appeals
- Handle role conflicts in merges

## Technical Implementation Notes

### Smart Contract Requirements
1. Community Management Contract
   - Community creation and configuration
   - Member management
   - Role assignment
   - Points system

2. Content Management Contract
   - Post creation and management
   - Poll/Quiz functionality
   - Engagement tracking
   - Access control

3. Collectible Management Contract
   - NFT minting and distribution
   - Supply management
   - Purchase processing
   - Ownership tracking

4. Event Management Contract
   - Event creation and configuration
   - Ticket management
   - Check-in processing
   - Refund handling

5. Super Community Contract
   - Community merging
   - Cross-community features
   - Analytics aggregation
   - Role management

### Testing Priorities
1. Security
   - Role-based access control
   - Transaction validation
   - Data integrity

2. Scalability
   - Large community handling
   - High-volume transactions
   - Data aggregation efficiency

3. User Experience
   - Transaction speed
   - Error handling
   - Feature accessibility

4. Integration
   - Cross-contract interactions
   - External service integration
   - Data consistency

## Conclusion
This document serves as a guideline for testing the Web2 styled flows in the Web3 contracts. Each scenario should be executed to ensure that the functionalities are working as intended and that the user experience aligns with the expected outcomes. 