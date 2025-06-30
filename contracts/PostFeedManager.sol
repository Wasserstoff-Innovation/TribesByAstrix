// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./libraries/FeedHelpers.sol";
import "./interfaces/ITribeController.sol";

contract PostFeedManager is AccessControl {
    using FeedHelpers for uint256[];

    // Feed storage
    mapping(uint256 => uint256[]) private _tribePostIds;
    mapping(address => uint256[]) private _userPostIds;
    mapping(uint256 => mapping(address => uint256[])) private _tribeUserPostIds;
    mapping(uint256 => FeedHelpers.PostData) public posts;

    ITribeController public immutable tribeController;

    constructor(address _tribeController) {
        tribeController = ITribeController(_tribeController);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function addPost(FeedHelpers.PostData memory post) external {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Not authorized");
        posts[post.id] = post;
        _tribePostIds[post.tribeId].push(post.id);
        _userPostIds[post.creator].push(post.id);
        _tribeUserPostIds[post.tribeId][post.creator].push(post.id);
    }

    function getPostsByTribe(
        uint256 tribeId,
        uint256 offset,
        uint256 limit
    ) external view returns (uint256[] memory postIds, uint256 total) {
        return FeedHelpers.getPaginatedPosts(_tribePostIds[tribeId], posts, offset, limit);
    }

    function getPostsByUser(
        address user,
        uint256 offset,
        uint256 limit
    ) external view returns (uint256[] memory postIds, uint256 total) {
        return FeedHelpers.getPaginatedPosts(_userPostIds[user], posts, offset, limit);
    }

    function getPostsByTribeAndUser(
        uint256 tribeId,
        address user,
        uint256 offset,
        uint256 limit
    ) external view returns (uint256[] memory postIds, uint256 total) {
        return FeedHelpers.getPaginatedPosts(_tribeUserPostIds[tribeId][user], posts, offset, limit);
    }

    function getFeedForUser(
        address user,
        uint256 offset,
        uint256 limit
    ) external view returns (uint256[] memory postIds, uint256 total) {
        // Get all tribes the user is a member of
        uint256[] memory userTribes = tribeController.getUserTribes(user);
        
        // First pass: count total posts
        total = 0;
        for (uint256 i = 0; i < userTribes.length; i++) {
            total += _tribePostIds[userTribes[i]].length;
        }
        
        if (offset >= total || limit == 0) {
            return (new uint256[](0), total);
        }
        
        // Create arrays to store all posts and their timestamps
        uint256[] memory allPosts = new uint256[](total);
        uint256[] memory timestamps = new uint256[](total);
        uint256 currentIndex = 0;
        
        // Second pass: collect all posts and timestamps
        for (uint256 i = 0; i < userTribes.length; i++) {
            uint256[] storage tribePosts = _tribePostIds[userTribes[i]];
            for (uint256 j = 0; j < tribePosts.length; j++) {
                allPosts[currentIndex] = tribePosts[j];
                timestamps[currentIndex] = posts[tribePosts[j]].createdAt;
                currentIndex++;
            }
        }
        
        // Sort posts by timestamp
        FeedHelpers.sortPostsByTimestamp(allPosts, posts);
        
        // Return paginated results
        uint256 end = offset + limit > total ? total : offset + limit;
        uint256 resultLength = end - offset;
        postIds = new uint256[](resultLength);
        
        for (uint256 i = 0; i < resultLength; i++) {
            postIds[i] = allPosts[offset + i];
        }
        
        return (postIds, total);
    }

    function markPostDeleted(uint256 postId) external {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Not authorized");
        posts[postId].isDeleted = true;
    }

    function getPost(uint256 postId) external view returns (FeedHelpers.PostData memory) {
        return posts[postId];
    }
} 