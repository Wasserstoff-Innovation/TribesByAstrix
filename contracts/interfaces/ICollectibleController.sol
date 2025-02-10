// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ICollectibleController {
    struct Collectible {
        string name;
        string symbol;
        string metadataURI;
        uint256 maxSupply;
        uint256 currentSupply;
        uint256 price;
        uint256 pointsRequired;
        bool isActive;
    }

    event CollectibleCreated(uint256 indexed collectibleId, uint256 indexed tribeId, string name, uint256 maxSupply);
    event CollectibleClaimed(uint256 indexed tribeId, uint256 indexed collectibleId, address indexed claimer);
    event CollectibleDeactivated(uint256 indexed collectibleId);

    function createCollectible(
        uint256 tribeId,
        string memory name,
        string memory symbol,
        string memory metadataURI,
        uint256 maxSupply,
        uint256 price,
        uint256 pointsRequired
    ) external returns (uint256);

    function claimCollectible(uint256 tribeId, uint256 collectibleId) external payable;

    function deactivateCollectible(uint256 tribeId, uint256 collectibleId) external;

    function getCollectible(uint256 collectibleId) external view returns (Collectible memory);

    function balanceOf(address account, uint256 id) external view returns (uint256);

    function uri(uint256 collectibleId) external view returns (string memory);
} 