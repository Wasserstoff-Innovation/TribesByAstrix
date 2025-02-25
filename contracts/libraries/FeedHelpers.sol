// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

library FeedHelpers {
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

    function validatePostData(PostData memory post) internal pure returns (bool) {
        return bytes(post.metadata).length > 0 &&
               post.creator != address(0) &&
               post.tribeId > 0;
    }

    function isPostAccessible(
        PostData memory post,
        address viewer,
        mapping(uint256 => mapping(address => bool)) storage authorizedViewers
    ) internal view returns (bool) {
        if (post.isDeleted) return false;
        if (authorizedViewers[post.id][viewer]) return true;
        if (post.creator == viewer) return true;
        return true;
    }

    function getPaginatedPosts(
        uint256[] storage allPosts,
        mapping(uint256 => PostData) storage postData,
        uint256 offset,
        uint256 limit
    ) internal view returns (uint256[] memory postIds, uint256 total) {
        total = 0;
        
        // Count only non-deleted posts
        for (uint256 i = 0; i < allPosts.length; i++) {
            if (!postData[allPosts[i]].isDeleted) {
                total++;
            }
        }
        
        if (offset >= total) {
            return (new uint256[](0), total);
        }
        
        uint256 end = offset + limit;
        if (end > total) {
            end = total;
        }
        
        uint256 resultLength = end - offset;
        postIds = new uint256[](resultLength);
        
        // Fill array with non-deleted posts
        uint256 currentIndex = 0;
        uint256 skipped = 0;
        for (uint256 i = 0; i < allPosts.length && currentIndex < resultLength; i++) {
            if (!postData[allPosts[i]].isDeleted) {
                if (skipped >= offset) {
                    postIds[currentIndex] = allPosts[i];
                    currentIndex++;
                } else {
                    skipped++;
                }
            }
        }
        
        return (postIds, total);
    }

    function sortPostsByTimestamp(
        uint256[] memory posts,
        mapping(uint256 => PostData) storage postData
    ) internal view {
        uint256 length = posts.length;
        for (uint256 i = 0; i < length - 1; i++) {
            for (uint256 j = 0; j < length - i - 1; j++) {
                if (postData[posts[j]].createdAt < postData[posts[j + 1]].createdAt) {
                    uint256 temp = posts[j];
                    posts[j] = posts[j + 1];
                    posts[j + 1] = temp;
                }
            }
        }
    }
} 