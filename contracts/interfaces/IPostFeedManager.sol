// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

/**
 * @title IPostFeedManager
 * @dev Interface for the PostFeedManager contract
 */
interface IPostFeedManager {
    /**
     * @dev Add a post to user feed
     * @param postId Post ID to add
     * @param user User address to add the post for
     */
    function addPostToUserFeed(uint256 postId, address user) external;
    
    /**
     * @dev Add a post to tribe feed
     * @param tribeId Tribe ID to add the post to
     * @param postId Post ID to add
     */
    function addPostToTribeFeed(uint256 tribeId, uint256 postId) external;
} 