pragma solidity ^0.8.0;

interface ICollectibles {
    // Mint a new collectible
    function mint(address to, uint256 id, uint256 amount, bytes memory data) external;
}