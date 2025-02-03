pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./CollectibleExtended.sol";

contract CollectibleController is Ownable {
    // Mapping to store the addresses of deployed CollectibleExtended contracts
    mapping(address => bool) public deployedContracts;

    // Event emitted when a new CollectibleExtended contract is deployed
    event CollectibleExtendedDeployed(address indexed contractAddress);

    // Deploy a new CollectibleExtended contract
    function deployCollectibleExtended(
        string memory name,
        string memory symbol,
        string memory baseURI,
        address manager // Address with manager role
    ) public onlyOwner returns (address) {
        CollectibleExtended newCollectible = new CollectibleExtended(name, symbol, baseURI);
        deployedContracts[address(newCollectible)] = true;
        newCollectible.grantRole(newCollectible.MANAGER_ROLE(), manager); // Grant manager role
        emit CollectibleExtendedDeployed(address(newCollectible));
        return address(newCollectible);
    }

    // Clawback a collectible from a user (only callable by the controller owner)
    function clawbackCollectible(address collectibleContract, uint256 tokenId) public onlyOwner {
        CollectibleExtended collectible = CollectibleExtended(collectibleContract);
        require(deployedContracts[collectibleContract], "Contract not deployed by this controller");
        address tokenOwner = collectible.ownerOf(tokenId);
        collectible.transferFrom(tokenOwner, msg.sender, tokenId);
        emit CollectibleClawedBack(collectibleContract, tokenId, tokenOwner, msg.sender);
    }

    // Freeze a collectible (only callable by the controller owner)
    function freezeCollectible(address collectibleContract, uint256 tokenId) public onlyOwner {
        CollectibleExtended collectible = CollectibleExtended(collectibleContract);
        require(deployedContracts[collectibleContract], "Contract not deployed by this controller");
        collectible.freezeToken(tokenId);
        emit CollectibleFrozen(collectibleContract, tokenId);
    }

    // Unfreeze a collectible (only callable by the controller owner)
    function unfreezeCollectible(address collectibleContract, uint256 tokenId) public onlyOwner {
        CollectibleExtended collectible = CollectibleExtended(collectibleContract);
        require(deployedContracts[collectibleContract], "Contract not deployed by this controller");
        collectible.unfreezeToken(tokenId);
        emit CollectibleUnfrozen(collectibleContract, tokenId);
    }

   

    event CollectibleClawedBack(address indexed collectibleContract, uint256 tokenId, address from, address to);
    event CollectibleFrozen(address indexed collectibleContract, uint256 tokenId);
    event CollectibleUnfrozen(address indexed collectibleContract, uint256 tokenId);
}