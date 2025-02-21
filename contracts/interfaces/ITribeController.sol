// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IRoleManager.sol";

interface ITribeController {
    enum NFTType { ERC721, ERC1155 }

    enum JoinType { 
        PUBLIC,         // Anyone can join
        PRIVATE,        // Need approval from admin
        INVITE_ONLY,    // Need to be invited/whitelisted
        NFT_GATED,      // Need specific NFT(s)
        MULTI_NFT,      // Need multiple NFTs (AND condition)
        ANY_NFT,        // Need any one of multiple NFTs (OR condition)
        INVITE_CODE     // Need valid invite code
    }

    enum MemberStatus { NONE, ACTIVE, PENDING, BANNED }

    struct NFTRequirement {
        address nftContract;
        NFTType nftType;
        bool isMandatory;      // If true, this NFT is required (for AND conditions)
        uint256 minAmount;     // Minimum number of tokens required
        uint256[] tokenIds;    // Specific token IDs (empty means any token from contract)
    }

    struct InviteCode {
        bytes32 codeHash;      // Hash of the invite code
        uint256 maxUses;       // Maximum number of times this code can be used
        uint256 usedCount;     // Number of times this code has been used
        uint256 expiryTime;    // When this code expires (0 for no expiry)
    }

    // Split TribeConfig into two parts to handle mappings
    struct TribeConfigView {
        JoinType joinType;
        uint256 entryFee;
        NFTRequirement[] nftRequirements;
        bool canMerge;         // Whether this tribe can be merged into another
    }

    struct MergeRequest {
        uint256 sourceTribeId;
        uint256 targetTribeId;
        uint256 requestTime;
        bool approved;
    }

    // Events
    event TribeCreated(uint256 indexed tribeId, address indexed creator, string tribeName, JoinType joinType);
    event TribeConfigUpdated(uint256 indexed tribeId, JoinType joinType, uint256 entryFee);
    event MembershipUpdated(uint256 indexed tribeId, address indexed member, MemberStatus status);
    event MemberJoined(uint256 indexed tribeId, address indexed member);
    event InviteCodeCreated(uint256 indexed tribeId, bytes32 indexed codeHash, uint256 maxUses, uint256 expiryTime);
    event InviteCodeRevoked(uint256 indexed tribeId, bytes32 indexed codeHash);
    event MergeRequested(uint256 indexed requestId, uint256 indexed sourceTribeId, uint256 indexed targetTribeId);
    event MergeApproved(uint256 indexed requestId);
    event MergeExecuted(uint256 indexed requestId, uint256 indexed sourceTribeId, uint256 indexed targetTribeId);
    event MergeCancelled(uint256 indexed requestId);

    // Core tribe management functions
    function createTribe(
        string calldata name,
        string calldata metadata,
        address[] calldata admins,
        JoinType joinType,
        uint256 entryFee,
        NFTRequirement[] calldata nftRequirements
    ) external returns (uint256);

    function updateTribeConfig(
        uint256 tribeId,
        JoinType joinType,
        uint256 entryFee,
        NFTRequirement[] calldata nftRequirements
    ) external;

    // Membership management
    function joinTribe(uint256 tribeId) external;
    function joinTribeWithCode(uint256 tribeId, bytes32 inviteCode) external;
    function requestToJoinTribe(uint256 tribeId) external payable;
    function approveMember(uint256 tribeId, address member) external;
    function rejectMember(uint256 tribeId, address member) external;
    function banMember(uint256 tribeId, address member) external;

    // Invite code management
    function createInviteCode(
        uint256 tribeId,
        string calldata code,
        uint256 maxUses,
        uint256 expiryTime
    ) external;
    
    function revokeInviteCode(uint256 tribeId, string calldata code) external;

    // Tribe merging functionality
    function requestMerge(uint256 sourceTribeId, uint256 targetTribeId) external;
    function approveMerge(uint256 mergeRequestId) external;
    function executeMerge(uint256 mergeRequestId) external;
    function cancelMerge(uint256 mergeRequestId) external;

    // View functions
    function getTribeConfigView(uint256 tribeId) external view returns (TribeConfigView memory);
    function getTribeAdmin(uint256 tribeId) external view returns (address);
    function getMemberStatus(uint256 tribeId, address member) external view returns (MemberStatus);
    function getMergeRequest(uint256 requestId) external view returns (MergeRequest memory);
    function getInviteCodeStatus(uint256 tribeId, string calldata code) external view returns (bool valid, uint256 remainingUses);
    function getMemberCount(uint256 tribeId) external view returns (uint256);
    function getTribeWhitelist(uint256 tribeId) external view returns (address[] memory);

    // Get all tribes a user is a member of
    function getUserTribes(address user) external view returns (uint256[] memory tribeIds);
} 