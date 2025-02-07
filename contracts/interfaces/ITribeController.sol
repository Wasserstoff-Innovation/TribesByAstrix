// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ITribeController {
    enum JoinType { PUBLIC, PRIVATE, INVITE_ONLY }
    enum MemberStatus { NONE, ACTIVE, PENDING, BANNED }

    struct TribeConfig {
        JoinType joinType;
        uint256 entryFee;
        address collectibleRequirement;
    }

    function createTribe(
        string memory name,
        string memory metadata,
        address[] memory admins,
        JoinType joinType,
        uint256 entryFee,
        address collectibleRequirement
    ) external returns (uint256);

    function getTribeConfig(uint256 tribeId) external view returns (TribeConfig memory);
    function getTribeAdmin(uint256 tribeId) external view returns (address);
    function getMemberStatus(uint256 tribeId, address member) external view returns (MemberStatus);
    function joinTribe(uint256 tribeId) external payable;
    function requestToJoinTribe(uint256 tribeId) external payable;
    function approveMember(uint256 tribeId, address member) external;
    function rejectMember(uint256 tribeId, address member) external;
    function banMember(uint256 tribeId, address member) external;
} 