// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "./RoleManager.sol";

contract ProfileNFTMinter is ERC721 {
    uint256 public nextTokenId;
    uint256 public immutable mintFee;
    RoleManager public roleManager;
    
    // Mapping: tokenId => metadata key => value
    mapping(uint256 => mapping(string => string)) public profileMetadata;
    
    event ProfileNFTMinted(address indexed user, uint256 indexed tokenId, string username);
    event ProfileMetadataUpdated(uint256 indexed tokenId, string key, string value);

    constructor(uint256 _mintFee, address _roleManager) ERC721("Profile NFT", "PROFILE") {
        mintFee = _mintFee;
        roleManager = RoleManager(_roleManager);
    }

    function mintProfileNFT(string calldata username, string calldata avatarURI) external payable returns (uint256) {
        require(msg.value >= mintFee, "Insufficient fee");
        uint256 tokenId = nextTokenId++;
        _safeMint(msg.sender, tokenId);
        // Store immutable username and initial avatar
        profileMetadata[tokenId]["username"] = username;
        profileMetadata[tokenId]["avatarURI"] = avatarURI;

        // Assign FAN_ROLE to the minter
        roleManager.assignFanRole(msg.sender);
        
        emit ProfileNFTMinted(msg.sender, tokenId, username);
        return tokenId;
    }

    function setProfileMetadata(uint256 tokenId, string calldata key, string calldata value) external {
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        profileMetadata[tokenId][key] = value;
        emit ProfileMetadataUpdated(tokenId, key, value);
    }
}