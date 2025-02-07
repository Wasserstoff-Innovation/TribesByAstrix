// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IPointSystem {
    function getMemberPoints(uint256 tribeId, address member) external view returns (uint256);
    function awardPoints(uint256 tribeId, address member, uint256 points, bytes32 actionType) external;
    function deductPoints(uint256 tribeId, address member, uint256 points, string memory reason) external;
    function getActionPoints(uint256 tribeId, bytes32 actionType) external view returns (uint256);
    function getActionCount(uint256 tribeId, address member, bytes32 actionType) external view returns (uint256);
} 