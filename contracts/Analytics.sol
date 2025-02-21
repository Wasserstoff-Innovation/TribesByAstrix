// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/ITribeController.sol";
import "./interfaces/IPointSystem.sol";
import "./interfaces/IPostMinter.sol";

/**
 * @title Analytics
 * @dev Handles analytics and data queries for the tribe system
 */
contract Analytics {
    ITribeController public tribeController;
    IPointSystem public pointSystem;
    IPostMinter public postMinter;

    // Cached data structures for optimization
    mapping(uint256 => address[]) private tribeMembers;
    mapping(uint256 => uint256) private lastUpdateBlock;
    mapping(uint256 => mapping(address => uint256)) private memberActivityScores;
    
    uint256 private constant CACHE_VALIDITY_BLOCKS = 100; // Cache validity period
    uint256 private constant MAX_BATCH_SIZE = 100; // Maximum items per query

    constructor(address _tribeController, address _pointSystem, address _postMinter) {
        tribeController = ITribeController(_tribeController);
        pointSystem = IPointSystem(_pointSystem);
        postMinter = IPostMinter(_postMinter);
    }

    /**
     * @dev Get paginated list of tribe members with their status
     */
    function getTribeMembers(
        uint256 tribeId,
        uint256 offset,
        uint256 limit
    ) external returns (
        address[] memory members,
        ITribeController.MemberStatus[] memory statuses,
        uint256 total
    ) {
        require(limit <= MAX_BATCH_SIZE, "Batch size too large");
        
        // Get total member count from TribeController
        total = tribeController.getMemberCount(tribeId);
        if (offset >= total) {
            return (new address[](0), new ITribeController.MemberStatus[](0), total);
        }

        // Calculate actual limit
        uint256 actualLimit = (offset + limit > total) ? total - offset : limit;
        members = new address[](actualLimit);
        statuses = new ITribeController.MemberStatus[](actualLimit);

        // Get members from cache or direct query
        address[] storage cachedMembers = tribeMembers[tribeId];
        if (block.number - lastUpdateBlock[tribeId] > CACHE_VALIDITY_BLOCKS) {
            updateMemberCache(tribeId);
            cachedMembers = tribeMembers[tribeId];
        }

        // Fill arrays with member data
        uint256 currentIndex = 0;
        for (uint256 i = offset; i < offset + actualLimit && i < cachedMembers.length; i++) {
            if (cachedMembers[i] != address(0)) {
                ITribeController.MemberStatus status = tribeController.getMemberStatus(tribeId, cachedMembers[i]);
                if (status == ITribeController.MemberStatus.ACTIVE) {
                    members[currentIndex] = cachedMembers[i];
                    statuses[currentIndex] = status;
                    currentIndex++;
                }
            }
        }

        // Resize arrays if needed
        if (currentIndex < actualLimit) {
            assembly {
                mstore(members, currentIndex)
                mstore(statuses, currentIndex)
            }
        }

        return (members, statuses, total);
    }

    /**
     * @dev Get active tribes sorted by member count
     */
    function getPopularTribes(
        uint256 /* offset */,
        uint256 limit
    ) external pure returns (
        uint256[] memory tribeIds,
        uint256[] memory memberCounts,
        string[] memory names
    ) {
        require(limit <= MAX_BATCH_SIZE, "Batch size too large");
        
        // Return empty arrays for now
        tribeIds = new uint256[](0);
        memberCounts = new uint256[](0);
        names = new string[](0);
        return (tribeIds, memberCounts, names);
    }

    /**
     * @dev Get member activity score based on points and engagement
     */
    function getMemberActivityScore(uint256 tribeId, address member) 
        public 
        view 
        returns (uint256) 
    {
        // Check if member is active
        if (tribeController.getMemberStatus(tribeId, member) != ITribeController.MemberStatus.ACTIVE) {
            return 0;
        }

        // Get points from PointSystem
        uint256 points = pointSystem.getMemberPoints(tribeId, member);
        
        // Get interaction counts
        (uint256[] memory postIds, uint256 postCount) = postMinter.getPostsByTribeAndUser(tribeId, member, 0, 1000);
        
        // Get total interactions across all posts
        uint256 commentCount = 0;
        uint256 likeCount = 0;
        for (uint256 i = 0; i < postIds.length; i++) {
            commentCount += postMinter.getInteractionCount(postIds[i], IPostMinter.InteractionType.COMMENT);
            likeCount += postMinter.getInteractionCount(postIds[i], IPostMinter.InteractionType.LIKE);
        }
        
        // Calculate activity score
        uint256 activityScore = points;
        activityScore += postCount * 100;    // 100 points per post
        activityScore += commentCount * 20;   // 20 points per comment
        activityScore += likeCount * 5;       // 5 points per like
        
        return activityScore;
    }

    /**
     * @dev Update member cache for a tribe
     */
    function updateMemberCache(uint256 tribeId) public {
        if (block.number - lastUpdateBlock[tribeId] <= CACHE_VALIDITY_BLOCKS) {
            return;
        }

        // Clear existing cache
        delete tribeMembers[tribeId];
        
        // Get total member count
        uint256 total = tribeController.getMemberCount(tribeId);
        
        // Get tribe admin first
        address admin = tribeController.getTribeAdmin(tribeId);
        if (tribeController.getMemberStatus(tribeId, admin) == ITribeController.MemberStatus.ACTIVE) {
            tribeMembers[tribeId].push(admin);
            memberActivityScores[tribeId][admin] = getMemberActivityScore(tribeId, admin);
        }
        
        // Get all members from tribe
        address[] memory allMembers = tribeController.getTribeWhitelist(tribeId);
        for (uint256 i = 0; i < allMembers.length; i++) {
            if (allMembers[i] != admin && 
                tribeController.getMemberStatus(tribeId, allMembers[i]) == ITribeController.MemberStatus.ACTIVE) {
                tribeMembers[tribeId].push(allMembers[i]);
                memberActivityScores[tribeId][allMembers[i]] = getMemberActivityScore(tribeId, allMembers[i]);
            }
        }

        lastUpdateBlock[tribeId] = block.number;
    }

    function _isMemberInCache(uint256 tribeId, address member) internal view returns (bool) {
        for (uint256 i = 0; i < tribeMembers[tribeId].length; i++) {
            if (tribeMembers[tribeId][i] == member) {
                return true;
            }
        }
        return false;
    }

    /**
     * @dev Get most active members in a tribe
     */
    function getMostActiveMembers(
        uint256 tribeId,
        uint256 offset,
        uint256 limit
    ) external view returns (
        address[] memory members,
        uint256[] memory activityScores
    ) {
        require(limit <= MAX_BATCH_SIZE, "Batch size too large");
        
        // Get total members
        uint256 total = tribeController.getMemberCount(tribeId);
        if (offset >= total) {
            return (new address[](0), new uint256[](0));
        }

        // Calculate actual limit
        uint256 actualLimit = (offset + limit > total) ? total - offset : limit;
        members = new address[](actualLimit);
        activityScores = new uint256[](actualLimit);

        // Get members from cache
        address[] storage cachedMembers = tribeMembers[tribeId];
        
        // Fill arrays with member data and scores
        uint256 currentIndex = 0;
        for (uint256 i = 0; i < cachedMembers.length && currentIndex < actualLimit; i++) {
            if (cachedMembers[i] != address(0)) {
                members[currentIndex] = cachedMembers[i];
                activityScores[currentIndex] = memberActivityScores[tribeId][cachedMembers[i]];
                currentIndex++;
            }
        }

        // Resize arrays if needed
        if (currentIndex < actualLimit) {
            assembly {
                mstore(members, currentIndex)
                mstore(activityScores, currentIndex)
            }
        }

        return (members, activityScores);
    }
} 