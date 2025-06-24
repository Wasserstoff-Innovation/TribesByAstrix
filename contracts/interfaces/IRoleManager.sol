// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IRoleManager {
    function hasRole(bytes32 role, address account) external view returns (bool);
    function grantRole(bytes32 role, address account) external;
    function revokeRole(bytes32 role, address account) external;
    function getRoleMember(bytes32 role, uint256 index) external view returns (address);
    function getRoleMemberCount(bytes32 role) external view returns (uint256);
    
    // Role definitions
    function DEFAULT_ADMIN_ROLE() external pure returns (bytes32);
    function CREATOR_ROLE() external pure returns (bytes32);
    function MODERATOR_ROLE() external pure returns (bytes32);
    function FAN_ROLE() external pure returns (bytes32);
    function ORGANIZER_ROLE() external pure returns (bytes32);
    function ARTIST_ROLE() external pure returns (bytes32);
    function BRAND_ROLE() external pure returns (bytes32);
    function FAN_ASSIGNER_ROLE() external pure returns (bytes32);
    function POST_CREATOR_ROLE() external pure returns (bytes32);
    function POLL_CREATOR_ROLE() external pure returns (bytes32);
    function QUIZ_CREATOR_ROLE() external pure returns (bytes32);
    function PROPOSAL_CREATOR_ROLE() external pure returns (bytes32);
} 