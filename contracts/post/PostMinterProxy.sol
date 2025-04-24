// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "../interfaces/IPostMinter.sol";
import "../libraries/PostErrors.sol";
import "./PostCreationManager.sol";
import "./PostEncryptionManager.sol";
import "./PostInteractionManager.sol";
import "./PostQueryManager.sol";

/**
 * @title PostMinterProxy
 * @dev Main contract that delegates calls to specialized post manager contracts
 */
contract PostMinterProxy is Initializable, AccessControlUpgradeable, UUPSUpgradeable, IPostMinter {
    // Sub-manager contracts
    PostCreationManager public creationManager;
    PostEncryptionManager public encryptionManager;
    PostInteractionManager public interactionManager;
    PostQueryManager public queryManager;
    
    // Events and constants defined in IPostMinter
    bytes32 public constant RATE_LIMIT_MANAGER_ROLE = keccak256("RATE_LIMIT_MANAGER_ROLE");
    bytes32 public constant PROJECT_CREATOR_ROLE = keccak256("PROJECT_CREATOR_ROLE");
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
    
    /**
     * @dev Initializes the proxy and deploys all sub-managers
     */
    function initialize(
        address _roleManager,
        address _tribeController,
        address _collectibleController,
        address _feedManager,
        address _creationManager,
        address _encryptionManager,
        address _interactionManager,
        address _queryManager
    ) public initializer {
        __AccessControl_init();
        __UUPSUpgradeable_init();
        
        // Setup managers
        creationManager = PostCreationManager(_creationManager);
        encryptionManager = PostEncryptionManager(_encryptionManager);
        interactionManager = PostInteractionManager(_interactionManager);
        queryManager = PostQueryManager(_queryManager);
        
        // Grant admin role to deployer
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(RATE_LIMIT_MANAGER_ROLE, msg.sender);
        _grantRole(PROJECT_CREATOR_ROLE, msg.sender);
    }
    
    /**
     * @dev Function that should revert when `msg.sender` is not authorized to upgrade the contract.
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}
    
    // ========== POST CREATION FUNCTIONS ==========
    
    function createPost(
        uint256 tribeId,
        string memory metadata,
        bool isGated,
        address collectibleContract,
        uint256 collectibleId
    ) external override returns (uint256) {
        return creationManager.createPost(tribeId, metadata, isGated, collectibleContract, collectibleId);
    }
    
    function createReply(
        uint256 parentPostId,
        string memory metadata,
        bool isGated,
        address collectibleContract,
        uint256 collectibleId
    ) external override returns (uint256) {
        return creationManager.createReply(parentPostId, metadata, isGated, collectibleContract, collectibleId);
    }
    
    function createBatchPosts(
        uint256 tribeId,
        BatchPostData[] calldata posts
    ) external override returns (uint256[] memory) {
        return creationManager.createBatchPosts(tribeId, posts);
    }
    
    function deletePost(uint256 postId) external override {
        creationManager.deletePost(postId);
    }
    
    function reportPost(uint256 postId, string calldata reason) external override {
        creationManager.reportPost(postId, reason);
    }
    
    // ========== ENCRYPTED POST FUNCTIONS ==========
    
    function createEncryptedPost(
        uint256 tribeId,
        string memory metadata,
        bytes32 encryptionKeyHash,
        address accessSigner
    ) external override returns (uint256) {
        return encryptionManager.createEncryptedPost(tribeId, metadata, encryptionKeyHash, accessSigner);
    }
    
    function createSignatureGatedPost(
        uint256 tribeId,
        string memory metadata,
        bytes32 encryptionKeyHash,
        address accessSigner,
        address collectibleContract,
        uint256 collectibleId
    ) external override returns (uint256) {
        return encryptionManager.createSignatureGatedPost(
            tribeId, 
            metadata, 
            encryptionKeyHash, 
            accessSigner, 
            collectibleContract, 
            collectibleId
        );
    }
    
    function authorizeViewer(uint256 postId, address viewer) external override {
        encryptionManager.authorizeViewer(postId, viewer);
    }
    
    function setTribeEncryptionKey(uint256 tribeId, bytes32 encryptionKey) external override {
        encryptionManager.setTribeEncryptionKey(tribeId, encryptionKey);
    }
    
    function canViewPost(uint256 postId, address viewer) public view override returns (bool) {
        return encryptionManager.canViewPost(postId, viewer);
    }
    
    function getPostDecryptionKey(uint256 postId, address viewer) external view override returns (bytes32) {
        return encryptionManager.getPostDecryptionKey(postId, viewer);
    }
    
    function verifyPostAccess(
        uint256 postId,
        address viewer,
        bytes memory signature
    ) external view override returns (bool) {
        return encryptionManager.verifyPostAccess(postId, viewer, signature);
    }
    
    function generatePostKey(uint256 postId) public view override returns (bytes32) {
        return encryptionManager.generatePostKey(postId);
    }
    
    function deriveSharedKey(uint256 tribeId, address member) public view override returns (bytes32) {
        return encryptionManager.deriveSharedKey(tribeId, member);
    }
    
    // ========== INTERACTION FUNCTIONS ==========
    
    function interactWithPost(uint256 postId, InteractionType interactionType) external override {
        interactionManager.interactWithPost(postId, interactionType);
    }
    
    function getInteractionCount(uint256 postId, InteractionType interactionType) external view override returns (uint256) {
        return interactionManager.getInteractionCount(postId, interactionType);
    }
    
    function getPostReplies(uint256 postId) external view override returns (uint256[] memory) {
        return interactionManager.getPostReplies(postId);
    }
    
    function getPost(uint256 postId) external view override returns (
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
        return interactionManager.getPost(postId);
    }
    
    // ========== QUERY FUNCTIONS ==========
    
    function getPostsByTribe(
        uint256 tribeId,
        uint256 offset,
        uint256 limit
    ) external view override returns (uint256[] memory postIds, uint256 total) {
        return queryManager.getPostsByTribe(tribeId, offset, limit);
    }
    
    function getPostsByUser(
        address user,
        uint256 offset,
        uint256 limit
    ) external view override returns (uint256[] memory postIds, uint256 total) {
        return queryManager.getPostsByUser(user, offset, limit);
    }
    
    function getPostsByTribeAndUser(
        uint256 tribeId,
        address user,
        uint256 offset,
        uint256 limit
    ) external view override returns (uint256[] memory postIds, uint256 total) {
        return queryManager.getPostsByTribeAndUser(tribeId, user, offset, limit);
    }
    
    function getFeedForUser(
        address user,
        uint256 offset,
        uint256 limit
    ) external view override returns (uint256[] memory postIds, uint256 total) {
        return queryManager.getFeedForUser(user, offset, limit);
    }
    
    // ========== ADMIN FUNCTIONS ==========
    
    function pause() external override onlyRole(DEFAULT_ADMIN_ROLE) {
        queryManager.pause();
    }
    
    function unpause() external override onlyRole(DEFAULT_ADMIN_ROLE) {
        queryManager.unpause();
    }
    
    // ========== RATE LIMIT FUNCTIONS ==========
    
    function setPostTypeCooldown(PostType postType, uint256 cooldown) external override onlyRole(RATE_LIMIT_MANAGER_ROLE) {
        // We can delegate to any manager, but we choose creationManager for this
        creationManager.setPostTypeCooldown(postType, cooldown);
    }
    
    function getPostTypeCooldown(PostType postType) external view override returns (uint256) {
        return creationManager.getPostTypeCooldown(postType);
    }
    
    function getRemainingCooldown(address user, PostType postType) external view override returns (uint256) {
        return creationManager.getRemainingCooldown(user, postType);
    }
    
    function getBatchPostingLimits() external view override returns (uint256 maxBatchSize, uint256 batchCooldown) {
        return creationManager.getBatchPostingLimits();
    }

    /**
     * @dev Validate metadata format and content
     */
    function validateMetadata(string memory metadata, PostType postType) external pure override returns (bool) {
        // Delegate to queryManager implementation with a static call
        // Since this is a pure function, we have to reimplement it here
        
        bytes memory metadataBytes = bytes(metadata);
        
        // Validate basic format
        if (metadataBytes.length == 0) revert PostErrors.EmptyMetadata();
        if (metadataBytes[0] != "{" || metadataBytes[metadataBytes.length - 1] != "}") 
            revert PostErrors.InvalidJsonFormat();
        
        // Check for required fields - using PostHelpers
        // This is a simplified implementation
        return true;
    }
} 