// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "./interfaces/IRoleManager.sol";
import "./interfaces/ITribeController.sol";
import "./interfaces/ICollectibleController.sol";
import "./interfaces/IPostMinter.sol";

/**
 * @title DummyPostMinter
 * @dev Lightweight implementation of PostMinter for testing
 * Implements only the essential functionality to make tests pass
 */
contract DummyPostMinter is IPostMinter, Initializable, AccessControlUpgradeable, UUPSUpgradeable {
    // Constants
    bytes32 public constant PROJECT_CREATOR_ROLE = keccak256("PROJECT_CREATOR_ROLE");
    bytes32 public constant RATE_LIMIT_MANAGER_ROLE = keccak256("RATE_LIMIT_MANAGER_ROLE");

    // Core contracts
    IRoleManager public roleManager;
    ITribeController public tribeController;
    ICollectibleController public collectibleController;
    address public feedManager;

    // Post storage
    uint256 public nextPostId;
    mapping(uint256 => PostData) private posts;
    mapping(uint256 => mapping(InteractionType => uint256)) private interactionCounts;
    mapping(uint256 => mapping(address => mapping(InteractionType => bool))) private hasInteracted;
    mapping(address => mapping(PostType => uint256)) public lastPostTimeByType;
    mapping(uint256 => uint256) public reportCount;

    // Struct to represent post data
    struct PostData {
        uint256 id;
        address creator;
        uint256 tribeId;
        string metadata;
        bool isGated;
        address collectibleContract;
        uint256 collectibleId;
        bool isEncrypted;
        bytes32 encryptionKeyHash;
        address accessSigner;
        uint256 parentPostId;
        uint256 createdAt;
        bool isDeleted;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initializes the contract
     */
    function initialize(
        address _roleManager,
        address _tribeController,
        address _collectibleController,
        address _feedManager
    ) public initializer {
        __AccessControl_init();
        __UUPSUpgradeable_init();
        
        roleManager = IRoleManager(_roleManager);
        tribeController = ITribeController(_tribeController);
        collectibleController = ICollectibleController(_collectibleController);
        feedManager = _feedManager;
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(RATE_LIMIT_MANAGER_ROLE, msg.sender);
        _grantRole(PROJECT_CREATOR_ROLE, msg.sender);
    }

    /**
     * @dev Function that should revert when `msg.sender` is not authorized to upgrade the contract.
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}

    // Implement key functions needed for tests
    function createPost(
        uint256 tribeId,
        string memory metadata,
        bool isGated,
        address collectibleContract,
        uint256 collectibleId
    ) external override returns (uint256) {
        // Basic validation
        require(bytes(metadata).length > 0, "EmptyMetadata");
        require(tribeController.getMemberStatus(tribeId, msg.sender) == ITribeController.MemberStatus.ACTIVE, "NotTribeMember");

        uint256 postId = nextPostId++;
        
        posts[postId] = PostData({
            id: postId,
            creator: msg.sender,
            tribeId: tribeId,
            metadata: metadata,
            isGated: isGated,
            collectibleContract: collectibleContract,
            collectibleId: collectibleId,
            isEncrypted: false,
            encryptionKeyHash: bytes32(0),
            accessSigner: address(0),
            parentPostId: 0,
            createdAt: block.timestamp,
            isDeleted: false
        });
        
        lastPostTimeByType[msg.sender][PostType.TEXT] = block.timestamp;
        
        emit PostCreated(postId, tribeId, msg.sender, metadata);
        return postId;
    }

    function deletePost(uint256 postId) external override {
        require(posts[postId].creator == msg.sender || hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "NotPostCreator");
        require(!posts[postId].isDeleted, "PostAlreadyDeleted");
        
        posts[postId].isDeleted = true;
        
        emit PostDeleted(postId, msg.sender);
    }

    function reportPost(uint256 postId, string calldata reason) external override {
        require(!hasInteracted[postId][msg.sender][InteractionType.REPORT], "AlreadyReported");
        require(!posts[postId].isDeleted, "PostDeleted");
        
        hasInteracted[postId][msg.sender][InteractionType.REPORT] = true;
        reportCount[postId]++;
        
        emit PostReported(postId, msg.sender, reason);
    }

    function interactWithPost(uint256 postId, InteractionType interactionType) external override {
        require(!posts[postId].isDeleted, "PostDeleted");
        require(posts[postId].creator != msg.sender, "CannotInteractWithOwnPost");
        require(!hasInteracted[postId][msg.sender][interactionType], "AlreadyInteracted");
        
        hasInteracted[postId][msg.sender][interactionType] = true;
        interactionCounts[postId][interactionType]++;
        
        emit PostInteraction(postId, msg.sender, interactionType);
    }

    function getPost(uint256 postId) external view returns (
        uint256 id,
        address creator,
        uint256 tribeId,
        string memory metadata,
        bool isGated,
        address collectibleContract,
        uint256 collectibleId,
        bool isEncrypted,
        address accessSigner
    ) {
        PostData storage post = posts[postId];
        return (
            post.id,
            post.creator,
            post.tribeId,
            post.metadata,
            post.isGated,
            post.collectibleContract,
            post.collectibleId,
            post.isEncrypted,
            post.accessSigner
        );
    }

    function getInteractionCount(uint256 postId, InteractionType interactionType) external view override returns (uint256) {
        return interactionCounts[postId][interactionType];
    }

    function getPostsByTribe(
        uint256 tribeId,
        uint256 offset,
        uint256 limit
    ) external view override returns (
        uint256[] memory postIds,
        uint256 total
    ) {
        // Simple implementation for tests
        uint256 count = 0;
        for (uint256 i = 0; i < nextPostId; i++) {
            if (posts[i].tribeId == tribeId && !posts[i].isDeleted) {
                count++;
            }
        }
        
        total = count;
        uint256 resultsCount = (offset + limit > count) ? (count > offset ? count - offset : 0) : limit;
        postIds = new uint256[](resultsCount);
        
        uint256 current = 0;
        uint256 added = 0;
        for (uint256 i = 0; i < nextPostId && added < resultsCount; i++) {
            if (posts[i].tribeId == tribeId && !posts[i].isDeleted) {
                if (current >= offset) {
                    postIds[added++] = i;
                }
                current++;
            }
        }
        
        return (postIds, total);
    }

    function getPostsByUser(
        address user,
        uint256 offset,
        uint256 limit
    ) external view override returns (
        uint256[] memory postIds,
        uint256 total
    ) {
        // Simple implementation for tests
        uint256 count = 0;
        for (uint256 i = 0; i < nextPostId; i++) {
            if (posts[i].creator == user && !posts[i].isDeleted) {
                count++;
            }
        }
        
        total = count;
        uint256 resultsCount = (offset + limit > count) ? (count > offset ? count - offset : 0) : limit;
        postIds = new uint256[](resultsCount);
        
        uint256 current = 0;
        uint256 added = 0;
        for (uint256 i = 0; i < nextPostId && added < resultsCount; i++) {
            if (posts[i].creator == user && !posts[i].isDeleted) {
                if (current >= offset) {
                    postIds[added++] = i;
                }
                current++;
            }
        }
        
        return (postIds, total);
    }

    // Stub implementations for required interface functions
    function createReply(uint256 parentPostId, string memory metadata, bool isGated, address collectibleContract, uint256 collectibleId) external override returns (uint256) { return 0; }
    function createEncryptedPost(uint256 tribeId, string memory metadata, bytes32 encryptionKeyHash, address accessSigner) external override returns (uint256) { return 0; }
    function createSignatureGatedPost(uint256 tribeId, string memory metadata, bytes32 encryptionKeyHash, address accessSigner, address collectibleContract, uint256 collectibleId) external override returns (uint256) { return 0; }
    function authorizeViewer(uint256 postId, address viewer) external override {}
    function setTribeEncryptionKey(uint256 tribeId, bytes32 encryptionKey) external override {}
    function canViewPost(uint256 postId, address viewer) external view override returns (bool) { return true; }
    function getPostDecryptionKey(uint256 postId, address viewer) external view override returns (bytes32) { return bytes32(0); }
    function verifyPostAccess(uint256 postId, address viewer, bytes memory signature) external view override returns (bool) { return true; }
    function getPostReplies(uint256 postId) external view override returns (uint256[] memory) { return new uint256[](0); }
    function generatePostKey(uint256 postId) external view override returns (bytes32) { return bytes32(0); }
    function deriveSharedKey(uint256 tribeId, address member) external view override returns (bytes32) { return bytes32(0); }
    function pause() external override {}
    function unpause() external override {}
    function getPostsByTribeAndUser(uint256 tribeId, address user, uint256 offset, uint256 limit) external view override returns (uint256[] memory, uint256) { return (new uint256[](0), 0); }
    function getFeedForUser(address user, uint256 offset, uint256 limit) external view override returns (uint256[] memory, uint256) { return (new uint256[](0), 0); }
    function createBatchPosts(uint256 tribeId, BatchPostData[] calldata posts) external override returns (uint256[] memory) { return new uint256[](0); }
    function setPostTypeCooldown(PostType postType, uint256 cooldown) external override {}
    function getPostTypeCooldown(PostType postType) external view override returns (uint256) { return 60; }
    function validateMetadata(string memory metadata, PostType postType) external pure override returns (bool) { return true; }
    function getRemainingCooldown(address user, PostType postType) external view override returns (uint256) { return 0; }
    function getBatchPostingLimits() external view override returns (uint256, uint256) { return (5, 300); }
} 