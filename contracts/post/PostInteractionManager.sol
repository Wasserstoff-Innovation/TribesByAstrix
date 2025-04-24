// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "../libraries/InteractionHelpers.sol";
import "../libraries/FeedHelpers.sol";
import "../interfaces/IPostMinter.sol";
import "./PostMinterBase.sol";

/**
 * @title PostInteractionManager
 * @dev Handles post interactions like likes, comments, shares, etc.
 */
contract PostInteractionManager is PostMinterBase {
    using InteractionHelpers for *;
    
    // Events
    event PostInteraction(uint256 indexed postId, address indexed user, IPostMinter.InteractionType interactionType);
    
    // Interaction storage
    mapping(uint256 => mapping(address => mapping(IPostMinter.InteractionType => bool))) private hasInteracted;
    mapping(uint256 => mapping(IPostMinter.InteractionType => uint256)) private interactionCounts;
    
    /**
     * @dev Initializes the contract
     */
    function initialize(
        address _roleManager,
        address _tribeController,
        address _collectibleController,
        address _feedManager
    ) public initializer {
        __PostMinterBase_init(_roleManager, _tribeController, _collectibleController, _feedManager);
    }
    
    /**
     * @dev Interact with a post (like, comment, share, etc.)
     */
    function interactWithPost(uint256 postId, IPostMinter.InteractionType interactionType) external {
        FeedHelpers.PostData memory post = feedManager.getPost(postId);
        if (post.isDeleted) revert PostErrors.PostDeleted();
        if (post.creator == msg.sender) revert PostErrors.CannotInteractWithOwnPost();
        if (hasInteracted[postId][msg.sender][interactionType]) revert PostErrors.AlreadyInteracted();
        
        // Check if user can view post - use canViewPost from PostEncryptionManager
        // This is a simplified check for this contract
        if (tribeController.getMemberStatus(post.tribeId, msg.sender) != ITribeController.MemberStatus.ACTIVE) {
            revert PostErrors.InsufficientAccess();
        }
        
        // If post is gated, check collectible ownership
        if (post.isGated && post.collectibleContract != address(0)) {
            uint256 balance = ICollectibleController(post.collectibleContract).balanceOf(msg.sender, post.collectibleId);
            if (balance == 0) revert PostErrors.InsufficientAccess();
        }

        // Record interaction
        hasInteracted[postId][msg.sender][interactionType] = true;
        interactionCounts[postId][interactionType]++;
        
        emit PostInteraction(postId, msg.sender, interactionType);
    }
    
    /**
     * @dev Get number of interactions of a specific type for a post
     */
    function getInteractionCount(uint256 postId, IPostMinter.InteractionType interactionType) external view returns (uint256) {
        return interactionCounts[postId][interactionType];
    }
    
    /**
     * @dev Check if a user has interacted with a post
     */
    function hasUserInteracted(uint256 postId, address user, IPostMinter.InteractionType interactionType) external view returns (bool) {
        return hasInteracted[postId][user][interactionType];
    }
    
    /**
     * @dev Get replies to a post
     */
    function getPostReplies(uint256 postId) external view returns (uint256[] memory) {
        uint256[] memory replies = new uint256[](interactionCounts[postId][IPostMinter.InteractionType.REPLY]);
        uint256 count = 0;
        
        for (uint256 i = 0; i < nextPostId; i++) {
            FeedHelpers.PostData memory post = feedManager.getPost(i);
            if (post.parentPostId == postId && !post.isDeleted) {
                replies[count++] = i;
                if (count >= replies.length) break;
            }
        }
        
        return replies;
    }
    
    /**
     * @dev Get basic post details
     */
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
        FeedHelpers.PostData memory post = feedManager.getPost(postId);
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
} 