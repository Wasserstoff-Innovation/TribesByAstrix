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
4. **Content Creation & Posting**
   - 4.1 [Create Post in Tribe](#journey-41)
   - 4.2 [Create Post Without Permission](#journey-42)
5. **Governance & Voting**
   - 5.1 [Create Proposal](#journey-51)
   - 5.2 [Vote on Proposal](#journey-52)
   - 5.3 [Unauthorized Vote Attempt](#journey-53)

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
     - The user’s address is in the `whitelist[]` if the tribe is invite-only.
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
     - Transaction reverts with “Preconditions not met”.
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

## 4. Content Creation & Posting

### Journey 4.1 <a id="journey-41"></a> Create Post in Tribe
1. **User** (a tribe member or NFT holder) wants to post content in a specific tribe.
2. **User** calls `createPost(tribeId, content)` on `PostMinter`.
   - **Expectation**:  
     - Possibly checks if `msg.sender` is in the tribe’s whitelist, or if user owns a Profile NFT, etc. (Depending on your extended logic).
   - **Outcome**:  
     - `nextPostId` increments, returning the new post ID.
     - `PostCreated(postId, tribeId, creator, content)` event is emitted.

### Journey 4.2 <a id="journey-42"></a> Create Post Without Permission
1. **User** does not meet the tribe’s membership or NFT ownership requirements.
2. **User** attempts to call `createPost(tribeId, content)`.
   - **Expectation**:  
     - If your contract enforces checks, revert with an error (e.g., “Not authorized”).
   - **Outcome**:  
     - Transaction reverts, no post is created.

---

## 5. Governance & Voting

### Journey 5.1 <a id="journey-51"></a> Create Proposal
1. **Tribe admin** or an authorized user calls `createProposal(tribeId, proposalDetails)` on `Voting`.
   - **Expectation**:  
     - Possibly only admin or certain token/NFT holders can create proposals.
   - **Outcome**:  
     - A `proposalId` is returned and incremented internally.
     - `ProposalCreated(proposalId, tribeId, msg.sender, proposalDetails)` event is emitted.

### Journey 5.2 <a id="journey-52"></a> Vote on Proposal
1. **User** checks if they are eligible to vote (off-chain logic or on-chain check).
2. **User** calls `vote(proposalId, voteChoice)`.
   - **Expectation**:  
     - Must be a valid proposal ID.
     - If user has already voted or is not eligible, revert or skip (depending on logic).
   - **Outcome**:  
     - `voteCount` increments if `voteChoice` is `true`.
     - `VoteCasted(proposalId, voter, voteChoice)` event is emitted.

### Journey 5.3 <a id="journey-53"></a> Unauthorized Vote Attempt
1. **User** tries to vote on a proposal but does not meet eligibility (e.g., no NFT, not in tribe).
2. **User** calls `vote(proposalId, voteChoice)`.
   - **Expectation**:  
     - Transaction reverts, e.g., “Not authorized to vote”.
   - **Outcome**:  
     - No changes made to proposal state.

---

## How to Use These Journeys

Each journey outlines a specific set of contract calls, the preconditions, and the expected outcome. You can create test files (e.g., `test/ProfileNFTMinter.test.js`, `test/TribeController.test.js`) and replicate these scenarios in your tests:

1. **Setup**: Deploy fresh instances of the contracts in a test environment.
2. **Preconditions**: Mock or set up any necessary state (e.g., add user to a whitelist, set `mintFee`).
3. **Action**: Call the contract function (e.g., `mintProfileNFT`, `createPost`, `vote`) with relevant parameters.
4. **Assertion**: Verify logs (`events`), return values, and any updated on-chain state. Ensure the correct revert/require errors are triggered in negative scenarios.
