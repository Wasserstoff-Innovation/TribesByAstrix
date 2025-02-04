# User Journeys for Astrix

This document details typical user interactions with the Astrix contracts. These journeys are meant to guide test creation and ensure coverage of both happy-path scenarios and edge cases.

## Table of Contents
1. **Profile Creation & Updates**
   - 1.1 [Create Profile NFT](#journey-11)
   - 1.2 [Update Profile Metadata](#journey-12)
2. **Tribe Management**
   - 2.1 [Create Tribe](#journey-21)
   - 2.2 [Update Tribe Metadata](#journey-22)
   - 2.3 [Check Whitelist Permissions](#journey-23)
3. **Collectible Minting & Access**
   - 3.1 [Mint Collectible (Whitelisted)](#journey-31)
   - 3.2 [Mint Collectible (Not Whitelisted)](#journey-32)
   - 3.3 [Verify Access & Generate Session Key](#journey-33)
4. **Community Points & Activity**
   - 4.1 [Earning Points for On-Chain Activity](#journey-41)
   - 4.2 [Redeeming Points for Collectible](#journey-42)
   - 4.3 [Point Redemption with Signature](#journey-43)
   - 4.4 [Invalid Point Redemption](#journey-44)
5. **Community Events & Ticketing**
   - 5.1 [Minting Event Tickets](#journey-51)
   - 5.2 [Attending an Event](#journey-52)
   - 5.3 [Transfer Event Ticket](#journey-53)
   - 5.4 [Cancel Event](#journey-54)
6. **Super Communities & Merging**
   - 6.1 [Soft Merge Through Off-Chain Linking](#journey-61)
   - 6.2 [ParentTribe Field Assignment](#journey-62)
   - 6.3 [Add Tribe to Super Community](#journey-63)
   - 6.4 [Remove Tribe from Super Community](#journey-64)
7. **Concurrency & Scalability**
   - 7.1 [High-Demand Collectible Drop](#journey-71)
   - 7.2 [Multiple Admins Editing Tribe](#journey-72)
8. **Analytics & Insights**
   - 8.1 [Off-Chain Metrics Generation](#journey-81)
   - 8.2 [Aggregated Super Community Stats](#journey-82)
9. **Technical Considerations**
   - 9.1 [Access Control Integration](#journey-91)
   - 9.2 [Rate Limiting & RBAC](#journey-92)
10. **Edge Cases & Error Handling**
    - 10.1 [Banning a User](#journey-101)
    - 10.2 [Failed Transaction Handling](#journey-102)

---

## 1. Profile Creation & Updates

### Journey 1.1 <a id="journey-11"></a> Create Profile NFT
1. **User** connects wallet (e.g., MetaMask) with sufficient ETH balance.
2. **User** calls `mintProfileNFT(username, avatarURI)` on the `ProfileNFTMinter` contract.
   - **Expectation**:  
     - Must send at least `mintFee`.
     - If `msg.value < mintFee`, revert with `Insufficient fee`.
   - **Outcome**:  
     - A new Profile NFT is minted.  
     - An event `ProfileNFTMinted(user, tokenId, username)` is emitted.
3. **User** sees a success transaction, obtains the NFT token ID.

### Journey 1.2 <a id="journey-12"></a> Update Profile Metadata
1. **User** is the owner of a previously minted Profile NFT (identified by `tokenId`).
2. **User** calls `setProfileMetadata(tokenId, key, value)` on `ProfileNFTMinter`.
   - **Expectation**:  
     - Must be the NFT owner, otherwise revert with `Not token owner`.
   - **Outcome**:  
     - The `profileMetadata[tokenId][key]` is updated on-chain.
     - `ProfileMetadataUpdated(tokenId, key, value)` event is emitted.

---

## 2. Tribe Management

### Journey 2.1 <a id="journey-21"></a> Create Tribe
1. **User** decides to become an admin of a new tribe.
2. **User** calls `createTribe(tribeName, tribeMetadata, whitelist[])` on `TribeController`.
   - **Expectation**:  
     - The caller automatically becomes the tribe admin.
   - **Outcome**:  
     - A new `tribeId` is created and returned.  
     - An event `TribeCreated(tribeId, creator, tribeName)` is emitted.

### Journey 2.2 <a id="journey-22"></a> Update Tribe Metadata
1. **Tribe admin** calls `updateTribe(tribeId, newMetadata, updatedWhitelist)`.
   - **Expectation**:  
     - Only the `admin` of the tribe can update it.
     - If non-admin tries, revert with `Not tribe admin`.
   - **Outcome**:  
     - `tribes[tribeId].metadata` is updated with `newMetadata`.
     - `tribes[tribeId].whitelist` is updated with `updatedWhitelist`.
     - `TribeUpdated(tribeId, newMetadata)` event is emitted.

### Journey 2.3 <a id="journey-23"></a> Check Whitelist Permissions
1. **User** wants to see if they are whitelisted for a given tribe.
2. **User** or **backend** reads `tribes[tribeId].whitelist`.
   - **Expectation**:  
     - The user's address is in the `whitelist[]` if the tribe is invite-only.
   - **Outcome**:  
     - If not whitelisted, user might not be able to post or see certain tribe content.

---

## 3. Collectible Minting & Access

### Journey 3.1 <a id="journey-31"></a> Mint Collectible (Whitelisted)
1. **Admin** sets up whitelist for `collectibleType` by updating `collectibleWhitelist[collectibleType][user] = true`.
2. **User** calls `mintCollectible(collectibleType)` on `CollectibleController`.
   - **Expectation**:  
     - The user is whitelisted, so `verifyPreconditionsForPurchase(msg.sender, collectibleType)` returns `true`.
   - **Outcome**:  
     - Collectible is minted (actual mint logic to be implemented).
     - `CollectibleMinted(user, collectibleType, tokenId)` event is emitted.

### Journey 3.2 <a id="journey-32"></a> Mint Collectible (Not Whitelisted)
1. **User** tries to call `mintCollectible(collectibleType)` but is not whitelisted.
   - **Expectation**:  
     - `verifyPreconditionsForPurchase(...)` will return false.
     - Transaction reverts with "Preconditions not met".
   - **Outcome**:  
     - No collectible is minted.

### Journey 3.3 <a id="journey-33"></a> Verify Access & Generate Session Key
1. **User** has minted a collectible NFT from a known NFT contract address.
2. **User** calls `verifyAccessAndGenerateSessionKey(user, nftContract, tokenId, signature)`.
   - **Expectation**:  
     - Contract checks ownership and validity of signature (if implemented).
   - **Outcome**:  
     - `sessionKey = keccak256(...)` is emitted in `AccessVerified(user, sessionKey)`.
     - Off-chain services might use `sessionKey` to validate gating logic.

---

## 4. Community Points & Activity

### Journey 4.1 <a id="journey-41"></a> Earning Points for On-Chain Activity
1. **User** (already has a Profile NFT) creates a new post in a tribe.
2. **User** calls `createPost(tribeId, content)` on `PostMinter`.
3. **Backend** receives the `PostCreated(postId, tribeId, creator, content)` event.
4. **Backend** updates user's points off-chain (e.g., +5 points).
   - **Expectation**:  
     - No on-chain state changes except event emission.
   - **Outcome**:  
     - Points are updated in off-chain database.
     - Event is emitted for tracking.

### Journey 4.2 <a id="journey-42"></a> Redeeming Points for Collectible
1. **User** wants to redeem points for a special "Badge" collectible.
2. **Frontend** checks user's points in off-chain DB.
3. **Backend** signs redemption payload (user address, collectible type, nonce).
4. **User** calls `redeemCollectible(collectibleType, signature)`.
   - **Expectation**:  
     - Valid signature required.
     - Sufficient points in off-chain system.
   - **Outcome**:  
     - NFT is minted to user.
     - Points deducted off-chain.
     - `CollectibleMinted` event emitted.

### Journey 4.3 <a id="journey-43"></a> Point Redemption with Signature
1. **User** has earned points through off-chain activities.
2. **Backend** generates signature for point redemption.
3. **User** calls `redeemPoints(points, collectibleType, signature)`.
   - **Expectation**:  
     - Signature must be valid and unused.
     - Points amount must match signature.
   - **Outcome**:  
     - Points are redeemed.
     - `PointsRedeemed` event emitted.

### Journey 4.4 <a id="journey-44"></a> Invalid Point Redemption
1. **User** attempts to redeem with invalid/used signature.
2. **User** calls `redeemPoints(points, collectibleType, signature)`.
   - **Expectation**:  
     - Transaction reverts with "Invalid signature" or "Signature already used".
   - **Outcome**:  
     - No points redeemed.
     - No state changes.

---

## 5. Community Events & Ticketing

### Journey 5.1 <a id="journey-51"></a> Minting Event Tickets
1. **Organizer** sets up event in database.
2. **Organizer** configures ticket collectible:
   ```typescript
   await collectibleController.setCollectibleData(
     1001, // Event Ticket Type
     200,  // Max Supply
     ethers.parseEther("0.05"), // Price
     true, // Redeemable
     futureTimestamp // Expiration
   );
   ```
3. **User** purchases ticket:
   - **Expectation**:  
     - Must send sufficient payment.
     - Supply must be available.
   - **Outcome**:  
     - Ticket (ERC1155) minted to user.
     - Payment processed.
     - `CollectibleMinted` event emitted.

### Journey 5.2 <a id="journey-52"></a> Attending an Event
1. **User** arrives at event venue.
2. **Organizer** verifies ticket ownership.
3. **Optional**: Call `redeem(ticketId, 1)` for one-time use.
   - **Expectation**:  
     - Valid ticket ownership.
     - Not already redeemed.
   - **Outcome**:  
     - Attendance recorded off-chain.
     - Optional: Ticket marked as used on-chain.

### Journey 5.3 <a id="journey-53"></a> Transfer Event Ticket
1. **User** wants to transfer their ticket to another address.
2. **User** calls `safeTransferFrom(from, to, eventId, amount, data)`.
   - **Expectation**:  
     - Can only transfer ticket once.
     - If already transferred, revert with "Ticket already transferred once".
   - **Outcome**:  
     - Ticket is transferred if allowed.
     - Transfer is tracked in `hasTransferredTicket`.

### Journey 5.4 <a id="journey-54"></a> Cancel Event
1. **Organizer** needs to cancel an event.
2. **Organizer** calls `cancelEvent(eventId)`.
   - **Expectation**:  
     - Only event organizer can cancel.
     - If not organizer, revert with "Not event organizer".
   - **Outcome**:  
     - Event is marked as inactive.
     - No more tickets can be purchased.

---

## 6. Super Communities & Merging

### Journey 6.1 <a id="journey-61"></a> Soft Merge Through Off-Chain Linking
1. **Admin** wants to merge two tribes.
2. **Admin** calls `softMerge(tribeId1, tribeId2)`.
   - **Expectation**:  
     - Both tribes must be in the same super community.
     - Tribe1's members are merged into Tribe2.
   - **Outcome**:  
     - Tribe1 is marked as inactive.
     - Tribe2's members are updated to include Tribe1's members.
     - `TribeMerged(tribeId1, tribeId2)` event is emitted.

### Journey 6.2 <a id="journey-62"></a> ParentTribe Field Assignment
1. **Admin** assigns a parent tribe to a new tribe.
2. **Admin** calls `assignParentTribe(tribeId, parentTribeId)`.
   - **Expectation**:  
     - Only admin can assign a parent tribe.
     - If non-admin tries, revert with `Not admin`.
   - **Outcome**:  
     - `tribes[tribeId].parentTribe` is updated to `parentTribeId`.
     - `TribeUpdated(tribeId, newMetadata)` event is emitted.

### Journey 6.3 <a id="journey-63"></a> Add Tribe to Super Community
1. **Admin** wants to add a tribe to their super community.
2. **Admin** calls `addTribeToSuperCommunity(superCommunityId, tribeId)`.
   - **Expectation**:  
     - Must be super community admin.
     - Tribe must not be in another super community.
   - **Outcome**:  
     - Tribe is added to super community.
     - `TribeJoinedSuperCommunity(superCommunityId, tribeId)` event is emitted.

### Journey 6.4 <a id="journey-64"></a> Remove Tribe from Super Community
1. **Admin** or **Tribe Admin** wants to remove a tribe.
2. **User** calls `removeTribeFromSuperCommunity(superCommunityId, tribeId)`.
   - **Expectation**:  
     - Must be super community admin or tribe admin.
     - Tribe must be in the super community.
   - **Outcome**:  
     - Tribe is removed.
     - `TribeLeftSuperCommunity(superCommunityId, tribeId)` event is emitted.

---

## 7. Concurrency & Scalability

### Journey 7.1 <a id="journey-71"></a> High-Demand Collectible Drop
1. **Admin** configures limited collectible:
   ```typescript
   await collectibleController.setCollectibleData(
     2002, // Limited Edition Type
     500,  // Max Supply
     price,
     false,
     0
   );
   ```
2. **Multiple Users** attempt to mint simultaneously.
   - **Expectation**:  
     - Supply cap enforced.
     - First-come-first-served.
   - **Outcome**:  
     - Successful mints up to cap.
     - Later attempts revert.

### Journey 7.2 <a id="journey-72"></a> Multiple Admins Editing Tribe
1. **Admin A** and **Admin B** edit simultaneously.
2. **Network** processes in arrival order.
   - **Expectation**:  
     - Last-write-wins semantics.
     - No corrupt state.
   - **Outcome**:  
     - Final state reflects last processed tx.
     - Optional off-chain conflict detection.

---

## 8. Analytics & Insights

### Journey 8.1 <a id="journey-81"></a> Off-Chain Metrics Generation
1. **Indexer** monitors contract events.
2. **Backend** processes and stores metrics.
3. **Frontend** displays analytics.
   - **Expectation**:  
     - Accurate event processing.
     - Real-time updates.
   - **Outcome**:  
     - Comprehensive analytics.
     - No on-chain overhead.

### Journey 8.2 <a id="journey-82"></a> Aggregated Super Community Stats
1. **Backend** aggregates data from multiple tribes.
2. **Frontend** displays combined metrics.
   - **Expectation**:  
     - Accurate aggregation.
     - Clear hierarchy display.
   - **Outcome**:  
     - Unified community view.
     - Enhanced insights.

---

## 9. Technical Considerations

### Journey 9.1 <a id="journey-91"></a> Access Control Integration
1. **Contract** inherits OpenZeppelin `AccessControl`.
2. **Admin** grants roles post-deployment.
   - **Expectation**:  
     - Role checks enforced.
     - Backward compatibility.
   - **Outcome**:  
     - Secure access control.
     - Minimal refactoring.

### Journey 9.2 <a id="journey-92"></a> Rate Limiting & RBAC
1. **API Gateway** enforces rate limits.
2. **Contract** enforces role checks.
   - **Expectation**:  
     - Rate limits respected.
     - Role validation.
   - **Outcome**:  
     - Protected endpoints.
     - Spam prevention.

---

## 10. Edge Cases & Error Handling

### Journey 10.1 <a id="journey-101"></a> Banning a User
1. **Admin** initiates ban.
2. **System** implements restrictions:
   ```typescript
   // Off-chain
   await db.setUserStatus(userId, 'BANNED');
   
   // On-chain (if needed)
   await roleManager.revokeRole(COMMUNITY_ROLE, userAddress);
   ```
   - **Expectation**:  
     - User access revoked.
     - Clean state transition.
   - **Outcome**:  
     - Effective ban enforcement.
     - Minimal contract changes.

### Journey 10.2 <a id="journey-102"></a> Failed Transaction Handling
1. **User** attempts invalid purchase.
2. **Contract** reverts cleanly.
   - **Expectation**:  
     - No partial state changes.
     - Clear error message.
   - **Outcome**:  
     - Atomic transaction.
     - User funds preserved.

---

## How to Use These Journeys

### Unit Testing
```typescript
describe("Community Points", () => {
  it("should redeem points with valid signature", async () => {
    // Setup
    const points = 100;
    const signature = await generateSignature(user, points);
    
    // Test
    await expect(communityPoints.redeemPoints(points, signature))
      .to.emit(communityPoints, "PointsRedeemed")
      .withArgs(user.address, points);
  });
});
```

### Integration Testing
1. Deploy contracts to test network
2. Setup backend services
3. Run full user journeys
4. Verify both on-chain and off-chain state

### Performance Testing
1. Simulate concurrent users
2. Verify system limits
3. Test recovery scenarios

### Security Testing
1. Role permission tests
2. Signature verification
3. Rate limit effectiveness
