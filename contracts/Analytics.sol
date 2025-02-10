// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/ITribeController.sol";
import "./interfaces/IPointSystem.sol";

/**
 * @title Analytics
 * @dev Handles analytics and data queries for the tribe system
 */
contract Analytics {
    ITribeController public tribeController;
    IPointSystem public pointSystem;

    // Cached data structures for optimization
    mapping(uint256 => address[]) private tribeMembers;
    mapping(uint256 => uint256) private lastUpdateBlock;
    mapping(uint256 => mapping(address => uint256)) private memberActivityScores;
    
    uint256 private constant CACHE_VALIDITY_BLOCKS = 100; // Cache validity period
    uint256 private constant MAX_BATCH_SIZE = 100; // Maximum items per query

    constructor(address _tribeController, address _pointSystem) {
        tribeController = ITribeController(_tribeController);
        pointSystem = IPointSystem(_pointSystem);
    }

    /**
     * @dev Get paginated list of tribe members with their status
     */
    function getTribeMembers(
        uint256 tribeId,
        uint256 offset,
        uint256 limit
    ) external view returns (
        address[] memory members,
        ITribeController.MemberStatus[] memory statuses,
        uint256 total
    ) {
        require(limit <= MAX_BATCH_SIZE, "Batch size too large");
        
        // Get total member count
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
        uint256 count = 0;

        // Only iterate if we have cached members
        if (cachedMembers.length > 0) {
            for (uint256 i = offset; i < offset + actualLimit && i < cachedMembers.length; i++) {
                address member = cachedMembers[i];
                if (member != address(0)) {
                    members[count] = member;
                    statuses[count] = tribeController.getMemberStatus(tribeId, member);
                    count++;
                }
            }
        }

        // If we didn't get enough members from cache, fill with zeros
        while (count < actualLimit) {
            members[count] = address(0);
            statuses[count] = ITribeController.MemberStatus.NONE;
            count++;
        }
    }

    /**
     * @dev Get active tribes sorted by member count
     */
    function getPopularTribes(uint256 offset, uint256 limit) 
        external 
        view 
        returns (
            uint256[] memory tribeIds,
            uint256[] memory memberCounts,
            string[] memory names
        ) 
    {
        require(limit <= MAX_BATCH_SIZE, "Batch size too large");
        
        // Implementation would include sorting logic based on member counts
        // For now, returning placeholder data
        tribeIds = new uint256[](limit);
        memberCounts = new uint256[](limit);
        names = new string[](limit);
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

        // For now, activity score is just points
        // In the future, we can add more metrics like:
        // - Number of posts
        // - Number of interactions
        // - Time since last activity
        return points;
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

        // Get and sort members by activity score
        address[] storage cachedMembers = tribeMembers[tribeId];
        uint256 count = 0;

        // Only iterate if we have cached members
        if (cachedMembers.length > 0) {
            for (uint256 i = offset; i < offset + actualLimit && i < cachedMembers.length; i++) {
                address member = cachedMembers[i];
                if (member != address(0)) {
                    members[count] = member;
                    activityScores[count] = getMemberActivityScore(tribeId, member);
                    count++;
                }
            }
        }

        // If we didn't get enough members from cache, fill with zeros
        while (count < actualLimit) {
            members[count] = address(0);
            activityScores[count] = 0;
            count++;
        }

        // Sort by activity score (bubble sort for simplicity)
        for (uint256 i = 0; i < count - 1; i++) {
            for (uint256 j = 0; j < count - i - 1; j++) {
                if (activityScores[j] < activityScores[j + 1]) {
                    // Swap scores
                    uint256 tempScore = activityScores[j];
                    activityScores[j] = activityScores[j + 1];
                    activityScores[j + 1] = tempScore;
                    
                    // Swap addresses
                    address tempAddr = members[j];
                    members[j] = members[j + 1];
                    members[j + 1] = tempAddr;
                }
            }
        }
    }

    /**
     * @dev Update member cache for a tribe
     */
    function updateMemberCache(uint256 tribeId) external {
        if (block.number - lastUpdateBlock[tribeId] <= CACHE_VALIDITY_BLOCKS) {
            return;
        }

        // Clear existing cache
        delete tribeMembers[tribeId];
        
        // Rebuild cache
        uint256 total = tribeController.getMemberCount(tribeId);
        for (uint256 i = 0; i < total; i++) {
            // This is a simplified implementation
            // In production, you would want to batch this operation
            // and possibly use events to track members
            tribeMembers[tribeId].push(address(0)); // Placeholder
        }

        lastUpdateBlock[tribeId] = block.number;
    }
} 