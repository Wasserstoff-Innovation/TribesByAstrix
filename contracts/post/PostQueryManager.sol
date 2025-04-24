// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "../libraries/FeedHelpers.sol";
import "../libraries/PostHelpers.sol";
import "../interfaces/IPostMinter.sol";
import "./PostMinterBase.sol";

/**
 * @title PostQueryManager
 * @dev Handles post queries and feed operations
 */
contract PostQueryManager is PostMinterBase, PausableUpgradeable {
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
        __Pausable_init();
    }
    
    /**
     * @dev Get all posts from a specific tribe with pagination
     */
    function getPostsByTribe(
        uint256 tribeId,
        uint256 offset,
        uint256 limit
    ) external view returns (uint256[] memory postIds, uint256 total) {
        return feedManager.getPostsByTribe(tribeId, offset, limit);
    }
    
    /**
     * @dev Get all posts from a specific user with pagination
     */
    function getPostsByUser(
        address user,
        uint256 offset,
        uint256 limit
    ) external view returns (uint256[] memory postIds, uint256 total) {
        return feedManager.getPostsByUser(user, offset, limit);
    }
    
    /**
     * @dev Get posts from a specific user in a specific tribe with pagination
     */
    function getPostsByTribeAndUser(
        uint256 tribeId,
        address user,
        uint256 offset,
        uint256 limit
    ) external view returns (uint256[] memory postIds, uint256 total) {
        return feedManager.getPostsByTribeAndUser(tribeId, user, offset, limit);
    }
    
    /**
     * @dev Get a feed of posts for a specific user with pagination
     */
    function getFeedForUser(
        address user,
        uint256 offset,
        uint256 limit
    ) external view returns (uint256[] memory postIds, uint256 total) {
        return feedManager.getFeedForUser(user, offset, limit);
    }
    
    /**
     * @dev Validate metadata format and content
     */
    function validateMetadata(string memory metadata, IPostMinter.PostType postType) public pure returns (bool) {
        bytes memory metadataBytes = bytes(metadata);
        
        // Validate basic format
        if (metadataBytes.length == 0) revert PostErrors.EmptyMetadata();
        if (metadataBytes[0] != "{" || metadataBytes[metadataBytes.length - 1] != "}") revert PostErrors.InvalidJsonFormat();
        
        // Check for required fields
        if (!PostHelpers.containsField(metadataBytes, "\"title\"")) {
            revert PostErrors.MissingTitleField();
        }
        
        if (!PostHelpers.containsField(metadataBytes, "\"content\"")) {
            revert PostErrors.MissingContentField();
        }
        
        // Check for post-type specific fields
        if (postType == IPostMinter.PostType.EVENT) {
            if (!PostHelpers.containsField(metadataBytes, "\"type\":\"EVENT\"")) {
                revert PostErrors.InvalidPostType();
            }
            if (!PostHelpers.containsField(metadataBytes, "\"eventDetails\"")) {
                revert PostErrors.InvalidPostType();
            }
        } else if (postType == IPostMinter.PostType.RICH_MEDIA) {
            if (!PostHelpers.containsField(metadataBytes, "\"type\":\"RICH_MEDIA\"")) {
                revert PostErrors.InvalidPostType();
            }
            if (!PostHelpers.containsField(metadataBytes, "\"mediaContent\"")) {
                revert PostErrors.InvalidPostType();
            }
        } else if (postType == IPostMinter.PostType.PROJECT_UPDATE) {
            if (!PostHelpers.containsField(metadataBytes, "\"type\":\"PROJECT_UPDATE\"") && 
                !PostHelpers.containsField(metadataBytes, "\"type\":\"PROJECT\"")) {
                revert PostErrors.InvalidPostType();
            }
            if (!PostHelpers.containsField(metadataBytes, "\"projectDetails\"")) {
                revert PostErrors.InvalidPostType();
            }
        } else if (postType == IPostMinter.PostType.POLL) {
            if (!PostHelpers.containsField(metadataBytes, "\"type\":\"POLL\"")) {
                revert PostErrors.InvalidPostType();
            }
            if (!PostHelpers.containsField(metadataBytes, "\"options\"")) {
                revert PostErrors.InvalidPostType();
            }
        } else if (postType == IPostMinter.PostType.COMMUNITY_UPDATE) {
            if (!PostHelpers.containsField(metadataBytes, "\"type\":\"COMMUNITY_UPDATE\"")) {
                revert PostErrors.InvalidPostType();
            }
            if (!PostHelpers.containsField(metadataBytes, "\"communityDetails\"")) {
                revert PostErrors.InvalidPostType();
            }
        } else if (postType == IPostMinter.PostType.ENCRYPTED) {
            if (!PostHelpers.containsField(metadataBytes, "\"type\":\"ENCRYPTED\"")) {
                revert PostErrors.InvalidPostType();
            }
        } else if (postType == IPostMinter.PostType.TEXT) {
            if (PostHelpers.containsField(metadataBytes, "\"type\"") && 
                !PostHelpers.containsField(metadataBytes, "\"type\":\"TEXT\"")) {
                revert PostErrors.InvalidPostType();
            }
        }

        // Check for empty values in required fields
        if (PostHelpers.hasEmptyValue(metadataBytes, "\"title\"") || 
            PostHelpers.hasEmptyValue(metadataBytes, "\"content\"")) {
            revert PostErrors.InvalidMetadata();
        }

        return true;
    }
    
    /**
     * @dev Pause all posting operations
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }
    
    /**
     * @dev Unpause all posting operations
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
    
    /**
     * @dev Simple test function for gas estimation
     */
    function testCreate() external pure returns (uint256) {
        return 42;
    }
} 