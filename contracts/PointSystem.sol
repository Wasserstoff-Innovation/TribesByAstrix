// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./interfaces/IRoleManager.sol";
import "./interfaces/ITribeController.sol";

contract PointSystem is AccessControl {
    IRoleManager public roleManager;
    ITribeController public tribeController;

    // Point action types
    bytes32 public constant POST_ACTION = keccak256("POST");
    bytes32 public constant COMMENT_ACTION = keccak256("COMMENT");
    bytes32 public constant LIKE_ACTION = keccak256("LIKE");
    bytes32 public constant QUIZ_ACTION = keccak256("QUIZ");
    bytes32 public constant POLL_ACTION = keccak256("POLL");
    bytes32 public constant CUSTOM_ACTION = keccak256("CUSTOM");

    // Tribe ID => Member address => Total points
    mapping(uint256 => mapping(address => uint256)) public memberPoints;
    
    // Tribe ID => Action type => Points value
    mapping(uint256 => mapping(bytes32 => uint256)) public actionPoints;

    // Tribe ID => Member address => Action type => Count
    mapping(uint256 => mapping(address => mapping(bytes32 => uint256))) public actionCounts;

    event PointsAwarded(uint256 indexed tribeId, address indexed member, uint256 points, bytes32 actionType);
    event PointsDeducted(uint256 indexed tribeId, address indexed member, uint256 points, string reason);
    event ActionPointsUpdated(uint256 indexed tribeId, bytes32 actionType, uint256 points);

    constructor(address _roleManager, address _tribeController) {
        roleManager = IRoleManager(_roleManager);
        tribeController = ITribeController(_tribeController);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    modifier onlyTribeAdmin(uint256 tribeId) {
        require(tribeController.getTribeAdmin(tribeId) == msg.sender, "Not tribe admin");
        _;
    }

    modifier onlyActiveMember(uint256 tribeId) {
        require(tribeController.getMemberStatus(tribeId, msg.sender) == ITribeController.MemberStatus.ACTIVE, "Not an active member");
        _;
    }

    function setActionPoints(
        uint256 tribeId,
        bytes32 actionType,
        uint256 points
    ) external onlyTribeAdmin(tribeId) {
        actionPoints[tribeId][actionType] = points;
        emit ActionPointsUpdated(tribeId, actionType, points);
    }

    function _awardPoints(
        uint256 tribeId,
        address member,
        uint256 points,
        bytes32 actionType
    ) internal {
        require(tribeController.getMemberStatus(tribeId, member) == ITribeController.MemberStatus.ACTIVE, "Not an active member");
        
        memberPoints[tribeId][member] += points;
        actionCounts[tribeId][member][actionType]++;
        
        emit PointsAwarded(tribeId, member, points, actionType);
    }

    function awardPoints(
        uint256 tribeId,
        address member,
        uint256 points,
        bytes32 actionType
    ) external onlyTribeAdmin(tribeId) {
        _awardPoints(tribeId, member, points, actionType);
    }

    function deductPoints(
        uint256 tribeId,
        address member,
        uint256 points,
        string memory reason
    ) external onlyTribeAdmin(tribeId) {
        require(memberPoints[tribeId][member] >= points, "Insufficient points");
        
        memberPoints[tribeId][member] -= points;
        emit PointsDeducted(tribeId, member, points, reason);
    }

    function getMemberPoints(uint256 tribeId, address member) external view returns (uint256) {
        return memberPoints[tribeId][member];
    }

    function getActionPoints(uint256 tribeId, bytes32 actionType) external view returns (uint256) {
        return actionPoints[tribeId][actionType];
    }

    function getActionCount(
        uint256 tribeId,
        address member,
        bytes32 actionType
    ) external view returns (uint256) {
        return actionCounts[tribeId][member][actionType];
    }

    function recordAction(
        uint256 tribeId,
        address member,
        bytes32 actionType
    ) external onlyTribeAdmin(tribeId) {
        uint256 points = actionPoints[tribeId][actionType];
        if (points > 0) {
            _awardPoints(tribeId, member, points, actionType);
        }
    }

    function batchAwardPoints(
        uint256 tribeId,
        address[] memory members,
        uint256 points,
        bytes32 actionType
    ) external onlyTribeAdmin(tribeId) {
        for (uint256 i = 0; i < members.length; i++) {
            if (tribeController.getMemberStatus(tribeId, members[i]) == ITribeController.MemberStatus.ACTIVE) {
                _awardPoints(tribeId, members[i], points, actionType);
            }
        }
    }

    function getTopMembers(uint256 tribeId, uint256 limit) external view returns (address[] memory, uint256[] memory) {
        // This is a simplified implementation
        // In production, you would want to use a more efficient data structure
        address[] memory members = new address[](limit);
        uint256[] memory points = new uint256[](limit);
        
        // Placeholder implementation
        return (members, points);
    }
} 